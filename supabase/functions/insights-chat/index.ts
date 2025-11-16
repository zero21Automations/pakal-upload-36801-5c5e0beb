import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { getRoleSystemPrompt } from './role-prompts.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, org_id, unit_id, mode = 'insights', level_weights, user_role = null } = await req.json();

    if (!message || !org_id) {
      return new Response(
        JSON.stringify({ error: 'Message and org_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Insights Chat - Message: "${message.substring(0, 100)}...", Org: ${org_id}, Mode: ${mode}, Role: ${user_role || 'none'}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('Lovable API key not configured');
    }

    // Perform RAG search to get relevant context
    let searchResults = [];
    let searchMetadata = {};

    try {
      const ragResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/rag-search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: message,
          org_id,
          unit_id,
          mode,
          top_k: 6,
          include_drafts: mode === 'sandbox',
          level_weights: level_weights || { Core: 0.50, L1: 0.20, L2: 0.08, L3: 0 }
        }),
      });

      if (ragResponse.ok) {
        const ragData = await ragResponse.json();
        searchResults = ragData.results || [];
        searchMetadata = ragData.metadata || {};
        console.log(`RAG Search found ${searchResults.length} relevant chunks`);
      } else {
        console.warn('RAG search failed, proceeding without context');
      }
    } catch (ragError) {
      console.warn('RAG search error:', ragError instanceof Error ? ragError.message : String(ragError));
    }

    // Build context from search results
    let contextText = '';
    let citations: Array<{
      source_id: string;
      chunk_id: string;
      title: string;
      level: number;
      confidence: number;
      excerpt: string;
    }> = [];
    
    if (searchResults.length > 0) {
      contextText = '\n\nמידע רלוונטי מהמערכת:\n\n';
      searchResults.forEach((result: any, index: number) => {
        let levelBadge = '';
        if (result.level === 0) {
          levelBadge = 'מסמך ליבה';
        } else {
          levelBadge = `רמה ${result.level}`;
        }
        contextText += `[${levelBadge}] ${result.source_title}\n${result.content}\n\n`;
        citations.push({
          source_id: result.source_id,
          chunk_id: result.chunk_id,
          title: result.source_title,
          level: result.level,
          confidence: result.confidence,
          excerpt: result.content.substring(0, 200) + '...'
        });
      });
    }

    // Get role-specific system prompt
    const baseRolePrompt = getRoleSystemPrompt(user_role);
    
    // Add knowledge base guidelines for all roles
    const knowledgeGuidelines = `

היררכיית מקורות (סדר עדיפות):
1. **רמה 0 (מסמך ליבה)** - תוכן הליבה הרשמי של פק״ל - זוהי המקור הסמכותי ביותר
2. **רמה 1 (L1)** - תוכן ליבה נוסף - עדיפות גבוהה מאוד
3. **רמה 2 (L2)** - כלים והדרכות מעשיות - עדיפות בינונית
4. **רמה 3 (L3)** - מחקרים והקשר רחב - תוספת עומק

עקרונות חשובים:
- ענה על בסיס המידע שסופק לך מהמערכת
- צטט מקורות רלוונטיים ורמת הידע שלהם
- אם יש מספר מקורות ברמות שונות - העדף את הרמה הגבוהה יותר
- אם אין מידע רלוונטי במערכת - אמור זאת בבירור
- הדגש נקודות מעשיות וישימות`;

    const systemPrompt = baseRolePrompt + knowledgeGuidelines;

    let contextInfo = '';
    if (searchResults.length > 0) {
      const metadata = searchMetadata as any;
      contextInfo = `

מידע על החיפוש:
- נמצאו ${metadata.total_found || 0} תוצאות רלוונטיות
- מוצגות ${searchResults.length} תוצאות מובילות
- התפלגות לפי רמות: L0/Core: ${metadata.level_distribution?.L0 || 0}, L1: ${metadata.level_distribution?.L1 || 0}, L2: ${metadata.level_distribution?.L2 || 0}, L3: ${metadata.level_distribution?.L3 || 0}
- כולל תוכן ליבה (L0/L1): ${metadata.has_l1_content ? 'כן' : 'לא'}`;
    } else {
      contextInfo = `

⚠️ חשוב: לא נמצא מידע רלוונטי במאגר הידע לשאלה זו.
אנא הודע למשתמש בבירור שאין מידע במערכת על הנושא הזה, ואל תמציא מידע.`;
    }

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: systemPrompt + contextInfo
            },
            {
              role: 'user',
              content: `שאלת המשתמש: ${message}${contextText ? '\n\n' + contextText : ''}`
            }
          ],
          max_tokens: 1000,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Lovable AI error:', errorData);
        return new Response(
          JSON.stringify({ error: 'שגיאה ביצירת תשובה', details: errorData.error?.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Return streaming response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Send initial metadata
            const initialData = JSON.stringify({
              type: 'metadata',
              citations,
              metadata: searchMetadata
            });
            controller.enqueue(encoder.encode(`data: ${initialData}\n\n`));

            // Stream the AI response
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullMessage = '';

            if (!reader) {
              throw new Error('No reader available');
            }

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') continue;
                  
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) {
                      fullMessage += content;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content })}\n\n`));
                    }
                  } catch (e) {
                    // Skip malformed JSON
                  }
                }
              }
            }

            // Store in database after streaming completes
            const chatTurnId = `chat_${new Date().toISOString().split('T')[0]}_${Math.random().toString(36).substr(2, 4)}`;
            
            await supabaseClient.from('chat_turns').insert({
              id: chatTurnId,
              org_id,
              unit_id,
              user_id: org_id,
              question: message,
              answer: fullMessage,
              mode,
              retrieval_meta: searchMetadata
            });

            if (citations.length > 0) {
              const citationInserts = citations.map(citation => ({
                turn_id: chatTurnId,
                source_id: citation.source_id,
                chunk_id: citation.chunk_id,
                level: citation.level,
                confidence: citation.confidence,
                excerpt: citation.excerpt
              }));
              await supabaseClient.from('citations').insert(citationInserts);
            }

            // Send done signal
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
            controller.close();
          } catch (error) {
            console.error('Streaming error:', error);
            controller.error(error);
          }
        }
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      });

  } catch (error) {
    console.error('Error in insights chat:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function analyzeQueryType(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('פערי ידע') || lowerQuery.includes('חסר') || lowerQuery.includes('ללא מקור')) {
    return 'gap_analysis';
  }
  if (lowerQuery.includes('שימוש') || lowerQuery.includes('מסמכים') || lowerQuery.includes('ציטוט')) {
    return 'usage_analysis';
  }
  if (lowerQuery.includes('השפעת') || lowerQuery.includes('אישור') || lowerQuery.includes('טיוטה')) {
    return 'approval_impact';
  }
  if (lowerQuery.includes('סתירה') || lowerQuery.includes('התנגשות') || lowerQuery.includes('קונפליקט')) {
    return 'conflict_detection';
  }
  if (lowerQuery.includes('תוכנית') || lowerQuery.includes('השלמה') || lowerQuery.includes('המלצ')) {
    return 'improvement_plan';
  }
  
  return 'generic';
}

async function performGapAnalysis(supabaseClient: any): Promise<string> {
  // Simulate gap analysis - in production, this would query actual analytics
  const mockGaps = [
    { topic: 'איך מחזקים לכידות פלוגתית?', count: 47, hasL1: false },
    { topic: 'טיפול בקונפליקטים בצוות', count: 29, hasL1: false },
    { topic: 'ליווי משפחות בזמן שירות', count: 23, hasL1: false }
  ];

  const levelStats = { l1Rate: 0.34, l2Rate: 0.45, l3Rate: 0.21 };

  return `📊 **ניתוח פערי ידע מעמיק:**

