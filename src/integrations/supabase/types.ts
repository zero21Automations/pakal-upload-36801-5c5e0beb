export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      chunks: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          level: number
          metadata: Json | null
          org_id: string
          sequence_number: number
          source_id: string
          source_type: string
          status: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id: string
          level: number
          metadata?: Json | null
          org_id: string
          sequence_number: number
          source_id: string
          source_type: string
          status?: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          level?: number
          metadata?: Json | null
          org_id?: string
          sequence_number?: number
          source_id?: string
          source_type?: string
          status?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      core_documents: {
        Row: {
          chunks_count: number | null
          content: string
          created_at: string
          id: string
          processed_at: string | null
          processing_error: string | null
          processing_status: string | null
          title: string
          updated_at: string
          updated_by: string
          version: number
        }
        Insert: {
          chunks_count?: number | null
          content: string
          created_at?: string
          id?: string
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: string | null
          title: string
          updated_at?: string
          updated_by: string
          version?: number
        }
        Update: {
          chunks_count?: number | null
          content?: string
          created_at?: string
          id?: string
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: string | null
          title?: string
          updated_at?: string
          updated_by?: string
          version?: number
        }
        Relationships: []
      }
      document_mappings: {
        Row: {
          created_at: string
          demographics: Json | null
          discipline_culture: Json | null
          id: string
          leadership: Json | null
          operational_capability: Json | null
          org_id: string
          training_education: Json | null
          unit_id: string
          unit_name: string
          updated_at: string
          updated_by: string
          welfare_morale: Json | null
        }
        Insert: {
          created_at?: string
          demographics?: Json | null
          discipline_culture?: Json | null
          id?: string
          leadership?: Json | null
          operational_capability?: Json | null
          org_id: string
          training_education?: Json | null
          unit_id: string
          unit_name: string
          updated_at?: string
          updated_by: string
          welfare_morale?: Json | null
        }
        Update: {
          created_at?: string
          demographics?: Json | null
          discipline_culture?: Json | null
          id?: string
          leadership?: Json | null
          operational_capability?: Json | null
          org_id?: string
          training_education?: Json | null
          unit_id?: string
          unit_name?: string
          updated_at?: string
          updated_by?: string
          welfare_morale?: Json | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          chunks_count: number | null
          content_type: string | null
          created_at: string
          description: string | null
          document_level: string | null
          document_type: string | null
          file_path: string
          file_size: number
          file_type: string | null
          filename: string
          id: string
          processed_at: string | null
          processing_error: string | null
          processing_status: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          chunks_count?: number | null
          content_type?: string | null
          created_at?: string
          description?: string | null
          document_level?: string | null
          document_type?: string | null
          file_path: string
          file_size: number
          file_type?: string | null
          filename: string
          id?: string
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          chunks_count?: number | null
          content_type?: string | null
          created_at?: string
          description?: string | null
          document_level?: string | null
          document_type?: string | null
          file_path?: string
          file_size?: number
          file_type?: string | null
          filename?: string
          id?: string
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pakal_terms: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          definition: string
          id: string
          term: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by: string
          definition: string
          id?: string
          term: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string
          definition?: string
          id?: string
          term?: string
          updated_at?: string
        }
        Relationships: []
      }
      suggested_questions: {
        Row: {
          category: string | null
          context_triggers: string[] | null
          created_at: string | null
          id: string
          priority: number | null
          question_text: string
          role_type: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          category?: string | null
          context_triggers?: string[] | null
          created_at?: string | null
          id?: string
          priority?: number | null
          question_text: string
          role_type: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          category?: string | null
          context_triggers?: string[] | null
          created_at?: string | null
          id?: string
          priority?: number | null
          question_text?: string
          role_type?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          onboarding_completed: boolean | null
          org_id: string | null
          preferences: Json | null
          unit_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id?: string
          onboarding_completed?: boolean | null
          org_id?: string | null
          preferences?: Json | null
          unit_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          onboarding_completed?: boolean | null
          org_id?: string | null
          preferences?: Json | null
          unit_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "mentor"
        | "cohesion_officer"
        | "rear_officer"
        | "company_commander"
        | "platoon_commander"
        | "platoon_cohesion_leader"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "mentor",
        "cohesion_officer",
        "rear_officer",
        "company_commander",
        "platoon_commander",
        "platoon_cohesion_leader",
      ],
    },
  },
} as const
