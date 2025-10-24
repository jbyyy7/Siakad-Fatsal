# 🔧 Database Migration Guide - Step by Step

## ⚠️ IMPORTANT: Run in This Exact Order!

Kamu harus run migrations dari awal karena database masih belum setup lengkap.

---

## 📋 Migration Steps

### ✅ STEP 1: Complete Database Setup (FIRST!)
**File:** `sql/COMPLETE_DATABASE_SETUP.sql`

**What it does:**
- Creates all base tables (profiles, schools, classes, subjects, etc.)
- Creates `announcements` table (required for notifications!)
- Sets up RLS policies
- Creates indexes

**Run this FIRST** sebelum yang lain!

---

### ✅ STEP 2: Fix Gate & Attendance Functions
**File:** `sql/FIX_GATE_ATTENDANCE_FUNCTIONS.sql`

**What it does:**
- Fixes gate attendance recording
- Updates attendance functions
- Adds proper error handling

---

### ✅ STEP 3: Gate Attendance Phase 2
**File:** `sql/FIX_GATE_ATTENDANCE_PHASE2.sql`

**What it does:**
- Additional attendance improvements
- Performance optimizations

---

### ✅ STEP 4: Student Features
**File:** `sql/FIX_STUDENT_FEATURES.sql`

**What it does:**
- Fixes student-specific features
- Updates grade tracking
- Improves student queries

---

### ✅ STEP 5: Notifications System
**File:** `sql/migrations/ADD_NOTIFICATIONS_SYSTEM.sql`

**What it does:**
- Creates `user_notifications` table
- Adds read/unread tracking
- Creates notification functions

**⚠️ Requires:** `announcements` table from STEP 1!

---

## 🚀 Quick Copy-Paste Order

Run these in Supabase SQL Editor in this order:

```
1. sql/COMPLETE_DATABASE_SETUP.sql          ← START HERE!
2. sql/FIX_GATE_ATTENDANCE_FUNCTIONS.sql
3. sql/FIX_GATE_ATTENDANCE_PHASE2.sql
4. sql/FIX_STUDENT_FEATURES.sql
5. sql/migrations/ADD_NOTIFICATIONS_SYSTEM.sql
```

---

## 🔍 Verification After Each Step

After running each file, check for:
- ✅ Green "Success" message
- ✅ No red ERROR messages
- ✅ Tables created (check Supabase Table Editor)

---

## ❌ Common Errors

### Error: "relation does not exist"
**Cause:** Skipped earlier steps  
**Fix:** Start from STEP 1

### Error: "already exists"
**Cause:** Already ran this migration  
**Fix:** Safe to ignore, continue to next step

### Error: "permission denied"
**Cause:** Not using service_role key  
**Fix:** Make sure you're in SQL Editor with full permissions

---

## 📝 Current Situation

**Your Error:**
```
ERROR: 42P01: relation "announcements" does not exist
```

**Solution:**
Run `COMPLETE_DATABASE_SETUP.sql` first! It creates the `announcements` table.

---

## ✅ After All Migrations

You should have these tables:
- profiles
- schools
- classes
- subjects
- announcements ← (You need this!)
- user_notifications ← (Will be created in Step 5)
- grades
- attendance
- schedules
- teachers
- students
- ... and more

---

## 🎯 Next Steps After Migrations

1. ✅ Run all 5 migrations in order
2. ✅ Verify tables exist
3. ✅ Test with demo data
4. 🚀 Deploy to Vercel!

---

**Need help?** Check the error message and see which table is missing, then go back to STEP 1.
