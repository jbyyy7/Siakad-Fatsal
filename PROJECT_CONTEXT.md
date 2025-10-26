# PROJECT CONTEXT: Yayasan Fathus Salafi - Multi-System Ecosystem

## 🏢 System Overview

Project ini adalah bagian dari **ekosistem Yayasan Fathus Salafi** yang terdiri dari 3 sistem terpisah dengan shared authentication:

### 1. **Website Utama** (Landing Page & PPDB)
- **Domain:** `yayasan-fatsal.com`
- **Repository:** [TBD - Will be created]
- **Purpose:** 
  - Landing page yayasan
  - Informasi sekolah-sekolah
  - Berita & pengumuman
  - PPDB (Penerimaan Peserta Didik Baru) online
  - Kontak & lokasi
- **Tech Stack:** Next.js 14, Tailwind CSS, Supabase

### 2. **SIAKAD** (Sistem Informasi Akademik) ✅ EXISTING
- **Domain:** `siakad.yayasan-fatsal.com`
- **Repository:** https://github.com/jbyyy7/Siakad-Fatsal
- **Purpose:**
  - Manajemen pengguna (Admin, Staff, Teacher, Student)
  - Manajemen sekolah & kelas
  - Jadwal pelajaran
  - Input & view nilai
  - Absensi siswa & guru
  - Laporan & export
- **Tech Stack:** React + Vite, Tailwind CSS, Supabase

### 3. **LMS** (Learning Management System)
- **Domain:** `lms.yayasan-fatsal.com`
- **Repository:** [TBD - Will be created]
- **Purpose:**
  - Materi pembelajaran (video, PDF, dokumen)
  - Tugas online
  - Kuis & ujian online
  - Forum diskusi
  - Progress tracking
  - Sertifikat
- **Tech Stack:** Next.js 14, Tailwind CSS, Supabase, Video.js

---

## 🔐 SHARED AUTHENTICATION - CRITICAL!

**⚠️ SEMUA PROJECT MENGGUNAKAN SUPABASE AUTH YANG SAMA!**

### Supabase Configuration

```typescript
// lib/supabase.ts (Standard untuk semua project)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For admin operations only (server-side)
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

### Environment Variables

```env
# Shared across all projects
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]

# Server-side only (for admin operations like creating users)
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY]

# Project-specific
NEXT_PUBLIC_SITE_URL=https://[subdomain].yayasan-fatsal.com
```

### Single Sign-On (SSO) Behavior

**Konsep:**
- User login di **satu sistem** → otomatis login di **semua sistem**
- Session tersinkronisasi via JWT token
- Logout di satu sistem → logout di semua sistem

**Implementasi:**
```typescript
// Login (sama di semua project)
const { data, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password,
})

if (error) {
  console.error('Login failed:', error.message)
  return
}

// User authenticated! Redirect to dashboard
router.push('/dashboard')
```

```typescript
// Logout (sama di semua project)
const { error } = await supabase.auth.signOut()

if (!error) {
  router.push('/login')
}
```

```typescript
// Get current user (sama di semua project)
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  // Not authenticated
  router.push('/login')
}
```

### User Roles & Permissions

```typescript
type UserRole = 
  | 'Admin'           // Super admin yayasan (full access semua)
  | 'Foundation Head' // Kepala yayasan (read-only semua sekolah)
  | 'Principal'       // Kepala sekolah (full access 1 sekolah)
  | 'Staff'           // Staf administrasi (input data, laporan)
  | 'Teacher'         // Guru (input nilai, absensi, materi LMS)
  | 'Student'         // Siswa (view nilai, jadwal, materi)

// Role-based access example
const hasPermission = (userRole: UserRole, action: string) => {
  const permissions = {
    'Admin': ['*'],
    'Foundation Head': ['view:all'],
    'Principal': ['manage:school'],
    'Staff': ['input:data', 'view:reports'],
    'Teacher': ['input:grades', 'input:attendance', 'manage:courses'],
    'Student': ['view:grades', 'view:schedule', 'view:courses'],
  }
  
  return permissions[userRole]?.includes(action) || permissions[userRole]?.includes('*')
}
```

---

## 🗄️ DATABASE SCHEMA - SHARED TABLES

### Core Tables (Used by ALL systems)

#### 1. **profiles** (User Data)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  identity_number TEXT,        -- NISN untuk siswa, NIP untuk guru/staff
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Foundation Head', 'Principal', 'Staff', 'Teacher', 'Student')),
  school_id UUID REFERENCES schools(id),
  
  -- Student specific fields
  place_of_birth TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('L', 'P')),
  religion TEXT,
  address TEXT,
  phone_number TEXT,
  parent_name TEXT,
  parent_phone_number TEXT,
  
  -- Teacher specific fields
  subject_ids UUID[],           -- Array of subject IDs yang diajar
  
  -- Common fields
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_school_id ON profiles(school_id);
CREATE INDEX idx_profiles_email ON profiles(email);

-- RLS Policies (simplified)
CREATE POLICY "Users can view all profiles" 
  ON profiles FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);
```

