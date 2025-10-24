# Gate Attendance System - Phase 1 Implementation

## 📋 Overview

Sistem Absensi Gerbang adalah fitur untuk memantau keluar-masuk siswa di gerbang sekolah. Sistem ini terpisah dari absensi kelas dan berfungsi sebagai **monitoring kedatangan dan kepulangan siswa**.

## ✨ Features Implemented (Phase 1)

### 1. QR Code System
- **Setiap siswa** memiliki QR code unik
- Format QR: `GATE:STUDENT_ID:IDENTITY_NUMBER`
- QR code dapat di-scan oleh petugas gerbang (future: hardware scanner)
- QR code dapat ditampilkan di halaman khusus siswa

### 2. Manual Input
- Admin/Staff dapat melakukan check-in/out manual
- Berguna jika QR code tidak bisa di-scan
- Ada tombol check-in dan check-out per siswa

### 3. Status Tracking
- **inside_school**: Siswa sudah check-in dan belum check-out
- **outside_school**: Siswa sudah check-out (pulang)
- **not_arrived**: Siswa belum check-in hari ini

### 4. Real-time Statistics
- Total siswa
- Sudah check-in
- Masih di sekolah
- Sudah pulang
- Belum datang

## 🗄️ Database Schema

### Table: `gate_attendance`
```sql
CREATE TABLE gate_attendance (
  id SERIAL PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id),
  school_id UUID REFERENCES schools(id),
  date DATE NOT NULL,
  check_in_time TIMESTAMPTZ,
  check_in_method TEXT CHECK (check_in_method IN ('QR', 'Face', 'Manual')),
  check_in_by UUID REFERENCES auth.users(id),
  check_out_time TIMESTAMPTZ,
  check_out_method TEXT CHECK (check_out_method IN ('QR', 'Face', 'Manual')),
  check_out_by UUID REFERENCES auth.users(id),
  status TEXT CHECK (status IN ('inside_school', 'outside_school')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, school_id, date)
);
```

### Table: `schools` (New Columns)
```sql
ALTER TABLE schools ADD COLUMN gate_attendance_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE schools ADD COLUMN gate_qr_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE schools ADD COLUMN gate_face_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE schools ADD COLUMN gate_manual_enabled BOOLEAN DEFAULT TRUE;
```

### Function: `get_gate_attendance_summary`
```sql
CREATE OR REPLACE FUNCTION get_gate_attendance_summary(
  school_id_param UUID,
  date_param DATE
) RETURNS TABLE (
  total_students BIGINT,
  checked_in BIGINT,
  inside_now BIGINT,
  checked_out BIGINT,
  not_arrived BIGINT
)
```

## 🔐 RLS Policies

1. **Students**: Can view own gate attendance records
2. **Admin**: Full access to all records
3. **Staff**: View and insert records for their school
4. **Principal**: View records for their school
5. **Kepala Yayasan**: View all records across schools

## 📱 User Interface

### For Admin/Staff: `/absensi-gerbang`
- Dashboard with summary statistics
- Real-time student list with check-in/out status
- Manual check-in/out buttons
- Search and filter functionality
- Status indicators (Di Sekolah, Sudah Pulang, Belum Datang)

### For Students: `/qr-gerbang`
- Display personal QR code (256x256px)
- Today's check-in/out status
- Check-in/out history (last 7 days)
- Instructions on how to use QR code

### School Settings
- Toggle gate attendance on/off
- Enable/disable QR scanning
- Enable/disable face recognition (future)
- Enable/disable manual input

## 🛠️ Installation Steps

### 1. Run Database Migration
```bash
# Navigate to Supabase SQL Editor
# Copy and paste contents of sql/migrations/ADD_GATE_ATTENDANCE.sql
# Execute the SQL
```

### 2. Install Dependencies
```bash
npm install react-qr-code
```

### 3. Enable Gate Attendance
1. Login as Admin
2. Go to "Kelola Sekolah"
3. Edit school settings
4. Enable "Absensi Gerbang"
5. Select methods: QR, Manual

## 🚀 Usage Flow

### Admin/Staff Workflow
1. Access `/absensi-gerbang`
2. View daily summary and student list
3. Manual check-in: Click "Check-in" button for student
4. Manual check-out: Click "Check-out" button for student who is inside school
5. Use filters to find specific students

### Student Workflow
1. Access `/qr-gerbang`
2. Show QR code to gate officer
3. Officer scans QR (currently manual input, hardware scanner coming)
4. Check status on the same page

## 📊 API Endpoints

### Supabase Direct Queries
- `SELECT * FROM gate_attendance WHERE student_id = $1 AND date = $2`
- `INSERT INTO gate_attendance (...) VALUES (...)`
- `UPDATE gate_attendance SET check_out_time = $1 WHERE id = $2`

### RPC Function
```javascript
const { data } = await supabase.rpc('get_gate_attendance_summary', {
  school_id_param: schoolId,
  date_param: '2024-01-15'
});
```

## 🔄 Phase 2 (Coming Soon)

- **Hardware QR Scanner Integration**
- **Face Recognition System**
- **Parent Notifications** (push notification when check-in/out)
- **Late Arrival Tracking** (if check-in after 07:30)
- **Export to Excel** (daily/monthly reports)
- **Analytics Dashboard** (attendance trends, late patterns)

## 🐛 Known Issues

1. **QR Scanner**: Currently manual only, need hardware scanner device
2. **Face Recognition**: Not yet implemented
3. **Notifications**: Not yet integrated

## 📝 Notes

- One record per student per day (enforced by UNIQUE constraint)
- Check-out is optional (status remains `inside_school` if not checked out)
- Admin can add notes to any record
- Timestamps are in TIMESTAMPTZ (timezone-aware)
- School-level feature toggles allow flexibility

## 🤝 Contributing

To add new features:
1. Update `types.ts` if needed
2. Update database schema in `sql/migrations/`
3. Update UI components
4. Update RLS policies
5. Test with different roles
6. Update this README

## 📞 Support

For issues or questions:
- WhatsApp: +6285157288473
- GitHub Issues: [Create Issue](link-to-repo)
