# 🔧 FIX: Database Schema Error - School Form

## ❌ Error yang Terjadi:
```
Error: "Could not find the 'locationAttendanceEnabled' column of 'schools' in the schema cache"
Error: "Could not find the 'gateAttendanceEnabled' column of 'schools' in the schema cache"
```

## 🎯 Penyebab:
Aplikasi mencoba menyimpan kolom-kolom yang **belum ada** di database Supabase:
- `location_attendance_enabled` ❌
- `gate_attendance_enabled` ❌
- `gate_qr_enabled` ❌
- `gate_face_enabled` ❌
- `gate_manual_enabled` ❌
- `gate_check_in_start` ❌
- `gate_check_in_end` ❌
- `gate_late_threshold` ❌
- `gate_check_out_start` ❌
- `gate_check_out_end` ❌
- `gate_notify_parents` ❌
- `gate_notify_on_late` ❌

## ✅ Solusi: Tambah Kolom ke Database

### **LANGKAH 1: Buka Supabase SQL Editor**
1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Pilih project: **Siakad Fathus Salafi**
3. Klik menu **SQL Editor** di sidebar kiri
4. Klik **New Query** atau gunakan editor kosong

---

### **LANGKAH 2: Jalankan Migration SQL**

**Copy & Paste SQL berikut ke SQL Editor:**

```sql
-- ============================================================================
-- Migration: Add Gate Attendance Columns to Schools Table
-- Date: 2024-10-24
-- ============================================================================

-- Add all gate attendance columns
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS gate_attendance_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS gate_qr_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS gate_face_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS gate_manual_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS gate_check_in_start TIME DEFAULT '05:00:00',
ADD COLUMN IF NOT EXISTS gate_check_in_end TIME DEFAULT '23:59:59',
ADD COLUMN IF NOT EXISTS gate_late_threshold TIME DEFAULT '07:30:00',
ADD COLUMN IF NOT EXISTS gate_check_out_start TIME DEFAULT '05:00:00',
ADD COLUMN IF NOT EXISTS gate_check_out_end TIME DEFAULT '23:59:59',
ADD COLUMN IF NOT EXISTS gate_notify_parents BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS gate_notify_on_late BOOLEAN DEFAULT true;

-- Add comments
COMMENT ON COLUMN schools.gate_attendance_enabled IS 'Toggle sistem check-in/out di gerbang';
COMMENT ON COLUMN schools.gate_qr_enabled IS 'Izinkan scan QR code';
COMMENT ON COLUMN schools.gate_face_enabled IS 'Izinkan face recognition (future)';
COMMENT ON COLUMN schools.gate_manual_enabled IS 'Izinkan input manual';
COMMENT ON COLUMN schools.gate_check_in_start IS 'Jam mulai check-in';
COMMENT ON COLUMN schools.gate_check_in_end IS 'Jam akhir check-in';
COMMENT ON COLUMN schools.gate_late_threshold IS 'Batas waktu terlambat';
COMMENT ON COLUMN schools.gate_check_out_start IS 'Jam mulai check-out';
COMMENT ON COLUMN schools.gate_check_out_end IS 'Jam akhir check-out';
COMMENT ON COLUMN schools.gate_notify_parents IS 'Notifikasi orang tua saat check-in/out';
COMMENT ON COLUMN schools.gate_notify_on_late IS 'Notifikasi khusus saat terlambat';
```

**Klik tombol "RUN" atau tekan `Ctrl+Enter`**

---

### **LANGKAH 3: Verifikasi Kolom Sudah Ada**

Jalankan query ini untuk cek:

```sql
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'schools' 
AND column_name LIKE 'gate_%'
ORDER BY column_name;
```

**Expected Output (11 rows):**
```
column_name              | data_type | column_default
-------------------------|-----------|---------------
gate_attendance_enabled  | boolean   | false
gate_check_in_end        | time      | '23:59:59'
gate_check_in_start      | time      | '05:00:00'
gate_check_out_end       | time      | '23:59:59'
gate_check_out_start     | time      | '05:00:00'
gate_face_enabled        | boolean   | false
gate_late_threshold      | time      | '07:30:00'
gate_manual_enabled      | boolean   | true
gate_notify_on_late      | boolean   | true
gate_notify_parents      | boolean   | true
gate_qr_enabled          | boolean   | true
```

