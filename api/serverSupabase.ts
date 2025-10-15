import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // In serverless environment this will surface a runtime error if not configured
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_URL in environment');
}

export const serverSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default serverSupabase;
