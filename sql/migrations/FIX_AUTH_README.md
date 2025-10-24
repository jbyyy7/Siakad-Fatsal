# 🔧 FIX: Login dengan Nomor Induk & Role Issues

## 🐛 Masalah yang Ditemukan:
1. ❌ Login pakai nomor induk tapi masuk sebagai Siswa (role salah)
2. ❌ Role tidak sesuai dengan yang seharusnya
3. ❌ RLS policies terlalu ketat sehingga user tidak bisa akses data

## ✅ Solusi:

### **QUICK FIX - Jalankan Script SQL Ini:**

**File:** `sql/migrations/FIX_AUTH_AND_RLS.sql`

**Cara Pakai:**
1. Buka **Supabase Dashboard** → **SQL Editor**
2. Copy semua isi file `sql/migrations/FIX_AUTH_AND_RLS.sql`
3. Paste ke SQL Editor
4. Klik **RUN**
5. Tunggu hingga selesai (akan ada success message)

## 📋 Yang Diperbaiki:

### 1. **Function untuk Login dengan Nomor Induk**
```sql
get_email_by_identity_number(identity_input TEXT)
```
- Mengambil email dari nomor induk
- Digunakan untuk login

### 2. **RLS Policies Diperbaiki**
**Before:** Policies terlalu ketat, user tidak bisa view data sekolah lain
**After:** Policies lebih permissive, user bisa view semua data (app logic yang handle filtering)

### 3. **Helper Functions**
```sql
get_user_role(user_id UUID)          -- Get role user
is_admin(user_id UUID)               -- Check apakah admin
is_teacher_or_admin(user_id UUID)    -- Check apakah guru/admin
```

### 4. **Auto-Create Profile on Signup**
Trigger `handle_new_user()` akan otomatis create profile saat user signup via Supabase Auth

### 5. **Service Role Bypass**
Service role bisa bypass RLS untuk API calls

## 🔍 Testing Setelah Fix:

### Test 1: Login dengan Nomor Induk
```
Nomor Induk: [masukkan NIS/NIP]
Password: [password]
Expected: Login berhasil dengan role yang benar
```

### Test 2: Cek Role di Database
```sql
-- Jalankan di SQL Editor untuk cek role user
SELECT id, full_name, email, identity_number, role 
FROM profiles 
WHERE identity_number = 'NOMOR_INDUK_ANDA';
```

### Test 3: Test Function
```sql
-- Test get email dari nomor induk
SELECT get_email_by_identity_number('12345678');

-- Test get role
SELECT get_user_role('UUID_USER');

-- Test is admin
SELECT is_admin('UUID_USER');
```

## 📝 Jika Role Masih Salah di Database:

Kalau user sudah ada tapi rolenya salah, update manual:

```sql
-- Update role user (ganti dengan data yang benar)
UPDATE profiles 
SET role = 'Admin'  -- atau 'Guru', 'Kepala Sekolah', 'Staff', 'Siswa'
WHERE identity_number = 'NOMOR_INDUK_ANDA';

-- Atau update by email
UPDATE profiles 
SET role = 'Guru'
WHERE email = 'email@example.com';
```

## ⚠️ IMPORTANT:

**Role yang Valid:**
- `Admin` - Super admin sistem
- `Guru` - Guru/pengajar
- `Kepala Sekolah` - Kepala sekolah
- `Staff` - Staff sekolah
- `Siswa` - Siswa
- `Kepala Yayasan` - Kepala yayasan

**Case Sensitive!** Harus persis seperti di atas (huruf besar di awal).

## 🎯 Flow Login yang Benar:

1. User input: **Nomor Induk** + **Password**
2. Frontend call: `get_email_by_identity_number(nomor_induk)`
3. Get email dari function
4. Login Supabase Auth dengan email + password
5. Fetch profile dari table `profiles`
6. Return User object dengan role yang benar
7. Dashboard routing berdasarkan role

## 🔒 Security Notes:

- RLS policies masih aktif untuk INSERT/UPDATE/DELETE
- Hanya SELECT yang lebih permissive
- Service role tetap memiliki full access
- Function menggunakan SECURITY DEFINER (aman)

## 📞 Troubleshooting:

### Problem: "Function not found"
**Solution:** Jalankan script `FIX_AUTH_AND_RLS.sql`

### Problem: "Permission denied"
**Solution:** Check GRANT statements sudah dijalankan

### Problem: Role masih salah
**Solution:** 
1. Check database: `SELECT * FROM profiles WHERE identity_number = 'XXX'`
2. Update manual jika perlu
3. Logout dan login ulang

### Problem: Tidak bisa akses data
**Solution:** 
1. Check RLS policies: Script sudah fix ini
2. Check role di database: Pastikan tidak typo
3. Check logs di Supabase Dashboard

## ✨ Expected Result:

Setelah fix:
- ✅ Login dengan nomor induk works
- ✅ Role sesuai dengan database
- ✅ Dashboard routing benar per role
- ✅ User bisa akses data yang diperlukan
- ✅ No more permission errors

---

**Next Steps:**
1. ✅ Jalankan `FIX_AUTH_AND_RLS.sql` di Supabase
2. ✅ Cek role user di database
3. ✅ Test login dengan berbagai role
4. ✅ Commit changes ke git
