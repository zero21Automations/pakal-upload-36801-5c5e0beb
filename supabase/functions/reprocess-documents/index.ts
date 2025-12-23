import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!supabaseUrl || !serviceKey || !anonKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Backend not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Read body for backward compatibility (org_id is ignored for security)
    const body = await req.json().catch(() => ({} as any));
    console.log("Reprocess request body:", body);

    // Verify caller
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authData, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !authData?.user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ success: false, error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userId = authData.user.id;

    // Privileged client for processing operations
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    console.log("Starting reprocessing for user:", userId);

    // Reprocess documents that are failed or missing derived fields
    const { data: documents, error: docError } = await supabaseAdmin
      .from("documents")
      .select(
        "id, filename, title, file_type, user_id, processing_status, processed_at, document_level, chunks_count",
      )
      .eq("user_id", userId)
      .in("document_type", ["content", "padlet"])
      .in("status", ["מאושר", "approved", "ממתין לאישור"])
      .or(
        [
          "processing_status.eq.failed",
          "processed_at.is.null",
          "document_level.is.null",
          "chunks_count.is.null",
          "chunks_count.eq.0",
        ].join(","),
      )
      .order("updated_at", { ascending: false })
      .limit(50);

    if (docError) {
      console.error("Error fetching documents:", docError);
      throw new Error(docError.message || "Failed to fetch documents");
    }

    if (!documents || documents.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No documents need reprocessing",
          processed_count: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`Found ${documents.length} documents to reprocess`);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const document of documents) {
      try {
        console.log(`Reprocessing document: ${document.title} (${document.id})`);

        const { data, error } = await supabaseAdmin.functions.invoke("process-document", {
          body: { documentId: document.id },
        });

        if (error) {
          // Best-effort: extract JSON error from upstream function
          let details = error.message;
          try {
            const ctx = (error as any)?.context;
            if (ctx && typeof ctx.clone === "function") {
              const payload = await ctx.clone().json().catch(() => null);
              if (payload?.error) details = payload.error;
            }
          } catch {
            // ignore
          }
          throw new Error(details);
        }

        if (data?.success) {
          results.success++;
        } else {
          throw new Error(data?.error || "Unknown processing error");
        }

        // Small delay to avoid rate-limits
        await new Promise((r) => setTimeout(r, 700));
      } catch (e) {
        results.failed++;
        const msg = e instanceof Error ? e.message : String(e);
        results.errors.push(`${document.title}: ${msg}`);
        console.error("Reprocess failed:", document.id, msg);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Reprocessing complete: ${results.success} successful, ${results.failed} failed`,
        processed_count: documents.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in reprocess-documents function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
