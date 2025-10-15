-- 001_create_core_tables.sql
-- Core tables for SIAKAD: schools, profiles, classes, subjects, class_members, grades, attendances, announcements, notifications, teaching_journals, semesters
-- Run this in a staging environment first. Adjust types/constraints to your needs.

begin;

-- Schools
create table if not exists schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- App user profiles (extends auth.users via id)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null,
  email text,
  phone text,
  school_id uuid references schools(id) on delete set null,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Semesters (to tie grades/attendance to academic periods)
create table if not exists semesters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  is_active boolean default false,
  school_id uuid references schools(id) on delete cascade,
  created_at timestamptz default now()
);

-- Classes (homeroom / grade-class grouping)
create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade_level text,
  school_id uuid references schools(id) on delete cascade,
  homeroom_teacher uuid references profiles(id),
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Subjects
create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  school_id uuid references schools(id) on delete cascade,
  created_at timestamptz default now()
);

-- Class members (students assigned to classes)
create table if not exists class_members (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references classes(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  role text default 'student'
);

-- Grades
create table if not exists grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  teacher_id uuid references profiles(id) on delete set null,
  semester_id uuid references semesters(id) on delete set null,
  score numeric not null,
  max_score numeric default 100,
  grade_type text default 'exam', -- exam, assignment, quiz
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Attendance records
create table if not exists attendances (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade,
  class_id uuid references classes(id) on delete set null,
  teacher_id uuid references profiles(id) on delete set null,
  occurred_at timestamptz not null,
  status text not null, -- present, absent, late, excused
  method text default 'manual', -- qr, manual
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Announcements
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  author_id uuid references profiles(id) on delete set null,
  school_id uuid references schools(id) on delete set null,
  audience jsonb default '[]'::jsonb, -- e.g. ["students","parents","teachers"] or list of roles
  pinned boolean default false,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Notifications (sent to users; link to announcement/grade/attendance)
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references profiles(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null,
  type text not null,
  payload jsonb default '{}',
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Teaching journals (teacher reflections / logs)
create table if not exists teaching_journals (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references profiles(id) on delete cascade,
  class_id uuid references classes(id) on delete set null,
  subject_id uuid references subjects(id) on delete set null,
  entry_date date not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

commit;

-- Indexes (helpful)
create index if not exists idx_profiles_school on profiles(school_id);
create index if not exists idx_class_members_class on class_members(class_id);
create index if not exists idx_grades_student on grades(student_id);
create index if not exists idx_attendances_student on attendances(student_id);
