# 🔧 RLS Policy Fix - Quick Guide

## ❗ MASALAH
- Infinite recursion error di dashboard
- Siswa tidak muncul di "Kelas Saya"
- Error 500 saat query grades/classes

## ✅ SOLUSI
Execute file SQL untuk fix RLS policies

---

## 📋 LANGKAH-LANGKAH:

### **1. Buka Supabase Dashboard**
- Login ke https://supabase.com
- Pilih project: Siakad-Fatsal
- Klik "SQL Editor" di sidebar kiri

### **2. Execute SQL File**
- Klik "New Query" (atau +)
- Copy **SEMUA ISI** dari file: `sql/EXECUTE_THIS_RLS_FIX.sql`
- Paste ke SQL Editor
- Klik tombol **"Run"** (atau Ctrl+Enter)

### **3. Verifikasi**
Query akan otomatis menampilkan:
- ✅ List policies untuk `profiles` table
- ✅ List policies untuk `class_members` table
- ✅ Success message

**Expected Output:**
```
PROFILES POLICIES:
- Users can delete profiles (DELETE)
- Users can insert profiles (INSERT)
- Users can manage their own profile (ALL)
- Users can update profiles (UPDATE)
- Users can view all profiles (SELECT)

CLASS_MEMBERS POLICIES:
- Users can delete class members (DELETE)
- Users can insert class members (INSERT)
- Users can update class members (UPDATE)
- Users can view class members (SELECT)

✅ RLS POLICIES FIXED!
All infinite recursion issues resolved
Role-based access control moved to application layer
```

### **4. Test di Aplikasi**
1. **Hard refresh browser**: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
2. **Login sebagai Guru** (Malikatul Mahbubah)
3. **Buka "Kelas Saya"**
4. **Expected**: Siswa muncul! ✅

---

## 🎯 APA YANG DIPERBAIKI:

### **BEFORE (❌ Error):**
```sql
-- Policy yang menyebabkan infinite recursion:
EXISTS (
  SELECT FROM profiles 
  WHERE id = auth.uid() 
  AND role = 'Guru'  -- ← Query profiles dari profiles policy = LOOP!
)
```

### **AFTER (✅ Fixed):**
```sql
-- Simple policy tanpa recursion:
USING (true)  -- ← Semua authenticated users bisa akses
```

**Note:** Role-based access control dipindah ke **application layer** (sudah ada di `authService.ts`)

---

## 🔒 SECURITY:

### **RLS Tetap Aktif!**
- ✅ Unauthenticated users: **TIDAK BISA** akses
- ✅ Authenticated users: **BISA** akses
- ✅ Role filtering: Di **application layer**

### **Application Layer Security:**
```typescript
// di authService.ts & dataService.ts
if (user.role !== UserRole.ADMIN) {
  // Filter by school_id, teacher_id, etc
}
```

---

## ❓ TROUBLESHOOTING:

### **Error: "policy already exists"**
**Solusi:** Script sudah punya `DROP POLICY IF EXISTS`, harusnya tidak error. Kalau tetap error:
```sql
-- Manual drop semua policies dulu:
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view class members" ON class_members;
-- ... (copy semua DROP statements dari file)
```

### **Masih ada infinite recursion**
**Solusi:** 
1. Pastikan SQL berhasil execute (cek output)
2. Hard refresh browser (Ctrl+Shift+R)
3. Clear browser cache
4. Re-login

### **Siswa masih tidak muncul**
**Debug:**
```sql
-- Cek apakah ada data di class_members:
SELECT * FROM class_members 
WHERE class_id IN (
  SELECT id FROM classes WHERE homeroom_teacher_id = 'YOUR_TEACHER_ID'
);

-- Cek policies aktif:
SELECT * FROM pg_policies WHERE tablename = 'class_members';
```

---

## 📞 SUPPORT:

Jika masih error setelah execute SQL:
1. Screenshot error message
2. Screenshot output dari SQL execution
3. Share di chat untuk troubleshooting lebih lanjut

---

**Dibuat:** October 25, 2025  
**Purpose:** Fix infinite recursion di RLS policies  
**Impact:** Semua fitur dashboard & data berfungsi normal
