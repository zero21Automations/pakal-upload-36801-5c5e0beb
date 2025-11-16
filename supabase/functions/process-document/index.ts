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

  let documentId: string | null = null;

  try {
    const body = await req.json();
    documentId = body.documentId;
    console.log('Processing document:', documentId);

    // Update status to extracting
    await supabaseClient
      .from('documents')
      .update({ processing_status: 'extracting', processing_error: null })
      .eq('id', documentId);

    // Get document from database
    const { data: document, error: docError } = await supabaseClient
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      await supabaseClient
        .from('documents')
        .update({ processing_status: 'failed', processing_error: 'Document not found' })
        .eq('id', documentId);
      throw new Error('Document not found');
    }

    // Extract text using preview-document (no file download needed)
    let content = '';
    
    try {
      const { data: previewData, error: previewError } = await supabaseClient.functions.invoke('preview-document', {
        body: {
          bucket: 'documents',
          path: document.file_path,
          filename: document.filename
        }
      });
      
      if (previewError || !previewData?.fullContent) {
        throw new Error('Failed to extract text from file');
      }
      
      content = previewData.fullContent;
      console.log('Text extraction successful, length:', content.length);
    } catch (extractionError) {
      console.error('Text extraction failed:', extractionError);
      throw new Error(`Failed to extract text from ${document.file_type} file: ${extractionError instanceof Error ? extractionError.message : String(extractionError)}`);
    }

    if (!content || content.trim().length < 10) {
      throw new Error('No meaningful content extracted from document');
    }

    // Update status to classifying
    await supabaseClient
      .from('documents')
      .update({ processing_status: 'classifying' })
      .eq('id', documentId);

    // AI Classification using GPT-4o-mini with retry logic
    let classification;
    let classificationAttempts = 0;
    const maxAttempts = 3;
    
    while (classificationAttempts < maxAttempts) {
      try {
        console.log(`Classification attempt ${classificationAttempts + 1}/${maxAttempts}`);
        
        const classificationResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `אתה מסווג מסמכים לפי מערכת הידע של פק"ל:

L1 - מסמכי ליבה פק"לים: מתודולוגיות, מדריכים רשמיים, הנחיות ליבה
L2 - כלים ופעילויות: כרטיסי פעילות, מדריכי הדרכה, נהלים יחידתיים  
L3 - מחקר והרחבה: מחקרים אקדמיים, דוחות חיצוניים, חומרי רקע

השב בפורמט JSON:
{
  "level": "L1|L2|L3", 
  "confidence": 0.0-1.0,
  "reasoning": "הסבר קצר",
  "ai_summary": "סיכום 2-3 משפטים",
  "keywords": ["מילת מפתח1", "מילת מפתח2"]
}`
              },
              {
                role: 'user',
                content: `כותרת: ${document.title}\nסוג קובץ: ${document.file_type}\nתוכן:\n${content.substring(0, 3000)}`
              }
            ],
            max_tokens: 500,
            temperature: 0.2
          }),
        });
        
        if (!classificationResponse.ok) {
          const errorData = await classificationResponse.json();
          throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const classificationData = await classificationResponse.json();
        let rawContent = classificationData.choices[0].message.content;
        console.log('Raw AI response:', rawContent);
        
        // Clean up markdown code blocks if present
        if (rawContent.includes('```json')) {
          rawContent = rawContent.replace(/```json\s*/, '').replace(/\s*```$/, '');
        } else if (rawContent.includes('```')) {
          rawContent = rawContent.replace(/```\s*/, '').replace(/\s*```$/, '');
        }
        
        // Fix Hebrew quotation marks that break JSON parsing
        // Replace standalone Hebrew quotes and problematic patterns
        const trimmedContent = rawContent.trim()
          .replace(/״/g, '') // Remove Hebrew opening quotes
          .replace(/״/g, '') // Remove Hebrew closing quotes  
          .replace(/פק"ל/g, 'פקל'); // Replace the specific problematic term
        
        classification = JSON.parse(trimmedContent);
        
        // Validate classification structure
        if (!classification.level || !classification.confidence || !classification.reasoning) {
          throw new Error('Invalid classification response structure');
        }
        
        console.log('Classification successful:', classification);
        break;
        
      } catch (classificationError) {
        classificationAttempts++;
        console.error(`Classification attempt ${classificationAttempts} failed:`, classificationError);
        
        if (classificationAttempts >= maxAttempts) {
          throw new Error(`AI classification failed after ${maxAttempts} attempts: ${classificationError instanceof Error ? classificationError.message : String(classificationError)}`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * classificationAttempts));
      }
    }


    // Update status to embedding
    await supabaseClient
      .from('documents')
      .update({ processing_status: 'embedding' })
      .eq('id', documentId);

    // Numeric level for storage
    const levelNum = classification.level === 'L1' ? 1 : classification.level === 'L2' ? 2 : 3;
    let chunksInsertedCount = 0;

    // Graceful fallback: try embeddings with ultra-conservative settings, but don't fail the whole pipeline
    try {
      // Generate embeddings for chunks with EXTREME memory optimization to avoid OOM
      const maxContentLength = Math.min(content.length, 300); // Hyper-reduced to 300 chars max
      const contentToProcess = content.slice(0, maxContentLength);
      
      // Clear full content to free memory before processing
      content = '';
      
      // Create single chunk only - no overlap needed for such small content
      const chunks = [contentToProcess]; // Single chunk to minimize memory
      
      console.log(`Processing 1 chunk from ${maxContentLength} characters of content`);

      // Process the single chunk to avoid memory issues
      try {
        console.log('Embedding single chunk attempt');

        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: chunks
          }),
        });

        if (!embeddingResponse.ok) {
          const errorData = await embeddingResponse.json();
          throw new Error(`OpenAI Embeddings error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const embeddingData = await embeddingResponse.json();
        const data = embeddingData.data as Array<{ embedding: number[] }>;

        const row = {
          id: `${documentId}:0`,
          org_id: document.user_id,
          unit_id: null,
          level: levelNum,
          metadata: {
            filename: document.filename,
            title: document.title,
            file_path: document.file_path,
            chunk_index: 0,
            total_chunks: 1,
            content_length: chunks[0].length
          },
          embedding: data[0].embedding,
          source_id: documentId,
          status: 'approved',
          source_type: 'content_document',
          content: chunks[0],
          sequence_number: 0,
        } as any;

        const { error: chunkUpsertError } = await supabaseClient
          .from('chunks')
          .upsert([row], { onConflict: 'id' });

        if (chunkUpsertError) {
          console.error('Failed to upsert chunk:', chunkUpsertError);
          throw new Error(`Failed to store chunk: ${chunkUpsertError.message}`);
        }
        
        chunksInsertedCount = 1;
        console.log('Successfully embedded and stored 1 chunk');

      } catch (embeddingError) {
        console.error('Embedding failed:', embeddingError);
        throw embeddingError;
      }

      console.log(`Finished embedding + upsert pipeline. Inserted ${chunksInsertedCount} chunks`);

      // Update document with full completion results
      const { error: updateError } = await supabaseClient
        .from('documents')
        .update({
          document_level: classification.level,
          processing_status: 'completed',
          processed_at: new Date().toISOString(),
          chunks_count: chunksInsertedCount,
          processing_error: null
        })
        .eq('id', documentId);

      if (updateError) {
        console.error('Failed to update document after successful embedding:', updateError);
        throw new Error('Failed to update document');
      }

      console.log(`Successfully processed ${chunksInsertedCount} chunks for document ${documentId}`);

      return new Response(
        JSON.stringify({
          success: true,
          document_id: documentId,
          classification: classification,
          chunks_processed: chunksInsertedCount,
          status: 'completed'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (embeddingError) {
      // Graceful fallback: save classification but mark as partially complete
      console.error('Embedding failed, saving classification only:', embeddingError);
      
      const errorMessage = embeddingError instanceof Error ? embeddingError.message : String(embeddingError);
      const isOOM = errorMessage.toLowerCase().includes('memory');
      const errorTag = isOOM ? 'OOM' : 'EMBEDDING_FAILED';

      // Update document with classification only (status: completed with warning, not failed)
      const { error: fallbackUpdateError } = await supabaseClient
        .from('documents')
        .update({
          document_level: classification.level,
          processing_status: 'completed',
          processed_at: new Date().toISOString(),
          chunks_count: chunksInsertedCount,
          processing_error: `${errorTag}: ${errorMessage.substring(0, 500)}`
        })
        .eq('id', documentId);

      if (fallbackUpdateError) {
        console.error('Failed to save classification fallback:', fallbackUpdateError);
      }

      console.log(`Document ${documentId} classified but embedding failed. Chunks inserted: ${chunksInsertedCount}`);

      // Return 200 (not 500) with partial success indicator
      return new Response(
        JSON.stringify({
          success: true,
          document_id: documentId,
          classification: classification,
          chunks_processed: chunksInsertedCount,
          status: 'completed',
          warning: 'Document classified successfully but embeddings could not be generated due to resource constraints'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error processing document:', error);
    
    // Update status to failed if we have documentId
    if (documentId) {
      await supabaseClient
        .from('documents')
        .update({ 
          processing_status: 'failed',
          processing_error: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', documentId);
    }
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
  }

  return chunks;
}