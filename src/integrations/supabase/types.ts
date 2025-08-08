export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      brand_websites: {
        Row: {
          brand_name: string
          created_at: string
          id: string
          is_active: boolean
          last_scraped_at: string | null
          scraping_enabled: boolean
          updated_at: string
          website_url: string
        }
        Insert: {
          brand_name: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_scraped_at?: string | null
          scraping_enabled?: boolean
          updated_at?: string
          website_url: string
        }
        Update: {
          brand_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_scraped_at?: string | null
          scraping_enabled?: boolean
          updated_at?: string
          website_url?: string
        }
        Relationships: []
      }
      closet_items: {
        Row: {
          brand_name: string
          category: string | null
          color: string | null
          company_website_url: string | null
          created_at: string
          email_id: string | null
          id: string
          order_number: string | null
          price: string | null
          product_description: string | null
          product_image_url: string | null
          product_name: string | null
          purchase_date: string | null
          size: string | null
          stored_image_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_name: string
          category?: string | null
          color?: string | null
          company_website_url?: string | null
          created_at?: string
          email_id?: string | null
          id?: string
          order_number?: string | null
          price?: string | null
          product_description?: string | null
          product_image_url?: string | null
          product_name?: string | null
          purchase_date?: string | null
          size?: string | null
          stored_image_path?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_name?: string
          category?: string | null
          color?: string | null
          company_website_url?: string | null
          created_at?: string
          email_id?: string | null
          id?: string
          order_number?: string | null
          price?: string | null
          product_description?: string | null
          product_image_url?: string | null
          product_name?: string | null
          purchase_date?: string | null
          size?: string | null
          stored_image_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "closet_items_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "promotional_emails"
            referencedColumns: ["id"]
          },
        ]
      }
      connected_gmail_accounts: {
        Row: {
          created_at: string
          display_name: string | null
          gmail_address: string
          id: string
          is_primary: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          gmail_address: string
          id?: string
          is_primary?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          gmail_address?: string
          id?: string
          is_primary?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fit_tags: {
        Row: {
          closet_item_id: string
          created_at: string
          fit_id: string
          id: string
        }
        Insert: {
          closet_item_id: string
          created_at?: string
          fit_id: string
          id?: string
        }
        Update: {
          closet_item_id?: string
          created_at?: string
          fit_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fit_tags_closet_item_id_fkey"
            columns: ["closet_item_id"]
            isOneToOne: false
            referencedRelation: "closet_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fit_tags_fit_id_fkey"
            columns: ["fit_id"]
            isOneToOne: false
            referencedRelation: "fits"
            referencedColumns: ["id"]
          },
        ]
      }
      fits: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          is_instagram_url: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_instagram_url?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_instagram_url?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          gmail_address: string | null
          id: string
          myfits_email: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          gmail_address?: string | null
          id: string
          myfits_email?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          gmail_address?: string | null
          id?: string
          myfits_email?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      promotional_emails: {
        Row: {
          body_html: string | null
          body_text: string | null
          brand_name: string
          created_at: string
          email_category: string | null
          email_source: string | null
          expires_at: string | null
          gmail_message_id: string
          id: string
          is_expired: boolean | null
          labels: string[] | null
          order_items: string | null
          order_number: string | null
          order_total: string | null
          received_date: string
          sender_email: string
          sender_name: string | null
          snippet: string | null
          subject: string
          thread_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          brand_name: string
          created_at?: string
          email_category?: string | null
          email_source?: string | null
          expires_at?: string | null
          gmail_message_id: string
          id?: string
          is_expired?: boolean | null
          labels?: string[] | null
          order_items?: string | null
          order_number?: string | null
          order_total?: string | null
          received_date: string
          sender_email: string
          sender_name?: string | null
          snippet?: string | null
          subject: string
          thread_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          brand_name?: string
          created_at?: string
          email_category?: string | null
          email_source?: string | null
          expires_at?: string | null
          gmail_message_id?: string
          id?: string
          is_expired?: boolean | null
          labels?: string[] | null
          order_items?: string | null
          order_number?: string | null
          order_total?: string | null
          received_date?: string
          sender_email?: string
          sender_name?: string | null
          snippet?: string | null
          subject?: string
          thread_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scraped_promotions: {
        Row: {
          brand_name: string
          brand_website_url: string
          created_at: string
          discount_code: string | null
          discount_percentage: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          promotion_description: string | null
          promotion_title: string
          promotion_url: string | null
          scraped_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_name: string
          brand_website_url: string
          created_at?: string
          discount_code?: string | null
          discount_percentage?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          promotion_description?: string | null
          promotion_title: string
          promotion_url?: string | null
          scraped_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_name?: string
          brand_website_url?: string
          created_at?: string
          discount_code?: string | null
          discount_percentage?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          promotion_description?: string | null
          promotion_title?: string
          promotion_url?: string | null
          scraped_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      unsubscribed_brands: {
        Row: {
          brand_name: string
          created_at: string
          id: string
          unsubscribed_at: string
          user_id: string
        }
        Insert: {
          brand_name: string
          created_at?: string
          id?: string
          unsubscribed_at?: string
          user_id: string
        }
        Update: {
          brand_name?: string
          created_at?: string
          id?: string
          unsubscribed_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_gmail_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          gmail_address: string | null
          id: string
          refresh_token: string
          scope: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          gmail_address?: string | null
          id?: string
          refresh_token: string
          scope: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          gmail_address?: string | null
          id?: string
          refresh_token?: string
          scope?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_likes: {
        Row: {
          brand_name: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          item_type: string | null
          price: string | null
          source_email: string | null
          title: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          brand_name?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          item_type?: string | null
          price?: string | null
          source_email?: string | null
          title: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          brand_name?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          item_type?: string | null
          price?: string | null
          source_email?: string | null
          title?: string
          updated_at?: string
          url?: string
          user_id?: string
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
    Enums: {},
  },
} as const
