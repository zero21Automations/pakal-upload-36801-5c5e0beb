import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PADLET_URL = 'https://padlet.com/kzyuval/padlet-6pvfheiao6cslrcz';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user_id from request body
    const { user_id } = await req.json().catch(() => ({}));
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Database not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting Padlet scrape:', PADLET_URL);

    // Scrape the Padlet page
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: PADLET_URL,
        formats: ['markdown', 'html'],
        onlyMainContent: false,
        waitFor: 5000,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok) {
      console.error('Firecrawl scrape error:', scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: scrapeData.error || 'Failed to scrape Padlet' }),
        { status: scrapeResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
    const metadata = scrapeData.data?.metadata || scrapeData.metadata || {};
    
    console.log('Scraped content length:', markdown.length);
    console.log('Page title:', metadata.title);

    if (!markdown || markdown.length < 100) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Padlet content too short or empty.',
          contentLength: markdown.length 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse Padlet posts from markdown
    const posts = parsePadletContent(markdown);
    console.log('Parsed posts count:', posts.length);

    // Get all existing Padlet documents
    const { data: existingDocs, error: fetchError } = await supabase
      .from('documents')
      .select('id, title, description')
      .eq('document_type', 'padlet');

    if (fetchError) {
      console.error('Error fetching existing docs:', fetchError);
    }

    const existingTitles = new Set((existingDocs || []).map(d => d.title));
    const scrapedTitles = new Set(posts.map(p => p.title));

    // Store sync results
    const results = {
      created: 0,
      updated: 0,
      deleted: 0,
      failed: 0,
      posts: [] as string[],
    };

    // Sync each scraped post
    for (const post of posts) {
      try {
        const existingDoc = (existingDocs || []).find(d => d.title === post.title);

        if (existingDoc) {
          // Check if content changed
          if (existingDoc.description !== post.content) {
            const { error: updateError } = await supabase
              .from('documents')
              .update({
                description: post.content,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingDoc.id);

            if (updateError) {
              console.error('Error updating post:', updateError);
              results.failed++;
            } else {
              results.updated++;
              results.posts.push(`עדכון: ${post.title}`);
            }
          }
        } else {
          // Create new document
          const { data: insertedDoc, error: insertError } = await supabase
            .from('documents')
            .insert({
              title: post.title,
              description: post.content,
              document_type: 'padlet',
              filename: `padlet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              file_path: PADLET_URL,
              file_size: post.content.length,
              file_type: 'text/markdown',
              content_type: 'external',
              status: 'מאושר',
              processing_status: 'pending',
              user_id: user_id,
            })
            .select('id')
            .single();

          if (insertError) {
            console.error('Error inserting post:', insertError);
            results.failed++;
          } else {
            results.created++;
            results.posts.push(`חדש: ${post.title}`);
            
            // Trigger document processing
            if (insertedDoc?.id) {
              try {
                const { error: processError } = await supabase.functions.invoke('process-document', {
                  body: { documentId: insertedDoc.id }
                });
                if (processError) {
                  console.error('Error triggering processing for:', post.title, processError);
                } else {
                  console.log('Triggered processing for:', post.title);
                }
              } catch (procErr) {
                console.error('Failed to invoke process-document:', procErr);
              }
            }
          }
        }
      } catch (postError) {
        console.error('Error processing post:', postError);
        results.failed++;
      }
    }

    // Delete posts that no longer exist in Padlet
    for (const existingDoc of (existingDocs || [])) {
      if (!scrapedTitles.has(existingDoc.title)) {
        try {
          // Also delete associated chunks
          const { error: chunksError } = await supabase
            .from('chunks')
            .delete()
            .eq('source_id', existingDoc.id);

          if (chunksError) {
            console.error('Error deleting chunks for removed post:', chunksError);
          }

          const { error: deleteError } = await supabase
            .from('documents')
            .delete()
            .eq('id', existingDoc.id);

          if (deleteError) {
            console.error('Error deleting removed post:', deleteError);
            results.failed++;
          } else {
            results.deleted++;
            results.posts.push(`נמחק: ${existingDoc.title}`);
          }
        } catch (deleteError) {
          console.error('Error deleting post:', deleteError);
          results.failed++;
        }
      }
    }

    console.log('Sync results:', results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `סונכרנו ${results.created} חדשים, ${results.updated} עודכנו, ${results.deleted} נמחקו`,
        results,
        rawContentLength: markdown.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-padlet:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Parse Padlet content from markdown into individual posts
function parsePadletContent(markdown: string): Array<{ title: string; content: string }> {
  const posts: Array<{ title: string; content: string }> = [];
  
  // Split by headers (## or ###) which typically separate Padlet cards
  const sections = markdown.split(/(?=^#{1,3}\s)/m);
  
  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed || trimmed.length < 20) continue;
    
    // Extract title from first line
    const lines = trimmed.split('\n');
    let title = lines[0].replace(/^#+\s*/, '').trim();
    
    // If no header, use first 50 chars as title
    if (!title || title.length < 3) {
      title = trimmed.substring(0, 50).replace(/\n/g, ' ').trim();
      if (title.length === 50) title += '...';
    }
    
    // Content is everything after the title
    const content = lines.slice(1).join('\n').trim() || trimmed;
    
    // Skip very short or empty posts
    if (content.length < 20) continue;
    
    posts.push({ title, content });
  }
  
  // If no posts found by headers, try to split by double newlines
  if (posts.length === 0) {
    const paragraphs = markdown.split(/\n\n+/);
    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i].trim();
      if (para.length < 30) continue;
      
      const title = para.substring(0, 50).replace(/\n/g, ' ').trim() + (para.length > 50 ? '...' : '');
      posts.push({ title, content: para });
    }
  }
  
  // If still no posts, treat entire content as one post
  if (posts.length === 0 && markdown.length > 50) {
    posts.push({
      title: 'Padlet Content',
      content: markdown,
    });
  }
  
  return posts;
}
