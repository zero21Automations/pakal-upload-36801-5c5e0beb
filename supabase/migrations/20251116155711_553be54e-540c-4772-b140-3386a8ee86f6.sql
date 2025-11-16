-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM (
  'mentor',
  'cohesion_officer', 
  'rear_officer',
  'company_commander',
  'platoon_commander',
  'platoon_cohesion_leader'
);

-- Create user_roles table (security: separate from profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create user_profiles table
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  unit_id TEXT,
  org_id TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roles during onboarding"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS policies for user_profiles
CREATE POLICY "Users can view their own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create suggested_questions table
CREATE TABLE public.suggested_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_type app_role NOT NULL,
  question_text TEXT NOT NULL,
  category TEXT,
  priority INTEGER DEFAULT 0,
  context_triggers TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.suggested_questions ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read suggested questions
CREATE POLICY "Authenticated users can view suggested questions"
ON public.suggested_questions
FOR SELECT
TO authenticated
USING (true);

-- Create trigger for updated_at on user_profiles
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert default suggested questions for each role
INSERT INTO public.suggested_questions (role_type, question_text, category, priority) VALUES
-- Mentor questions
('mentor', 'איך אני מנחה את קצין הלכידות להציג למג"ד תוכנית עבודה בצורה שתגייס אותו?', 'רתימת מפקדים', 1),
('mentor', 'צריך דוגמה קצרה לניסוח שקצין הלכידות יכול לשלוח למ"פ כדי שישלב לכידות בשגרה', 'הטמעת שגרה', 2),
('mentor', 'איך מתמודדים עם קצין לכידות שנתקע בשלב הקמת צוות המובילים?', 'יישום', 3),
('mentor', 'שלח לי את 3 ההישגים הנדרשים בשלב היישום', 'מעקב התקדמות', 4),
('mentor', 'מה הנוהל לטיפול בדילמת עורף מורכבת שחורגת מהמנדט שלי?', 'העברה למומחה', 5),

-- Cohesion Officer questions  
('cohesion_officer', 'מהם 3 הטיעונים המרכזיים לרתימת מ"פ סקפטי?', 'רתימה', 1),
('cohesion_officer', 'איך מנתחים מיפויים פלוגתיים כדי למצוא אתגר גדודי?', 'מיפוי', 2),
('cohesion_officer', 'צריך תבנית לסדנת סגל (מ"מ ומעלה) בנושא שותפות היררכית', 'סדנאות', 3),
('cohesion_officer', 'איך אני מתניע את מובילי הלכידות הפלוגתיים להתחיל פעילות ברמת השטח?', 'הפעלה', 4),
('cohesion_officer', 'המ"פ לא מקצה זמן. איך אני משכנע אותו בשיחה קצרה?', 'רתימה', 5),

-- Rear Officer questions
('rear_officer', 'שלחי לי את הצעדים ב״שלבי פיתוח קהילות עורף״', 'פיתוח קהילה', 1),
('rear_officer', 'מה הנוהל המדויק להפניה לגורמי רווחה אזרחיים?', 'גבולות אחריות', 2),
('rear_officer', 'צריכה רעיון קונקרטי לזירת מפגש שיחזק את הקשרים הקהילתיים', 'מפגשים', 3),
('rear_officer', 'איך מנהלים מיפוי קהילתי כדי לאתר נכסים ולא רק צרכים?', 'מיפוי', 4),
('rear_officer', 'אני צריכה לנסח איגרת מיידית לאחר אירוע בטחוני', 'תקשורת משבר', 5),

-- Company Commander questions
('company_commander', 'צריך 3 שאלות פתיחה (5 דקות) לחיזוק משמעות לפני יציאה למשימה', 'משמעות', 1),
('company_commander', 'איך מזהים ומטפלים בשחיקה אצל חייל מילואים?', 'רווחה', 2),
('company_commander', 'שלח לי את המתודה מתנה/תובנה שקיבלתי להעברה מיידית', 'מתודות', 3),
('company_commander', 'מה ההבדל בין מנהיגות של שותפות מול היררכיה?', 'מנהיגות', 4),
('company_commander', 'איך אני מנהל את צוות הלכידות הפלוגתי?', 'ניהול צוות', 5),

-- Platoon Commander questions
('platoon_commander', 'צריך שאלה טובה לתדריך בוקר - משהו שלא לוקח יותר מ-5 דקות', 'תדריכים', 1),
('platoon_commander', 'איך אני מתחיל שיחה בונה אמון עם החיילים בכינוס?', 'בניית אמון', 2),
('platoon_commander', 'שלח לי מתודה קצרה (10 דקות) לחיזוק קשרים', 'קשרים', 3),
('platoon_commander', 'חייל מילואים ותיק לא מקבל סמכות. מתי לדבר איתו כחבר ומתי כמפקד?', 'שותפות-היררכיה', 4),
('platoon_commander', 'איך אני משלב לכידות בשגרת הפיקוד היומיומית?', 'הטמעה', 5),

-- Platoon Cohesion Leader questions
('platoon_cohesion_leader', 'צריך מתודה (15 דקות) לחיזוק זהות ושייכות בצוות המילואים שלי', 'זהות', 1),
('platoon_cohesion_leader', 'מהם 3 הטיפים המרכזיים לניהול צוות לכידות פלוגתי יעיל?', 'ניהול', 2),
('platoon_cohesion_leader', 'שלח לי את תבנית המיפוי הפלוגתי לזיהוי נכסים וצרכים', 'מיפוי', 3),
('platoon_cohesion_leader', 'איך אני מתמודד עם חייל שלא משתף פעולה בפעילות הלכידות?', 'אתגרים', 4),
('platoon_cohesion_leader', 'המ"פ ביקש פעילות קצרה על משמעות. יש לי חצי שעה', 'משמעות', 5);