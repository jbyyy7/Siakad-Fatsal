-- 002_password_resets.sql
-- Table to store password reset tokens for welcome/reset flow
begin;

create table if not exists password_resets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  token text not null,
  expires_at timestamptz not null,
  used boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_password_resets_token on password_resets(token);

commit;
