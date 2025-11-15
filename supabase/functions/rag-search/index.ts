import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SearchRequest {
  query: string;
  org_id: string;
  unit_id?: string;
  mode?: 'insights' | 'user' | 'sandbox';
  top_k?: number;
  level_weights?: { Core: number; L1: number; L2: number; L3: number };
  include_drafts?: boolean;
}

interface SearchResult {
  chunk_id: string;
  source_id: string;
  content: string;
  level: number;
  confidence: number;
  metadata: any;
  source_title: string;
  source_status: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      query, 
      org_id, 
      unit_id, 
      mode = 'insights',
      top_k = 8,
      level_weights = { Core: 0.50, L1: 0.20, L2: 0.08, L3: 0 },
      include_drafts = false
    }: SearchRequest = await req.json();

    console.log(`RAG Search - Query: "${query}", Org: ${org_id}, Mode: ${mode}`);

    if (!query || !org_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: query, org_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate query embedding
    let queryEmbedding: number[];
    try {
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: query,
        }),
      });

      const embeddingData = await embeddingResponse.json();
      queryEmbedding = embeddingData.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to generate query embedding' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build status filter based on mode
    let statusFilter = ['מאושר']; // approved only by default
    if (mode === 'sandbox' && include_drafts) {
      statusFilter = ['מאושר', 'ממתין לאישור', 'טיוטה'];
    } else if (mode === 'insights') {
      statusFilter = ['מאושר', 'ממתין לאישור']; // admins can see pending
    }

    // Perform hybrid search with vector similarity and metadata filtering
    // Search both regular documents and core documents
    let searchQuery = supabase
      .from('chunks')
      .select(`
        id,
        source_id,
        source_type,
        content,
        level,
        metadata,
        embedding
      `)
      .eq('org_id', org_id)
      .in('status', statusFilter);

    // Add unit filter if specified
    if (unit_id) {
      searchQuery = searchQuery.or(`unit_id.eq.${unit_id},unit_id.is.null`);
    }

    // Execute the query
    const { data: chunks, error: searchError } = await searchQuery;

    if (searchError) {
      console.error('Database search error:', searchError);
      return new Response(
        JSON.stringify({ error: 'Database search failed', details: searchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!chunks || chunks.length === 0) {
      console.log('No chunks found for search criteria');
      return new Response(
        JSON.stringify({ 
          results: [], 
          metadata: { 
            total_found: 0, 
            query_embedding_generated: true,
            search_mode: mode,
            status_filter: statusFilter
          } 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate semantic similarity and apply level boosting
    const scoredResults: (SearchResult & { similarity: number; boosted_score: number })[] = chunks
      .map(chunk => {
        // Calculate cosine similarity
        const chunkEmbedding = chunk.embedding;
        let similarity = 0;
        
        if (chunkEmbedding && Array.isArray(chunkEmbedding)) {
          const dotProduct = queryEmbedding.reduce((sum, val, i) => sum + val * chunkEmbedding[i], 0);
          const queryMagnitude = Math.sqrt(queryEmbedding.reduce((sum, val) => sum + val * val, 0));
          const chunkMagnitude = Math.sqrt(chunkEmbedding.reduce((sum, val) => sum + val * val, 0));
          similarity = dotProduct / (queryMagnitude * chunkMagnitude);
        }

        // Apply level-based boosting with Core (level 0) as highest
        const level = chunk.level;
        let levelBoost = level_weights.L3; // default
        if (level === 0) levelBoost = level_weights.Core;
        else if (level === 1) levelBoost = level_weights.L1;
        else if (level === 2) levelBoost = level_weights.L2;

        const boosted_score = similarity + levelBoost;

        // Get source title from metadata (for core docs) or documents table
        const source_title = chunk.metadata?.title || chunk.documents?.title || 'Unknown';

        return {
          chunk_id: chunk.id,
          source_id: chunk.source_id,
          source_type: chunk.source_type,
          content: chunk.content,
          level: level,
          confidence: similarity,
          metadata: chunk.metadata || {},
          source_title,
          source_status: chunk.status || 'approved',
          similarity,
          boosted_score
        };
      })
      // Sort by boosted score (descending)
      .sort((a, b) => b.boosted_score - a.boosted_score)
      // Take top_k results
      .slice(0, Math.min(top_k, 16)); // max 16 as per global rules

    // Apply diversity filter (max 2 chunks per source)
    const diversityFiltered: SearchResult[] = [];
    const sourceCountMap = new Map<string, number>();

    for (const result of scoredResults) {
      const sourceCount = sourceCountMap.get(result.source_id) || 0;
      if (sourceCount < 2) {
        diversityFiltered.push({
          chunk_id: result.chunk_id,
          source_id: result.source_id,
          content: result.content,
          level: result.level,
          confidence: result.confidence,
          metadata: result.metadata,
          source_title: result.source_title,
          source_status: result.source_status
        });
        sourceCountMap.set(result.source_id, sourceCount + 1);
      }
    }

    // Calculate metadata for insights
    const levelDistribution = {
      Core: diversityFiltered.filter(r => r.level === 0).length,
      L1: diversityFiltered.filter(r => r.level === 1).length,
      L2: diversityFiltered.filter(r => r.level === 2).length,
      L3: diversityFiltered.filter(r => r.level === 3).length,
    };

    const hasCore = levelDistribution.Core > 0;
    const hasL1 = levelDistribution.L1 > 0;
    const avgConfidence = diversityFiltered.reduce((sum, r) => sum + r.confidence, 0) / diversityFiltered.length;

    const responseMetadata = {
      total_found: chunks.length,
      returned: diversityFiltered.length,
      search_mode: mode,
      level_distribution: levelDistribution,
      has_core_content: hasCore,
      has_l1_content: hasL1,
      avg_confidence: avgConfidence,
      level_weights_applied: level_weights,
      status_filter: statusFilter,
      diversity_applied: true,
      query_embedding_generated: true
    };

    console.log(`RAG Search completed - Found: ${chunks.length}, Returned: ${diversityFiltered.length}, L1: ${levelDistribution.L1}, L2: ${levelDistribution.L2}, L3: ${levelDistribution.L3}`);

    return new Response(
      JSON.stringify({
        results: diversityFiltered,
        metadata: responseMetadata
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in RAG search:', error);
    return new Response(
      JSON.stringify({ 
        error: 'RAG search failed', 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});