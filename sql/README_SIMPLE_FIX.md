# 🔧 Database Setup - SIMPLE FIX

## ❗ PENTING - Baca Ini Dulu!

**Kalau kamu tidak bisa login**, berarti function `get_email_from_identity` belum ada di database Supabase kamu.

Error yang muncul:
```
Could not find the function public.get_email_from_identity
POST /rest/v1/rpc/get_email_from_identity 404 (Not Found)
```

---

## 🚀 Cara Fix (5 Menit)

### **Langkah 1: Buka Supabase Dashboard**
1. Login ke https://supabase.com
2. Pilih project: **xlkphzmjbfyzpiqnnyvc**

### **Langkah 2: Buka SQL Editor**
1. Di sidebar kiri, klik **"SQL Editor"**
2. Klik tombol **"New query"** (hijau, pojok kanan atas)

### **Langkah 3: Copy Script**
1. Buka file **`sql/SIMPLE_FIX.sql`** (file ini ada di folder yang sama)
2. **Copy SEMUA ISI file tersebut** (dari baris 1 sampai akhir)

### **Langkah 4: Paste & Run**
1. **Paste** ke SQL Editor
2. Klik tombol **"Run"** (atau tekan `Ctrl+Enter` / `Cmd+Enter`)
3. Tunggu sampai selesai (sekitar 5-10 detik)

### **Langkah 5: Cek Hasil**
Akan muncul pesan sukses seperti ini:
```
✓ Function get_email_from_identity created
✓ Function check_email_exists created
✓ Kolom latitude ditambahkan ke schools
✓ Kolom longitude ditambahkan ke schools
✓ Kolom location_radius ditambahkan ke schools
✓ Kolom location_attendance_enabled ditambahkan ke schools
✓ Kolom teacher_latitude ditambahkan ke attendances
✓ Kolom teacher_longitude ditambahkan ke attendances
✓ Kolom latitude ditambahkan ke teacher_attendance
✓ Kolom longitude ditambahkan ke teacher_attendance
✓ Table class_schedules created
✓ School ID updated untuk profiles yang NULL
```

---

## ✅ Setelah Run Script

### **Test Login:**
1. Refresh browser (tekan `Ctrl+Shift+R` / `Cmd+Shift+R`)
2. Login dengan:
   - **Nomor Induk** (NIS/NIP) - bukan email!
   - **Password**
3. Login seharusnya **berhasil!** 🎉

### **Test Fitur Lokasi:**
1. Login sebagai Admin
2. Buka menu **"Pengaturan Sistem"** → **"Kelola Sekolah"**
3. Edit sekolah
4. Scroll ke bawah → ada toggle **"Aktifkan Fitur Lokasi untuk Absensi"**
5. Toggle ON → koordinat default: `-7.653938, 114.042504` (Jember)

---

## 📋 Apa yang Dilakukan Script Ini?

### 1. **Login Functions** ✅
- `get_email_from_identity()` - Mengambil email dari nomor induk (NIS/NIP)
- `check_email_exists()` - Cek apakah email sudah ada

### 2. **Fitur Lokasi GPS** 📍
Menambahkan kolom ke table:
- **schools**: `latitude`, `longitude`, `location_radius`, `location_attendance_enabled`
- **attendances**: `teacher_latitude`, `teacher_longitude` (tracking lokasi guru)
- **teacher_attendance**: `latitude`, `longitude` (lokasi saat absen)

### 3. **Table Jadwal** 📅
- Membuat table **class_schedules** untuk jadwal pelajaran
- Dengan RLS policies yang sesuai

### 4. **Fix School ID** 🏫
- Update semua profiles yang `school_id`-nya NULL
- Menghubungkan user ke sekolah pertama di database

---

## 🔍 Troubleshooting

### **Masalah: Error "permission denied"**
**Solusi:** Run query ini dulu di SQL Editor:
```sql
GRANT EXECUTE ON FUNCTION public.get_email_from_identity(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO anon, authenticated;
```

### **Masalah: "Tidak ada school di database"**
**Solusi:**
1. Login sebagai Admin (pakai email kalau nomor induk belum work)
2. Buka menu "Kelola Sekolah"
3. Buat sekolah baru
4. Run script `SIMPLE_FIX.sql` lagi

### **Masalah: Masih error 404 setelah run script**
**Solusi:**
1. **Hard refresh** browser: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Coba login lagi

### **Masalah: Script error di tengah jalan**
**Solusi:** Script ini **aman dijalankan berkali-kali!** Coba run lagi, tidak akan duplikat.

---

## 📞 Butuh Bantuan?

Kalau masih error, cek:
1. Apakah script sudah di-run di Supabase SQL Editor? ✅
2. Apakah ada error message saat run script? 
3. Apakah sudah hard refresh browser? ✅
4. Apakah login pakai **nomor induk** (bukan email)? ✅

---

## 🎯 Flow Login yang Benar

```
User Input: Nomor Induk (NIS/NIP) + Password
                    ↓
   Call function: get_email_from_identity(nomor_induk)
                    ↓
              Dapat email dari database
                    ↓
        Supabase Auth: signInWithPassword(email, password)
                    ↓
              Login berhasil! 🎉
```

**PENTING:** User tetap input **nomor induk** saat login, tapi sistem akan otomatis convert ke email untuk autentikasi Supabase!

---

**Last Updated:** October 24, 2025
**Version:** 1.0.0
