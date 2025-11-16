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

  try {
    console.log('Running watchdog for stuck documents...');

    // Find documents stuck in processing for more than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: stuckDocuments, error: queryError } = await supabaseClient
      .from('documents')
      .select('id, filename, processing_status, updated_at')
      .in('processing_status', ['processing', 'extracting', 'classifying', 'embedding'])
      .lt('updated_at', fiveMinutesAgo);

    if (queryError) {
      console.error('Error querying stuck documents:', queryError);
      throw queryError;
    }

    if (!stuckDocuments || stuckDocuments.length === 0) {
      console.log('No stuck documents found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No stuck documents found',
          checked: 0,
          updated: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${stuckDocuments.length} stuck documents:`, 
      stuckDocuments.map(d => ({ id: d.id, filename: d.filename, status: d.processing_status }))
    );

    // Mark them as failed
    const { error: updateError } = await supabaseClient
      .from('documents')
      .update({
        processing_status: 'failed',
        processing_error: 'העיבוד נתקע ונכשל לאחר 5 דקות. נסה שוב או צור קשר עם התמיכה.'
      })
      .in('id', stuckDocuments.map(d => d.id));

    if (updateError) {
      console.error('Error updating stuck documents:', updateError);
      throw updateError;
    }

    console.log(`Successfully marked ${stuckDocuments.length} documents as failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Marked ${stuckDocuments.length} stuck documents as failed`,
        checked: stuckDocuments.length,
        updated: stuckDocuments.length,
        documents: stuckDocuments.map(d => ({ id: d.id, filename: d.filename }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in watchdog-stuck-documents function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
