import { createClient } from '@supabase/supabase-js';

// Read Supabase configuration from Vite environment variables.
// On Vercel set these as project/environment variables.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Helpful runtime message for developers if env vars are missing.
  throw new Error('Supabase URL and anon key are required. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);