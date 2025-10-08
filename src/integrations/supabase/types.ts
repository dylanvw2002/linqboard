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
      activity_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          organization_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          organization_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      boards: {
        Row: {
          background_gradient: string | null
          background_image_url: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          background_gradient?: string | null
          background_image_url?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          background_gradient?: string | null
          background_image_url?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boards_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      columns: {
        Row: {
          board_id: string
          column_type: Database["public"]["Enums"]["column_type"]
          content_padding_bottom: number | null
          content_padding_left: number | null
          content_padding_right: number | null
          content_padding_top: number | null
          created_at: string
          glow_type: Database["public"]["Enums"]["column_glow_type"]
          header_height: number | null
          header_width: number | null
          height: number | null
          id: string
          name: string
          position: number
          width: number | null
          width_ratio: number
          x_position: number | null
          y_position: number | null
        }
        Insert: {
          board_id: string
          column_type?: Database["public"]["Enums"]["column_type"]
          content_padding_bottom?: number | null
          content_padding_left?: number | null
          content_padding_right?: number | null
          content_padding_top?: number | null
          created_at?: string
          glow_type?: Database["public"]["Enums"]["column_glow_type"]
          header_height?: number | null
          header_width?: number | null
          height?: number | null
          id?: string
          name: string
          position: number
          width?: number | null
          width_ratio?: number
          x_position?: number | null
          y_position?: number | null
        }
        Update: {
          board_id?: string
          column_type?: Database["public"]["Enums"]["column_type"]
          content_padding_bottom?: number | null
          content_padding_left?: number | null
          content_padding_right?: number | null
          content_padding_top?: number | null
          created_at?: string
          glow_type?: Database["public"]["Enums"]["column_glow_type"]
          header_height?: number | null
          header_width?: number | null
          height?: number | null
          id?: string
          name?: string
          position?: number
          width?: number | null
          width_ratio?: number
          x_position?: number | null
          y_position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "columns_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      eu_sales_summary: {
        Row: {
          country: string
          created_at: string | null
          id: string
          quarter: number
          total_sales_excl_vat: number | null
          total_vat_collected: number | null
          transaction_count: number | null
          updated_at: string | null
          vat_rate: number | null
          year: number
        }
        Insert: {
          country: string
          created_at?: string | null
          id?: string
          quarter: number
          total_sales_excl_vat?: number | null
          total_vat_collected?: number | null
          transaction_count?: number | null
          updated_at?: string | null
          vat_rate?: number | null
          year: number
        }
        Update: {
          country?: string
          created_at?: string | null
          id?: string
          quarter?: number
          total_sales_excl_vat?: number | null
          total_vat_collected?: number | null
          transaction_count?: number | null
          updated_at?: string | null
          vat_rate?: number | null
          year?: number
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_excl_vat: number
          amount_incl_vat: number
          created_at: string | null
          customer_country: string
          customer_email: string
          customer_name: string
          customer_type: string
          id: string
          invoice_date: string | null
          invoice_number: string
          payment_id: string | null
          pdf_url: string | null
          status: string | null
          subscription_id: string | null
          updated_at: string | null
          user_id: string
          vat_amount: number
          vat_number: string | null
          vat_rate: number
        }
        Insert: {
          amount_excl_vat: number
          amount_incl_vat: number
          created_at?: string | null
          customer_country: string
          customer_email: string
          customer_name: string
          customer_type: string
          id?: string
          invoice_date?: string | null
          invoice_number: string
          payment_id?: string | null
          pdf_url?: string | null
          status?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id: string
          vat_amount: number
          vat_number?: string | null
          vat_rate: number
        }
        Update: {
          amount_excl_vat?: number
          amount_incl_vat?: number
          created_at?: string | null
          customer_country?: string
          customer_email?: string
          customer_name?: string
          customer_type?: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string
          payment_id?: string | null
          pdf_url?: string | null
          status?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
          vat_amount?: number
          vat_number?: string | null
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mollie_transactions: {
        Row: {
          amount: number
          country: string | null
          created_at: string | null
          currency: string | null
          customer_type: string | null
          id: string
          mollie_response: Json | null
          payment_id: string
          status: string
          subscription_id: string | null
          updated_at: string | null
          user_id: string
          vat_amount: number | null
          vat_number: string | null
          vat_rate: number | null
        }
        Insert: {
          amount: number
          country?: string | null
          created_at?: string | null
          currency?: string | null
          customer_type?: string | null
          id?: string
          mollie_response?: Json | null
          payment_id: string
          status: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id: string
          vat_amount?: number | null
          vat_number?: string | null
          vat_rate?: number | null
        }
        Update: {
          amount?: number
          country?: string | null
          created_at?: string | null
          currency?: string | null
          customer_type?: string | null
          id?: string
          mollie_response?: Json | null
          payment_id?: string
          status?: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
          vat_amount?: number | null
          vat_number?: string | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mollie_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          invite_code: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      task_assignees: {
        Row: {
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          task_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          task_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          task_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_labels: {
        Row: {
          created_at: string
          id: string
          label: string
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_labels_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          column_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          position: number
          priority: Database["public"]["Enums"]["task_priority"] | null
          title: string
          updated_at: string
        }
        Insert: {
          column_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"] | null
          title: string
          updated_at?: string
        }
        Update: {
          column_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "columns"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          billing_interval:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          country: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          customer_type: string | null
          id: string
          max_members_per_org: number
          max_organizations: number
          mollie_customer_id: string | null
          mollie_subscription_id: string | null
          pending_billing_interval:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          pending_plan: Database["public"]["Enums"]["subscription_plan"] | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          price_excl_vat: number | null
          price_incl_vat: number | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
          vat_amount: number | null
          vat_number: string | null
          vat_number_valid: boolean | null
          vat_rate: number | null
        }
        Insert: {
          billing_interval?:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          country?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          customer_type?: string | null
          id?: string
          max_members_per_org: number
          max_organizations: number
          mollie_customer_id?: string | null
          mollie_subscription_id?: string | null
          pending_billing_interval?:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          pending_plan?: Database["public"]["Enums"]["subscription_plan"] | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          price_excl_vat?: number | null
          price_incl_vat?: number | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
          vat_amount?: number | null
          vat_number?: string | null
          vat_number_valid?: boolean | null
          vat_rate?: number | null
        }
        Update: {
          billing_interval?:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          country?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          customer_type?: string | null
          id?: string
          max_members_per_org?: number
          max_organizations?: number
          mollie_customer_id?: string | null
          mollie_subscription_id?: string | null
          pending_billing_interval?:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          pending_plan?: Database["public"]["Enums"]["subscription_plan"] | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          price_excl_vat?: number | null
          price_incl_vat?: number | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
          vat_amount?: number | null
          vat_number?: string | null
          vat_number_valid?: boolean | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_member_limit: {
        Args: { _org_id: string }
        Returns: boolean
      }
      check_organization_limit: {
        Args: { _user_id: string }
        Returns: boolean
      }
      generate_invite_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_org_id: {
        Args: { _board_id: string; _user_id: string }
        Returns: string
      }
      get_user_subscription_limits: {
        Args: { _user_id: string }
        Returns: {
          current_org_count: number
          max_members_per_org: number
          max_organizations: number
          plan: Database["public"]["Enums"]["subscription_plan"]
        }[]
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      user_can_view_membership: {
        Args: { _membership_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "member"
      billing_interval: "monthly" | "yearly"
      column_glow_type:
        | "default"
        | "red"
        | "green"
        | "blue"
        | "yellow"
        | "purple"
        | "orange"
      column_type: "regular" | "sick_leave" | "vacation"
      subscription_plan: "free" | "pro" | "team" | "business"
      subscription_status:
        | "active"
        | "canceled"
        | "expired"
        | "past_due"
        | "pending"
        | "cancelled"
      task_priority: "low" | "medium" | "high"
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
      app_role: ["owner", "member"],
      billing_interval: ["monthly", "yearly"],
      column_glow_type: [
        "default",
        "red",
        "green",
        "blue",
        "yellow",
        "purple",
        "orange",
      ],
      column_type: ["regular", "sick_leave", "vacation"],
      subscription_plan: ["free", "pro", "team", "business"],
      subscription_status: [
        "active",
        "canceled",
        "expired",
        "past_due",
        "pending",
        "cancelled",
      ],
      task_priority: ["low", "medium", "high"],
    },
  },
} as const
