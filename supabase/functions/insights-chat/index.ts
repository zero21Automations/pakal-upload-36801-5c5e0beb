import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

  try {
    const { message, org_id, unit_id, mode = 'insights' } = await req.json();

    if (!message || !org_id) {
      return new Response(
        JSON.stringify({ error: 'Message and org_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Insights Chat - Message: "${message.substring(0, 100)}...", Org: ${org_id}, Mode: ${mode}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('OpenAI API key not configured');
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
          include_drafts: mode === 'sandbox'
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
      console.warn('RAG search error:', ragError.message);
    }

    // Build context from search results
    let contextText = '';
    let citations = [];
    
    if (searchResults.length > 0) {
      contextText = '\n\nמידע רלוונטי מהמערכת:\n\n';
      searchResults.forEach((result, index) => {
        const levelBadge = `L${result.level}`;
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

    // Analyze query type for specialized insights
    const analysisType = analyzeQueryType(message);
    let systemPrompt = '';
    let assistantMessage = '';

    if (analysisType !== 'generic' && searchResults.length === 0) {
      // Use specialized analysis functions for system insights
      switch (analysisType) {
        case 'gap_analysis':
          assistantMessage = await performGapAnalysis(supabaseClient);
          break;
        case 'usage_analysis':
          assistantMessage = await performUsageAnalysis(supabaseClient, org_id);
          break;
        case 'approval_impact':
          assistantMessage = await performApprovalImpact(supabaseClient, org_id);
          break;
        case 'conflict_detection':
          assistantMessage = await performConflictDetection(supabaseClient, org_id);
          break;
        case 'improvement_plan':
          assistantMessage = await performImprovementPlan(supabaseClient, org_id);
          break;
        default:
          assistantMessage = await generateGenericInsight(supabaseClient, message, org_id);
      }
    } else {
      // Use RAG-powered chat with OpenAI
      systemPrompt = `אתה עוזר דיגיטלי מתקדם עבור מערכת ידע פק״ל (פיתוח כוח לכידות).

מצב פעילות: ${mode === 'insights' ? 'תובנות מנהל' : mode}

היכולות שלך כוללות:
- ניתוח מסמכים וזיהוי פערי ידע
- המלצות על שיפור תהליכי אישור  
- ניתוח דפוסי שימוש במערכת
- זיהוי מסמכים שלא בשימוש או מיושנים
- הצעות לשיפור ארגון הידע

היררכיית ידע:
- רמה 1 (L1): תוכן ליבה של פק״ל - עדיפות גבוהה
- רמה 2 (L2): כלים והדרכות - עדיפות בינונית  
- רמה 3 (L3): מחקרים והקשר - תוספת עומק

חובה לצטט מקורות כאשר זמינים. ענה בעברית, בצורה מקצועית וממוקדת.`;

      if (searchResults.length > 0) {
        systemPrompt += `\n\nסטטיסטיקות חיפוש:
- נמצאו ${searchMetadata.total_found || 0} תוצאות רלוונטיות
- מוצגות ${searchResults.length} תוצאות מובילות
- רמה 1: ${searchMetadata.level_distribution?.L1 || 0} מסמכים
- רמה 2: ${searchMetadata.level_distribution?.L2 || 0} מסמכים  
- רמה 3: ${searchMetadata.level_distribution?.L3 || 0} מסמכים
- יש תוכן L1: ${searchMetadata.has_l1_content ? 'כן' : 'לא'}`;
      } else {
        systemPrompt += '\n\nשים לב: לא נמצא תוכן רלוונטי במערכת לשאלה זו. ספק תשובה כללית מבוססת ידע מקצועי.';
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: message + contextText
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('OpenAI API error:', data);
        return new Response(
          JSON.stringify({ error: 'שגיאה ביצירת תשובה', details: data.error?.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      assistantMessage = data.choices[0].message.content;
    }

    // Store chat turn and citations in database
    const chatTurnId = `chat_${new Date().toISOString().split('T')[0]}_${Math.random().toString(36).substr(2, 4)}`;
    
    try {
      // Store chat turn
      await supabaseClient.from('chat_turns').insert({
        id: chatTurnId,
        org_id,
        unit_id,
        user_id: org_id, // For now, using org_id as user_id
        question: message,
        answer: assistantMessage,
        mode,
        retrieval_meta: searchMetadata
      });

      // Store citations
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
        console.log(`Stored ${citations.length} citations for turn ${chatTurnId}`);
      }
    } catch (dbError) {
      console.warn('Failed to store chat turn/citations:', dbError.message);
      // Don't fail the request if DB storage fails
    }

    return new Response(
      JSON.stringify({
        answer: assistantMessage,
        citations,
        query_type: analysisType,
        metadata: {
          model: 'gpt-4o-mini',
          mode,
          search_results_count: searchResults.length,
          has_l1_content: searchMetadata.has_l1_content || false,
          turn_id: chatTurnId,
          timestamp: new Date().toISOString(),
          ...searchMetadata
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in insights chat:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
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