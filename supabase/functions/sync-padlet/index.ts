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
        onlyMainContent: false, // Get full page to capture all posts
        waitFor: 5000, // Wait for dynamic content to load
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
          error: 'Padlet content too short or empty. The page might require authentication or has no public content.',
          contentLength: markdown.length 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse Padlet posts from markdown
    // Padlet posts are usually separated by headers or sections
    const posts = parsePadletContent(markdown);
    console.log('Parsed posts count:', posts.length);

    // Store each post as a document
    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      posts: [] as string[],
    };

    for (const post of posts) {
      try {
        // Check if this post already exists (by title match)
        const { data: existing } = await supabase
          .from('documents')
          .select('id')
          .eq('document_type', 'padlet')
          .eq('title', post.title)
          .maybeSingle();

        if (existing) {
          // Update existing
          const { error: updateError } = await supabase
            .from('documents')
            .update({
              description: post.content,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (updateError) {
            console.error('Error updating post:', updateError);
            results.failed++;
          } else {
            results.updated++;
            results.posts.push(post.title);
          }
        } else {
          // Create new document
          const { error: insertError } = await supabase
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
            });

          if (insertError) {
            console.error('Error inserting post:', insertError);
            results.failed++;
          } else {
            results.created++;
            results.posts.push(post.title);
          }
        }
      } catch (postError) {
        console.error('Error processing post:', postError);
        results.failed++;
      }
    }

    console.log('Sync results:', results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced ${results.created + results.updated} posts from Padlet`,
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