**⚠️ IMPORTANT:**
- `profiles.id` = `auth.users.id` (same UUID!)
- Jangan buat tabel `users` sendiri
- Semua relasi ke user pakai `profile_id` atau `user_id` yang refer ke `profiles.id`

#### 2. **schools** (Sekolah)
```sql
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,                    -- e.g., "MA Fathus Salafi"
  level TEXT NOT NULL CHECK (level IN ('MA', 'MTs', 'MI', 'RA', 'TK')),
  address TEXT,
  
  -- Location-based attendance (optional)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_name TEXT,
  radius INTEGER DEFAULT 100,            -- meters
  location_attendance_enabled BOOLEAN DEFAULT FALSE,
  
  -- Gate attendance (optional)
  gate_attendance_enabled BOOLEAN DEFAULT FALSE,
  gate_qr_enabled BOOLEAN DEFAULT TRUE,
  gate_face_enabled BOOLEAN DEFAULT FALSE,
  gate_manual_enabled BOOLEAN DEFAULT TRUE,
  gate_check_in_start TIME DEFAULT '05:00:00',
  gate_check_in_end TIME DEFAULT '23:59:59',
  gate_late_threshold TIME DEFAULT '07:30:00',
  gate_check_out_start TIME DEFAULT '05:00:00',
  gate_check_out_end TIME DEFAULT '23:59:59',
  gate_notify_parents BOOLEAN DEFAULT TRUE,
  gate_notify_on_late BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
CREATE POLICY "Anyone can view schools" 
  ON schools FOR SELECT 
  USING (true);
```

#### 3. **classes** (Kelas)
```sql
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- e.g., "VII-A", "X-IPA-1"
  level TEXT,                            -- e.g., "7", "10"
  homeroom_teacher_id UUID REFERENCES profiles(id),
  academic_year TEXT NOT NULL,           -- e.g., "2024/2025"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(school_id, name, academic_year)
);

-- Indexes
CREATE INDEX idx_classes_school_id ON classes(school_id);
CREATE INDEX idx_classes_homeroom_teacher ON classes(homeroom_teacher_id);

-- RLS
CREATE POLICY "Authenticated users can view classes" 
  ON classes FOR SELECT 
  USING (auth.uid() IS NOT NULL);
```

#### 4. **subjects** (Mata Pelajaran)
```sql
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- e.g., "Matematika", "Fisika"
  code TEXT,                             -- e.g., "MAT", "FIS"
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(school_id, name)
);

-- Indexes
CREATE INDEX idx_subjects_school_id ON subjects(school_id);

-- RLS
CREATE POLICY "Authenticated users can view subjects" 
  ON subjects FOR SELECT 
  USING (auth.uid() IS NOT NULL);
```

#### 5. **class_members** (Relasi Siswa/Guru ke Kelas)
```sql
CREATE TABLE class_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(class_id, profile_id, role)
);

-- Indexes
CREATE INDEX idx_class_members_class_id ON class_members(class_id);
CREATE INDEX idx_class_members_profile_id ON class_members(profile_id);

-- RLS
CREATE POLICY "Authenticated users can view class members" 
  ON class_members FOR SELECT 
  USING (auth.uid() IS NOT NULL);
```

---

## 📊 SYSTEM-SPECIFIC TABLES

### SIAKAD Tables (Already in database)

- `class_schedules` - Jadwal pelajaran
- `grades` - Nilai siswa
- `attendances` - Absensi siswa
- `teacher_attendances` - Absensi guru
- `teaching_journals` - Jurnal mengajar
- `announcements` - Pengumuman

### Website Tables (Will be created)