**TOP 3 נושאים ללא מקור L1:**
${mockGaps.map((gap, i) => `${i + 1}. ${gap.topic} - ${gap.count} פניות`).join('\n')}

**התפלגות רמות מקורות (7 ימים):**
• L1: ${Math.round(levelStats.l1Rate * 100)}% מהתשובות
• L2: ${Math.round(levelStats.l2Rate * 100)}% מהתשובות  
• L3: ${Math.round(levelStats.l3Rate * 100)}% מהתשובות

**המלצות מיידיות:**
🟨 יש ליצור מדריכי L1 ל-3 הנושאים הפופולריים ביותר
🟪 לאשר טיוטות ממתינות שיכסו 45% מהפערים
🔴 דחיפות גבוהה - רק 34% מהתשובות מבוססות על L1`;
}

async function performUsageAnalysis(supabaseClient: any, orgId: string): Promise<string> {
  // Query actual documents
  const { data: documents } = await supabaseClient
    .from('documents')
    .select('title, ai_determined_level, created_at, status')
    .eq('status', 'מאושר')
    .order('created_at', { ascending: false })
    .limit(10);

  return `📈 **דוח שימוש במסמכים:**

**מסמכים אחרונים שאושרו:**
${documents?.map((doc: any) => `🟨 ${doc.title} (${doc.ai_determined_level || 'לא סווג'})`).join('\n') || 'אין מסמכים'}

