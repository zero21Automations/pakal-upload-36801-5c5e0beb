import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    console.log('Previewing file:', file.name, file.type);

    // Extract text based on file type
    let content = '';
    const fileType = file.name.split('.').pop()?.toLowerCase();
    
    try {
      if (fileType === 'docx') {
        // Use mammoth for DOCX files
        const mammoth = await import('https://esm.sh/mammoth@1.6.0');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;
      } else if (fileType === 'pdf') {
        // Use pdfjs-dist for PDF files (Deno-compatible)
        const pdfjsLib = await import('https://esm.sh/pdfjs-dist@3.11.174/build/pdf.mjs');
        const arrayBuffer = await file.arrayBuffer();
        
        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        // Extract text from all pages
        const textPromises = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          textPromises.push(
            pdf.getPage(i).then(async (page: any) => {
              const textContent = await page.getTextContent();
              return textContent.items.map((item: any) => item.str).join(' ');
            })
          );
        }
        
        const pageTexts = await Promise.all(textPromises);
        content = pageTexts.join('\n\n');
      } else {
        // Fallback for text files
        content = await file.text();
      }
    } catch (extractionError) {
      console.error('Text extraction failed:', extractionError);
      throw new Error(`Failed to extract text from ${fileType} file: ${extractionError instanceof Error ? extractionError.message : String(extractionError)}`);
    }

    if (!content || content.trim().length < 10) {
      throw new Error('No meaningful content extracted from document');
    }

    // Create chunks preview
    const chunkText = (text: string, chunkSize = 350, overlap = 50) => {
      const chunks = [];
      let start = 0;
      let sequence = 0;
      
      while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        const chunk = text.slice(start, end).trim();
        
        if (chunk.length > 0) {
          chunks.push({
            sequence: sequence++,
            content: chunk,
            length: chunk.length,
            start_char: start,
            end_char: end
          });
        }
        
        start += chunkSize - overlap;
      }
      
      return chunks;
    };

    const chunks = chunkText(content);

    // Generate basic statistics
    const stats = {
      totalCharacters: content.length,
      totalWords: content.split(/\s+/).length,
      totalChunks: chunks.length,
      avgChunkLength: chunks.reduce((sum, c) => sum + c.length, 0) / chunks.length,
      estimatedEmbeddingCost: chunks.length * 0.0001, // Rough estimate
    };

    // Get content preview (first 2000 chars)
    const contentPreview = content.substring(0, 2000);

    // Get sample chunks (first 3)
    const sampleChunks = chunks.slice(0, 3);

    return new Response(
      JSON.stringify({
        success: true,
        fileName: file.name,
        fileType: fileType || 'unknown',
        fileSize: file.size,
        contentPreview,
        fullContent: content, // Include full content for core document uploads
        stats,
        sampleChunks,
        fullContentLength: content.length,
        isContentTruncated: content.length > 2000,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in preview-document function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
