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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      campaign_players: {
        Row: {
          campaign_id: string
          character_id: string | null
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          character_id?: string | null
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          character_id?: string | null
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_players_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_players_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          invite_code: string | null
          master_id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          invite_code?: string | null
          master_id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          invite_code?: string | null
          master_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      characters: {
        Row: {
          alignment: string | null
          armor_class: number
          attributes: Json
          background: string | null
          backstory: string | null
          bonds: string | null
          class: string
          created_at: string
          currency: Json
          current_hp: number
          death_saves: Json
          equipment: Json
          experience: number
          features: Json
          flaws: string | null
          hit_dice: Json
          id: string
          ideals: string | null
          image_url: string | null
          initiative: number
          inventory: Json
          languages: Json
          level: number
          max_hp: number
          name: string
          personality_traits: string | null
          proficiencies: Json
          proficiency_bonus: number
          race: string
          saving_throws: Json
          skills: Json
          speed: number
          spellcasting: Json | null
          spells: Json
          subrace: string | null
          temporary_hp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          alignment?: string | null
          armor_class?: number
          attributes?: Json
          background?: string | null
          backstory?: string | null
          bonds?: string | null
          class: string
          created_at?: string
          currency?: Json
          current_hp?: number
          death_saves?: Json
          equipment?: Json
          experience?: number
          features?: Json
          flaws?: string | null
          hit_dice?: Json
          id?: string
          ideals?: string | null
          image_url?: string | null
          initiative?: number
          inventory?: Json
          languages?: Json
          level?: number
          max_hp?: number
          name: string
          personality_traits?: string | null
          proficiencies?: Json
          proficiency_bonus?: number
          race: string
          saving_throws?: Json
          skills?: Json
          speed?: number
          spellcasting?: Json | null
          spells?: Json
          subrace?: string | null
          temporary_hp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          alignment?: string | null
          armor_class?: number
          attributes?: Json
          background?: string | null
          backstory?: string | null
          bonds?: string | null
          class?: string
          created_at?: string
          currency?: Json
          current_hp?: number
          death_saves?: Json
          equipment?: Json
          experience?: number
          features?: Json
          flaws?: string | null
          hit_dice?: Json
          id?: string
          ideals?: string | null
          image_url?: string | null
          initiative?: number
          inventory?: Json
          languages?: Json
          level?: number
          max_hp?: number
          name?: string
          personality_traits?: string | null
          proficiencies?: Json
          proficiency_bonus?: number
          race?: string
          saving_throws?: Json
          skills?: Json
          speed?: number
          spellcasting?: Json | null
          spells?: Json
          subrace?: string | null
          temporary_hp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      combat_encounters: {
        Row: {
          campaign_id: string
          created_at: string
          current_turn: number
          id: string
          is_active: boolean
          name: string
          round: number
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          current_turn?: number
          id?: string
          is_active?: boolean
          name: string
          round?: number
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          current_turn?: number
          id?: string
          is_active?: boolean
          name?: string
          round?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "combat_encounters_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      combatants: {
        Row: {
          armor_class: number
          character_id: string | null
          conditions: string[] | null
          created_at: string
          current_hp: number
          encounter_id: string
          id: string
          initiative: number
          is_player: boolean
          max_hp: number
          name: string
          notes: string | null
          sort_order: number
        }
        Insert: {
          armor_class?: number
          character_id?: string | null
          conditions?: string[] | null
          created_at?: string
          current_hp?: number
          encounter_id: string
          id?: string
          initiative?: number
          is_player?: boolean
          max_hp?: number
          name: string
          notes?: string | null
          sort_order?: number
        }
        Update: {
          armor_class?: number
          character_id?: string | null
          conditions?: string[] | null
          created_at?: string
          current_hp?: number
          encounter_id?: string
          id?: string
          initiative?: number
          is_player?: boolean
          max_hp?: number
          name?: string
          notes?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "combatants_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combatants_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "combat_encounters"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          location: string | null
          notes: string | null
          scheduled_at: string
          title: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          scheduled_at: string
          title: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          scheduled_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_create_character: { Args: { _user_id: string }; Returns: boolean }
      count_user_characters: { Args: { _user_id: string }; Returns: number }
      generate_invite_code: { Args: never; Returns: string }
      is_campaign_master: {
        Args: { _campaign_id: string; _user_id: string }
        Returns: boolean
      }
      is_campaign_member: {
        Args: { _campaign_id: string; _user_id: string }
        Returns: boolean
      }
      is_premium: { Args: { _user_id: string }; Returns: boolean }
      join_campaign_by_code: {
        Args: { _character_id?: string; _invite_code: string; _user_id: string }
        Returns: string
      }
    }
    Enums: {
      subscription_status: "free" | "premium"
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
      subscription_status: ["free", "premium"],
    },
  },
} as const