✅ **Jika muncul 11 rows, BERHASIL!**

---

### **LANGKAH 4: Test di Aplikasi**

1. **Refresh aplikasi** di browser (`Ctrl+F5` atau hard refresh)
2. **Login sebagai Admin**
3. **Buka menu "Kelola Sekolah"** atau "Pengaturan Sekolah"
4. **Klik "+ Tambah Sekolah"** atau **Edit sekolah existing**
5. **Isi form dan klik "Simpan"**

**Expected Result:**
- ✅ Form berhasil disimpan tanpa error
- ✅ Tidak ada error 400 lagi
- ✅ Data sekolah tersimpan di database

---

## 📝 Catatan Penting:

### **Kolom yang Ditambahkan:**

| Kolom | Tipe | Default | Fungsi |
|-------|------|---------|--------|
| `gate_attendance_enabled` | BOOLEAN | false | Toggle utama fitur gate attendance |
| `gate_qr_enabled` | BOOLEAN | true | Izinkan scan QR code |
| `gate_face_enabled` | BOOLEAN | false | Face recognition (belum aktif) |
| `gate_manual_enabled` | BOOLEAN | true | Input manual oleh staff |
| `gate_check_in_start` | TIME | 05:00:00 | Jam mulai check-in |
| `gate_check_in_end` | TIME | 23:59:59 | Jam akhir check-in |
| `gate_late_threshold` | TIME | 07:30:00 | Batas waktu terlambat |
| `gate_check_out_start` | TIME | 05:00:00 | Jam mulai check-out |
| `gate_check_out_end` | TIME | 23:59:59 | Jam akhir check-out |
| `gate_notify_parents` | BOOLEAN | true | Notifikasi orang tua |
| `gate_notify_on_late` | BOOLEAN | true | Notifikasi khusus terlambat |

### **Fitur Gate Attendance (Setelah Migration):**
- ✅ Siswa bisa check-in/out di gerbang sekolah
- ✅ Scan QR code untuk absensi cepat
- ✅ Admin/staff bisa input manual
- ✅ Aturan waktu check-in/out
- ✅ Deteksi keterlambatan otomatis
- ✅ Notifikasi ke orang tua (future)
- 🔄 Face recognition (future feature)

---

## 🚨 Troubleshooting:

### **Jika Masih Error Setelah Migration:**

1. **Clear Supabase Cache:**
   - Di Supabase dashboard, klik **Project Settings** > **API**
   - Scroll bawah, klik **Reset API key** (optional, hati-hati!)
   - Atau tunggu 5-10 menit untuk cache refresh

2. **Refresh Schema Cache:**
   ```sql
   -- Di SQL Editor, jalankan:
   NOTIFY pgrst, 'reload schema';
   ```

3. **Hard Refresh Aplikasi:**
   - `Ctrl+Shift+R` (Windows/Linux)
   - `Cmd+Shift+R` (Mac)
   - Atau close browser dan buka lagi

4. **Check RLS Policies:**
   ```sql
   -- Pastikan ada policy untuk UPDATE schools
   SELECT * FROM pg_policies WHERE tablename = 'schools';
   ```

---

## ✅ Checklist Migration:

- [ ] Buka Supabase SQL Editor
- [ ] Copy & paste SQL migration
- [ ] Klik RUN
- [ ] Lihat "Success" message
- [ ] Jalankan query verifikasi (11 rows muncul)
- [ ] Refresh aplikasi di browser
- [ ] Test form tambah/edit sekolah
- [ ] Berhasil simpan tanpa error

---

## 📞 Butuh Bantuan?

Jika masih error setelah migration:
1. Screenshot error message
2. Screenshot hasil query verifikasi
3. Check browser console (F12)
4. Hubungi developer

---

**© 2024 SIAKAD Fathus Salafi - Database Migration Guide**
