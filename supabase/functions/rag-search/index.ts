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
      top_k = 12, // Increased for better diversity
      level_weights = { Core: 0.50, L1: 0.20, L2: 0.08, L3: 0 },
      include_drafts = false
    }: SearchRequest = await req.json();

    console.log(`RAG Search - Query: "${query}", Org: ${org_id}, Mode: ${mode}`);

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: query' }),
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
    let statusFilter = ['approved', 'מאושר']; // approved only by default (both English and Hebrew)
    if (mode === 'sandbox' && include_drafts) {
      statusFilter = ['approved', 'מאושר', 'ממתין לאישור', 'טיוטה', 'pending'];
    } else if (mode === 'insights') {
      statusFilter = ['approved', 'מאושר', 'ממתין לאישור', 'pending']; // admins can see pending
    }

    // Perform hybrid search with vector similarity and metadata filtering
    // First try with org_id, then fallback to all chunks if no results
    let searchQuery = supabase
      .from('chunks')
      .select(`
        id,
        source_id,
        source_type,
        content,
        level,
        metadata,
        embedding,
        status,
        org_id
      `);

    // Only filter by org_id if provided and not 'default-org'
    if (org_id && org_id !== 'default-org') {
      searchQuery = searchQuery.eq('org_id', org_id);
    }

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

    console.log(`RAG Search - Found ${chunks?.length || 0} total chunks in database`);

    // If no chunks found with org_id filter, try without it
    let finalChunks = chunks;
    if ((!chunks || chunks.length === 0) && org_id && org_id !== 'default-org') {
      console.log('No chunks found with org_id filter, trying without filter...');
      const { data: allChunks, error: allError } = await supabase
        .from('chunks')
        .select(`
          id,
          source_id,
          source_type,
          content,
          level,
          metadata,
          embedding,
          status,
          org_id
        `);
      
      if (!allError && allChunks && allChunks.length > 0) {
        console.log(`Found ${allChunks.length} chunks without org_id filter`);
        finalChunks = allChunks;
      }
    }

    // Get source titles from documents and core_documents tables
    const documentSourceIds = finalChunks?.filter(c => c.source_type === 'document').map(c => c.source_id) || [];
    const coreDocSourceIds = finalChunks?.filter(c => c.source_type === 'core_document').map(c => c.source_id) || [];

    // Fetch document titles
    let documentTitles: Record<string, string> = {};
    if (documentSourceIds.length > 0) {
      const { data: docs } = await supabase
        .from('documents')
        .select('id, title')
        .in('id', documentSourceIds);
      docs?.forEach(d => { documentTitles[d.id] = d.title; });
    }

    // Fetch core document titles
    let coreDocTitles: Record<string, string> = {};
    if (coreDocSourceIds.length > 0) {
      const { data: coreDocs } = await supabase
        .from('core_documents')
        .select('id, title')
        .in('id', coreDocSourceIds);
      coreDocs?.forEach(d => { coreDocTitles[d.id] = d.title; });
    }

    if (!finalChunks || finalChunks.length === 0) {
      console.log('No chunks found for search criteria after fallback');
      return new Response(
        JSON.stringify({ 
          results: [], 
          metadata: { 
            total_found: 0, 
            query_embedding_generated: true,
            search_mode: mode,
            status_filter: statusFilter,
            org_id_used: org_id
          } 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate semantic similarity and apply level boosting
    const scoredResults: (SearchResult & { similarity: number; boosted_score: number })[] = finalChunks
      .map(chunk => {
        // Calculate cosine similarity
        // The embedding comes from DB as a string like "[0.1, 0.2, ...]" - need to parse it
        let chunkEmbedding: number[] | null = null;
        
        if (chunk.embedding) {
          try {
            if (typeof chunk.embedding === 'string') {
              // Parse the vector string format from Postgres
              chunkEmbedding = JSON.parse(chunk.embedding);
            } else if (Array.isArray(chunk.embedding)) {
              chunkEmbedding = chunk.embedding;
            }
          } catch (e) {
            console.error('Failed to parse embedding for chunk:', chunk.id, e);
          }
        }
        
        let similarity = 0;
        
        if (chunkEmbedding && Array.isArray(chunkEmbedding) && chunkEmbedding.length === queryEmbedding.length) {
          const dotProduct = queryEmbedding.reduce((sum, val, i) => sum + val * chunkEmbedding![i], 0);
          const queryMagnitude = Math.sqrt(queryEmbedding.reduce((sum, val) => sum + val * val, 0));
          const chunkMagnitude = Math.sqrt(chunkEmbedding.reduce((sum, val) => sum + val * val, 0));
          if (queryMagnitude > 0 && chunkMagnitude > 0) {
            similarity = dotProduct / (queryMagnitude * chunkMagnitude);
          }
        }

        // Apply level-based boosting with Core (level 0) as highest
        const level = chunk.level;
        let levelBoost = level_weights.L3; // default
        if (level === 0) levelBoost = level_weights.Core;
        else if (level === 1) levelBoost = level_weights.L1;
        else if (level === 2) levelBoost = level_weights.L2;

        const boosted_score = similarity + levelBoost;

        // Get source title from fetched document data
        let source_title = chunk.metadata?.title || 'מסמך';
        if (chunk.source_type === 'document' && documentTitles[chunk.source_id]) {
          source_title = documentTitles[chunk.source_id];
        } else if (chunk.source_type === 'core_document' && coreDocTitles[chunk.source_id]) {
          source_title = coreDocTitles[chunk.source_id];
        }

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
      // Filter out low similarity results - use 0.2 threshold to be more inclusive
      .filter(r => r.similarity > 0.2)
      // Sort by boosted score (descending)
      .sort((a, b) => b.boosted_score - a.boosted_score)
      // Take more results initially to allow for diversity filtering
      .slice(0, Math.min(top_k * 2, 24));

    // Apply enhanced diversity filter:
    // - Max 2 chunks per source (to get diverse sources)
    // - Prioritize higher-level sources (Core > L1 > L2 > L3)
    // - Ensure at least 3 unique sources if available
    const diversityFiltered: SearchResult[] = [];
    const sourceCountMap = new Map<string, number>();
    const uniqueSources = new Set<string>();
    
    // First pass: ensure we get at least one chunk from each unique high-level source
    const sortedByLevel = [...scoredResults].sort((a, b) => a.level - b.level);
    
    for (const result of sortedByLevel) {
      if (uniqueSources.size < 5 && !uniqueSources.has(result.source_id)) {
        diversityFiltered.push({
          chunk_id: result.chunk_id,
          source_id: result.source_id,
          content: result.content,
          level: result.level,
          confidence: result.confidence,
          metadata: { ...result.metadata, source_type: (result as any).source_type },
          source_title: result.source_title,
          source_status: result.source_status
        });
        uniqueSources.add(result.source_id);
        sourceCountMap.set(result.source_id, 1);
      }
    }
    
    // Second pass: fill remaining slots with best scoring chunks (max 2 per source)
    for (const result of scoredResults) {
      if (diversityFiltered.length >= top_k) break;
      
      const sourceCount = sourceCountMap.get(result.source_id) || 0;
      const alreadyIncluded = diversityFiltered.some(r => r.chunk_id === result.chunk_id);
      
      if (!alreadyIncluded && sourceCount < 2) {
        diversityFiltered.push({
          chunk_id: result.chunk_id,
          source_id: result.source_id,
          content: result.content,
          level: result.level,
          confidence: result.confidence,
          metadata: { ...result.metadata, source_type: (result as any).source_type },
          source_title: result.source_title,
          source_status: result.source_status
        });
        sourceCountMap.set(result.source_id, sourceCount + 1);
      }
    }
    
    // Final sort by level (hierarchy) then confidence
    diversityFiltered.sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return b.confidence - a.confidence;
    });

    // Calculate metadata for insights
    const levelDistribution = {
      Core: diversityFiltered.filter(r => r.level === 0).length,
      L1: diversityFiltered.filter(r => r.level === 1).length,
      L2: diversityFiltered.filter(r => r.level === 2).length,
      L3: diversityFiltered.filter(r => r.level === 3).length,
    };

    const hasCore = levelDistribution.Core > 0;
    const hasL1 = levelDistribution.L1 > 0;
    const avgConfidence = diversityFiltered.length > 0 
      ? diversityFiltered.reduce((sum, r) => sum + r.confidence, 0) / diversityFiltered.length
      : 0;

    const responseMetadata = {
      total_found: finalChunks.length,
      returned: diversityFiltered.length,
      search_mode: mode,
      level_distribution: levelDistribution,
      has_core_content: hasCore,
      has_l1_content: hasL1,
      avg_confidence: avgConfidence,
      level_weights_applied: level_weights,
      status_filter: statusFilter,
      diversity_applied: true,
      query_embedding_generated: true,
      org_id_used: org_id
    };

    console.log(`RAG Search completed - Found: ${finalChunks.length}, Returned: ${diversityFiltered.length}, Core: ${levelDistribution.Core}, L1: ${levelDistribution.L1}, L2: ${levelDistribution.L2}, L3: ${levelDistribution.L3}`);

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