/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly GEMINI_API_KEY?: string;
  // tambahkan variabel env lain di sini jika diperlukan
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