- `news` - Berita & artikel
- `ppdb_registrations` - Pendaftaran siswa baru
- `galleries` - Galeri foto/video
- `contact_messages` - Pesan dari form kontak

### LMS Tables (Will be created)

- `courses` - Kursus/mata pelajaran online
- `modules` - Modul/bab per kursus
- `lessons` - Materi pembelajaran (video, dokumen, teks)
- `enrollments` - Pendaftaran siswa ke kursus
- `lesson_progress` - Progress belajar siswa
- `assignments` - Tugas
- `submissions` - Pengumpulan tugas
- `quizzes` - Kuis/ujian
- `quiz_questions` - Soal kuis
- `quiz_attempts` - Percobaan kuis siswa
- `discussions` - Forum diskusi
- `announcements` - Pengumuman kursus

---

## 🔄 PPDB AUTO-ACCOUNT CREATION FLOW

**Alur lengkap dari pendaftaran hingga akun aktif:**

### 1. User Mengisi Form PPDB (Website Utama)

```typescript
// app/ppdb/daftar/page.tsx
const handleSubmit = async (data: PPDBFormData) => {
  const { error } = await supabase
    .from('ppdb_registrations')
    .insert({
      registration_number: generateRegistrationNumber(), // Auto: "PPDB-2024-001"
      school_id: data.schoolId,
      student_name: data.studentName,
      parent_email: data.parentEmail,
      status: 'pending',
      // ... other fields
    })
  
  if (!error) {
    // Send confirmation email with registration number
    await sendConfirmationEmail(data.parentEmail, registrationNumber)
  }
}
```

### 2. Admin Review & Terima Pendaftaran

```typescript
// app/admin/ppdb/[id]/page.tsx
const acceptRegistration = async (registrationId: string) => {
  // Call API endpoint
  const response = await fetch('/api/ppdb/accept', {
    method: 'POST',
    body: JSON.stringify({ registrationId }),
  })
  
  if (response.ok) {
    alert('Siswa diterima dan akun berhasil dibuat!')
  }
}
```

### 3. API Auto-Create Account (Server-side)

```typescript
// app/api/ppdb/accept/route.ts
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  const { registrationId } = await req.json()
  
  // 1. Get registration data
  const { data: registration } = await supabaseAdmin
    .from('ppdb_registrations')
    .select('*')
    .eq('id', registrationId)
    .single()
  
  // 2. Generate secure password
  const password = generateSecurePassword() // e.g., "Fatsal2024!Xyz789"
  
  // 3. Create Supabase Auth user
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: registration.parent_email,
    password: password,
    email_confirm: true,  // Auto-confirm, skip verification email
    user_metadata: {
      full_name: registration.student_name,
      registration_number: registration.registration_number,
    }
  })
  
  if (authError) {
    return Response.json({ error: authError.message }, { status: 500 })
  }
  
  // 4. Insert to profiles table
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: authUser.user.id,  // ← SAME as auth.users.id!
      email: registration.parent_email,
      full_name: registration.student_name,
      identity_number: registration.student_nisn,
      role: 'Student',
      school_id: registration.school_id,
      place_of_birth: registration.place_of_birth,
      date_of_birth: registration.date_of_birth,
      gender: registration.gender,
      religion: registration.religion,
      address: registration.address,
      phone_number: registration.phone_number,
      parent_name: registration.parent_name,
      parent_phone_number: registration.parent_phone,
    })
  
  if (profileError) {
    return Response.json({ error: profileError.message }, { status: 500 })
  }
  
  // 5. Update registration status
  await supabaseAdmin
    .from('ppdb_registrations')
    .update({
      status: 'accepted',
      verified_at: new Date().toISOString(),
    })
    .eq('id', registrationId)
  
  // 6. Send welcome email with credentials
  await sendWelcomeEmail({
    to: registration.parent_email,
    studentName: registration.student_name,
    email: registration.parent_email,
    password: password,
    siakadUrl: 'https://siakad.yayasan-fatsal.com',
    lmsUrl: 'https://lms.yayasan-fatsal.com',
  })
  
  return Response.json({ 
    success: true,
    message: 'Account created successfully',
    userId: authUser.user.id 
  })
}

function generateSecurePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let password = 'Fatsal2024!'
  for (let i = 0; i < 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}
```

### 4. User Login ke SIAKAD/LMS

