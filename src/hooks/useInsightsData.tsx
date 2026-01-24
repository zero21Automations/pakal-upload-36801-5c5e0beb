import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserRole } from "./useUserRole";
import { startOfDay, subDays, subMonths, subWeeks, format } from "date-fns";

interface UsageStats {
  totalChats: number;
  totalUsers: number;
  avgSessionLength: number;
  satisfactionRate: number;
  topUnits: string[];
  weeklyGrowth: number;
}

interface ChatInsight {
  id: string;
  question: string;
  frequency: number;
  avgRating: number;
  lastAsked: Date;
  category: string;
  trend: 'up' | 'down' | 'stable';
}

interface KnowledgeGap {
  topic: string;
  count: number;
  hasL1: boolean;
}

interface UsageTrend {
  day: string;
  chats: number;
  users: number;
}

export function useInsightsData(period: string = 'week', unitFilter: string = 'all') {
  const { user } = useAuth();
  const { profile } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [usageStats, setUsageStats] = useState<UsageStats>({
    totalChats: 0,
    totalUsers: 0,
    avgSessionLength: 0,
    satisfactionRate: 0,
    topUnits: [],
    weeklyGrowth: 0
  });
  
  const [chatInsights, setChatInsights] = useState<ChatInsight[]>([]);
  const [knowledgeGaps, setKnowledgeGaps] = useState<KnowledgeGap[]>([]);
  const [usageTrends, setUsageTrends] = useState<UsageTrend[]>([]);

  const getDateRange = useCallback((periodType: string): Date => {
    const now = new Date();
    switch (periodType) {
      case 'day':
        return subDays(now, 1);
      case 'week':
        return subWeeks(now, 1);
      case 'month':
        return subMonths(now, 1);
      case 'quarter':
        return subMonths(now, 3);
      default:
        return subWeeks(now, 1);
    }
  }, []);

  const fetchInsightsData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const startDate = getDateRange(period);
      const orgId = profile?.org_id || 'default-org';
      
      // Fetch conversation statistics
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id, user_id, created_at')
        .gte('created_at', startDate.toISOString());
      
      if (convError) throw convError;
      
      // Fetch chat messages count
      const { data: messages, error: msgError } = await supabase
        .from('chat_messages')
        .select('id, conversation_id, created_at, is_user')
        .gte('created_at', startDate.toISOString());
      
      if (msgError) throw msgError;
      
      // Fetch chat turns for analytics (if available)
      const { data: chatTurns, error: turnsError } = await supabase
        .from('chat_turns')
        .select('id, question, org_id, unit_id, created_at, retrieval_meta')
        .eq('org_id', orgId)
        .gte('created_at', startDate.toISOString());
      
      // Don't throw on chat_turns error - it might not have data yet
      
      // Calculate stats
      const uniqueUsers = new Set(conversations?.map(c => c.user_id) || []);
      const totalChats = conversations?.length || 0;
      const totalUsers = uniqueUsers.size;
      
      // Calculate weekly growth
      const previousStartDate = subWeeks(startDate, 1);
      const { data: previousConversations } = await supabase
        .from('conversations')
        .select('id')
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString());
      
      const previousTotal = previousConversations?.length || 0;
      const weeklyGrowth = previousTotal > 0 
        ? Math.round(((totalChats - previousTotal) / previousTotal) * 100) 
        : 0;
      
      setUsageStats({
        totalChats,
        totalUsers,
        avgSessionLength: messages ? Math.round(messages.length / Math.max(totalChats, 1) * 2) : 0,
        satisfactionRate: 0, // Would need rating system
        topUnits: [],
        weeklyGrowth
      });
      
      // Analyze popular questions from chat_turns
      if (chatTurns && chatTurns.length > 0) {
        const questionFrequency: Record<string, { count: number; lastAsked: Date }> = {};
        
        chatTurns.forEach(turn => {
          const question = turn.question.substring(0, 100);
          if (!questionFrequency[question]) {
            questionFrequency[question] = { count: 0, lastAsked: new Date(turn.created_at) };
          }
          questionFrequency[question].count++;
          if (new Date(turn.created_at) > questionFrequency[question].lastAsked) {
            questionFrequency[question].lastAsked = new Date(turn.created_at);
          }
        });
        
        const sortedQuestions = Object.entries(questionFrequency)
          .sort(([, a], [, b]) => b.count - a.count)
          .slice(0, 10)
          .map(([question, data], index) => ({
            id: `q-${index}`,
            question,
            frequency: data.count,
            avgRating: 4.0, // Placeholder
            lastAsked: data.lastAsked,
            category: 'כללי',
            trend: 'stable' as const
          }));
        
        setChatInsights(sortedQuestions);
        
        // Analyze knowledge gaps from retrieval_meta
        const gapsMap: Record<string, { count: number; hasL1: boolean }> = {};
        
        chatTurns.forEach(turn => {
          const meta = turn.retrieval_meta as any;
          if (meta && !meta.has_l1_content) {
            const topic = turn.question.substring(0, 50);
            if (!gapsMap[topic]) {
              gapsMap[topic] = { count: 0, hasL1: false };
            }
            gapsMap[topic].count++;
          }
        });
        
        const gaps = Object.entries(gapsMap)
          .sort(([, a], [, b]) => b.count - a.count)
          .slice(0, 5)
          .map(([topic, data]) => ({
            topic,
            count: data.count,
            hasL1: data.hasL1
          }));
        
        setKnowledgeGaps(gaps);
      }
      
      // Calculate usage trends
      const trends: UsageTrend[] = [];
      const days = period === 'day' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : 90;
      
      for (let i = days - 1; i >= 0; i--) {
        const day = subDays(new Date(), i);
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        
        const dayConversations = conversations?.filter(c => {
          const created = new Date(c.created_at);
          return created >= dayStart && created < dayEnd;
        }) || [];
        
        const dayUsers = new Set(dayConversations.map(c => c.user_id));
        
        trends.push({
          day: format(day, 'dd/MM'),
          chats: dayConversations.length,
          users: dayUsers.size
        });
      }
      
      setUsageTrends(trends);
      
    } catch (err) {
      console.error('Error fetching insights data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch insights');
    } finally {
      setLoading(false);
    }
  }, [user, profile, period, getDateRange]);

  useEffect(() => {
    fetchInsightsData();
  }, [fetchInsightsData]);

  return {
    loading,
    error,
    usageStats,
    chatInsights,
    knowledgeGaps,
    usageTrends,
    refetch: fetchInsightsData
  };
}
