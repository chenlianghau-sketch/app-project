-- Fix role-recipient message inbox policy after multi-role migration.
-- This does not change data. It only refreshes messages select/update/delete policies.

drop policy if exists "messages_select_inbox_outbox" on public.messages;
create policy "messages_select_inbox_outbox"
on public.messages for select
to authenticated
using (
  sender = (select username from public.profiles where id = auth.uid())
  or recipient = (select username from public.profiles where id = auth.uid())
  or exists (
    select 1
    from public.user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role = public.messages.recipient
  )
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = public.messages.recipient
  )
  or exists (
    select 1
    from public.user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role = '主任'
  )
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = '主任'
  )
);

drop policy if exists "messages_update_recipient" on public.messages;
create policy "messages_update_recipient"
on public.messages for update
to authenticated
using (
  recipient = (select username from public.profiles where id = auth.uid())
  or exists (
    select 1
    from public.user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role = public.messages.recipient
  )
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = public.messages.recipient
  )
  or exists (
    select 1
    from public.user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role = '主任'
  )
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = '主任'
  )
)
with check (
  recipient = (select username from public.profiles where id = auth.uid())
  or exists (
    select 1
    from public.user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role = public.messages.recipient
  )
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = public.messages.recipient
  )
  or exists (
    select 1
    from public.user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role = '主任'
  )
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = '主任'
  )
);

drop policy if exists "messages_delete_owner_recipient_director" on public.messages;
create policy "messages_delete_owner_recipient_director"
on public.messages for delete
to authenticated
using (
  sender = (select username from public.profiles where id = auth.uid())
  or recipient = (select username from public.profiles where id = auth.uid())
  or exists (
    select 1
    from public.user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role = public.messages.recipient
  )
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = public.messages.recipient
  )
  or exists (
    select 1
    from public.user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role = '主任'
  )
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = '主任'
  )
);

select pg_notify('pgrst', 'reload schema');
