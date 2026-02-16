/**
 * Database types for Supabase
 * Generated schema types for voltestimate-v2
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          company: string | null
          role: 'admin' | 'estimator' | 'viewer'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          company?: string | null
          role?: 'admin' | 'estimator' | 'viewer'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          company?: string | null
          role?: 'admin' | 'estimator' | 'viewer'
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          client: string
          address: string | null
          status: 'active' | 'completed' | 'on-hold' | 'cancelled'
          user_id: string
          created_at: string
          updated_at: string
          value: number
        }
        Insert: {
          id?: string
          name: string
          client: string
          address?: string | null
          status?: 'active' | 'completed' | 'on-hold' | 'cancelled'
          user_id: string
          created_at?: string
          updated_at?: string
          value?: number
        }
        Update: {
          id?: string
          name?: string
          client?: string
          address?: string | null
          status?: 'active' | 'completed' | 'on-hold' | 'cancelled'
          user_id?: string
          created_at?: string
          updated_at?: string
          value?: number
        }
      }
      blueprints: {
        Row: {
          id: string
          project_id: string
          name: string
          url: string
          scale: number
          width: number
          height: number
          analysis_status: 'pending' | 'analyzing' | 'completed' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          url: string
          scale?: number
          width?: number
          height?: number
          analysis_status?: 'pending' | 'analyzing' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          url?: string
          scale?: number
          width?: number
          height?: number
          analysis_status?: 'pending' | 'analyzing' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
      }
      devices: {
        Row: {
          id: string
          blueprint_id: string
          type: string
          system: 'fire' | 'cctv' | 'access'
          x: number
          y: number
          name: string
          rotation: number
          properties: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          blueprint_id: string
          type: string
          system: 'fire' | 'cctv' | 'access'
          x: number
          y: number
          name: string
          rotation?: number
          properties?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          blueprint_id?: string
          type?: string
          system?: 'fire' | 'cctv' | 'access'
          x?: number
          y?: number
          name?: string
          rotation?: number
          properties?: Json
          created_at?: string
          updated_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          blueprint_id: string
          name: string
          type: string
          x: number
          y: number
          width: number
          height: number
          created_at: string
        }
        Insert: {
          id?: string
          blueprint_id: string
          name: string
          type: string
          x: number
          y: number
          width: number
          height: number
          created_at?: string
        }
        Update: {
          id?: string
          blueprint_id?: string
          name?: string
          type?: string
          x?: number
          y?: number
          width?: number
          height?: number
          created_at?: string
        }
      }
      estimates: {
        Row: {
          id: string
          project_id: string
          status: 'draft' | 'pending' | 'approved' | 'rejected' | 'sent'
          total: number
          labor_hours: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          status?: 'draft' | 'pending' | 'approved' | 'rejected' | 'sent'
          total?: number
          labor_hours?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          status?: 'draft' | 'pending' | 'approved' | 'rejected' | 'sent'
          total?: number
          labor_hours?: number
          created_at?: string
          updated_at?: string
        }
      }
      estimate_items: {
        Row: {
          id: string
          estimate_id: string
          category: string
          description: string
          quantity: number
          unit_price: number
          created_at: string
        }
        Insert: {
          id?: string
          estimate_id: string
          category: string
          description: string
          quantity: number
          unit_price: number
          created_at?: string
        }
        Update: {
          id?: string
          estimate_id?: string
          category?: string
          description?: string
          quantity?: number
          unit_price?: number
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

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type Updatable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Profile = Tables<'profiles'>
export type ProjectRow = Tables<'projects'>
export type BlueprintRow = Tables<'blueprints'>
export type DeviceRow = Tables<'devices'>
export type RoomRow = Tables<'rooms'>
export type EstimateRow = Tables<'estimates'>
export type EstimateItemRow = Tables<'estimate_items'>
