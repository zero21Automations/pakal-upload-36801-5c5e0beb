import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIKey) {
    throw new Error('OpenAI API key not configured');
  }

  let coreDocId: string | null = null;

  try {
    const body = await req.json();
    coreDocId = body.coreDocId;
    console.log('Processing core document:', coreDocId);

    // Update status to processing
    await supabaseClient
      .from('core_documents')
      .update({ processing_status: 'processing', processing_error: null })
      .eq('id', coreDocId);

    // Get core document from database
    const { data: coreDoc, error: docError } = await supabaseClient
      .from('core_documents')
      .select('*')
      .eq('id', coreDocId)
      .single();

    if (docError || !coreDoc) {
      await supabaseClient
        .from('core_documents')
        .update({ processing_status: 'failed', processing_error: 'Document not found' })
        .eq('id', coreDocId);
      throw new Error('Core document not found');
    }

    const content = coreDoc.content;
    if (!content || content.trim().length < 10) {
      throw new Error('No meaningful content in core document');
    }

    console.log('Core document content length:', content.length);

    // Chunk the text
    const chunkText = (text: string, chunkSize = 350, overlap = 50) => {
      const chunks = [];
      let start = 0;
      let sequence = 0;
      
      while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        const chunk = text.slice(start, end).trim();
        
        if (chunk.length > 0) {
          chunks.push({
            content: chunk,
            sequence: sequence++,
            start_char: start,
            end_char: end
          });
        }
        
        start += chunkSize - overlap;
      }
      
      return chunks;
    };

    const chunks = chunkText(content);
    console.log(`Created ${chunks.length} chunks from core document`);

    // Generate embeddings for each chunk with batching
    const generateEmbedding = async (text: string, retries = 3): Promise<number[]> => {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'text-embedding-3-small',
              input: text,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          return data.data[0].embedding;
        } catch (error) {
          console.error(`Embedding attempt ${attempt + 1} failed:`, error);
          if (attempt === retries - 1) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
      throw new Error('Failed to generate embedding after retries');
    };

    // Generate embeddings in batches
    const batchSize = 5;
    const chunksWithEmbeddings = [];
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      console.log(`Processing embedding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);
      
      const batchResults = await Promise.all(
        batch.map(async (chunk) => {
          const embedding = await generateEmbedding(chunk.content);
          return { ...chunk, embedding };
        })
      );
      
      chunksWithEmbeddings.push(...batchResults);
    }

    console.log(`Generated embeddings for ${chunksWithEmbeddings.length} chunks`);

    // Prepare chunk data for insertion
    const chunkRecords = chunksWithEmbeddings.map((chunk) => ({
      id: `core_${coreDocId}_chunk_${chunk.sequence}`,
      org_id: 'default', // You may want to get this from the user or document
      unit_id: null,
      source_id: coreDocId,
      source_type: 'core_document',
      content: chunk.content,
      embedding: chunk.embedding,
      level: 0, // Core documents are level 0 (highest priority)
      status: 'approved',
      metadata: {
        sequence: chunk.sequence,
        start_char: chunk.start_char,
        end_char: chunk.end_char,
        title: coreDoc.title
      },
      sequence_number: chunk.sequence,
    }));

    // Delete existing chunks for this core document
    const { error: deleteError } = await supabaseClient
      .from('chunks')
      .delete()
      .eq('source_id', coreDocId)
      .eq('source_type', 'core_document');

    if (deleteError) {
      console.error('Error deleting old chunks:', deleteError);
    }

    // Insert chunks in batches to avoid timeout
    const insertBatchSize = 50;
    for (let i = 0; i < chunkRecords.length; i += insertBatchSize) {
      const batch = chunkRecords.slice(i, i + insertBatchSize);
      console.log(`Inserting chunk batch ${Math.floor(i / insertBatchSize) + 1}/${Math.ceil(chunkRecords.length / insertBatchSize)}`);
      
      const { error: insertError } = await supabaseClient
        .from('chunks')
        .insert(batch);

      if (insertError) {
        console.error('Error inserting chunks:', insertError);
        throw new Error(`Failed to insert chunks: ${insertError.message}`);
      }
    }

    console.log(`Successfully processed core document with ${chunkRecords.length} chunks`);

    // Update status to completed
    await supabaseClient
      .from('core_documents')
      .update({ 
        processing_status: 'completed', 
        processed_at: new Date().toISOString(),
        chunks_count: chunkRecords.length 
      })
      .eq('id', coreDocId);

    return new Response(
      JSON.stringify({
        success: true,
        coreDocId,
        chunksProcessed: chunkRecords.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-core-document function:', error);
    
    // Update status to failed if we have the coreDocId
    if (coreDocId) {
      await supabaseClient
        .from('core_documents')
        .update({ 
          processing_status: 'failed',
          processing_error: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', coreDocId);
    }
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
