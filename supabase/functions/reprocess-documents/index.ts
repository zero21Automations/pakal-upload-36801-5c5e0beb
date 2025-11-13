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

    const { org_id } = await req.json();
    console.log('Starting reprocessing for org:', org_id);

    // Get all approved documents that haven't been processed
    const { data: documents, error: docError } = await supabaseClient
      .from('documents')
      .select('id, filename, title, file_type, user_id')
      .or('processed_date.is.null,ai_determined_level.is.null')
      .in('status', ['מאושר', 'approved'])
      .eq('user_id', org_id);

    if (docError) {
      console.error('Error fetching documents:', docError);
      throw new Error('Failed to fetch documents');
    }

    if (!documents || documents.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No documents need reprocessing',
          processed_count: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${documents.length} documents to reprocess`);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Process each document
    for (const document of documents) {
      try {
        console.log(`Processing document: ${document.filename} (${document.id})`);
        
        // Call the process-document function
        const { data, error } = await supabaseClient.functions.invoke('process-document', {
          body: { documentId: document.id }
        });

        if (error) {
          throw error;
        }

        if (data && data.success) {
          results.success++;
          console.log(`Successfully processed: ${document.filename}`);
        } else {
          throw new Error(data?.error || 'Unknown processing error');
        }
        
        // Small delay between processing to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        results.failed++;
        const errorMsg = `Failed to process ${document.filename}: ${error.message}`;
        results.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    console.log('Reprocessing complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Reprocessing complete: ${results.success} successful, ${results.failed} failed`,
        results: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in reprocess-documents function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});