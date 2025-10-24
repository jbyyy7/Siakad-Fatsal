# Fitur Location-Based Attendance (Geofencing)

## Overview
Fitur ini menambahkan validasi lokasi berbasis GPS untuk sistem absensi, memastikan bahwa guru, staff, dan kepala sekolah hanya dapat melakukan absensi ketika berada di lokasi sekolah yang ditentukan.

**Note:** Fitur ini dapat diaktifkan atau dinonaktifkan per sekolah melalui pengaturan admin.

## Fitur Utama

### 1. **Geofencing untuk Sekolah**
- Setiap sekolah dapat mengatur lokasi koordinat GPS (latitude, longitude)
- Menentukan radius geofencing (50m - 500m)
- Nama lokasi untuk identifikasi
- **Toggle Enable/Disable:** Admin dapat mengaktifkan atau menonaktifkan fitur location-based attendance per sekolah
- **Default Location:** Lokasi default (-7.653938, 114.042504) dapat digunakan dengan satu klik

### 2. **Absensi Guru/Staff dengan Validasi Lokasi**
- Check-in dan check-out dengan validasi lokasi real-time (jika fitur diaktifkan)
- Sistem menolak absensi jika user berada di luar radius yang ditentukan
- Mencatat lokasi aktual saat absen (latitude, longitude, nama lokasi)
- Status absensi: Hadir, Sakit, Izin
- Status lokasi hanya ditampilkan jika fitur location attendance diaktifkan

### 3. **Absensi Siswa oleh Guru dengan Validasi Lokasi**
- Guru harus berada di lokasi sekolah untuk mengabsenkan siswa (jika fitur diaktifkan)
- Lokasi guru saat mengabsen siswa dicatat
- Validasi real-time sebelum menyimpan data absensi
- Alert lokasi hanya muncul jika fitur diaktifkan

### 4. **Jadwal Pelajaran (Class Schedule)**
- Mendukung validasi waktu untuk absensi
- Menentukan jam pelajaran per mata pelajaran
- Validasi hari dan waktu

## Database Changes

### Tables Modified:
1. **schools**
   - `latitude` (NUMERIC): Latitude lokasi sekolah
   - `longitude` (NUMERIC): Longitude lokasi sekolah
   - `location_name` (TEXT): Nama lokasi
   - `radius` (INTEGER): Radius geofencing dalam meter (default: 100m)
   - `location_attendance_enabled` (BOOLEAN): Toggle untuk mengaktifkan/menonaktifkan fitur (default: false)

2. **teacher_attendance**
   - `latitude` (NUMERIC): Lokasi guru saat check-in/out
   - `longitude` (NUMERIC): Lokasi guru saat check-in/out
   - `location_name` (TEXT): Nama lokasi saat absen

3. **attendances** (student attendance)
   - `teacher_latitude` (NUMERIC): Lokasi guru saat mengabsen siswa
   - `teacher_longitude` (NUMERIC): Lokasi guru saat mengabsen siswa
   - `teacher_location_name` (TEXT): Nama lokasi guru

4. **class_schedules** (NEW TABLE)
   - `id` (UUID): Primary key
   - `class_id` (UUID): Reference ke classes
   - `subject_id` (UUID): Reference ke subjects
   - `teacher_id` (UUID): Reference ke profiles
   - `day_of_week` (INTEGER): Hari (0=Minggu, 6=Sabtu)
   - `start_time` (TIME): Jam mulai
   - `end_time` (TIME): Jam selesai
   - `room` (TEXT): Nama ruangan

## Migration

Jalankan migration SQL:
```sql
\i sql/migrations/ADD_LOCATION_FIELDS.sql
```

## Admin Configuration

### Mengaktifkan/Menonaktifkan Fitur Location Attendance

1. **Di SchoolForm (Manage Schools Page):**
   - Toggle switch "Aktifkan Absensi Berbasis Lokasi" untuk enable/disable
   - Ketika toggle ON (hijau), field lokasi akan muncul
   - Ketika toggle OFF (merah), field lokasi tersembunyi dan validasi lokasi dinonaktifkan
   
2. **Tombol Lokasi:**
   - **"Gunakan Lokasi Default"**: Mengisi dengan koordinat default (-7.653938, 114.042504)
   - **"Lokasi GPS Saat Ini"**: Menggunakan lokasi browser saat ini

3. **Behavior:**
   - Jika `location_attendance_enabled = false`: 
     - Tidak ada validasi lokasi
     - Status lokasi tidak ditampilkan
     - Check-in/out dapat dilakukan dari mana saja
   - Jika `location_attendance_enabled = true`:
     - Validasi lokasi aktif
     - Status lokasi ditampilkan
     - Check-in/out hanya bisa di dalam radius sekolah

## Komponen Baru

### 1. **TeacherSelfAttendancePage**
Halaman untuk guru/staff melakukan absensi diri sendiri.

