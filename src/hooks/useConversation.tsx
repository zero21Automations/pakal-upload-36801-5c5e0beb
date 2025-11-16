import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./useAuth";

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  citations?: any[];
  metadata?: any;
}

export function useConversation() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // Load messages for a conversation
  const loadConversation = useCallback(async (conversationId: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const loadedMessages: ChatMessage[] = (data || []).map(msg => ({
        id: msg.id,
        content: msg.content,
        isUser: msg.is_user,
        timestamp: new Date(msg.created_at),
        citations: msg.citations as any,
        metadata: msg.metadata as any
      }));

      setMessages(loadedMessages);
      setCurrentConversationId(conversationId);
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לטעון את השיחה",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Create a new conversation
  const createConversation = useCallback(async (firstMessage: string) => {
    if (!user) return null;

    try {
      // Create conversation with title based on first message
      const title = firstMessage.length > 50 
        ? firstMessage.substring(0, 50) + '...' 
        : firstMessage;

      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title
        })
        .select()
        .single();

      if (convError) throw convError;

      setCurrentConversationId(conversation.id);
      return conversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו ליצור שיחה חדשה",
        variant: "destructive"
      });
      return null;
    }
  }, [user, toast]);

  // Save a message to the current conversation
  const saveMessage = useCallback(async (
    message: Omit<ChatMessage, 'id' | 'timestamp'>,
    conversationId?: string
  ) => {
    if (!user) return null;

    const targetConversationId = conversationId || currentConversationId;
    if (!targetConversationId) return null;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: targetConversationId,
          content: message.content,
          is_user: message.isUser,
          citations: message.citations || null,
          metadata: message.metadata || null
        })
        .select()
        .single();

      if (error) throw error;

      return data.id;
    } catch (error) {
      console.error('Error saving message:', error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לשמור את ההודעה",
        variant: "destructive"
      });
      return null;
    }
  }, [user, currentConversationId, toast]);

  // Start a new conversation
  const startNewConversation = useCallback(() => {
    setCurrentConversationId(null);
    setMessages([{
      id: 'welcome',
      content: 'שלום! אני העוזר הדיגיטלי של מערכת הידע של פק״ל.\n\nאני יכול לענות על שאלות בהתבסס על המסמכים והתוכן שהועלו למערכת.\n\nהמערכת כוללת:\n• מסמך ליבה (רמה 0) - התוכן הרשמי של פק״ל\n• תוכן L1 - תוכן ליבה נוסף\n• תוכן L2 - כלים והדרכות מעשיות\n• תוכן L3 - מחקרים והקשר רחב\n\nאיך אני יכול לעזור לך היום?',
      isUser: false,
      timestamp: new Date(),
      metadata: { mode: 'knowledge' }
    }]);
  }, []);

  // Subscribe to realtime updates for current conversation
  useEffect(() => {
    if (!currentConversationId) return;

    const channel = supabase
      .channel(`conversation-${currentConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${currentConversationId}`
        },
        (payload) => {
          const newMessage: ChatMessage = {
            id: payload.new.id,
            content: payload.new.content,
            isUser: payload.new.is_user,
            timestamp: new Date(payload.new.created_at),
            citations: payload.new.citations,
            metadata: payload.new.metadata
          };

          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentConversationId]);

  return {
    currentConversationId,
    messages,
    loading,
    setMessages,
    loadConversation,
    createConversation,
    saveMessage,
    startNewConversation
  };
}
