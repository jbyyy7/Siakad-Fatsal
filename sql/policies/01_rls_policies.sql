-- 01_rls_policies.sql
-- Row Level Security helpers and policies for SIAKAD
-- NOTE: Review role names and claims emitted by your Supabase Auth JWT. Adjust checks below accordingly.

-- Helper functions to check role claim on jwt
create or replace function public.jwt_role() returns text stable language sql as $$
  select current_setting('request.jwt.claims.role', true);
$$;

create or replace function public.is_admin() returns boolean stable language sql as $$
  select public.jwt_role() in ('admin','Admin','Administrator');
$$;

create or replace function public.is_teacher() returns boolean stable language sql as $$
  select public.jwt_role() in ('teacher','guru','Guru','Teacher');
$$;

create or replace function public.is_student() returns boolean stable language sql as $$
  select public.jwt_role() in ('student','siswa','Siswa','Student');
$$;

create or replace function public.is_parent() returns boolean stable language sql as $$
  select public.jwt_role() in ('parent','orangtua','OrangTua','Parent');
$$;

-- Enable RLS on sensitive tables
alter table if exists profiles enable row level security;
alter table if exists grades enable row level security;
alter table if exists attendances enable row level security;
alter table if exists notifications enable row level security;
alter table if exists announcements enable row level security;

-- Profiles: users can read their own profile; admins and teachers may read student/teacher profiles for their school
create policy profiles_select_policy on profiles for select using (
  public.is_admin() OR
  (public.is_teacher() AND (current_setting('request.jwt.claims.school_id', true) is not null AND profiles.school_id::text = current_setting('request.jwt.claims.school_id', true))) OR
  (auth.uid() = id)
);

create policy profiles_update_policy on profiles for update using (
  auth.uid() = id OR public.is_admin()
) with check (
  auth.uid() = id OR public.is_admin()
);

create policy profiles_insert_policy on profiles for insert using (public.is_admin()) with check (public.is_admin());

-- Grades: students can see their own grades, teachers can insert/update grades they authored, admins can see all
create policy grades_select_policy on grades for select using (
  public.is_admin() OR
  (public.is_teacher() AND teacher_id = auth.uid()) OR
  (public.is_student() AND student_id = auth.uid())
);

create policy grades_insert_policy on grades for insert using (
  public.is_admin() OR public.is_teacher()
) with check (
  public.is_admin() OR public.is_teacher()
);

create policy grades_update_policy on grades for update using (
  public.is_admin() OR (public.is_teacher() AND teacher_id = auth.uid())
) with check (
  public.is_admin() OR (public.is_teacher() AND teacher_id = auth.uid())
);

create policy grades_delete_policy on grades for delete using (public.is_admin());

-- Attendances: students can view their own records, teachers can manage attendances for classes they teach, admins can manage all
create policy attendances_select_policy on attendances for select using (
  public.is_admin() OR
  (public.is_student() AND student_id = auth.uid()) OR
  (public.is_teacher() AND teacher_id = auth.uid())
);

create policy attendances_insert_policy on attendances for insert using (
  public.is_admin() OR public.is_teacher()
) with check (
  public.is_admin() OR public.is_teacher()
);

create policy attendances_update_policy on attendances for update using (
  public.is_admin() OR public.is_teacher()
) with check (
  public.is_admin() OR public.is_teacher()
);

create policy attendances_delete_policy on attendances for delete using (public.is_admin());

-- Notifications: users should see notifications where they are recipient; server/services (via service_role) can insert
create policy notifications_select_policy on notifications for select using (
  public.is_admin() OR recipient_id = auth.uid()
);

create policy notifications_insert_policy on notifications for insert using (
  public.is_admin() OR current_setting('request.jwt.claims.is_service', true) = 'true'
) with check (true);

create policy notifications_update_policy on notifications for update using (
  public.is_admin() OR recipient_id = auth.uid()
) with check (true);

create policy notifications_delete_policy on notifications for delete using (public.is_admin());

-- Announcements: public select for published ones; authors/admins can manage
create policy announcements_select_policy on announcements for select using (
  published_at is not null OR public.is_admin() OR author_id = auth.uid()
);

create policy announcements_insert_policy on announcements for insert using (
  public.is_admin() OR public.is_teacher()
) with check (public.is_admin() OR public.is_teacher());

create policy announcements_update_policy on announcements for update using (
  public.is_admin() OR author_id = auth.uid()
) with check (public.is_admin() OR author_id = auth.uid());

create policy announcements_delete_policy on announcements for delete using (public.is_admin() or author_id = auth.uid());

-- Guidance: Service role operations should use the supabase service role key and bypass RLS
