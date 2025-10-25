# 🚨 PENTING: Yang Harus Dilakukan User

## ⚠️ SQL Fix Belum Dijalankan!

Agar fitur-fitur baru berfungsi dengan baik, user **HARUS** menjalankan SQL fix terlebih dahulu.

---

## 📋 Checklist Sebelum Testing

### 1. ✅ Jalankan SQL Fix di Supabase

**File**: `sql/EXECUTE_THIS_RLS_FIX.sql`
**Panduan**: Baca `sql/RLS_FIX_README.md`

#### Langkah Singkat:
1. Buka Supabase Dashboard
2. Pilih project Siakad-Fatsal
3. Masuk ke **SQL Editor**
4. Copy-paste isi `EXECUTE_THIS_RLS_FIX.sql`
5. Klik **RUN**
6. Tunggu hingga selesai (ada pesan sukses di akhir)

**Tanpa ini, data tidak akan muncul karena RLS policies masih blocking!**

---

### 2. ✅ Isi Data Master (Jika Belum Ada)

Agar fitur siswa berfungsi, pastikan sudah ada data:

#### a. **Sekolah (schools)**
```sql
-- Login sebagai Admin/Foundation Head
-- Masuk ke "Kelola Sekolah" → Tambah sekolah
```

#### b. **Kelas (classes)**
```sql
-- Login sebagai Admin/Staff
-- Masuk ke "Kelola Kelas" → Tambah kelas
```

#### c. **Mata Pelajaran (subjects)**
```sql
-- Login sebagai Admin/Staff
-- Masuk ke "Kelola Mata Pelajaran" → Tambah mapel
```

#### d. **Jadwal Pelajaran (class_schedules)**
```sql
-- Login sebagai Admin/Staff
-- Masuk ke "Kelola Jadwal" → Tambah jadwal
-- Atau login sebagai Guru → "Jadwal Saya" (read-only)
```

#### e. **Siswa & Keanggotaan Kelas (profiles + class_members)**
```sql
-- Login sebagai Admin/Staff
-- Masuk ke "Kelola Pengguna" → Tambah siswa
-- Jangan lupa assign ke kelas!
```

#### f. **Nilai (grades)**
```sql
-- Login sebagai Guru
-- Masuk ke "Input Nilai" → Pilih kelas → Input nilai siswa
```

#### g. **Absensi (attendances)**
```sql
-- Login sebagai Guru
-- Masuk ke "Input Absensi" → Pilih kelas → Input kehadiran
```

---

### 3. ✅ Testing Login Sebagai Siswa

Setelah data ada, login sebagai siswa dan cek:

#### Dashboard Siswa
- ✅ Nilai rata-rata muncul (dari tabel grades)
- ✅ Kehadiran muncul (dari tabel attendances)
- ✅ **Jadwal hari ini** muncul (dari tabel class_schedules)
- ✅ Nilai terbaru muncul
- ✅ Statistik absensi benar

#### Lihat Nilai
- ✅ Tabel nilai muncul (bukan dummy)
- ✅ Filter semester berfungsi
- ✅ Rata-rata, tertinggi, terendah benar

#### Jadwal Pelajaran
- ✅ Jadwal seminggu muncul (bukan dummy)
- ✅ Filter per hari berfungsi
- ✅ Mata pelajaran, guru, ruangan benar

---

## 🔍 Troubleshooting

### Masalah: "Tidak ada jadwal hari ini"

**Kemungkinan:**
1. Siswa belum di-assign ke kelas → Cek di "Kelola Pengguna"
2. Kelas belum punya jadwal → Tambah di "Kelola Jadwal"
3. Hari ini bukan hari sekolah (Sabtu/Minggu) → Normal

**Solusi:**
```sql
-- Cek apakah siswa punya kelas
SELECT * FROM class_members WHERE profile_id = 'ID_SISWA';

-- Cek apakah kelas punya jadwal
SELECT * FROM class_schedules WHERE class_id = 'ID_KELAS';
```

---

### Masalah: "Belum ada nilai"

**Kemungkinan:**
1. Guru belum input nilai
2. Semester tidak match dengan filter

