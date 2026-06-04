-- Run this after database/supabase-schema.sql.
-- It keeps existing rows, adds multi-role support, and refreshes RLS policies for synced modules.

create table if not exists public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('主任', '教師', '總務', '財政')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

alter table public.user_roles enable row level security;

insert into public.user_roles (user_id, role)
select id, role
from public.profiles
on conflict do nothing;

insert into public.user_roles (user_id, role)
select id, '財政'
from public.profiles
where username = 'carey'
on conflict do nothing;

insert into public.user_roles (user_id, role)
select id, '總務'
from public.profiles
where username = 'william'
on conflict do nothing;

create or replace function public.has_app_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = any(required_roles)
  )
  or exists (
    select 1
    from public.user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role = any(required_roles)
  );
$$;

grant execute on function public.has_app_role(text[]) to authenticated;

drop policy if exists "user_roles_select_self" on public.user_roles;
create policy "user_roles_select_self"
on public.user_roles for select
to authenticated
using (user_id = auth.uid() or public.has_app_role(array['主任']));

drop policy if exists "user_roles_write_director" on public.user_roles;
create policy "user_roles_write_director"
on public.user_roles for all
to authenticated
using (public.has_app_role(array['主任']))
with check (public.has_app_role(array['主任']));

drop policy if exists "students_write_director_teacher" on public.students;
create policy "students_write_director_teacher"
on public.students for all
to authenticated
using (public.has_app_role(array['主任', '教師']))
with check (public.has_app_role(array['主任', '教師']));

drop policy if exists "journals_write_director_teacher" on public.journals;
create policy "journals_write_director_teacher"
on public.journals for all
to authenticated
using (public.has_app_role(array['主任', '教師']))
with check (public.has_app_role(array['主任', '教師']));

drop policy if exists "assignments_write_director" on public.assignments;
create policy "assignments_write_director"
on public.assignments for all
to authenticated
using (public.has_app_role(array['主任']))
with check (public.has_app_role(array['主任']));

drop policy if exists "shifts_write_director_teacher" on public.shifts;
create policy "shifts_write_director_teacher"
on public.shifts for all
to authenticated
using (public.has_app_role(array['主任', '教師']))
with check (public.has_app_role(array['主任', '教師']));

drop policy if exists "payroll_write_finance" on public.payroll_adjustments;
create policy "payroll_write_finance"
on public.payroll_adjustments for all
to authenticated
using (public.has_app_role(array['財政']))
with check (public.has_app_role(array['財政']));

drop policy if exists "ledger_write_finance" on public.ledger_entries;
create policy "ledger_write_finance"
on public.ledger_entries for all
to authenticated
using (public.has_app_role(array['財政']))
with check (public.has_app_role(array['財政']));

drop policy if exists "inventory_write_general_affairs" on public.inventory_items;
create policy "inventory_write_general_affairs"
on public.inventory_items for all
to authenticated
using (public.has_app_role(array['主任', '總務']))
with check (public.has_app_role(array['主任', '總務']));

drop policy if exists "messages_select_inbox_outbox" on public.messages;
create policy "messages_select_inbox_outbox"
on public.messages for select
to authenticated
using (
  sender = (select username from public.profiles where id = auth.uid())
  or recipient = (select username from public.profiles where id = auth.uid())
  or public.has_app_role(array[recipient])
  or public.has_app_role(array['主任'])
);

drop policy if exists "messages_update_recipient" on public.messages;
create policy "messages_update_recipient"
on public.messages for update
to authenticated
using (
  recipient = (select username from public.profiles where id = auth.uid())
  or public.has_app_role(array[recipient])
  or public.has_app_role(array['主任'])
)
with check (
  recipient = (select username from public.profiles where id = auth.uid())
  or public.has_app_role(array[recipient])
  or public.has_app_role(array['主任'])
);

drop policy if exists "messages_delete_owner_recipient_director" on public.messages;
create policy "messages_delete_owner_recipient_director"
on public.messages for delete
to authenticated
using (
  sender = (select username from public.profiles where id = auth.uid())
  or recipient = (select username from public.profiles where id = auth.uid())
  or public.has_app_role(array[recipient])
  or public.has_app_role(array['主任'])
);
