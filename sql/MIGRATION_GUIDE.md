# 🔧 Database Migration Guide - Step by Step

## ⚠️ IMPORTANT: Choose Your Path!

### 🆕 NEW DATABASE (Fresh Setup)
**If you're starting from scratch**, run `COMPLETE_DATABASE_SETUP.sql` only.

### 🔄 EXISTING DATABASE (Already have tables)
**If you see errors like "column does not exist" or "table already exists"**, 
you have an existing database. Use the fix script instead!

---

## 📋 Migration Paths

### PATH A: 🆕 New Database (Fresh Setup)

#### ✅ STEP 1: Complete Database Setup
**File:** `sql/COMPLETE_DATABASE_SETUP.sql`

**What it does:**
- Creates all base tables (profiles, schools, classes, subjects, etc.)
- Creates `announcements` table (required for notifications!)
- Sets up RLS policies
- Creates indexes

**Use this if:** You're starting fresh with no existing tables.

---

### PATH B: 🔄 Existing Database (Fix Missing Columns)

#### ✅ STEP 1: Fix Existing Database (USE THIS!)
**File:** `sql/FIX_EXISTING_DATABASE.sql` ⭐ **START HERE!**

**What it does:**
- Adds missing columns to existing tables (location_name, latitude, etc.)
- Creates `announcements` table if not exists
- Adds all missing fields without breaking existing data
- Safe to run multiple times (uses IF NOT EXISTS)

**Use this if:** You see errors like:
- "column location_name does not exist"
- "relation announcements does not exist"
- Tables already exist but missing some columns

---

### ✅ STEP 2-5: Additional Migrations (Both Paths)

After completing STEP 1 (either path), run these in order:

#### STEP 2: Fix Gate & Attendance Functions
**File:** `sql/migrations/FIX_GATE_ATTENDANCE_FUNCTIONS.sql`

**What it does:**
- Fixes gate attendance recording
- Updates attendance functions
- Adds proper error handling

---

#### STEP 3: Gate Attendance Phase 2
**File:** `sql/migrations/FIX_GATE_ATTENDANCE_PHASE2.sql`

**What it does:**
- Additional attendance improvements
- Performance optimizations

---

#### STEP 4: Student Features
**File:** `sql/migrations/FIX_STUDENT_FEATURES.sql`

**What it does:**
- Fixes student-specific features
- Updates grade tracking
- Improves student queries

---

#### STEP 5: Notifications System
**File:** `sql/migrations/ADD_NOTIFICATIONS_SYSTEM.sql`

**What it does:**
- Creates `user_notifications` table
- Adds read/unread tracking
- Creates notification functions

**⚠️ Requires:** `announcements` table from STEP 1!

---

## 🚀 Quick Copy-Paste Order

### For EXISTING Database (Your Situation):
```
1. sql/FIX_EXISTING_DATABASE.sql                ← START HERE!
2. sql/migrations/FIX_GATE_ATTENDANCE_FUNCTIONS.sql
3. sql/migrations/FIX_GATE_ATTENDANCE_PHASE2.sql
4. sql/migrations/FIX_STUDENT_FEATURES.sql
5. sql/migrations/ADD_NOTIFICATIONS_SYSTEM.sql
```

### For NEW Database:
```
1. sql/COMPLETE_DATABASE_SETUP.sql              ← Fresh setup
2. sql/migrations/FIX_GATE_ATTENDANCE_FUNCTIONS.sql
3. sql/migrations/FIX_GATE_ATTENDANCE_PHASE2.sql
4. sql/migrations/FIX_STUDENT_FEATURES.sql
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
ERROR: 42703: column "location_name" of relation "schools" does not exist
```

**Diagnosis:** ✅ You have an EXISTING database with old structure

**Solution:**
1. ❌ **DON'T** run `COMPLETE_DATABASE_SETUP.sql` (will conflict with existing tables)
2. ✅ **DO** run `FIX_EXISTING_DATABASE.sql` (adds missing columns safely)
3. ✅ Then continue with migrations 2-5

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
