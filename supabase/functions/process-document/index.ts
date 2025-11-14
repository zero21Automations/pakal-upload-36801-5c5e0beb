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

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { documentId } = await req.json();
    console.log('Processing document:', documentId);

    // Get document from database
    const { data: document, error: docError } = await supabaseClient
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error('Document not found');
    }

    // Get file content from storage
    const { data: fileData } = await supabaseClient.storage
      .from('documents')
      .download(document.file_path);

    if (!fileData) {
      throw new Error('File not found in storage');
    }

    // Extract text based on file type
    let content = '';
    const arrayBuffer = await fileData.arrayBuffer();
    
    try {
      if (document.file_type === 'docx') {
        // Use mammoth for DOCX files
        const mammoth = await import('https://esm.sh/mammoth@1.6.0');
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;
        console.log('DOCX extraction successful, length:', content.length);
      } else if (document.file_type === 'pdf') {
        // Use pdf-parse for PDF files
        const pdfParse = await import('https://esm.sh/pdf-parse@1.1.1');
        const buffer = new Uint8Array(arrayBuffer);
        const result = await pdfParse.default(buffer);
        content = result.text;
        console.log('PDF extraction successful, length:', content.length);
      } else {
        // Fallback for text files
        content = new TextDecoder().decode(arrayBuffer);
        console.log('Text extraction (fallback), length:', content.length);
      }
    } catch (extractionError) {
      console.error('Text extraction failed:', extractionError);
      throw new Error(`Failed to extract text from ${document.file_type} file: ${extractionError instanceof Error ? extractionError.message : String(extractionError)}`);
    }

    if (!content || content.trim().length < 10) {
      throw new Error('No meaningful content extracted from document');
    }

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
        
        classification = JSON.parse(rawContent.trim());
        
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


    // Generate embeddings for chunks with memory optimization
    const maxContentLength = Math.min(content.length, 20000); // Cap content to prevent memory issues
    const contentToProcess = content.slice(0, maxContentLength);
    const chunks = chunkText(contentToProcess, 350, 50); // Optimized chunk size
    
    console.log(`Processing ${chunks.length} chunks from ${maxContentLength} characters of content`);

    // Process embeddings in very small batches to avoid memory issues
    const batchSize = 15; // Even smaller batch size
    const allEmbeddings: Array<{ embedding: number[]; index: number }> = [];
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      let embeddingAttempts = 0;
      const maxEmbeddingAttempts = 3;
      
      while (embeddingAttempts < maxEmbeddingAttempts) {
        try {
          console.log(`Processing embedding batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(chunks.length/batchSize)}, attempt ${embeddingAttempts + 1}`);
          
          const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'text-embedding-3-small',
              input: batch
            }),
          });

          if (!embeddingResponse.ok) {
            const errorData = await embeddingResponse.json();
            throw new Error(`OpenAI Embeddings error: ${errorData.error?.message || 'Unknown error'}`);
          }
          
          const embeddingData = await embeddingResponse.json();
          allEmbeddings.push(...embeddingData.data);
          break;
          
        } catch (embeddingError) {
          embeddingAttempts++;
          console.error(`Embedding attempt ${embeddingAttempts} failed:`, embeddingError);
          
          if (embeddingAttempts >= maxEmbeddingAttempts) {
            throw new Error(`Embedding generation failed after ${maxEmbeddingAttempts} attempts: ${embeddingError instanceof Error ? embeddingError.message : String(embeddingError)}`);
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * embeddingAttempts));
        }
      }
      
      // Small delay between batches to prevent rate limiting
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Prepare and upsert chunk rows into the database
    const levelNum = classification.level === 'L1' ? 1 : classification.level === 'L2' ? 2 : 3;
    
    if (allEmbeddings.length !== chunks.length) {
      throw new Error(`Embedding count mismatch: ${allEmbeddings.length} embeddings vs ${chunks.length} chunks`);
    }
    
    const chunkRows = chunks.map((chunkText: string, i: number) => ({
      id: `${documentId}:${i}`,
      org_id: document.user_id, // aligns with RLS expecting org_id == auth.uid()
      unit_id: null,
      level: levelNum,
      metadata: {
        filename: document.filename,
        title: document.title,
        file_path: document.file_path,
        chunk_index: i,
        total_chunks: chunks.length,
        content_length: chunkText.length
      },
      embedding: allEmbeddings[i].embedding,
      source_id: documentId,
      status: 'approved',
      content: chunkText,
      sequence_number: i,
    }));

    console.log(`Attempting to upsert ${chunkRows.length} chunks`);
    
    // Upsert chunks in smaller batches to avoid database timeouts
    const dbBatchSize = 10;
    for (let i = 0; i < chunkRows.length; i += dbBatchSize) {
      const batch = chunkRows.slice(i, i + dbBatchSize);
      const { error: chunkUpsertError } = await supabaseClient
        .from('chunks')
        .upsert(batch, { onConflict: 'id' });

      if (chunkUpsertError) {
        console.error('Failed to upsert chunk batch:', chunkUpsertError);
        throw new Error(`Failed to store chunk batch ${Math.floor(i/dbBatchSize) + 1}: ${chunkUpsertError.message}`);
      }
      
      console.log(`Upserted chunk batch ${Math.floor(i/dbBatchSize) + 1}/${Math.ceil(chunkRows.length/dbBatchSize)}`);
    }

    // Update document with AI analysis and numeric level
    const { error: updateError } = await supabaseClient
      .from('documents')
      .update({
        ai_determined_level: classification.level,
        level: levelNum,
        confidence: classification.confidence,
        reasons: classification.reasoning,
        ai_summary: classification.ai_summary,
        ai_keywords: classification.keywords,
        processed_date: new Date().toISOString()
      })
      .eq('id', documentId);

    if (updateError) {
      throw new Error('Failed to update document');
    }

    // Store chunks (simplified table structure)
    // In production, you'd have a proper chunks table with vector storage
    console.log(`Processed ${chunks.length} chunks for document ${documentId}`);

    return new Response(
      JSON.stringify({
        success: true,
        document_id: documentId,
        classification: classification,
        chunks_processed: chunks.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing document:', error);
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