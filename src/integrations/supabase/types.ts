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
      battle_maps: {
        Row: {
          campaign_id: string
          cell_size: number
          created_at: string
          grid_height: number
          grid_width: number
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          token_positions: Json
          updated_at: string
        }
        Insert: {
          campaign_id: string
          cell_size?: number
          created_at?: string
          grid_height?: number
          grid_width?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          token_positions?: Json
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          cell_size?: number
          created_at?: string
          grid_height?: number
          grid_width?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          token_positions?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_maps_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_comments: {
        Row: {
          bug_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          bug_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          bug_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bug_comments_bug_id_fkey"
            columns: ["bug_id"]
            isOneToOne: false
            referencedRelation: "bugs"
            referencedColumns: ["id"]
          },
        ]
      }
      bugs: {
        Row: {
          actual_behavior: string | null
          app_version: string | null
          assigned_to: string | null
          browser: string | null
          created_at: string
          description: string | null
          device: string | null
          expected_behavior: string | null
          id: string
          reporter_id: string
          resolved_at: string | null
          screenshot_url: string | null
          section: string
          severity: Database["public"]["Enums"]["bug_severity"]
          status: Database["public"]["Enums"]["bug_status"]
          steps_to_reproduce: string | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_behavior?: string | null
          app_version?: string | null
          assigned_to?: string | null
          browser?: string | null
          created_at?: string
          description?: string | null
          device?: string | null
          expected_behavior?: string | null
          id?: string
          reporter_id: string
          resolved_at?: string | null
          screenshot_url?: string | null
          section: string
          severity?: Database["public"]["Enums"]["bug_severity"]
          status?: Database["public"]["Enums"]["bug_status"]
          steps_to_reproduce?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_behavior?: string | null
          app_version?: string | null
          assigned_to?: string | null
          browser?: string | null
          created_at?: string
          description?: string | null
          device?: string | null
          expected_behavior?: string | null
          id?: string
          reporter_id?: string
          resolved_at?: string | null
          screenshot_url?: string | null
          section?: string
          severity?: Database["public"]["Enums"]["bug_severity"]
          status?: Database["public"]["Enums"]["bug_status"]
          steps_to_reproduce?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaign_character_faction_rep: {
        Row: {
          campaign_id: string
          character_id: string
          created_at: string
          faction_id: string
          id: string
          notes: string | null
          reputation_level: number
          reputation_title: string | null
          updated_at: string
        }
        Insert: {
          campaign_id: string
          character_id: string
          created_at?: string
          faction_id: string
          id?: string
          notes?: string | null
          reputation_level?: number
          reputation_title?: string | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          character_id?: string
          created_at?: string
          faction_id?: string
          id?: string
          notes?: string | null
          reputation_level?: number
          reputation_title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_character_faction_rep_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_character_faction_rep_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_character_faction_rep_faction_id_fkey"
            columns: ["faction_id"]
            isOneToOne: false
            referencedRelation: "campaign_factions"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_document_deliveries: {
        Row: {
          character_id: string
          delivered_at: string
          document_id: string
          id: string
          read_at: string | null
        }
        Insert: {
          character_id: string
          delivered_at?: string
          document_id: string
          id?: string
          read_at?: string | null
        }
        Update: {
          character_id?: string
          delivered_at?: string
          document_id?: string
          id?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_document_deliveries_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_document_deliveries_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "campaign_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_documents: {
        Row: {
          campaign_id: string
          content: string | null
          created_at: string
          created_by: string
          document_type: string
          id: string
          is_signed: boolean | null
          requires_signature: boolean | null
          signature_data: Json | null
          style: string | null
          title: string
          updated_at: string
          watermark_image_url: string | null
          watermark_text: string | null
          watermark_type: string | null
        }
        Insert: {
          campaign_id: string
          content?: string | null
          created_at?: string
          created_by: string
          document_type?: string
          id?: string
          is_signed?: boolean | null
          requires_signature?: boolean | null
          signature_data?: Json | null
          style?: string | null
          title: string
          updated_at?: string
          watermark_image_url?: string | null
          watermark_text?: string | null
          watermark_type?: string | null
        }
        Update: {
          campaign_id?: string
          content?: string | null
          created_at?: string
          created_by?: string
          document_type?: string
          id?: string
          is_signed?: boolean | null
          requires_signature?: boolean | null
          signature_data?: Json | null
          style?: string | null
          title?: string
          updated_at?: string
          watermark_image_url?: string | null
          watermark_text?: string | null
          watermark_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_documents_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_faction_events: {
        Row: {
          campaign_id: string
          created_at: string
          created_by: string
          description: string | null
          event_date: string | null
          faction_id: string
          id: string
          reputation_change: number
          title: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          created_by: string
          description?: string | null
          event_date?: string | null
          faction_id: string
          id?: string
          reputation_change?: number
          title: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          event_date?: string | null
          faction_id?: string
          id?: string
          reputation_change?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_faction_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_faction_events_faction_id_fkey"
            columns: ["faction_id"]
            isOneToOne: false
            referencedRelation: "campaign_factions"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_faction_npcs: {
        Row: {
          created_at: string
          faction_id: string
          id: string
          is_leader: boolean
          npc_id: string
          rank: string | null
          role: string | null
        }
        Insert: {
          created_at?: string
          faction_id: string
          id?: string
          is_leader?: boolean
          npc_id: string
          rank?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string
          faction_id?: string
          id?: string
          is_leader?: boolean
          npc_id?: string
          rank?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_faction_npcs_faction_id_fkey"
            columns: ["faction_id"]
            isOneToOne: false
            referencedRelation: "campaign_factions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_faction_npcs_npc_id_fkey"
            columns: ["npc_id"]
            isOneToOne: false
            referencedRelation: "campaign_npcs"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_faction_relationships: {
        Row: {
          campaign_id: string
          created_at: string
          description: string | null
          faction_id: string
          id: string
          is_mutual: boolean
          related_faction_id: string
          relationship_type: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          description?: string | null
          faction_id: string
          id?: string
          is_mutual?: boolean
          related_faction_id: string
          relationship_type?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          description?: string | null
          faction_id?: string
          id?: string
          is_mutual?: boolean
          related_faction_id?: string
          relationship_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_faction_relationships_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_faction_relationships_faction_id_fkey"
            columns: ["faction_id"]
            isOneToOne: false
            referencedRelation: "campaign_factions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_faction_relationships_related_faction_id_fkey"
            columns: ["related_faction_id"]
            isOneToOne: false
            referencedRelation: "campaign_factions"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_factions: {
        Row: {
          alignment: string | null
          campaign_id: string
          created_at: string
          description: string | null
          goals: string | null
          headquarters: string | null
          id: string
          image_url: string | null
          influence_level: string | null
          is_hidden: boolean
          name: string
          secrets: string | null
          show_reputation_to_players: boolean
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          alignment?: string | null
          campaign_id: string
          created_at?: string
          description?: string | null
          goals?: string | null
          headquarters?: string | null
          id?: string
          image_url?: string | null
          influence_level?: string | null
          is_hidden?: boolean
          name: string
          secrets?: string | null
          show_reputation_to_players?: boolean
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          alignment?: string | null
          campaign_id?: string
          created_at?: string
          description?: string | null
          goals?: string | null
          headquarters?: string | null
          id?: string
          image_url?: string | null
          influence_level?: string | null
          is_hidden?: boolean
          name?: string
          secrets?: string | null
          show_reputation_to_players?: boolean
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_factions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_funding: {
        Row: {
          current_amount: number
          goal_amount: number
          id: string
          updated_at: string
        }
        Insert: {
          current_amount?: number
          goal_amount?: number
          id?: string
          updated_at?: string
        }
        Update: {
          current_amount?: number
          goal_amount?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaign_message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "campaign_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_message_read_receipts: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          last_read_at: string
          other_user_id: string | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          last_read_at?: string
          other_user_id?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          last_read_at?: string
          other_user_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_message_read_receipts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_messages: {
        Row: {
          campaign_id: string
          content: string
          created_at: string
          id: string
          recipient_id: string | null
          reply_to_id: string | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          content: string
          created_at?: string
          id?: string
          recipient_id?: string | null
          reply_to_id?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          content?: string
          created_at?: string
          id?: string
          recipient_id?: string | null
          reply_to_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "campaign_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_notes: {
        Row: {
          campaign_id: string
          content: string | null
          created_at: string
          id: string
          is_public: boolean
          parent_id: string | null
          sort_order: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          content?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          parent_id?: string | null
          sort_order?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          content?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          parent_id?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_notes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_notes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "campaign_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_npc_relationships: {
        Row: {
          campaign_id: string
          created_at: string
          description: string | null
          id: string
          is_mutual: boolean
          npc_id: string
          related_npc_id: string
          relationship_type: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_mutual?: boolean
          npc_id: string
          related_npc_id: string
          relationship_type: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_mutual?: boolean
          npc_id?: string
          related_npc_id?: string
          relationship_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_npc_relationships_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_npc_relationships_npc_id_fkey"
            columns: ["npc_id"]
            isOneToOne: false
            referencedRelation: "campaign_npcs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_npc_relationships_related_npc_id_fkey"
            columns: ["related_npc_id"]
            isOneToOne: false
            referencedRelation: "campaign_npcs"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_npcs: {
        Row: {
          appearance: string | null
          campaign_id: string
          created_at: string
          id: string
          image_url: string | null
          is_hidden: boolean
          location: string | null
          motivations: string | null
          name: string
          notes: string | null
          occupation: string | null
          personality: string | null
          secrets: string | null
          status: string
          tags: string[] | null
          title: string | null
          updated_at: string
        }
        Insert: {
          appearance?: string | null
          campaign_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          location?: string | null
          motivations?: string | null
          name: string
          notes?: string | null
          occupation?: string | null
          personality?: string | null
          secrets?: string | null
          status?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          appearance?: string | null
          campaign_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          location?: string | null
          motivations?: string | null
          name?: string
          notes?: string | null
          occupation?: string | null
          personality?: string | null
          secrets?: string | null
          status?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_npcs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
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
      campaign_shop_items: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_available: boolean
          name: string
          notes: string | null
          price_copper: number
          price_gold: number
          price_silver: number
          quantity: number | null
          rarity: string | null
          shop_id: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          name: string
          notes?: string | null
          price_copper?: number
          price_gold?: number
          price_silver?: number
          quantity?: number | null
          rarity?: string | null
          shop_id: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          name?: string
          notes?: string | null
          price_copper?: number
          price_gold?: number
          price_silver?: number
          quantity?: number | null
          rarity?: string | null
          shop_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_shop_items_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "campaign_shops"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_shops: {
        Row: {
          campaign_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_hidden: boolean
          location: string | null
          name: string
          npc_id: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          location?: string | null
          name: string
          npc_id?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          location?: string | null
          name?: string
          npc_id?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_shops_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_shops_npc_id_fkey"
            columns: ["npc_id"]
            isOneToOne: false
            referencedRelation: "campaign_npcs"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_timeline_events: {
        Row: {
          campaign_id: string
          color: string | null
          created_at: string
          created_by: string
          description: string | null
          event_date: string
          icon: string | null
          id: string
          image_url: string | null
          is_hidden: boolean
          is_major_event: boolean | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          color?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          event_date: string
          icon?: string | null
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          is_major_event?: boolean | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          color?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          event_date?: string
          icon?: string | null
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          is_major_event?: boolean | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_timeline_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_whiteboard_elements: {
        Row: {
          background_color: string | null
          campaign_id: string
          connection_from: string | null
          connection_style: string | null
          connection_to: string | null
          content: string | null
          created_at: string
          element_type: string
          font_size: number | null
          height: number | null
          id: string
          image_url: string | null
          rotation: number | null
          text_color: string | null
          updated_at: string
          width: number | null
          x: number
          y: number
          z_index: number | null
        }
        Insert: {
          background_color?: string | null
          campaign_id: string
          connection_from?: string | null
          connection_style?: string | null
          connection_to?: string | null
          content?: string | null
          created_at?: string
          element_type: string
          font_size?: number | null
          height?: number | null
          id?: string
          image_url?: string | null
          rotation?: number | null
          text_color?: string | null
          updated_at?: string
          width?: number | null
          x?: number
          y?: number
          z_index?: number | null
        }
        Update: {
          background_color?: string | null
          campaign_id?: string
          connection_from?: string | null
          connection_style?: string | null
          connection_to?: string | null
          content?: string | null
          created_at?: string
          element_type?: string
          font_size?: number | null
          height?: number | null
          id?: string
          image_url?: string | null
          rotation?: number | null
          text_color?: string | null
          updated_at?: string
          width?: number | null
          x?: number
          y?: number
          z_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_whiteboard_elements_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_whiteboard_elements_connection_from_fkey"
            columns: ["connection_from"]
            isOneToOne: false
            referencedRelation: "campaign_whiteboard_elements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_whiteboard_elements_connection_to_fkey"
            columns: ["connection_to"]
            isOneToOne: false
            referencedRelation: "campaign_whiteboard_elements"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string
          description: string | null
          discord_webhook_url: string | null
          homebrew_sharing_policy: Database["public"]["Enums"]["homebrew_sharing_policy"]
          icon: string | null
          id: string
          image_url: string | null
          invite_code: string | null
          master_id: string
          name: string
          theme_color: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discord_webhook_url?: string | null
          homebrew_sharing_policy?: Database["public"]["Enums"]["homebrew_sharing_policy"]
          icon?: string | null
          id?: string
          image_url?: string | null
          invite_code?: string | null
          master_id: string
          name: string
          theme_color?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discord_webhook_url?: string | null
          homebrew_sharing_policy?: Database["public"]["Enums"]["homebrew_sharing_policy"]
          icon?: string | null
          id?: string
          image_url?: string | null
          invite_code?: string | null
          master_id?: string
          name?: string
          theme_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      catarse_supporters: {
        Row: {
          created_at: string
          id: string
          is_visible: boolean
          message: string | null
          name: string
          tier: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_visible?: boolean
          message?: string | null
          name: string
          tier?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_visible?: boolean
          message?: string | null
          name?: string
          tier?: string
        }
        Relationships: []
      }
      character_history: {
        Row: {
          change_type: string
          character_id: string
          created_at: string
          field_label: string
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          user_id: string
        }
        Insert: {
          change_type?: string
          character_id: string
          created_at?: string
          field_label: string
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id: string
        }
        Update: {
          change_type?: string
          character_id?: string
          created_at?: string
          field_label?: string
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_history_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          age: string | null
          alignment: string | null
          allies_organizations: string | null
          armor_class: number
          attributes: Json
          background: string | null
          backstory: string | null
          bonds: string | null
          class: string
          conditions: string[] | null
          created_at: string
          currency: Json
          current_hp: number
          death_saves: Json
          distinctive_features: string | null
          equipment: Json
          experience: number
          eyes: string | null
          features: Json
          flaws: string | null
          goals: string | null
          hair: string | null
          height: string | null
          hit_dice: Json
          id: string
          ideals: string | null
          image_url: string | null
          initiative: number
          inventory: Json
          is_archived: boolean
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
          skin: string | null
          speed: number
          spellcasting: Json | null
          spells: Json
          subrace: string | null
          temporary_hp: number
          updated_at: string
          user_id: string
          weight: string | null
        }
        Insert: {
          age?: string | null
          alignment?: string | null
          allies_organizations?: string | null
          armor_class?: number
          attributes?: Json
          background?: string | null
          backstory?: string | null
          bonds?: string | null
          class: string
          conditions?: string[] | null
          created_at?: string
          currency?: Json
          current_hp?: number
          death_saves?: Json
          distinctive_features?: string | null
          equipment?: Json
          experience?: number
          eyes?: string | null
          features?: Json
          flaws?: string | null
          goals?: string | null
          hair?: string | null
          height?: string | null
          hit_dice?: Json
          id?: string
          ideals?: string | null
          image_url?: string | null
          initiative?: number
          inventory?: Json
          is_archived?: boolean
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
          skin?: string | null
          speed?: number
          spellcasting?: Json | null
          spells?: Json
          subrace?: string | null
          temporary_hp?: number
          updated_at?: string
          user_id: string
          weight?: string | null
        }
        Update: {
          age?: string | null
          alignment?: string | null
          allies_organizations?: string | null
          armor_class?: number
          attributes?: Json
          background?: string | null
          backstory?: string | null
          bonds?: string | null
          class?: string
          conditions?: string[] | null
          created_at?: string
          currency?: Json
          current_hp?: number
          death_saves?: Json
          distinctive_features?: string | null
          equipment?: Json
          experience?: number
          eyes?: string | null
          features?: Json
          flaws?: string | null
          goals?: string | null
          hair?: string | null
          height?: string | null
          hit_dice?: Json
          id?: string
          ideals?: string | null
          image_url?: string | null
          initiative?: number
          inventory?: Json
          is_archived?: boolean
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
          skin?: string | null
          speed?: number
          spellcasting?: Json | null
          spells?: Json
          subrace?: string | null
          temporary_hp?: number
          updated_at?: string
          user_id?: string
          weight?: string | null
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
          pre_selected_player_ids: string[] | null
          round: number
          status: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          current_turn?: number
          id?: string
          is_active?: boolean
          name: string
          pre_selected_player_ids?: string[] | null
          round?: number
          status?: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          current_turn?: number
          id?: string
          is_active?: boolean
          name?: string
          pre_selected_player_ids?: string[] | null
          round?: number
          status?: string
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
      combat_logs: {
        Row: {
          action_type: string
          combatant_id: string | null
          combatant_name: string | null
          created_at: string
          details: string | null
          encounter_id: string
          id: string
          value: number | null
        }
        Insert: {
          action_type: string
          combatant_id?: string | null
          combatant_name?: string | null
          created_at?: string
          details?: string | null
          encounter_id: string
          id?: string
          value?: number | null
        }
        Update: {
          action_type?: string
          combatant_id?: string | null
          combatant_name?: string | null
          created_at?: string
          details?: string | null
          encounter_id?: string
          id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "combat_logs_combatant_id_fkey"
            columns: ["combatant_id"]
            isOneToOne: false
            referencedRelation: "combatants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combat_logs_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "combat_encounters"
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
      discord_oauth_states: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          used?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      homebrew_content: {
        Row: {
          created_at: string
          data: Json
          description: string | null
          icon: string | null
          id: string
          is_public: boolean
          name: string
          source: Database["public"]["Enums"]["homebrew_source"]
          type: Database["public"]["Enums"]["homebrew_content_type"]
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          data?: Json
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean
          name: string
          source?: Database["public"]["Enums"]["homebrew_source"]
          type: Database["public"]["Enums"]["homebrew_content_type"]
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          data?: Json
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean
          name?: string
          source?: Database["public"]["Enums"]["homebrew_source"]
          type?: Database["public"]["Enums"]["homebrew_content_type"]
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      homebrew_share_requests: {
        Row: {
          campaign_id: string
          content_id: string
          created_at: string
          id: string
          requester_id: string
          responded_at: string | null
          responded_by: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          content_id: string
          created_at?: string
          id?: string
          requester_id: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string
          content_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "homebrew_share_requests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homebrew_share_requests_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "homebrew_content"
            referencedColumns: ["id"]
          },
        ]
      }
      homebrew_shares: {
        Row: {
          campaign_id: string
          content_id: string
          id: string
          shared_at: string
        }
        Insert: {
          campaign_id: string
          content_id: string
          id?: string
          shared_at?: string
        }
        Update: {
          campaign_id?: string
          content_id?: string
          id?: string
          shared_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homebrew_shares_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homebrew_shares_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "homebrew_content"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          campaign_invite: boolean | null
          campaign_update: boolean | null
          chat_message: boolean | null
          created_at: string | null
          id: string
          session_reminder: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          campaign_invite?: boolean | null
          campaign_update?: boolean | null
          chat_message?: boolean | null
          created_at?: string | null
          id?: string
          session_reminder?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          campaign_invite?: boolean | null
          campaign_update?: boolean | null
          chat_message?: boolean | null
          created_at?: string | null
          id?: string
          session_reminder?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      personal_notes: {
        Row: {
          color: string | null
          content: string | null
          created_at: string
          id: string
          is_pinned: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      player_trades: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          initiator_character_id: string | null
          initiator_confirmed: boolean
          initiator_item_data: Json
          initiator_user_id: string
          receiver_character_id: string
          receiver_confirmed: boolean
          receiver_item_data: Json | null
          receiver_user_id: string
          status: string
          trade_type: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          initiator_character_id?: string | null
          initiator_confirmed?: boolean
          initiator_item_data?: Json
          initiator_user_id: string
          receiver_character_id: string
          receiver_confirmed?: boolean
          receiver_item_data?: Json | null
          receiver_user_id: string
          status?: string
          trade_type?: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          initiator_character_id?: string | null
          initiator_confirmed?: boolean
          initiator_item_data?: Json
          initiator_user_id?: string
          receiver_character_id?: string
          receiver_confirmed?: boolean
          receiver_item_data?: Json | null
          receiver_user_id?: string
          status?: string
          trade_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_trades_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_trades_initiator_character_id_fkey"
            columns: ["initiator_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_trades_receiver_character_id_fkey"
            columns: ["receiver_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          discord_user_id: string | null
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          discord_user_id?: string | null
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          discord_user_id?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      promo_tokens: {
        Row: {
          code: string
          created_at: string | null
          current_uses: number | null
          days_premium: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          tier: string
        }
        Insert: {
          code: string
          created_at?: string | null
          current_uses?: number | null
          days_premium?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          tier?: string
        }
        Update: {
          code?: string
          created_at?: string | null
          current_uses?: number | null
          days_premium?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          tier?: string
        }
        Relationships: []
      }
      registration_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          current_uses: number | null
          id: string
          is_active: boolean | null
          max_uses: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
        }
        Relationships: []
      }
      session_attendance: {
        Row: {
          created_at: string
          id: string
          responded_at: string | null
          session_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          responded_at?: string | null
          session_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          responded_at?: string | null
          session_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          campaign_id: string
          completed_at: string | null
          created_at: string
          gold_awarded: number | null
          highlights: string[] | null
          id: string
          location: string | null
          notes: string | null
          recap: string | null
          scheduled_at: string
          status: string | null
          summary: string | null
          title: string
          xp_awarded: number | null
        }
        Insert: {
          campaign_id: string
          completed_at?: string | null
          created_at?: string
          gold_awarded?: number | null
          highlights?: string[] | null
          id?: string
          location?: string | null
          notes?: string | null
          recap?: string | null
          scheduled_at: string
          status?: string | null
          summary?: string | null
          title: string
          xp_awarded?: number | null
        }
        Update: {
          campaign_id?: string
          completed_at?: string | null
          created_at?: string
          gold_awarded?: number | null
          highlights?: string[] | null
          id?: string
          location?: string | null
          notes?: string | null
          recap?: string | null
          scheduled_at?: string
          status?: string | null
          summary?: string | null
          title?: string
          xp_awarded?: number | null
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
      shop_transactions: {
        Row: {
          buyer_character_id: string
          buyer_user_id: string
          campaign_id: string
          created_at: string
          id: string
          item_data: Json
          price_copper: number
          price_gold: number
          price_silver: number
          quantity: number
          responded_at: string | null
          seller_user_id: string
          shop_id: string
          shop_item_id: string
          status: string
        }
        Insert: {
          buyer_character_id: string
          buyer_user_id: string
          campaign_id: string
          created_at?: string
          id?: string
          item_data?: Json
          price_copper?: number
          price_gold?: number
          price_silver?: number
          quantity?: number
          responded_at?: string | null
          seller_user_id: string
          shop_id: string
          shop_item_id: string
          status?: string
        }
        Update: {
          buyer_character_id?: string
          buyer_user_id?: string
          campaign_id?: string
          created_at?: string
          id?: string
          item_data?: Json
          price_copper?: number
          price_gold?: number
          price_silver?: number
          quantity?: number
          responded_at?: string | null
          seller_user_id?: string
          shop_id?: string
          shop_item_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_transactions_buyer_character_id_fkey"
            columns: ["buyer_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_transactions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_transactions_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "campaign_shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_transactions_shop_item_id_fkey"
            columns: ["shop_item_id"]
            isOneToOne: false
            referencedRelation: "campaign_shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      stretch_goals: {
        Row: {
          created_at: string
          description: string | null
          feature_key: string | null
          goal_number: number
          id: string
          phase: string
          phase_emoji: string | null
          phase_order: number | null
          sort_order: number
          status: string
          subtitle: string | null
          title: string
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          feature_key?: string | null
          goal_number: number
          id?: string
          phase?: string
          phase_emoji?: string | null
          phase_order?: number | null
          sort_order?: number
          status?: string
          subtitle?: string | null
          title: string
          updated_at?: string
          value: number
        }
        Update: {
          created_at?: string
          description?: string | null
          feature_key?: string | null
          goal_number?: number
          id?: string
          phase?: string
          phase_emoji?: string | null
          phase_order?: number | null
          sort_order?: number
          status?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
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
      supporter_items: {
        Row: {
          ac_bonus: number | null
          attunement_requirements: string | null
          created_at: string
          creator_message: string | null
          creator_name: string
          creator_tier: string
          damage: string | null
          damage_type: string | null
          description: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          is_visible: boolean
          item_type: string
          name: string
          properties: string | null
          rarity: string
          requires_attunement: boolean
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          ac_bonus?: number | null
          attunement_requirements?: string | null
          created_at?: string
          creator_message?: string | null
          creator_name: string
          creator_tier?: string
          damage?: string | null
          damage_type?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_visible?: boolean
          item_type?: string
          name: string
          properties?: string | null
          rarity?: string
          requires_attunement?: boolean
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          ac_bonus?: number | null
          attunement_requirements?: string | null
          created_at?: string
          creator_message?: string | null
          creator_name?: string
          creator_tier?: string
          damage?: string | null
          damage_type?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_visible?: boolean
          item_type?: string
          name?: string
          properties?: string | null
          rarity?: string
          requires_attunement?: boolean
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      supporter_npcs: {
        Row: {
          appearance: string | null
          backstory: string | null
          created_at: string
          creator_message: string | null
          creator_name: string
          creator_tier: string
          description: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          is_visible: boolean
          location: string | null
          name: string
          occupation: string | null
          personality: string | null
          tags: string[] | null
          title: string | null
          updated_at: string
        }
        Insert: {
          appearance?: string | null
          backstory?: string | null
          created_at?: string
          creator_message?: string | null
          creator_name: string
          creator_tier?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_visible?: boolean
          location?: string | null
          name: string
          occupation?: string | null
          personality?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          appearance?: string | null
          backstory?: string | null
          created_at?: string
          creator_message?: string | null
          creator_name?: string
          creator_tier?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_visible?: boolean
          location?: string | null
          name?: string
          occupation?: string | null
          personality?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      supporter_submissions: {
        Row: {
          admin_notes: string | null
          created_at: string
          creator_message: string | null
          creator_name: string
          creator_tier: string
          data: Json
          email: string | null
          id: string
          promo_code: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submission_type: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          creator_message?: string | null
          creator_name: string
          creator_tier: string
          data: Json
          email?: string | null
          id?: string
          promo_code: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submission_type: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          creator_message?: string | null
          creator_name?: string
          creator_tier?: string
          data?: Json
          email?: string | null
          id?: string
          promo_code?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submission_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      token_redemptions: {
        Row: {
          id: string
          redeemed_at: string | null
          token_id: string
          user_id: string
        }
        Insert: {
          id?: string
          redeemed_at?: string | null
          token_id: string
          user_id: string
        }
        Update: {
          id?: string
          redeemed_at?: string | null
          token_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_redemptions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "promo_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      can_create_character: { Args: { _user_id: string }; Returns: boolean }
      can_create_homebrew: { Args: { _user_id: string }; Returns: boolean }
      can_create_homebrew_with_limit: {
        Args: { _limit?: number; _user_id: string }
        Returns: boolean
      }
      can_share_homebrew_in_campaign: {
        Args: { _campaign_id: string; _user_id: string }
        Returns: boolean
      }
      consume_discord_oauth_state: {
        Args: { _state_id: string }
        Returns: string
      }
      count_user_characters: { Args: { _user_id: string }; Returns: number }
      count_user_homebrew: { Args: { _user_id: string }; Returns: number }
      create_discord_oauth_state: { Args: never; Returns: string }
      create_notification: {
        Args: {
          _data?: Json
          _message: string
          _title: string
          _type: Database["public"]["Enums"]["notification_type"]
          _user_id: string
        }
        Returns: string
      }
      generate_invite_code: { Args: never; Returns: string }
      get_campaign_webhook_url: {
        Args: { campaign_id: string }
        Returns: string
      }
      get_document_campaign_id: {
        Args: { _document_id: string }
        Returns: string
      }
      get_or_create_notification_preferences: {
        Args: { _user_id: string }
        Returns: {
          campaign_invite: boolean | null
          campaign_update: boolean | null
          chat_message: boolean | null
          created_at: string | null
          id: string
          session_reminder: boolean | null
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "notification_preferences"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_subscription_tier: { Args: { _user_id: string }; Returns: string }
      has_document_access: {
        Args: { _document_id: string; _user_id: string }
        Returns: boolean
      }
      has_homebrew_access: {
        Args: { _content_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_campaign_master: {
        Args: { _campaign_id: string; _user_id: string }
        Returns: boolean
      }
      is_campaign_member: {
        Args: { _campaign_id: string; _user_id: string }
        Returns: boolean
      }
      is_homebrew_owner: {
        Args: { _content_id: string; _user_id: string }
        Returns: boolean
      }
      is_mestre: { Args: { _user_id: string }; Returns: boolean }
      is_premium: { Args: { _user_id: string }; Returns: boolean }
      join_campaign_by_code: {
        Args: { _character_id?: string; _invite_code: string; _user_id: string }
        Returns: string
      }
      owns_character: {
        Args: { _character_id: string; _user_id: string }
        Returns: boolean
      }
      redeem_promo_token: {
        Args: { _code: string; _user_id: string }
        Returns: Json
      }
      validate_registration_code: { Args: { _code: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      bug_severity: "low" | "medium" | "high" | "critical"
      bug_status: "open" | "in_progress" | "resolved" | "closed" | "wont_fix"
      homebrew_content_type:
        | "spell"
        | "item"
        | "race"
        | "class"
        | "subclass"
        | "monster"
        | "background"
        | "feat"
      homebrew_sharing_policy: "disabled" | "enabled" | "approval_required"
      homebrew_source: "user" | "master_shared" | "community"
      notification_type:
        | "campaign_invite"
        | "session_reminder"
        | "campaign_update"
        | "chat_message"
      subscription_status:
        | "free"
        | "premium"
        | "aldeao"
        | "heroi"
        | "mestre"
        | "visitante"
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
      app_role: ["admin", "moderator", "user"],
      bug_severity: ["low", "medium", "high", "critical"],
      bug_status: ["open", "in_progress", "resolved", "closed", "wont_fix"],
      homebrew_content_type: [
        "spell",
        "item",
        "race",
        "class",
        "subclass",
        "monster",
        "background",
        "feat",
      ],
      homebrew_sharing_policy: ["disabled", "enabled", "approval_required"],
      homebrew_source: ["user", "master_shared", "community"],
      notification_type: [
        "campaign_invite",
        "session_reminder",
        "campaign_update",
        "chat_message",
      ],
      subscription_status: [
        "free",
        "premium",
        "aldeao",
        "heroi",
        "mestre",
        "visitante",
      ],
    },
  },
} as const
