export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      audits: {
        Row: {
          id: string
          project_id: string
          name: string
          type: 'research' | 'collect' | 'business' | 'ab_test' | 'hypotheses'
          status: 'draft' | 'in_progress' | 'completed' | 'failed'
          input_data: Record<string, unknown> | null
          result_data: Record<string, unknown> | null
          confidence: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          type: 'research' | 'collect' | 'business' | 'ab_test' | 'hypotheses'
          status?: 'draft' | 'in_progress' | 'completed' | 'failed'
          input_data?: Record<string, unknown> | null
          result_data?: Record<string, unknown> | null
          confidence?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          type?: 'research' | 'collect' | 'business' | 'ab_test' | 'hypotheses'
          status?: 'draft' | 'in_progress' | 'completed' | 'failed'
          input_data?: Record<string, unknown> | null
          result_data?: Record<string, unknown> | null
          confidence?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      audit_history: {
        Row: {
          id: string
          audit_id: string
          action_type: string
          input_data: Record<string, unknown> | null
          output_data: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          audit_id: string
          action_type: string
          input_data?: Record<string, unknown> | null
          output_data?: Record<string, unknown> | null
          created_at?: string
        }
        Update: {
          id?: string
          audit_id?: string
          action_type?: string
          input_data?: Record<string, unknown> | null
          output_data?: Record<string, unknown> | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