**Solusi:**
- Login sebagai Guru → Input Nilai
- Atau coba ganti filter semester di halaman Nilai

---

### Masalah: "Data masih kosong semua"

**Kemungkinan:**
1. **RLS policies belum di-fix** ← PALING SERING!
2. User belum punya data

**Solusi:**
1. Jalankan `EXECUTE_THIS_RLS_FIX.sql` di Supabase
2. Check console browser (F12) → Lihat error di Network/Console
3. Baca error message untuk debugging

---

### Masalah: Build Error

**Kemungkinan:**
- npm install belum dijalankan
- Dependency version conflict

**Solusi:**
```bash
npm install
npm run build
```

Jika masih error, hapus node_modules dan reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📊 Urutan Testing yang Benar

### Phase 1: Setup Database (Admin/Staff)
1. ✅ Jalankan SQL fix
2. ✅ Tambah sekolah
3. ✅ Tambah kelas
4. ✅ Tambah mata pelajaran
5. ✅ Tambah jadwal pelajaran
6. ✅ Tambah siswa dan assign ke kelas

### Phase 2: Input Data (Guru)
7. ✅ Login sebagai guru
8. ✅ Input nilai siswa
9. ✅ Input absensi siswa

### Phase 3: Lihat Hasil (Siswa)
10. ✅ Login sebagai siswa
11. ✅ Cek dashboard
12. ✅ Cek lihat nilai
13. ✅ Cek jadwal pelajaran

---

## 🎯 Expected Results

Jika semua benar, siswa akan melihat:

### Dashboard
```
┌─────────────────────────────────────┐
│ Nilai Rata-rata: 87.5               │
│ Kehadiran: 95%                      │
│ Mata Pelajaran: 6                   │
│ Total Nilai: 6                      │
└─────────────────────────────────────┘

Jadwal Hari Ini:
• 07:00 - 08:30 | Matematika | Pak Ahmad
• 08:30 - 09:15 | IPA | Bu Siti
• 09:30 - 10:15 | Bahasa Indonesia | Pak Budi
```

### Lihat Nilai
```
┌──────────────────┬───────┬────────┐
│ Mata Pelajaran   │ Nilai │ Grade  │
├──────────────────┼───────┼────────┤
│ Matematika       │ 87.5  │ A      │
│ IPA              │ 92.0  │ A      │
│ Bahasa Indonesia │ 85.0  │ A-     │
└──────────────────┴───────┴────────┘
```

### Jadwal Pelajaran
```
Senin:
• 07:00 - 08:30 | Matematika | Pak Ahmad | Kelas 7A
• 08:30 - 09:15 | IPA | Bu Siti | Lab IPA

Selasa:
• 07:00 - 08:30 | Bahasa Inggris | Miss Linda | Kelas 7A
...
```

---

## ✅ Quick Checklist

Centang jika sudah selesai:

- [ ] SQL fix sudah dijalankan di Supabase
- [ ] Sekolah sudah ditambahkan
- [ ] Kelas sudah ditambahkan
- [ ] Mata pelajaran sudah ditambahkan
- [ ] Jadwal pelajaran sudah ditambahkan
- [ ] Siswa sudah ditambahkan dan di-assign ke kelas
- [ ] Nilai sudah di-input (oleh guru)
- [ ] Absensi sudah di-input (oleh guru)
- [ ] Login sebagai siswa dan cek semua fitur
- [ ] Dashboard siswa menampilkan data real
- [ ] Lihat nilai menampilkan data real (bukan dummy)
- [ ] Jadwal pelajaran menampilkan data real (bukan dummy)

---

## 🚀 Deployment

Kode sudah di-push ke GitHub:
- Commit: `685c7bc`
- Branch: `main`

Jika deploy otomatis (Vercel/Netlify), tunggu beberapa menit hingga deployment selesai.

---

## 📞 Jika Ada Masalah

1. Cek console browser (F12) untuk error
2. Cek Network tab untuk failed requests
3. Cek Supabase logs untuk RLS policy errors
4. Screenshot error dan tanyakan ke developer

---

**INGAT: SQL fix adalah langkah PERTAMA dan WAJIB!** 🔴
