import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Maximum file size to process (10MB) - larger files exceed memory limits
const MAX_FILE_SIZE = 10 * 1024 * 1024;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    let file: File;
    let fileName: string;
    
    // Check if it's a JSON request (backend-to-backend call)
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { bucket, path, filename } = body;
      
      if (!bucket || !path) {
        throw new Error('Missing bucket or path in JSON body');
      }
      
      console.log('Backend call: downloading from storage:', bucket, path);
      
      // Create Supabase client to download file
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );
      
      const { data: fileData, error: downloadError } = await supabaseClient.storage
        .from(bucket)
        .download(path);
      
      if (downloadError || !fileData) {
        throw new Error(`Failed to download file from storage: ${downloadError?.message || 'File not found'}`);
      }
      
      file = new File([fileData], filename || path.split('/').pop() || 'unknown', {
        type: fileData.type || 'application/octet-stream'
      });
      fileName = filename || path.split('/').pop() || 'unknown';
    } else {
      // FormData upload (direct UI call)
      const formData = await req.formData();
      const fileFromForm = formData.get('file') as File;
      
      if (!fileFromForm) {
        throw new Error('No file provided');
      }
      
      file = fileFromForm;
      fileName = file.name;
    }

    console.log('Previewing file:', fileName, file.type, 'size:', file.size);

    // Check file size before processing
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB. Please upload a smaller file or split the PDF into parts.`);
    }

    // Extract text based on file type
    let content = '';
    let excelData: any[][] | null = null;
    let sheetNames: string[] = [];
    const fileType = fileName.split('.').pop()?.toLowerCase();
    
    try {
      if (fileType === 'docx') {
        // Use mammoth for DOCX files
        const mammoth = await import('https://esm.sh/mammoth@1.6.0');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;
      } else if (fileType === 'xlsx' || fileType === 'xls') {
        // Use SheetJS for Excel files
        const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs');
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        sheetNames = workbook.SheetNames;
        console.log('Excel has', sheetNames.length, 'sheets:', sheetNames);
        
        // Get data from first sheet as 2D array
        const firstSheet = workbook.Sheets[sheetNames[0]];
        excelData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' }) as any[][];
        
        // Also create text content for search/fallback
        const textParts: string[] = [];
        for (const sheetName of sheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const text = XLSX.utils.sheet_to_csv(sheet);
          textParts.push(`=== ${sheetName} ===\n${text}`);
        }
        content = textParts.join('\n\n');
        
        console.log('Excel extraction: rows:', excelData.length, 'sheets:', sheetNames.length);
      } else if (fileType === 'pdf') {
        // Use unpdf for PDF files with memory-safe approach
        const { extractText, getDocumentProxy } = await import('https://esm.sh/unpdf@0.11.0');
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        console.log('Starting PDF extraction, size:', uint8Array.length);
        
        try {
          // Try page-by-page extraction for better memory management
          const pdf = await getDocumentProxy(uint8Array);
          const numPages = pdf.numPages;
          console.log('PDF has', numPages, 'pages');
          
          const textParts: string[] = [];
          const maxPages = Math.min(numPages, 100); // Limit to first 100 pages
          
          for (let i = 1; i <= maxPages; i++) {
            try {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items
                .map((item: any) => item.str || '')
                .join(' ');
              textParts.push(pageText);
              
              if (i % 10 === 0) {
                console.log(`Processed ${i}/${maxPages} pages`);
              }
            } catch (pageError) {
              console.warn(`Error extracting page ${i}:`, pageError);
              // Continue with other pages
            }
          }
          
          content = textParts.join('\n\n');
          
          if (numPages > maxPages) {
            content += `\n\n[Note: Document truncated. Showing first ${maxPages} of ${numPages} pages.]`;
          }
        } catch (pdfError) {
          console.warn('Page-by-page extraction failed, trying bulk extraction:', pdfError);
          // Fallback to bulk extraction
          const result = await extractText(uint8Array);
          const text = result.text;
          content = Array.isArray(text) ? text.join('\n\n') : String(text || '');
        }
        
        console.log('PDF extraction result length:', content.length);
      } else {
        // Fallback for text files
        content = await file.text();
      }
    } catch (extractionError) {
      console.error('Text extraction failed:', extractionError);
      const errorMessage = extractionError instanceof Error ? extractionError.message : String(extractionError);
      
      // Provide helpful error message for memory issues
      if (errorMessage.includes('memory') || errorMessage.includes('Memory')) {
        throw new Error(`PDF too large to process in memory. Please try a smaller file (under 10MB) or split into multiple documents.`);
      }
      
      throw new Error(`Failed to extract text from ${fileType} file: ${errorMessage}`);
    }

    if (!content || content.trim().length < 10) {
      throw new Error('No meaningful content extracted from document. The file may be image-based or protected.');
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
        fileName: fileName,
        fileType: fileType || 'unknown',
        fileSize: file.size,
        contentPreview,
        fullContent: content, // Include full content for core document uploads
        stats,
        sampleChunks,
        fullContentLength: content.length,
        isContentTruncated: content.length > 2000,
        // Excel-specific data
        excelData: excelData,
        sheetNames: sheetNames.length > 0 ? sheetNames : undefined,
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