**Features:**
- Real-time location detection
- Location validation dengan visual feedback (hanya jika diaktifkan)
- Check-in/Check-out dengan timestamp
- Status: Hadir, Sakit, Izin
- Menampilkan status lokasi (dalam/luar jangkauan) hanya jika `locationAttendanceEnabled = true`
- Menampilkan jarak dari sekolah
- Button check-in hanya disabled oleh lokasi jika fitur diaktifkan

**Usage:**
```tsx
import TeacherSelfAttendancePage from './components/pages/TeacherSelfAttendancePage';

<TeacherSelfAttendancePage user={currentUser} />
```

### 2. **SchoolForm (Updated)**
Form untuk mengatur sekolah dengan lokasi geofencing.

**New Features:**
- Tombol "Gunakan Lokasi Saat Ini" untuk auto-fill koordinat
- Input manual untuk latitude/longitude
- Slider untuk mengatur radius geofencing (50m - 500m)
- Preview jarak radius dalam format yang mudah dibaca

### 3. **StudentAttendancePage (Updated)**
Halaman absensi siswa dengan validasi lokasi guru.

**New Features:**
- Validasi lokasi guru sebelum menyimpan absensi
- Alert visual untuk status lokasi (hijau/kuning/merah)
- Menampilkan jarak guru dari sekolah
- Mencegah penyimpanan jika guru di luar jangkauan

## Utilities

### geolocation.ts
Helper functions untuk geolocation:

- `getCurrentLocation()`: Mendapatkan lokasi user saat ini
- `calculateDistance()`: Menghitung jarak antara 2 koordinat (Haversine formula)
- `validateLocation()`: Validasi apakah user dalam radius yang diizinkan
- `formatDistance()`: Format jarak untuk display (meter/km)
- `isWithinScheduleTime()`: Cek apakah waktu saat ini dalam jadwal
- `getCurrentDayOfWeek()`: Mendapatkan hari saat ini (0-6)

## Permission Requirements

### Browser Permissions
Aplikasi memerlukan izin "Geolocation" dari browser user untuk mengakses lokasi GPS.

**Handling Permission Denied:**
```typescript
try {
  const coords = await getCurrentLocation();
  // Use coordinates
} catch (error) {
  // Show error message to user
  toast.error('Izin lokasi ditolak. Mohon aktifkan izin lokasi di browser Anda.');
}
```

## Security Considerations

1. **Location Privacy**
   - Lokasi hanya dicatat saat absensi
   - Data lokasi disimpan dengan enkripsi di database
   - Akses data lokasi dibatasi sesuai role

2. **Validation**
   - Server-side validation untuk mencegah spoofing
   - Rate limiting untuk API geolocation
   - RLS policies untuk akses data

3. **Accuracy**
   - GPS accuracy: high (enableHighAccuracy: true)
   - Timeout: 10 detik
   - MaximumAge: 0 (selalu fresh)

## Testing

### Manual Testing:
1. **Set lokasi sekolah:**
   - Login sebagai Admin
   - Buka Manajemen Sekolah
   - Edit sekolah
   - Klik "Gunakan Lokasi Saat Ini" atau input manual
   - Set radius (misal: 100m)
   - Simpan

2. **Test absensi guru:**
   - Login sebagai Guru
   - Buka halaman "Absensi Saya"
   - Periksa status lokasi
   - Coba check-in (dalam/luar radius)

3. **Test absensi siswa:**
   - Login sebagai Guru
   - Buka halaman "Absensi Siswa"
   - Pilih kelas dan mata pelajaran
   - Periksa alert lokasi
   - Coba simpan absensi

## Future Enhancements

1. **Schedule-based Validation**
   - Auto-validate berdasarkan jadwal pelajaran
   - Hanya izinkan absensi pada jam pelajaran

2. **Multiple Locations**
   - Support multiple kampus/cabang
   - Geo-routing ke lokasi terdekat

3. **Offline Support**
   - Queue absensi saat offline
   - Sync ketika online kembali

4. **Advanced Analytics**
   - Heatmap kehadiran guru
   - Pattern analysis untuk keterlambatan
   - Location history tracking

5. **Integration dengan Maps**
   - Tampilkan peta lokasi sekolah
   - Visualisasi radius geofencing
   - Directions ke sekolah

## Troubleshooting

### Location Not Available
**Problem:** Browser tidak dapat mengakses GPS
**Solution:**
- Pastikan HTTPS enabled (geolocation hanya works di HTTPS)
- Check browser permissions
- Pastikan device memiliki GPS/Location services enabled

### Location Inaccurate
**Problem:** Jarak yang dihitung tidak akurat
**Solution:**
- Tunggu beberapa detik untuk GPS lock
- Gunakan di outdoor untuk signal GPS lebih baik
- Increase radius jika lokasi GPS sering meleset

### Permission Denied
**Problem:** User menolak izin lokasi
**Solution:**
- Jelaskan ke user mengapa izin lokasi diperlukan
- Berikan instruksi cara enable permission di browser
- Fallback: Allow manual absensi dengan approval dari admin
