export type AppRole = 
  | 'mentor'
  | 'cohesion_officer'
  | 'rear_officer'
  | 'company_commander'
  | 'platoon_commander'
  | 'platoon_cohesion_leader';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  unit_id?: string;
  org_id?: string;
  onboarding_completed: boolean;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface SuggestedQuestion {
  id: string;
  role_type: AppRole;
  question_text: string;
  category?: string;
  priority: number;
  context_triggers?: string[];
  created_at: string;
}

export const ROLE_LABELS: Record<AppRole, string> = {
  mentor: 'מנחה פק"ל',
  cohesion_officer: 'קצין לכידות גדודי',
  rear_officer: 'קצינת עורף',
  company_commander: 'מפקד פלוגה',
  platoon_commander: 'מפקד מחלקה',
  platoon_cohesion_leader: 'מוביל לכידות פלוגתי'
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  mentor: 'מומחה רב-תחומי המלווה קציני לכידות בתהליך יישום פק"ל',
  cohesion_officer: 'אחראי על יישום תורת הלכידות ברמת הגדוד',
  rear_officer: 'מנחת קהילות העורף והמשפחות',
  company_commander: 'מפקד דרג טקטי ברמת פלוגה',
  platoon_commander: 'מפקד דרג מבצעי ברמת מחלקה',
  platoon_cohesion_leader: 'מוביל לכידות ברמת הפלוגה'
};
