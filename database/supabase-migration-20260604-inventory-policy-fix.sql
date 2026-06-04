-- Fix inventory_items write policy after multi-role migration.
-- This does not change data. It only refreshes the RLS policy used by general affairs inventory sync.

drop policy if exists "inventory_write_general_affairs" on public.inventory_items;

create policy "inventory_write_general_affairs"
on public.inventory_items for all
to authenticated
using (
  exists (
    select 1
    from public.user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role in ('主任', '總務')
  )
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('主任', '總務')
  )
)
with check (
  exists (
    select 1
    from public.user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role in ('主任', '總務')
  )
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('主任', '總務')
  )
);

select pg_notify('pgrst', 'reload schema');