```typescript
// User menerima email dengan credentials
// Email: parent@email.com
// Password: Fatsal2024!Xyz789

// Login di SIAKAD atau LMS (sama saja)
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'parent@email.com',
  password: 'Fatsal2024!Xyz789',
})

// Success! User bisa akses semua sistem
```

---

## 🎨 UI/UX STANDARDS

### Tech Stack (Consistent across all projects)

```json
{
  "framework": "Next.js 14 (App Router)",
  "styling": "Tailwind CSS",
  "components": "shadcn/ui (optional but recommended)",
  "icons": "Lucide React or custom SVG",
  "forms": "React Hook Form + Zod",
  "state": "React useState/useContext (no Redux needed)",
  "api": "Next.js API Routes",
  "database": "Supabase (PostgreSQL)",
  "storage": "Supabase Storage",
  "realtime": "Supabase Realtime (optional)"
}
```

### Design System

```typescript
// tailwind.config.ts (shared)
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',  // ← Main primary
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          500: '#8b5cf6',  // Purple
        },
        success: {
          500: '#10b981',  // Green
        },
        danger: {
          500: '#ef4444',  // Red
        },
        warning: {
          500: '#f59e0b',  // Amber
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
    },
  },
}
```

### Component Patterns

```typescript
// Loading State
<div className="flex items-center justify-center py-8">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
  <span className="ml-2 text-gray-600">Memuat data...</span>
</div>

// Empty State
<div className="text-center py-12">
  <Icon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
  <p className="text-gray-500">Belum ada data</p>
</div>

// Error State
<div className="bg-red-50 border-l-4 border-red-500 p-4">
  <p className="text-red-700">Error: {error.message}</p>
</div>

// Success Toast
toast.success('Data berhasil disimpan!', {
  position: 'top-right',
  duration: 3000,
})
```

### Responsive Design

```typescript
// Mobile-first approach
<div className="
  px-4 py-6           /* Mobile */
  md:px-6 md:py-8     /* Tablet */
  lg:px-8 lg:py-10    /* Desktop */
">
  <h1 className="
    text-2xl           /* Mobile */
    md:text-3xl        /* Tablet */
    lg:text-4xl        /* Desktop */
  ">
    Title
  </h1>
</div>
```

---

## 🔗 INTER-SYSTEM INTEGRATION

### Navigation Between Systems

**Setiap navbar harus punya link ke sistem lain:**

```typescript
// components/Navbar.tsx (consistent across all projects)
export function Navbar() {
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <img src="/logo.png" alt="Yayasan Fathus Salafi" className="h-10" />
            
            {/* System links */}
            <div className="hidden md:flex space-x-4">
              <a 
                href="https://yayasan-fatsal.com"
                className="text-gray-700 hover:text-primary-500"
              >
                Beranda
              </a>
              <a 
                href="https://siakad.yayasan-fatsal.com"
                className="text-gray-700 hover:text-primary-500"
              >
                SIAKAD
              </a>
              <a 
                href="https://lms.yayasan-fatsal.com"
                className="text-gray-700 hover:text-primary-500"
              >
                LMS
              </a>
            </div>
          </div>
          
          {/* User menu */}
          <UserMenu />
        </div>
      </div>
    </nav>
  )
}
```

### Data Sync Points

**Source of truth untuk setiap jenis data:**

| Data Type | Source System | Used By |
|-----------|--------------|---------|
| Users, Schools, Classes, Subjects | SIAKAD | All systems (read-only) |
| Schedules, Grades, Attendance | SIAKAD | SIAKAD (write), LMS (read) |
| PPDB Registrations, News | Website | Website (write), SIAKAD (read) |
| Courses, Lessons, Assignments | LMS | LMS (write), SIAKAD (read) |

### Cross-System References

```typescript
// Example: LMS courses reference SIAKAD subjects
// LMS: courses table
{
  id: 'uuid',
  title: 'Matematika Kelas 7',
  subject_id: 'uuid-from-siakad',  // ← FK ke SIAKAD subjects table
  class_ids: ['uuid1', 'uuid2'],    // ← FK ke SIAKAD classes table
  teacher_id: 'uuid',               // ← FK ke shared profiles table
  ...
}
```

---

## 📁 PROJECT STRUCTURE (Recommended)

### Next.js 14 Project Structure

