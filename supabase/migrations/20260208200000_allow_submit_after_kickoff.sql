begin;

create or replace function public.can_submit_entry(p_entry_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and e.user_id = auth.uid()
    and e.status <> 'submitted'
  from public.superbowl_entries e
  where e.id = p_entry_id;
$$;

drop policy if exists "superbowl_entries_submit" on public.superbowl_entries;
create policy "superbowl_entries_submit" on public.superbowl_entries
  for update using (public.can_submit_entry(id))
  with check (user_id = auth.uid() and status = 'submitted');

grant execute on function public.can_submit_entry(uuid) to authenticated;

commit;
