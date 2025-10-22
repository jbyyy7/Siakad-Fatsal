# 🚀 Vercel Deployment Guide - SIAKAD Fathus Salafi

## 📋 Environment Variables untuk Vercel

Tambahkan environment variables berikut di **Vercel Dashboard** → **Settings** → **Environment Variables**:

### 1️⃣ **Supabase Configuration** (REQUIRED)

```env
# Supabase Project URL
VITE_SUPABASE_URL=https://your-project.supabase.co

# Supabase Anon Key (Public)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role Key (Private - untuk serverless functions)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Cara mendapatkan:**
- Login ke [Supabase Dashboard](https://app.supabase.com)
- Pilih project → **Settings** → **API**
- Copy `Project URL` dan `anon/public key`
- Copy `service_role key` (WARNING: Jangan share ke publik!)

---

### 2️⃣ **Email Configuration** (OPTIONAL - untuk fitur reset password)

```env
# SMTP Configuration (jika pakai custom email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Atau pakai email service lain seperti SendGrid, Mailgun, dll
```

**Catatan:** 
- Supabase sudah punya email bawaan, ini hanya jika mau custom
- Untuk Gmail, gunakan [App Password](https://support.google.com/accounts/answer/185833)

---

### 3️⃣ **Node Environment** (OPTIONAL)

```env
NODE_VERSION=18
```

---

## 🗄️ Setup Supabase Database

### ✅ **Yang sudah SELESAI:**

1. ✅ Tabel utama sudah ada:
   - `profiles` - User profiles
   - `schools` - Data sekolah
   - `classes` - Kelas
   - `subjects` - Mata pelajaran
   - `announcements` - Pengumuman
   - `teaching_journals` - Jurnal mengajar

2. ✅ Tabel baru yang perlu ditambahkan (via migration):
   - `password_resets` - Reset password tokens
   - `teacher_attendance` - Absensi guru/kepala sekolah
   - `class_members` - Relasi kelas-siswa/guru (many-to-many)
   - `notifications` - Notifikasi real-time

3. ✅ Enum `user_role` sudah ada dengan values:
   - Admin
   - Guru
   - Kepala Sekolah
   - Siswa
   - Yayasan

### 🔧 **Yang perlu DITAMBAHKAN di Supabase:**

#### **STEP 1: Tambah Staff Role ke Enum**

Jalankan script ini di **Supabase SQL Editor**:

```sql
-- File: sql/00_ADD_STAFF_ENUM.sql
```

Jalankan file `sql/00_ADD_STAFF_ENUM.sql` yang sudah ada di repository.

---

#### **STEP 2: Jalankan Migration Lengkap**

Jalankan script ini di **Supabase SQL Editor**:

```sql
-- File: sql/SAFE_MIGRATION.sql
```

Jalankan file `sql/SAFE_MIGRATION.sql` yang sudah ada di repository.

Script ini akan:
- ✅ Membuat 4 tabel baru (password_resets, teacher_attendance, class_members, notifications)
- ✅ Menambahkan kolom `email` ke tabel profiles
- ✅ Membuat RLS policies untuk Staff role
- ✅ Membuat RPC functions (get_email_from_identity, delete_user)
- ✅ Membuat indexes untuk performa
- ✅ Auto-skip tabel yang belum ada (aman!)

---

#### **STEP 3: Verifikasi Migration**

Jalankan queries ini untuk memastikan semuanya sukses:

```sql
-- File: sql/VERIFICATION_QUERIES.sql
```

Atau jalankan manual:

```sql
-- Cek semua tabel
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Cek RLS enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;

-- Cek Staff enum
SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');
```

---

## 🔐 Supabase Auth Configuration

### **Email Templates** (OPTIONAL)

Di Supabase Dashboard → **Authentication** → **Email Templates**, customize:

1. **Confirm Signup** - Email verifikasi untuk user baru
2. **Reset Password** - Email untuk reset password
3. **Magic Link** - Jika pakai magic link login

### **Auth Providers** (Saat ini: Email/Password saja)

Jika mau tambah provider lain (Google, Facebook, dll):
- Pergi ke **Authentication** → **Providers**
- Enable provider yang diinginkan
- Tambahkan credentials (Client ID, Secret)

---

## 📱 Storage Configuration (OPTIONAL)

Jika aplikasi perlu upload file (foto profil, dokumen, dll):

1. Buat bucket di **Storage**:
   ```sql
   -- Di Supabase Storage, buat bucket:
   - avatars (untuk foto profil)
   - documents (untuk dokumen)
   ```

2. Set RLS policies untuk storage:
   ```sql
   -- Policy untuk avatars bucket
   CREATE POLICY "Users can upload own avatar"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

---

## 🚀 Deployment Steps

### **1. Push code ke GitHub**

```bash
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### **2. Connect Vercel ke GitHub**

1. Login ke [Vercel](https://vercel.com)
2. Click **New Project**
3. Import repository `jbyyy7/Siakad-Fatsal`
4. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### **3. Add Environment Variables**

Tambahkan semua environment variables yang disebutkan di atas.

### **4. Deploy!**

Click **Deploy** dan tunggu ~2 menit.

---

## ✅ Post-Deployment Checklist

Setelah deploy sukses, test:

- [ ] Login sebagai Admin
- [ ] Login sebagai Staff (buat user baru dengan role Staff)
- [ ] Login sebagai Guru
- [ ] Login sebagai Kepala Sekolah
- [ ] Login sebagai Siswa
- [ ] Test Teacher Attendance (check-in/check-out)
- [ ] Test Create/Edit User
- [ ] Test Create/Edit Class
- [ ] Test Input Nilai
- [ ] Test Absensi Siswa
- [ ] Test Pengumuman

---

## 🐛 Troubleshooting

### **Error: "Invalid API Key"**
- Cek `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` benar
- Pastikan tidak ada spasi atau karakter aneh

### **Error: "Row Level Security policy violation"**
- Cek RLS policies sudah dibuat dengan benar
- Jalankan `SAFE_MIGRATION.sql` lagi
- Cek user role di database match dengan yang di code

### **Error: "Function does not exist"**
- Jalankan `SAFE_MIGRATION.sql` untuk membuat RPC functions
- Cek function `get_email_from_identity` dan `delete_user` ada

### **Build Error di Vercel**
- Cek Node version (set ke 18)
- Cek semua dependencies di `package.json`
- Lihat build logs untuk error spesifik

---

## 📊 Performance Optimization (OPTIONAL)

### **1. Enable Supabase Realtime** (untuk notifikasi live)

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
```

### **2. Add Database Indexes** (sudah ada di migration)

Indexes sudah otomatis dibuat via `SAFE_MIGRATION.sql`

### **3. Enable Supabase Edge Functions** (future enhancement)

Untuk background tasks, scheduled jobs, dll.

---

## 🔒 Security Best Practices

1. ✅ **Never commit** `.env` files ke Git
2. ✅ **Rotate** Supabase Service Role Key secara berkala
3. ✅ **Enable** RLS pada semua tabel
4. ✅ **Limit** API calls dengan rate limiting (sudah ada di code)
5. ✅ **Monitor** Supabase logs untuk suspicious activity

---

## 📞 Support

Jika ada masalah:
1. Cek [Supabase Docs](https://supabase.com/docs)
2. Cek [Vercel Docs](https://vercel.com/docs)
3. Lihat logs di Vercel Dashboard
4. Lihat logs di Supabase Dashboard → Logs

---

**✨ Aplikasi siap production!** 🎉
