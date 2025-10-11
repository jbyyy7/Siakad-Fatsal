import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xlkphzmjbfyzpiqnnyvc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhsa3Boem1qYmZ5enBpcW5ueXZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNzk4OTMsImV4cCI6MjA3NTY1NTg5M30.WMOI-22Maro_NtfQff9V7irqy2eRTy8lPtSljh3vLrs';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and anon key are required.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
