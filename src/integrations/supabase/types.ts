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
      app_settings: {
        Row: {
          business_id: string
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          business_id: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          business_id: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          business_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_counters: {
        Row: {
          business_id: string
          counter_key: string
          current_value: number
        }
        Insert: {
          business_id: string
          counter_key: string
          current_value?: number
        }
        Update: {
          business_id?: string
          counter_key?: string
          current_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_counters_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          business_phone: string | null
          company_stamp_url: string | null
          created_at: string
          currency: string
          default_signature_name: string | null
          default_signature_title: string | null
          email: string | null
          full_address: string | null
          id: string
          initial_capital: number
          invoice_footer_note: string | null
          language: string
          logo_url: string | null
          low_stock_default_limit: number
          name: string
          owner_name: string | null
          owner_user_id: string
          payment_details: string | null
          payment_terms: string | null
          province_city: string | null
          target_capital: number
          tin_number: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          business_phone?: string | null
          company_stamp_url?: string | null
          created_at?: string
          currency?: string
          default_signature_name?: string | null
          default_signature_title?: string | null
          email?: string | null
          full_address?: string | null
          id?: string
          initial_capital?: number
          invoice_footer_note?: string | null
          language?: string
          logo_url?: string | null
          low_stock_default_limit?: number
          name: string
          owner_name?: string | null
          owner_user_id: string
          payment_details?: string | null
          payment_terms?: string | null
          province_city?: string | null
          target_capital?: number
          tin_number?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          business_phone?: string | null
          company_stamp_url?: string | null
          created_at?: string
          currency?: string
          default_signature_name?: string | null
          default_signature_title?: string | null
          email?: string | null
          full_address?: string | null
          id?: string
          initial_capital?: number
          invoice_footer_note?: string | null
          language?: string
          logo_url?: string | null
          low_stock_default_limit?: number
          name?: string
          owner_name?: string | null
          owner_user_id?: string
          payment_details?: string | null
          payment_terms?: string | null
          province_city?: string | null
          target_capital?: number
          tin_number?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          business_id: string
          created_at: string
          customer_id: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_id: string
          created_at?: string
          customer_id: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      debt_items: {
        Row: {
          business_id: string
          cost_price_snapshot: number
          created_at: string
          debt_id: string
          id: string
          inventory_item_id: string | null
          item_name: string
          profit_snapshot: number
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          business_id: string
          cost_price_snapshot?: number
          created_at?: string
          debt_id: string
          id?: string
          inventory_item_id?: string | null
          item_name: string
          profit_snapshot?: number
          quantity: number
          total_price?: number
          unit_price?: number
        }
        Update: {
          business_id?: string
          cost_price_snapshot?: number
          created_at?: string
          debt_id?: string
          id?: string
          inventory_item_id?: string | null
          item_name?: string
          profit_snapshot?: number
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "debt_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debt_items_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debt_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      debt_payments: {
        Row: {
          amount_paid: number
          business_id: string
          created_at: string
          customer_id: string | null
          debt_id: string
          id: string
          note: string | null
          paid_at: string
          payment_id: string
          received_by: string | null
        }
        Insert: {
          amount_paid: number
          business_id: string
          created_at?: string
          customer_id?: string | null
          debt_id: string
          id?: string
          note?: string | null
          paid_at?: string
          payment_id: string
          received_by?: string | null
        }
        Update: {
          amount_paid?: number
          business_id?: string
          created_at?: string
          customer_id?: string | null
          debt_id?: string
          id?: string
          note?: string | null
          paid_at?: string
          payment_id?: string
          received_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "debt_payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debt_payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debt_payments_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          amount_paid: number
          business_id: string
          created_at: string
          created_by: string | null
          customer_id: string
          date_taken: string
          debt_id: string
          due_date: string | null
          id: string
          notes: string | null
          remaining_amount: number
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          business_id: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          date_taken?: string
          debt_id: string
          due_date?: string | null
          id?: string
          notes?: string | null
          remaining_amount?: number
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          business_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          date_taken?: string
          debt_id?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          remaining_amount?: number
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "debts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_note_items: {
        Row: {
          business_id: string
          created_at: string
          delivery_note_id: string
          id: string
          inventory_item_id: string | null
          item_name: string
          quantity: number
          unit_type: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          delivery_note_id: string
          id?: string
          inventory_item_id?: string | null
          item_name: string
          quantity: number
          unit_type?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          delivery_note_id?: string
          id?: string
          inventory_item_id?: string | null
          item_name?: string
          quantity?: number
          unit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_note_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_note_items_delivery_note_id_fkey"
            columns: ["delivery_note_id"]
            isOneToOne: false
            referencedRelation: "delivery_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_note_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_notes: {
        Row: {
          business_id: string
          created_at: string
          created_by: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          delivered_by: string | null
          delivery_address: string | null
          delivery_date: string | null
          delivery_note_id: string
          id: string
          notes: string | null
          received_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivered_by?: string | null
          delivery_address?: string | null
          delivery_date?: string | null
          delivery_note_id: string
          id?: string
          notes?: string | null
          received_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivered_by?: string | null
          delivery_address?: string | null
          delivery_date?: string | null
          delivery_note_id?: string
          id?: string
          notes?: string | null
          received_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_notes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          business_id: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          permissions: Json
          phone: string | null
          pin_code_hash: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          permissions?: Json
          phone?: string | null
          pin_code_hash?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          permissions?: Json
          phone?: string | null
          pin_code_hash?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          business_id: string
          category: string | null
          cost_price: number
          created_at: string
          date_bought: string | null
          id: string
          item_id: string
          item_name: string
          low_stock_limit: number
          normalized_name: string
          notes: string | null
          quantity: number
          selling_price: number
          subcategory: string | null
          supplier_name: string | null
          unit_type: string
          updated_at: string
        }
        Insert: {
          business_id: string
          category?: string | null
          cost_price?: number
          created_at?: string
          date_bought?: string | null
          id?: string
          item_id: string
          item_name: string
          low_stock_limit?: number
          normalized_name: string
          notes?: string | null
          quantity?: number
          selling_price?: number
          subcategory?: string | null
          supplier_name?: string | null
          unit_type?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          category?: string | null
          cost_price?: number
          created_at?: string
          date_bought?: string | null
          id?: string
          item_id?: string
          item_name?: string
          low_stock_limit?: number
          normalized_name?: string
          notes?: string | null
          quantity?: number
          selling_price?: number
          subcategory?: string | null
          supplier_name?: string | null
          unit_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_business_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          active_business_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active_business_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_business_id_fkey"
            columns: ["active_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      proforma_items: {
        Row: {
          business_id: string
          created_at: string
          id: string
          inventory_item_id: string | null
          item_name: string
          proforma_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          item_name: string
          proforma_id: string
          quantity: number
          total_price?: number
          unit_price?: number
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          item_name?: string
          proforma_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "proforma_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proforma_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proforma_items_proforma_id_fkey"
            columns: ["proforma_id"]
            isOneToOne: false
            referencedRelation: "proformas"
            referencedColumns: ["id"]
          },
        ]
      }
      proformas: {
        Row: {
          business_id: string
          created_at: string
          created_by: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          grand_total: number
          id: string
          notes: string | null
          proforma_id: string
          status: string
          subtotal: number
          updated_at: string
          vat_amount: number
          vat_enabled: boolean
          vat_percentage: number
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          grand_total?: number
          id?: string
          notes?: string | null
          proforma_id: string
          status?: string
          subtotal?: number
          updated_at?: string
          vat_amount?: number
          vat_enabled?: boolean
          vat_percentage?: number
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          grand_total?: number
          id?: string
          notes?: string | null
          proforma_id?: string
          status?: string
          subtotal?: number
          updated_at?: string
          vat_amount?: number
          vat_enabled?: boolean
          vat_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "proformas_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proformas_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          business_id: string
          cost_price_snapshot: number
          created_at: string
          id: string
          inventory_item_id: string | null
          item_name: string
          profit: number
          quantity: number
          sale_id: string
          selling_price_snapshot: number
          total_amount: number
        }
        Insert: {
          business_id: string
          cost_price_snapshot?: number
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          item_name: string
          profit?: number
          quantity: number
          sale_id: string
          selling_price_snapshot?: number
          total_amount?: number
        }
        Update: {
          business_id?: string
          cost_price_snapshot?: number
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          item_name?: string
          profit?: number
          quantity?: number
          sale_id?: string
          selling_price_snapshot?: number
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string | null
          id: string
          notes: string | null
          profit: number
          sale_date: string
          sale_id: string
          sold_by: string | null
          total_amount: number
          total_cost: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          profit?: number
          sale_date?: string
          sale_id: string
          sold_by?: string | null
          total_amount?: number
          total_cost?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          profit?: number
          sale_date?: string
          sale_id?: string
          sold_by?: string | null
          total_amount?: number
          total_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          business_id: string
          cost_price_snapshot: number | null
          created_at: string
          created_by: string | null
          id: string
          inventory_item_id: string
          movement_type: string
          quantity_after: number
          quantity_before: number
          quantity_change: number
          reason: string | null
          selling_price_snapshot: number | null
        }
        Insert: {
          business_id: string
          cost_price_snapshot?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_item_id: string
          movement_type: string
          quantity_after: number
          quantity_before: number
          quantity_change: number
          reason?: string | null
          selling_price_snapshot?: number | null
        }
        Update: {
          business_id?: string
          cost_price_snapshot?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_item_id?: string
          movement_type?: string
          quantity_after?: number
          quantity_before?: number
          quantity_change?: number
          reason?: string | null
          selling_price_snapshot?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage: { Args: { _business_id: string }; Returns: boolean }
      get_business_role: {
        Args: { _business_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      is_business_member: { Args: { _business_id: string }; Returns: boolean }
      is_business_owner: { Args: { _business_id: string }; Returns: boolean }
      next_readable_id: {
        Args: { _business_id: string; _key: string; _prefix: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "owner" | "manager" | "employee"
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
      app_role: ["owner", "manager", "employee"],
    },
  },
} as const
