# QUICK CONTEXT - Yayasan Fathus Salafi

**Copy-paste ini ke AI baru untuk quick start!**

---

## 🎯 Project Overview

Membuat **[Website Utama / LMS]** untuk Yayasan Fathus Salafi.

Bagian dari ekosistem 3 sistem:
1. **SIAKAD** (✅ sudah jadi) - siakad.yayasan-fatsal.com
2. **Website Utama** (⏳ development) - yayasan-fatsal.com
3. **LMS** (⏳ development) - lms.yayasan-fatsal.com

---

## 🔐 Authentication - CRITICAL!

**WAJIB pakai Supabase Auth yang sudah ada!**

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**Environment:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_KEY]  # server-only
```

**Login:**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email, password
})
```

**User Roles:**
- Admin, Foundation Head, Principal, Staff, Teacher, Student

**SSO:** Login 1x → akses semua sistem ✅

---

## 🗄️ Database - Shared Tables

### profiles (User Data)
```sql
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  role TEXT,  -- Admin, Teacher, Student, etc
  school_id UUID REFERENCES schools(id),
  -- ... student/teacher fields
)
```

**⚠️ JANGAN buat tabel `users` sendiri!**  
User data ada di `profiles`, auth di `auth.users` (managed by Supabase)

### Other Shared Tables
- `schools` - Sekolah (MA, MTs, MI, RA, TK)
- `classes` - Kelas per sekolah
- `subjects` - Mata pelajaran
- `class_members` - Relasi siswa/guru ke kelas

---

## 🎨 Tech Stack

```json
{
  "framework": "Next.js 14 (App Router)",
  "styling": "Tailwind CSS",
  "components": "shadcn/ui (optional)",
  "forms": "React Hook Form + Zod",
  "database": "Supabase",
  "deployment": "Vercel"
}
```

---

## 📁 Project Structure

```
project/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Login, register
│   ├── (dashboard)/       # Protected pages
│   └── api/               # API routes
├── components/
│   ├── ui/                # shadcn components
│   ├── forms/             # Form components
│   └── layout/            # Navbar, Sidebar
├── lib/
│   ├── supabase.ts        # Supabase client
│   └── validations.ts     # Zod schemas
└── types/
    └── database.ts        # Types
```

---

## 🔗 Cross-System Integration

### Navigation (Navbar)
```typescript
<nav>
  <a href="https://yayasan-fatsal.com">Beranda</a>
  <a href="https://siakad.yayasan-fatsal.com">SIAKAD</a>
  <a href="https://lms.yayasan-fatsal.com">LMS</a>
</nav>
```

### Data References
```typescript
// LMS courses → reference SIAKAD subjects
courses (
  subject_id UUID REFERENCES subjects(id),  // ← dari SIAKAD
  class_ids UUID[],                         // ← dari SIAKAD
)
```

---

## ⚠️ IMPORTANT RULES

1. ❌ **NEVER** create separate auth
2. ❌ **NEVER** duplicate user table
3. ✅ **ALWAYS** use Supabase Auth
4. ✅ **ALWAYS** validate with Zod
5. ✅ **ALWAYS** use TypeScript
6. ✅ **ALWAYS** handle loading/error states

---

## 🚀 Quick Start Prompt

```
Hi! Saya membuat [Website Utama / LMS] untuk Yayasan Fathus Salafi.

Context:
- Bagian dari 3 sistem (Website, SIAKAD, LMS)
- SIAKAD sudah jadi: github.com/jbyyy7/Siakad-Fatsal
- Auth: Supabase (SHARED, jangan buat baru!)
- Database: Supabase (tables: profiles, schools, classes, subjects)
- Tech: Next.js 14, Tailwind CSS
- SSO: Login 1x untuk semua sistem

Tolong bantu:
1. Setup Next.js 14 project
2. Implement login dengan Supabase existing
3. [Request spesifik lainnya]

Detail lengkap di: PROJECT_CONTEXT.md
```

---

## 📚 Resources

- **Full Context:** PROJECT_CONTEXT.md
- **SIAKAD Repo:** https://github.com/jbyyy7/Siakad-Fatsal
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs

---

**Last Updated:** Oct 26, 2025 | **Owner:** jbyyy7