```
project-name/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route group: authentication pages
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx            # Auth layout (centered, no navbar)
│   │
│   ├── (dashboard)/              # Route group: authenticated pages
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   └── layout.tsx            # Dashboard layout (navbar + sidebar)
│   │
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   ├── users/
│   │   └── [...]/
│   │
│   ├── globals.css               # Global styles
│   └── layout.tsx                # Root layout
│
├── components/
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── [...]/
│   │
│   ├── forms/                    # Form components
│   │   ├── LoginForm.tsx
│   │   ├── StudentForm.tsx
│   │   └── [...]/
│   │
│   ├── layout/                   # Layout components
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   └── Container.tsx
│   │
│   └── shared/                   # Shared components
│       ├── LoadingSpinner.tsx
│       ├── EmptyState.tsx
│       └── [...]/
│
├── lib/
│   ├── supabase.ts               # Supabase client
│   ├── supabase-admin.ts         # Supabase admin client (server-only)
│   ├── utils.ts                  # Utility functions
│   └── validations.ts            # Zod schemas
│
├── types/
│   ├── database.ts               # Database types
│   ├── api.ts                    # API types
│   └── index.ts                  # Exported types
│
├── hooks/
│   ├── useAuth.ts                # Authentication hook
│   ├── useUser.ts                # User data hook
│   └── [...]/
│
├── public/
│   ├── images/
│   └── icons/
│
├── .env.local                    # Environment variables (gitignored)
├── .env.example                  # Example env file
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### React + Vite Project Structure (SIAKAD existing)

```
siakad-fatsal/
├── src/
│   ├── components/
│   │   ├── dashboards/
│   │   ├── pages/
│   │   ├── forms/
│   │   ├── icons/
│   │   └── ui/
│   │
│   ├── services/
│   │   ├── authService.ts
│   │   ├── dataService.ts
│   │   └── supabaseClient.ts
│   │
│   ├── types/
│   │   └── index.ts
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

---

## 🚀 DEPLOYMENT

### Platform: Vercel (Recommended)

**Keuntungan:**
- ✅ Auto-deploy on git push
- ✅ Preview deployments for PR
- ✅ Custom domains easy setup
- ✅ SSL automatic
- ✅ Edge network (fast worldwide)
- ✅ Environment variables management
- ✅ Analytics built-in

### Domain Configuration

```
DNS Records (di domain provider):

# Root domain → Website Utama
A     @     76.76.21.21          (Vercel)
CNAME www   cname.vercel-dns.com

# Subdomains
CNAME siakad  cname.vercel-dns.com
CNAME lms     cname.vercel-dns.com
```

### Vercel Project Setup

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
cd project-directory
vercel

# 4. Add custom domain
vercel domains add yayasan-fatsal.com
vercel domains add siakad.yayasan-fatsal.com
vercel domains add lms.yayasan-fatsal.com
```

### Environment Variables (Vercel Dashboard)

```
Project: yayasan-website
├── NEXT_PUBLIC_SUPABASE_URL
├── NEXT_PUBLIC_SUPABASE_ANON_KEY
├── SUPABASE_SERVICE_ROLE_KEY
└── NEXT_PUBLIC_SITE_URL

Project: siakad-fatsal
├── VITE_SUPABASE_URL
├── VITE_SUPABASE_ANON_KEY
└── VITE_APP_URL

