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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      deliverable_purchases: {
        Row: {
          amount: number | null
          created_at: string
          currency: string
          email: string | null
          id: string
          product_id: string | null
          purchased_at: string
          session_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          product_id?: string | null
          purchased_at?: string
          session_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          product_id?: string | null
          purchased_at?: string
          session_id?: string
        }
        Relationships: []
      }
      email_deliveries: {
        Row: {
          attempts: number
          created_at: string
          error_message: string | null
          id: string
          last_opened_at: string | null
          open_count: number
          product_id: string | null
          recipient_email: string | null
          recipient_name: string | null
          sale_id: string
          sent_at: string | null
          status: string
          subject: string | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          id?: string
          last_opened_at?: string | null
          open_count?: number
          product_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          sale_id: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          id?: string
          last_opened_at?: string | null
          open_count?: number
          product_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          sale_id?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_deliveries_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          accent_color: string
          active: boolean
          body_text: string
          button_label: string
          created_at: string
          deliverable_url: string
          fallback_note: string
          from_email: string
          from_name: string
          heading: string
          id: string
          intro: string
          is_default: boolean
          name: string
          product_id: string | null
          reply_to: string | null
          signature: string
          subject: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          active?: boolean
          body_text?: string
          button_label?: string
          created_at?: string
          deliverable_url?: string
          fallback_note?: string
          from_email?: string
          from_name?: string
          heading?: string
          id?: string
          intro?: string
          is_default?: boolean
          name: string
          product_id?: string | null
          reply_to?: string | null
          signature?: string
          subject?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          active?: boolean
          body_text?: string
          button_label?: string
          created_at?: string
          deliverable_url?: string
          fallback_note?: string
          from_email?: string
          from_name?: string
          heading?: string
          id?: string
          intro?: string
          is_default?: boolean
          name?: string
          product_id?: string | null
          reply_to?: string | null
          signature?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          amount: number | null
          code: string | null
          created_at: string
          currency: string | null
          event_type: string | null
          id: string
          message: string | null
          offer: string | null
          payload: Json | null
          product_id: string | null
          session_id: string | null
          source: string
        }
        Insert: {
          amount?: number | null
          code?: string | null
          created_at?: string
          currency?: string | null
          event_type?: string | null
          id?: string
          message?: string | null
          offer?: string | null
          payload?: Json | null
          product_id?: string | null
          session_id?: string | null
          source: string
        }
        Update: {
          amount?: number | null
          code?: string | null
          created_at?: string
          currency?: string | null
          event_type?: string | null
          id?: string
          message?: string | null
          offer?: string | null
          payload?: Json | null
          product_id?: string | null
          session_id?: string | null
          source?: string
        }
        Relationships: []
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
