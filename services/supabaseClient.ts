import { createClient } from '@supabase/supabase-js';

// Implementasi sederhana dari storage di dalam memori untuk lingkungan tanpa localStorage
class InMemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }
}

const supabaseUrl = 'https://xlkphzmjbfyzpiqnnyvc.supabase.co';

// =================================================================================
// !!! PENTING: KUNCI ANDA SUDAH BENAR !!!
// Tidak perlu diubah lagi, masalahnya ada pada lingkungan preview, bukan kunci ini.
// =================================================================================
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhsa3Boem1qYmZ5enBpcW5ueXZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNzk4OTMsImV4cCI6MjA3NTY1NTg5M30.WMOI-22Maro_NtfQff9V7irqy2eRTy8lPtSljh3vLrs';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and anon key are required.');
}

// Inisialisasi klien Supabase dengan opsi custom storage
// Ini akan membuat aplikasi bekerja di browser biasa DAN di preview AI Studio
// FIX: The custom storage implementation must be provided under the `auth` key, not `global`. This resolves the type error.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: new InMemoryStorage(),
  },
});