Project: lms-fatsal
├── NEXT_PUBLIC_SUPABASE_URL
├── NEXT_PUBLIC_SUPABASE_ANON_KEY
├── SUPABASE_SERVICE_ROLE_KEY
└── NEXT_PUBLIC_SITE_URL
```

---

## ⚠️ IMPORTANT RULES & BEST PRACTICES

### 1. Authentication
- ❌ **NEVER** create separate auth system
- ❌ **NEVER** duplicate user/auth tables
- ✅ **ALWAYS** use Supabase Auth
- ✅ **ALWAYS** reference `profiles` table for user data

### 2. Database
- ❌ **NEVER** store passwords manually (Supabase handles it)
- ❌ **NEVER** expose service role key in frontend
- ✅ **ALWAYS** use RLS policies for security
- ✅ **ALWAYS** validate data with Zod before insert/update

### 3. User Experience
- ✅ **ALWAYS** show loading states
- ✅ **ALWAYS** handle errors gracefully
- ✅ **ALWAYS** provide user feedback (toast/alert)
- ✅ **ALWAYS** implement responsive design (mobile-first)

### 4. Code Quality
- ✅ **ALWAYS** use TypeScript (no `any` types)
- ✅ **ALWAYS** validate user input (React Hook Form + Zod)
- ✅ **ALWAYS** handle edge cases (empty states, errors)
- ✅ **ALWAYS** write meaningful commit messages

### 5. Security
- ✅ **ALWAYS** validate on server-side (API routes)
- ✅ **ALWAYS** check user permissions before actions
- ✅ **ALWAYS** sanitize user input (prevent XSS)
- ✅ **ALWAYS** use environment variables for secrets

---

## 🧪 TESTING ACCOUNTS

### Admin Account (Full Access)
```
Email: admin@fatsal.com
Password: [Contact owner for credentials]
Role: Admin
Access: All systems, all schools, all features
```

### Principal Account
```
Email: principal.ma@fatsal.com
Password: [Contact owner]
Role: Principal
School: MA Fathus Salafi
Access: SIAKAD (own school), LMS (own school)
```

### Teacher Account
```
Email: teacher@fatsal.com
Password: [Contact owner]
Role: Teacher
School: MA Fathus Salafi
Access: SIAKAD (input grades/attendance), LMS (manage courses)
```

### Student Account
```
Email: student@fatsal.com
Password: [Contact owner]
Role: Student
School: MA Fathus Salafi
Class: X-IPA-1
Access: SIAKAD (view only), LMS (learning)
```

---

## 📚 USEFUL RESOURCES

### Documentation
- Supabase: https://supabase.com/docs
- Next.js: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com
- React Hook Form: https://react-hook-form.com
- Zod: https://zod.dev

### Repositories
- SIAKAD (existing): https://github.com/jbyyy7/Siakad-Fatsal
- Website Utama: [TBD]
- LMS: [TBD]

### Dashboards
- Supabase: https://supabase.com/dashboard
- Vercel: https://vercel.com/dashboard
- GitHub: https://github.com/jbyyy7

---

## 🔍 COMMON ISSUES & SOLUTIONS

### Issue: "User not authenticated" error
```typescript
// Solution: Check if user is logged in
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  router.push('/login')
  return
}
```

### Issue: RLS policy blocking access
```sql
-- Solution: Check RLS policies in Supabase
-- Make sure authenticated users can access tables
CREATE POLICY "policy_name" ON table_name
  FOR SELECT USING (auth.uid() IS NOT NULL);
```

### Issue: Session not shared across domains
```typescript
// Solution: Make sure all projects use SAME Supabase URL/keys
// Check environment variables in each project
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
```

### Issue: CORS error when calling API
```typescript
// Solution: Add CORS headers in API route
export async function GET(req: Request) {
  return Response.json(data, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    },
  })
}
```

---

## 📞 CONTACTS & SUPPORT

- **Repository Owner:** jbyyy7 (GitHub)
- **Supabase Project:** [Contact owner for access]
- **Deployment:** Vercel (team account)
- **Domain Provider:** [TBD]

---

## 📝 CHANGELOG

### Version 1.0 (October 26, 2025)
- ✅ Initial context documentation
- ✅ SIAKAD system fully operational
- ✅ Shared authentication established
- ✅ Database schema documented
- ⏳ Website Utama - pending development
- ⏳ LMS - pending development

---

## 🎯 QUICK START FOR NEW AI/DEVELOPER

**Paste this when starting a new project:**

```
Hi! Saya sedang membuat [Website Utama / LMS] untuk Yayasan Fathus Salafi.

Ini adalah bagian dari ekosistem 3 sistem:
1. SIAKAD (sudah jadi) - sistem akademik
2. Website Utama (akan dibuat) - landing page & PPDB
3. LMS (akan dibuat) - learning management system

PENTING: Authentication
- Supabase URL: [URL]
- HARUS pakai Supabase Auth yang sudah ada (shared dengan SIAKAD)
- Table users: `profiles` (jangan buat tabel user baru!)
- SSO enabled (login 1x untuk semua sistem)

PENTING: Database
- Tables shared: profiles, schools, classes, subjects, class_members
- Semua FK ke user pakai `profile_id` yang refer ke `profiles.id`

Tech Stack:
- Next.js 14 (App Router)
- Tailwind CSS
- Supabase
- TypeScript

Baca PROJECT_CONTEXT.md untuk detail lengkap.

Tolong bantu saya: [request spesifik]
```

---

**Last Updated:** October 26, 2025  
**Version:** 1.0  
**Maintained by:** jbyyy7

