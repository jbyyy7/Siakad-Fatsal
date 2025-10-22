# 📋 Panduan Deployment SIAKAD Fathus Salafi

## 🚀 Checklist Deploy ke Vercel + Supabase

### 1️⃣ Environment Variables Vercel (WAJIB)

#### Client-side (Exposed to Browser)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

#### Server-side (Secret - JANGAN exposed ke browser)
```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
CREATE_USER_SECRET=random_secret_string_untuk_create_user
DELETE_USER_SECRET=random_secret_string_untuk_delete_user
APP_URL=https://your-app.vercel.app
```

#### Email (Opsional - untuk fitur notifikasi)
```bash
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
NOTIFICATIONS_FROM=noreply@yourschool.edu
SEND_NOTIFICATION_SECRET=random_secret_untuk_send_notification
```

**Cara set di Vercel:**
1. Buka Project → Settings → Environment Variables
2. Tambahkan satu per satu
3. Untuk server-only vars, centang "Production" & "Preview" tapi JANGAN "Development" yang exposed

---

### 2️⃣ Setup Database Supabase (WAJIB)

#### A. Jalankan Migrasi SQL

Buka **Supabase Dashboard → SQL Editor**, paste & run file berikut secara berurutan:

**1. Core Tables** (`sql/migrations/001_create_core_tables.sql`)
```sql
-- Sudah tersedia di repo, jalankan langsung di SQL Editor
```

**2. Password Resets** (`sql/migrations/002_password_resets.sql`)
```sql
-- Sudah tersedia di repo, jalankan langsung di SQL Editor
```

**3. RLS Policies** (`sql/policies/01_rls_policies.sql`)
```sql
-- Sudah tersedia di repo, sesuaikan dengan kebutuhan RLS Anda
```

#### B. Buat RPC Functions (PENTING untuk Login & Delete User)

**Login via Nomor Induk:**
```sql
CREATE OR REPLACE FUNCTION public.get_email_from_identity(identity_number_input text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT email FROM public.profiles WHERE identity_number = identity_number_input LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_email_from_identity(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_email_from_identity(text) TO authenticated;
```

**Delete User (untuk Manage Users):**
```sql
CREATE OR REPLACE FUNCTION public.delete_user(uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.class_members WHERE profile_id = uid;
  DELETE FROM public.grades WHERE student_id = uid;
  DELETE FROM public.attendance WHERE student_id = uid;
  DELETE FROM public.announcements WHERE author_id = uid;
  DELETE FROM public.password_resets WHERE user_id = uid;
  DELETE FROM public.profiles WHERE id = uid;
  -- Note: Hapus auth.users dilakukan via server admin API, bukan RPC
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user(uuid) TO service_role;
```

#### C. RLS Policies untuk Profiles

```sql
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Service role can do anything (untuk server APIs)
CREATE POLICY "Service role full access"
  ON public.profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

---

### 3️⃣ Verifikasi Pre-Deploy

**Checklist sebelum deploy:**
- [ ] Semua env vars di Vercel sudah diset (minimal SUPABASE keys)
- [ ] SQL migrations sudah dijalankan di Supabase
- [ ] RPC functions `get_email_from_identity` sudah dibuat & di-GRANT
- [ ] RLS policies untuk `profiles` sudah enable
- [ ] `package.json` tidak ada dependency error
- [ ] Build lokal sukses: `npm run build`
- [ ] TypeScript check lulus: `npm run typecheck`

---

### 4️⃣ Deploy & Testing

#### Push ke Vercel:
```bash
git add .
git commit -m "chore: prepare for production deployment"
git push origin main
```

Vercel akan otomatis trigger build jika repo terhubung.

#### Testing Post-Deploy:

1. **Test Login (NON-ADMIN)**
   - Login sebagai Guru/Siswa (bukan Admin)
   - Pastikan sidebar muncul sesuai role
   - Jika gagal: cek RLS policies & RPC `get_email_from_identity`

2. **Test Create User**
   - Buka Kelola Pengguna
   - Tambah user baru
   - Cek tabel `profiles` & `password_resets` di Supabase
   - Jika email diaktifkan: cek inbox untuk reset link

3. **Test Import Siswa**
   - Upload Excel/CSV dengan kolom: full_name, email, phone, class_name
   - Pastikan batch import berhasil
   - Cek error rows jika ada

4. **Monitor Logs**
   - Vercel Dashboard → Functions → Logs
   - Cek error 500/403 di serverless functions
   - Error umum: missing env vars, RLS blocking queries

---

### 5️⃣ Troubleshooting Common Errors

#### Error: "Profile tidak dapat dimuat" saat login non-admin
**Penyebab:** RLS blocking SELECT on profiles  
**Solusi:** Pastikan policy "Users can view own profile" sudah dibuat

#### Error: "SENDGRID_API_KEY is not set" di logs
**Penyebab:** Email feature aktif tapi key tidak di-set  
**Solusi:** Set `SENDGRID_API_KEY` di Vercel atau service akan auto-skip email sending

#### Error: "auth.admin.createUser is not a function"
**Penyebab:** `SUPABASE_SERVICE_ROLE_KEY` tidak diset atau salah  
**Solusi:** Verifikasi key di Vercel Settings → Environment Variables

#### Build Failed: "No matching version found for @sendgrid/mail"
**Penyebab:** Dependency di-remove & sekarang dynamic import  
**Solusi:** Sudah diperbaiki di commit terakhir, re-deploy

---

### 6️⃣ Post-Deploy Optimization

**Untuk production:**
1. Setup Sentry untuk error monitoring
2. Enable Vercel Analytics
3. Setup backup otomatis Supabase (Point-in-Time Recovery)
4. Tambahkan rate limiting di serverless functions
5. Setup CDN untuk assets statis
6. Compress & lazy-load komponen besar (Dashboard chunks > 500KB)

---

## 📞 Support

Jika ada masalah saat deployment:
1. Cek Vercel Build Logs
2. Cek Vercel Function Logs (runtime errors)
3. Cek Supabase Logs (query errors, RLS issues)
4. Review `sql/migrations/*.sql` apakah sudah dijalankan
