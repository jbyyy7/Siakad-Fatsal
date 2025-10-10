import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xlkphzmjbfyzpiqnnyvc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhsa3Boem1qYmZ5enBpcW5ueXZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjA2NzI3OTIsImV4cCI6MjAzNjI0ODc5Mn0.S-8vyAMan26t0c_3r_i5M24A5f26a1L3s6g2w5pY5wE';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and anon key are required.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
