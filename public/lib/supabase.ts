import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let client: SupabaseClient | null = null

if (supabaseUrl && supabaseAnonKey) {
  client = createClient(supabaseUrl, supabaseAnonKey)
} else {
  if (typeof window !== "undefined") {
    console.warn(
      "Supabase environment variables are not set. Supabase features will be disabled."
    )
  }
}

export const supabase = client
export const isSupabaseConfigured = !!client

// Database types based on the schema
export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: number
          organization_id: number
          start_date: string
          end_date: string | null
          active: boolean
          title: string | null
          description: string | null
          matches: any | null
        }
        Insert: {
          id?: number
          organization_id: number
          created_at: string
          ends_at?: string | null
          active: boolean
          title?: string | null
          description?: string | null
          matches?: any | null
        }
        Update: {
          id?: number
          organization_id?: number
          created_at?: string
          ends_at?: string | null
          active?: boolean
          title?: string | null
          description?: string | null
          matches?: any | null
        }
      }
      organizations: {
        Row: {
          id: number
          org_name: string
          description: string
        }
        Insert: {
          id?: number
          org_name: string
          description: string
        }
        Update: {
          id?: number
          org_name?: string
          description?: string
        }
      }
      questions: {
        Row: {
          id: number
          question: string
          options: any | null
          event_id: number
        }
        Insert: {
          id?: number
          question: string
          options?: any | null
          event_id: number
        }
        Update: {
          id?: number
          question?: string
          options?: any | null
          event_id?: number
        }
      }
      responses: {
        Row: {
          id: number
          question_id: number
          answer: any | null
          user_id: number
        }
        Insert: {
          id?: number
          question_id: number
          answer?: any | null
          user_id: number
        }
        Update: {
          id?: number
          question_id?: number
          answer?: any | null
          user_id?: number
        }
      }
      users: {
        Row: {
          id: number
          username: string
          first_name: string
          last_name: string
          email: string
          phone_number: string | null
          events: number[]
        }
        Insert: {
          id?: number
          username: string
          first_name: string
          last_name: string
          email: string
          phone_number?: string | null
          events: number[]
        }
        Update: {
          id?: number
          username?: string
          first_name?: string
          last_name?: string
          email?: string
          phone_number?: string | null
          events?: number[]
        }
      }
      user_profiles: {
        Row: {
          id: number
          user_id: number
          gender: string | null
          class_year: number
          major: string
          hobbies: string[]
        }
        Insert: {
          id?: number
          user_id: number
          gender?: string | null
          class_year: number
          major: string
          hobbies: string[]
        }
        Update: {
          id?: number
          user_id?: number
          gender?: string | null
          class_year?: number
          major?: string
          hobbies?: string[]
        }
      }
      orgadmins: {
        Row: {
          id: number
          username: string
          first_name: string
          last_name: string
          email: string
          organization_id: number
        }
        Insert: {
          id?: number
          username: string
          first_name: string
          last_name: string
          email: string
          organization_id: number
        }
        Update: {
          id?: number
          username?: string
          first_name?: string
          last_name?: string
          email?: string
          organization_id?: number
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