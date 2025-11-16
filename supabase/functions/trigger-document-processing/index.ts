import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { documentId } = await req.json();

    if (!documentId) {
      return new Response(
        JSON.stringify({ error: 'documentId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Manually triggering processing for document: ${documentId}`);

    // First, check if document exists
    const { data: document, error: fetchError } = await supabaseClient
      .from('documents')
      .select('id, title, processing_status')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      console.error('Document not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update status to pending to trigger processing
    const { error: updateError } = await supabaseClient
      .from('documents')
      .update({ 
        processing_status: 'pending',
        processing_error: null 
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Failed to update document status:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update document status', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Invoke process-document function
    const { data: processData, error: processError } = await supabaseClient.functions.invoke('process-document', {
      body: { documentId }
    });

    if (processError) {
      console.error('Failed to invoke process-document:', processError);
      
      // Update document with error
      await supabaseClient
        .from('documents')
        .update({ 
          processing_status: 'failed',
          processing_error: processError.message || 'Failed to start processing'
        })
        .eq('id', documentId);

      return new Response(
        JSON.stringify({ 
          error: 'Failed to start processing', 
          details: processError.message,
          documentId 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing triggered successfully for document: ${documentId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Processing triggered successfully',
        documentId,
        processData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in trigger-document-processing:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