**מסמכים לא בשימוש (סימולציה):**
🟪 מדריך הדרכה מתקדמת - 0 גישות ב-90 יום
🟪 נהלי בטיחות מעודכנים - 2 גישות

**המלצות:**
🗑️ מחיקה/ארכיון מסמכים ללא שימוש
📝 יצירת מסמכי L1 חדשים במקום L3 פופולריים`;
}

async function performApprovalImpact(supabaseClient: any, orgId: string): Promise<string> {
  const { data: pendingDocs } = await supabaseClient
    .from('documents')
    .select('title, ai_determined_level, ai_summary')
    .eq('status', 'נותח - ממתין לאישור')
    .limit(5);

  return `🔍 **ניתוח השפעת אישורים:**

**טיוטות ממתינות לאישור:**
${pendingDocs?.map((doc: any) => 
`📄 **${doc.title}** (${doc.ai_determined_level})
   ${doc.ai_summary || 'אין סיכום זמין'}`
).join('\n\n') || 'אין טיוטות ממתינות'}

**השפעה צפויה:**
• אישור מסמכי L1 ישפר 40-60% מהתשובות הרלוונטיות
• מסמכי L2 יוסיפו עומק וכלים מעשיים
• בדיקה נדרשת להתנגשויות עם מסמכים קיימים`;
}

async function performConflictDetection(supabaseClient: any, orgId: string): Promise<string> {
  return `⚠️ **זיהוי התנגשויות:**

**סתירות זוהו (סימולציה):**
🟩 **מסמך ליבה ארגוני:** "ODT בקבוצות של 15-20 איש"
🟦 **מסמך יחידתי פלוגה א׳:** "ODT מועדף בקבוצות של 8-12 איש"

**השפעה:**
• 23 שאלות על ODT מקבלות מענה סותר
• בלבול בקרב מנחים באתרי השטח

**המלצות פתרון:**
1. עדכן מסמך יחידתי להתאים לליבה הארגונית
2. יצור הוראה מיוחדת עם הסבר מתי לסטות
3. דגל למחיקה או הסרת ההתנגשות`;
}

async function performImprovementPlan(supabaseClient: any, orgId: string): Promise<string> {
  return `📋 **תוכנית השלמות מומלצת:**

**עדיפות גבוהה (חסרי L1):**
1. **לכידות פלוגתית** - 47 פניות
   📝 יצירת מדריך L1 מקיף (8-12 עמודים)

2. **קונפליקטים בצוות** - 29 פניות
   📝 מדריך פתרון סכסוכים L1

3. **ליווי משפחות** - 23 פניות
   📝 כרטיסיות פעילות L2

**משאבים נדרשים:**
• 2 מדריכי L1 חדשים (40 שעות כתיבה)
• 3 כרטיסי פעילות L2 (15 שעות)
• בדיקת איכות והתאמה (10 שעות)

**זמני יישום:** 4-6 שבועות`;
}

async function generateGenericInsight(supabaseClient: any, query: string, orgId: string): Promise<string> {
  return `🤖 **מצב תובנות אדמין פעיל**

על השאלה: "${query}"

אני יכול לעזור לך לנתח:

📊 **פערי ידע** - נושאים ללא מקורות L1/L2
📈 **שימוש במסמכים** - מסמכים פעילים/נטושים  
🔍 **השפעת אישורים** - איך אישור טיוטות ישפיע
⚠️ **התנגשויות** - סתירות בין מסמכי ליבה
🏷️ **איכות תוכן** - זיהוי כפילויות ובעיות

נסה שאלות כמו:
• "הראה לי פערי ידע"
• "נתח שימוש במסמכים"  
• "מה השפעת אישור הטיוטות?"`;
}