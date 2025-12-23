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
    const uploadMetadata = body.metadata || {}; // Enhanced metadata from upload
    console.log('Processing document:', documentId, 'with metadata:', uploadMetadata);

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

    // Check if this is a Padlet document (already has content in description, no file to download)
    const isPadletDoc = document.document_type === 'padlet' || document.content_type === 'external';
    
    let content = '';
    
    if (isPadletDoc) {
      // For Padlet documents, use the description field directly
      console.log('Processing Padlet document - using description as content');
      content = document.description || '';
      
      if (!content || content.trim().length < 10) {
        throw new Error('מסמך Padlet ריק או קצר מדי');
      }
      
      console.log('Padlet content length:', content.length);
    } else {
      // Check file size BEFORE downloading - edge functions have 150MB memory limit
      const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB max to be safe
      if (document.file_size > MAX_FILE_SIZE) {
        const sizeMB = (document.file_size / 1024 / 1024).toFixed(1);
        throw new Error(`הקובץ גדול מדי (${sizeMB}MB). הגודל המקסימלי הוא 8MB. נא לפצל את הקובץ או להעלות גרסה קטנה יותר.`);
      }

      // Extract text using preview-document (for regular uploaded files)
      try {
        const { data: previewData, error: previewError } = await supabaseClient.functions.invoke('preview-document', {
          body: {
            bucket: 'documents',
            path: document.file_path,
            filename: document.filename
          }
        });
        
        if (previewError) {
          console.error('Preview error:', previewError);
          throw new Error(previewError.message || 'Failed to extract text from file');
        }
        
        if (!previewData?.fullContent) {
          throw new Error(previewData?.error || 'Failed to extract text from file');
        }
        
        content = previewData.fullContent;
        console.log('Text extraction successful, length:', content.length);
      } catch (extractionError) {
        console.error('Text extraction failed:', extractionError);
        throw new Error(`Failed to extract text from ${document.file_type} file: ${extractionError instanceof Error ? extractionError.message : String(extractionError)}`);
      }
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
            // Force valid JSON output to prevent parsing failures from unescaped quotes (e.g., צה"ל)
            response_format: { type: 'json_object' },
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
        
        // Ensure we parse clean JSON. (With response_format=json_object this should already be valid.)
        let jsonText = rawContent.trim();

        // Safety: strip markdown code fences if the model ever returns them.
        if (jsonText.includes('```')) {
          jsonText = jsonText
            .replace(/```json\s*/i, '')
            .replace(/```\s*/g, '')
            .replace(/\s*```$/g, '')
            .trim();
        }

        classification = JSON.parse(jsonText);

        // Validate classification structure
        if (!['L1', 'L2', 'L3'].includes(classification.level) ||
            typeof classification.confidence !== 'number' ||
            typeof classification.reasoning !== 'string') {
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

    // Chunk the content into manageable pieces
    const chunkSize = 1500; // Characters per chunk
    const chunkOverlap = 200; // Overlap between chunks
    const chunks: string[] = [];
    
    // Split content into chunks with overlap
    for (let i = 0; i < content.length; i += chunkSize - chunkOverlap) {
      const chunk = content.slice(i, Math.min(i + chunkSize, content.length));
      if (chunk.trim().length > 0) {
        chunks.push(chunk);
      }
    }
    
    console.log(`Split content (${content.length} chars) into ${chunks.length} chunks`);
    
    // Update status to embedding
    await supabaseClient
      .from('documents')
      .update({ processing_status: 'embedding' })
      .eq('id', documentId);

    // Process embeddings in batches to manage memory
    const batchSize = 10; // Process 10 chunks at a time
    
    try {

      // Process chunks in batches
      for (let batchStart = 0; batchStart < chunks.length; batchStart += batchSize) {
        const batchEnd = Math.min(batchStart + batchSize, chunks.length);
        const batchChunks = chunks.slice(batchStart, batchEnd);
        
        console.log(`Processing batch ${Math.floor(batchStart / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)} (${batchChunks.length} chunks)`);

        // Get embeddings for this batch
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: batchChunks
          }),
        });

        if (!embeddingResponse.ok) {
          const errorData = await embeddingResponse.json();
          throw new Error(`OpenAI Embeddings error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const embeddingData = await embeddingResponse.json();
        const embeddings = embeddingData.data as Array<{ embedding: number[] }>;

        // Prepare rows for this batch
        const rows = batchChunks.map((chunk, idx) => {
          const chunkIndex = batchStart + idx;
          return {
            id: `${documentId}:${chunkIndex}`,
            org_id: document.user_id,
            unit_id: null,
            level: levelNum,
            metadata: {
              filename: document.filename,
              title: document.title,
              file_path: document.file_path,
              chunk_index: chunkIndex,
              total_chunks: chunks.length,
              content_length: chunk.length
            },
            embedding: embeddings[idx].embedding,
            source_id: documentId,
            status: 'approved',
            source_type: 'content_document',
            content: chunk,
            sequence_number: chunkIndex,
            // Apply enhanced metadata from upload
            content_category: uploadMetadata.content_category || null,
            target_roles: uploadMetadata.target_roles || null,
            time_required: uploadMetadata.time_required || null,
            topic_tags: uploadMetadata.topic_tags || null,
            methodology_name: uploadMetadata.methodology_name || null,
            is_practical: uploadMetadata.is_practical || false,
            difficulty_level: uploadMetadata.difficulty_level || null
          } as any;
        });

        // Insert batch into database
        const { error: chunkUpsertError } = await supabaseClient
          .from('chunks')
          .upsert(rows, { onConflict: 'id' });

        if (chunkUpsertError) {
          console.error('Failed to upsert chunks:', chunkUpsertError);
          throw new Error(`Failed to store chunks: ${chunkUpsertError.message}`);
        }
        
        chunksInsertedCount += batchChunks.length;
        console.log(`Batch complete. Total chunks inserted so far: ${chunksInsertedCount}`);
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