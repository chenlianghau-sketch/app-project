-- 補習班管理系統 Supabase schema
-- Step 1: 在 Supabase SQL Editor 執行本檔。
-- Step 2: 到 Authentication 新增使用者後，在 profiles 表補上角色。

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  role text not null check (role in ('主任', '教師', '總務', '財政')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade text not null,
  present boolean not null default true,
  meal boolean not null default false,
  absence_reason text not null default '',
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.journals (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete set null,
  teacher_name text not null,
  class_name text not null,
  teaching_status text not null default '',
  student_status text not null default '',
  incident_status text not null default '',
  reviewed boolean not null default false,
  saved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  teacher_name text not null,
  class_id uuid,
  assigned_date date not null,
  day text not null,
  title text not null,
  note text not null default '',
  completed boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  teacher_name text not null,
  shift_date date not null,
  start_time time not null,
  end_time time not null,
  pay_type text not null check (pay_type in ('hourly', 'monthly')),
  pay_rate numeric(12, 2) not null default 0,
  source text not null default 'director',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payroll_adjustments (
  id uuid primary key default gen_random_uuid(),
  teacher_name text not null,
  labor_insurance numeric(12, 2) not null default 0,
  health_insurance numeric(12, 2) not null default 0,
  attendance_bonus numeric(12, 2) not null default 0,
  other_deduction numeric(12, 2) not null default 0,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (teacher_name)
);

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null,
  type text not null check (type in ('income', 'expense')),
  title text not null,
  amount numeric(12, 2) not null default 0,
  note text not null default '',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  quantity integer not null default 0,
  threshold integer not null default 0,
  note text not null default '',
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender text not null,
  recipient text not null,
  body text not null default '',
  attachment_name text,
  attachment_type text,
  attachment_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_students_updated_at on public.students;
create trigger set_students_updated_at
before update on public.students
for each row execute function public.set_updated_at();

drop trigger if exists set_journals_updated_at on public.journals;
create trigger set_journals_updated_at
before update on public.journals
for each row execute function public.set_updated_at();

drop trigger if exists set_assignments_updated_at on public.assignments;
create trigger set_assignments_updated_at
before update on public.assignments
for each row execute function public.set_updated_at();

drop trigger if exists set_shifts_updated_at on public.shifts;
create trigger set_shifts_updated_at
before update on public.shifts
for each row execute function public.set_updated_at();

drop trigger if exists set_ledger_entries_updated_at on public.ledger_entries;
create trigger set_ledger_entries_updated_at
before update on public.ledger_entries
for each row execute function public.set_updated_at();

drop trigger if exists set_inventory_items_updated_at on public.inventory_items;
create trigger set_inventory_items_updated_at
before update on public.inventory_items
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.journals enable row level security;
alter table public.assignments enable row level security;
alter table public.shifts enable row level security;
alter table public.payroll_adjustments enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.inventory_items enable row level security;
alter table public.messages enable row level security;

create policy "profiles_select_authenticated"
on public.profiles for select
to authenticated
using (true);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "students_select_authenticated"
on public.students for select
to authenticated
using (true);

create policy "students_write_director_teacher"
on public.students for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('主任', '教師')
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('主任', '教師')
  )
);

create policy "journals_select_authenticated"
on public.journals for select
to authenticated
using (true);

create policy "journals_write_director_teacher"
on public.journals for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('主任', '教師')
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('主任', '教師')
  )
);

create policy "assignments_select_authenticated"
on public.assignments for select
to authenticated
using (true);

create policy "assignments_write_director"
on public.assignments for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = '主任'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = '主任'
  )
);

create policy "shifts_select_authenticated"
on public.shifts for select
to authenticated
using (true);

create policy "shifts_write_director_teacher"
on public.shifts for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('主任', '教師')
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('主任', '教師')
  )
);

create policy "payroll_select_authenticated"
on public.payroll_adjustments for select
to authenticated
using (true);

create policy "payroll_write_finance"
on public.payroll_adjustments for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = '財政'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = '財政'
  )
);

create policy "ledger_select_authenticated"
on public.ledger_entries for select
to authenticated
using (true);

create policy "ledger_write_finance"
on public.ledger_entries for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = '財政'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = '財政'
  )
);

create policy "inventory_select_authenticated"
on public.inventory_items for select
to authenticated
using (true);

create policy "inventory_write_general_affairs"
on public.inventory_items for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('主任', '總務')
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('主任', '總務')
  )
);

create policy "messages_select_inbox_outbox"
on public.messages for select
to authenticated
using (
  sender = (select username from public.profiles where id = auth.uid())
  or recipient = (select username from public.profiles where id = auth.uid())
  or exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = '主任'
  )
);

create policy "messages_insert_authenticated"
on public.messages for insert
to authenticated
with check (
  sender = (select username from public.profiles where id = auth.uid())
);

create policy "messages_update_recipient"
on public.messages for update
to authenticated
using (
  recipient = (select username from public.profiles where id = auth.uid())
)
with check (
  recipient = (select username from public.profiles where id = auth.uid())
);
