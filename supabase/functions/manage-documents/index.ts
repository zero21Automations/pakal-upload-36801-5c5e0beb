import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Database not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create user client to verify the token
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey || '', {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'לא מאומת' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // Check if user has mentor role (using admin client to bypass RLS)
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleError) {
      console.error('Error fetching role:', roleError);
      return new Response(
        JSON.stringify({ success: false, error: 'שגיאה באימות הרשאות' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userRole = roleData?.role;
    const isMentor = userRole === 'mentor';
    
    console.log('User role:', userRole, 'isMentor:', isMentor);

    // Parse request body
    const { action, documentId } = await req.json();
    console.log('Action:', action, 'DocumentId:', documentId);

    switch (action) {
      case 'approve': {
        if (!isMentor) {
          return new Response(
            JSON.stringify({ success: false, error: 'רק מנטור יכול לאשר מסמכים' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!documentId) {
          return new Response(
            JSON.stringify({ success: false, error: 'חסר מזהה מסמך' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: updateError } = await supabaseAdmin
          .from('documents')
          .update({
            status: 'מאושר',
            approved_at: new Date().toISOString(),
            approved_by: user.id,
          })
          .eq('id', documentId);

        if (updateError) {
          console.error('Error approving document:', updateError);
          return new Response(
            JSON.stringify({ success: false, error: updateError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Document approved:', documentId);
        return new Response(
          JSON.stringify({ success: true, message: 'המסמך אושר בהצלחה' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        if (!documentId) {
          return new Response(
            JSON.stringify({ success: false, error: 'חסר מזהה מסמך' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get document to check ownership
        const { data: doc, error: fetchError } = await supabaseAdmin
          .from('documents')
          .select('user_id, document_type')
          .eq('id', documentId)
          .maybeSingle();

        if (fetchError || !doc) {
          return new Response(
            JSON.stringify({ success: false, error: 'מסמך לא נמצא' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Allow delete if mentor OR if user owns the document
        const canDelete = isMentor || doc.user_id === user.id;
        
        if (!canDelete) {
          return new Response(
            JSON.stringify({ success: false, error: 'אין הרשאה למחוק מסמך זה' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Delete associated chunks first
        const { error: chunksError } = await supabaseAdmin
          .from('chunks')
          .delete()
          .eq('source_id', documentId);

        if (chunksError) {
          console.error('Error deleting chunks:', chunksError);
          // Continue anyway, chunks are not critical
        }

        // Delete the document
        const { error: deleteError } = await supabaseAdmin
          .from('documents')
          .delete()
          .eq('id', documentId);

        if (deleteError) {
          console.error('Error deleting document:', deleteError);
          return new Response(
            JSON.stringify({ success: false, error: deleteError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Document deleted:', documentId);
        return new Response(
          JSON.stringify({ success: true, message: 'המסמך נמחק בהצלחה' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'purgePadlet': {
        if (!isMentor) {
          return new Response(
            JSON.stringify({ success: false, error: 'רק מנטור יכול למחוק את כל מסמכי Padlet' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get all padlet documents
        const { data: padletDocs, error: fetchError } = await supabaseAdmin
          .from('documents')
          .select('id')
          .eq('document_type', 'padlet');

        if (fetchError) {
          console.error('Error fetching padlet docs:', fetchError);
          return new Response(
            JSON.stringify({ success: false, error: fetchError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const docIds = (padletDocs || []).map(d => d.id);
        console.log('Padlet documents to delete:', docIds.length);

        if (docIds.length === 0) {
          return new Response(
            JSON.stringify({ success: true, message: 'אין מסמכי Padlet למחיקה', deletedCount: 0 }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Delete chunks for all padlet documents
        for (const docId of docIds) {
          const { error: chunkError } = await supabaseAdmin
            .from('chunks')
            .delete()
            .eq('source_id', docId);

          if (chunkError) {
            console.error('Error deleting chunks for', docId, chunkError);
          }
        }

        // Delete all padlet documents
        const { error: deleteError } = await supabaseAdmin
          .from('documents')
          .delete()
          .eq('document_type', 'padlet');

        if (deleteError) {
          console.error('Error deleting padlet documents:', deleteError);
          return new Response(
            JSON.stringify({ success: false, error: deleteError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Deleted all padlet documents:', docIds.length);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `נמחקו ${docIds.length} מסמכי Padlet`,
            deletedCount: docIds.length 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Error in manage-documents:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
