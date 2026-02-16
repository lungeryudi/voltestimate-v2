/**
 * Supabase client configuration
 * Provides typed Supabase client for database operations
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not configured. Auth features will not work.');
}

// Supabase client - will be properly typed when schema is synced
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

export type SupabaseClient = typeof supabase;
