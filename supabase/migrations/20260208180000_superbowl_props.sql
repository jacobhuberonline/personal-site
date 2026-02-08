begin;

create extension if not exists "pgcrypto";

create table if not exists public.superbowl_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_at timestamptz not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists superbowl_events_active_unique
  on public.superbowl_events (is_active)
  where is_active;

create table if not exists public.superbowl_questions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.superbowl_events(id) on delete cascade,
  key text not null,
  section text not null,
  label text not null,
  description text,
  type text not null check (type in ('single_choice', 'score', 'text')),
  options jsonb,
  points int not null default 0,
  order_index int,
  created_at timestamptz not null default now(),
  unique (event_id, key)
);

create index if not exists superbowl_questions_event_idx
  on public.superbowl_questions (event_id);

create table if not exists public.superbowl_entries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.superbowl_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('draft', 'submitted')),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index if not exists superbowl_entries_event_idx
  on public.superbowl_entries (event_id);
create index if not exists superbowl_entries_user_idx
  on public.superbowl_entries (user_id);

create table if not exists public.superbowl_answers (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.superbowl_entries(id) on delete cascade,
  question_id uuid not null references public.superbowl_questions(id) on delete cascade,
  value jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entry_id, question_id)
);

create index if not exists superbowl_answers_entry_idx
  on public.superbowl_answers (entry_id);

create table if not exists public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table if not exists public.superbowl_results (
  event_id uuid not null references public.superbowl_events(id) on delete cascade,
  question_id uuid not null references public.superbowl_questions(id) on delete cascade,
  value jsonb,
  entered_by uuid references auth.users(id),
  entered_at timestamptz not null default now(),
  primary key (event_id, question_id)
);

create index if not exists superbowl_results_event_idx
  on public.superbowl_results (event_id);

create table if not exists public.superbowl_scores (
  event_id uuid not null references public.superbowl_events(id) on delete cascade,
  entry_id uuid not null references public.superbowl_entries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  total_points int not null default 0,
  computed_at timestamptz not null default now(),
  primary key (event_id, entry_id)
);

create index if not exists superbowl_scores_event_idx
  on public.superbowl_scores (event_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger superbowl_entries_set_updated_at
before update on public.superbowl_entries
for each row execute function public.set_updated_at();

create trigger superbowl_answers_set_updated_at
before update on public.superbowl_answers
for each row execute function public.set_updated_at();

create or replace function public.is_site_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(select 1 from public.site_admins where user_id = auth.uid());
$$;

create or replace function public.can_create_entry(p_event_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and now() < starts_at
  from public.superbowl_events
  where id = p_event_id;
$$;

create or replace function public.can_edit_entry(p_entry_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and e.user_id = auth.uid()
    and e.status <> 'submitted'
    and now() < ev.starts_at
  from public.superbowl_entries e
  join public.superbowl_events ev on ev.id = e.event_id
  where e.id = p_entry_id;
$$;

create or replace function public.can_view_leaderboard_event(p_event_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select auth.role() = 'authenticated'
    and now() >= starts_at
  from public.superbowl_events
  where id = p_event_id;
$$;

create or replace function public.can_view_leaderboard_answers(p_entry_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select auth.role() = 'authenticated'
    and e.status = 'submitted'
    and now() >= ev.starts_at
  from public.superbowl_entries e
  join public.superbowl_events ev on ev.id = e.event_id
  where e.id = p_entry_id;
$$;

create or replace function public.superbowl_participant_summary(target_event uuid)
returns table (total_entries int, submitted_entries int)
language sql
security definer
set search_path = public
as $$
  select
    count(*)::int as total_entries,
    count(*) filter (where status = 'submitted')::int as submitted_entries
  from public.superbowl_entries
  where event_id = target_event
    and auth.role() = 'authenticated';
$$;

create or replace function public.get_superbowl_leaderboard(target_event uuid)
returns table (
  entry_id uuid,
  user_id uuid,
  total_points int,
  submitted_at timestamptz,
  question_id uuid,
  answer_value jsonb
)
language sql
security definer
set search_path = public
as $$
  select
    e.id as entry_id,
    e.user_id,
    s.total_points,
    e.submitted_at,
    a.question_id,
    a.value as answer_value
  from public.superbowl_entries e
  left join public.superbowl_scores s
    on s.event_id = e.event_id
    and s.entry_id = e.id
  left join public.superbowl_answers a
    on a.entry_id = e.id
  where e.event_id = target_event
    and e.status = 'submitted'
    and auth.role() = 'authenticated'
    and now() >= (select starts_at from public.superbowl_events where id = target_event);
$$;

create or replace function public.recompute_superbowl_scores(target_event uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_site_admin() then
    raise exception 'not authorized';
  end if;

  delete from public.superbowl_scores
  where event_id = target_event
    and entry_id not in (
      select id from public.superbowl_entries
      where event_id = target_event and status = 'submitted'
    );

  insert into public.superbowl_scores (event_id, entry_id, user_id, total_points, computed_at)
  select
    e.event_id,
    e.id,
    e.user_id,
    coalesce(
      sum(
        case
          when q.points > 0
            and a.value is not null
            and r.value is not null
            and a.value = r.value
          then q.points
          else 0
        end
      ),
      0
    ) as total_points,
    now()
  from public.superbowl_entries e
  join public.superbowl_questions q on q.event_id = e.event_id
  left join public.superbowl_answers a on a.entry_id = e.id and a.question_id = q.id
  left join public.superbowl_results r on r.event_id = e.event_id and r.question_id = q.id
  where e.event_id = target_event
    and e.status = 'submitted'
  group by e.event_id, e.id, e.user_id
  on conflict (event_id, entry_id)
  do update set
    total_points = excluded.total_points,
    computed_at = excluded.computed_at,
    user_id = excluded.user_id;
end;
$$;

alter table public.superbowl_events enable row level security;
alter table public.superbowl_questions enable row level security;
alter table public.superbowl_entries enable row level security;
alter table public.superbowl_answers enable row level security;
alter table public.superbowl_results enable row level security;
alter table public.superbowl_scores enable row level security;
alter table public.site_admins enable row level security;

create policy "superbowl_events_select" on public.superbowl_events
  for select using (auth.role() = 'authenticated');

create policy "superbowl_questions_select" on public.superbowl_questions
  for select using (auth.role() = 'authenticated');

create policy "superbowl_entries_select" on public.superbowl_entries
  for select using (user_id = auth.uid());

create policy "superbowl_entries_insert" on public.superbowl_entries
  for insert with check (user_id = auth.uid() and public.can_create_entry(event_id));

create policy "superbowl_entries_update" on public.superbowl_entries
  for update using (public.can_edit_entry(id))
  with check (user_id = auth.uid());

create policy "superbowl_answers_select_owner" on public.superbowl_answers
  for select using (
    exists(
      select 1 from public.superbowl_entries e
      where e.id = entry_id and e.user_id = auth.uid()
    )
  );

create policy "superbowl_answers_select_leaderboard" on public.superbowl_answers
  for select using (public.can_view_leaderboard_answers(entry_id));

create policy "superbowl_answers_insert" on public.superbowl_answers
  for insert with check (public.can_edit_entry(entry_id));

create policy "superbowl_answers_update" on public.superbowl_answers
  for update using (public.can_edit_entry(entry_id))
  with check (public.can_edit_entry(entry_id));

create policy "superbowl_results_select" on public.superbowl_results
  for select using (public.is_site_admin());

create policy "superbowl_results_insert" on public.superbowl_results
  for insert with check (public.is_site_admin());

create policy "superbowl_results_update" on public.superbowl_results
  for update using (public.is_site_admin())
  with check (public.is_site_admin());

create policy "superbowl_scores_select" on public.superbowl_scores
  for select using (public.can_view_leaderboard_event(event_id) or public.is_site_admin());

create policy "superbowl_scores_insert" on public.superbowl_scores
  for insert with check (public.is_site_admin());

create policy "superbowl_scores_update" on public.superbowl_scores
  for update using (public.is_site_admin())
  with check (public.is_site_admin());

create policy "site_admins_select_self" on public.site_admins
  for select using (user_id = auth.uid());

grant select on public.superbowl_events to authenticated;
grant select on public.superbowl_questions to authenticated;
grant select, insert, update on public.superbowl_entries to authenticated;
grant select, insert, update on public.superbowl_answers to authenticated;
grant select, insert, update on public.superbowl_results to authenticated;
grant select on public.superbowl_scores to authenticated;
grant select on public.site_admins to authenticated;
grant execute on function public.is_site_admin() to authenticated;
grant execute on function public.can_create_entry(uuid) to authenticated;
grant execute on function public.can_edit_entry(uuid) to authenticated;
grant execute on function public.can_view_leaderboard_event(uuid) to authenticated;
grant execute on function public.can_view_leaderboard_answers(uuid) to authenticated;
grant execute on function public.superbowl_participant_summary(uuid) to authenticated;
grant execute on function public.get_superbowl_leaderboard(uuid) to authenticated;
grant execute on function public.recompute_superbowl_scores(uuid) to authenticated;

with event as (
  insert into public.superbowl_events (name, starts_at, is_active)
  values ('Super Bowl LX', '2026-02-08T17:30:00-06:00', true)
  returning id
)
insert into public.superbowl_questions (
  event_id,
  key,
  section,
  label,
  description,
  type,
  options,
  points,
  order_index
)
select event.id, 'winner', 'Game outcome', 'Game winner', null, 'single_choice',
  '[{"value":"SEA","label":"Seahawks"},{"value":"NE","label":"Patriots"}]'::jsonb, 5, 1
from event
union all
select event.id, 'final_score', 'Game outcome', 'Final score (SEA vs NE)', null, 'score',
  null, 15, 2
from event
union all
select event.id, 'winning_margin', 'Game outcome', 'Winning margin', null, 'single_choice',
  '[{"value":"1-3","label":"1-3"},{"value":"4-7","label":"4-7"},{"value":"8-14","label":"8-14"},{"value":"15+","label":"15+"}]'::jsonb, 4, 3
from event
union all
select event.id, 'overtime', 'Game outcome', 'Will the game go to overtime?', null, 'single_choice',
  '[{"value":"Yes","label":"Yes"},{"value":"No","label":"No"}]'::jsonb, 3, 4
from event
union all
select event.id, 'first_team_score', 'Scoring timeline', 'First team to score', null, 'single_choice',
  '[{"value":"SEA","label":"Seahawks"},{"value":"NE","label":"Patriots"}]'::jsonb, 2, 5
from event
union all
select event.id, 'first_score_type', 'Scoring timeline', 'Type of first score', null, 'single_choice',
  '[{"value":"TD","label":"TD"},{"value":"FG","label":"FG"},{"value":"Safety","label":"Safety"}]'::jsonb, 2, 6
from event
union all
select event.id, 'total_points_ou', 'Scoring timeline', 'Total points (47.5)', null, 'single_choice',
  '[{"value":"Over 47.5","label":"Over 47.5"},{"value":"Under 47.5","label":"Under 47.5"}]'::jsonb, 4, 7
from event
union all
select event.id, 'total_tds_ou', 'Scoring timeline', 'Total TDs (5.5)', null, 'single_choice',
  '[{"value":"Over 5.5","label":"Over 5.5"},{"value":"Under 5.5","label":"Under 5.5"}]'::jsonb, 4, 8
from event
union all
select event.id, 'any_safety', 'Scoring timeline', 'Any safety in game?', null, 'single_choice',
  '[{"value":"Yes","label":"Yes"},{"value":"No","label":"No"}]'::jsonb, 3, 9
from event
union all
select event.id, 'any_def_st_td', 'Scoring timeline', 'Any defense/special teams TD?', null, 'single_choice',
  '[{"value":"Yes","label":"Yes"},{"value":"No","label":"No"}]'::jsonb, 3, 10
from event
union all
select event.id, 'last_td_team', 'Scoring timeline', 'Team to score the last TD', null, 'single_choice',
  '[{"value":"SEA","label":"Seahawks"},{"value":"NE","label":"Patriots"},{"value":"No TD","label":"No TD"}]'::jsonb, 3, 11
from event
union all
select event.id, 'darnold_pass_ou', 'Player props', 'Sam Darnold passing yards (245.5)', null, 'single_choice',
  '[{"value":"Over 245.5","label":"Over 245.5"},{"value":"Under 245.5","label":"Under 245.5"}]'::jsonb, 4, 12
from event
union all
select event.id, 'maye_pass_ou', 'Player props', 'Drake Maye passing yards (228.5)', null, 'single_choice',
  '[{"value":"Over 228.5","label":"Over 228.5"},{"value":"Under 228.5","label":"Under 228.5"}]'::jsonb, 4, 13
from event
union all
select event.id, 'maye_rush_ou', 'Player props', 'Drake Maye rushing yards (24.5)', null, 'single_choice',
  '[{"value":"Over 24.5","label":"Over 24.5"},{"value":"Under 24.5","label":"Under 24.5"}]'::jsonb, 4, 14
from event
union all
select event.id, 'qb_more_pass_yards', 'Player props', 'QB with more passing yards', null, 'single_choice',
  '[{"value":"Darnold","label":"Sam Darnold"},{"value":"Maye","label":"Drake Maye"}]'::jsonb, 4, 15
from event
union all
select event.id, 'walker_rush_ou', 'Player props', 'Kenneth Walker III rushing yards (79.5)', null, 'single_choice',
  '[{"value":"Over 79.5","label":"Over 79.5"},{"value":"Under 79.5","label":"Under 79.5"}]'::jsonb, 4, 16
from event
union all
select event.id, 'stevenson_rush_ou', 'Player props', 'Rhamondre Stevenson rushing yards (72.5)', null, 'single_choice',
  '[{"value":"Over 72.5","label":"Over 72.5"},{"value":"Under 72.5","label":"Under 72.5"}]'::jsonb, 4, 17
from event
union all
select event.id, 'longest_rush_ou', 'Player props', 'Longest rush (19.5)', null, 'single_choice',
  '[{"value":"Over 19.5","label":"Over 19.5"},{"value":"Under 19.5","label":"Under 19.5"}]'::jsonb, 4, 18
from event
union all
select event.id, 'jsn_rec_ou', 'Player props', 'Jaxon Smith-Njigba receiving yards (74.5)', null, 'single_choice',
  '[{"value":"Over 74.5","label":"Over 74.5"},{"value":"Under 74.5","label":"Under 74.5"}]'::jsonb, 4, 19
from event
union all
select event.id, 'metcalf_rec_ou', 'Player props', 'DK Metcalf receiving yards (68.5)', null, 'single_choice',
  '[{"value":"Over 68.5","label":"Over 68.5"},{"value":"Under 68.5","label":"Under 68.5"}]'::jsonb, 4, 20
from event
union all
select event.id, 'henry_rec_ou', 'Player props', 'Hunter Henry receiving yards (42.5)', null, 'single_choice',
  '[{"value":"Over 42.5","label":"Over 42.5"},{"value":"Under 42.5","label":"Under 42.5"}]'::jsonb, 4, 21
from event
union all
select event.id, 'longest_reception_ou', 'Player props', 'Longest reception (39.5)', null, 'single_choice',
  '[{"value":"Over 39.5","label":"Over 39.5"},{"value":"Under 39.5","label":"Under 39.5"}]'::jsonb, 4, 22
from event
union all
select event.id, 'mvp_player', 'MVP', 'Super Bowl MVP (player)', null, 'single_choice',
  '[{"value":"Sam Darnold","label":"Sam Darnold"},{"value":"Drake Maye","label":"Drake Maye"},{"value":"Kenneth Walker III","label":"Kenneth Walker III"},{"value":"Rhamondre Stevenson","label":"Rhamondre Stevenson"},{"value":"DK Metcalf","label":"DK Metcalf"},{"value":"Jaxon Smith-Njigba","label":"Jaxon Smith-Njigba"},{"value":"Hunter Henry","label":"Hunter Henry"},{"value":"Other","label":"Other"}]'::jsonb, 10, 23
from event
union all
select event.id, 'mvp_position', 'MVP', 'MVP position', null, 'single_choice',
  '[{"value":"QB","label":"QB"},{"value":"RB","label":"RB"},{"value":"WR/TE","label":"WR/TE"},{"value":"Defense","label":"Defense"}]'::jsonb, 4, 24
from event
union all
select event.id, 'mvp_from_winner', 'MVP', 'MVP from winning team?', null, 'single_choice',
  '[{"value":"Yes","label":"Yes"},{"value":"No","label":"No"}]'::jsonb, 2, 25
from event
union all
select event.id, 'coin_toss', 'Fun', 'Coin toss result', null, 'single_choice',
  '[{"value":"Heads","label":"Heads"},{"value":"Tails","label":"Tails"}]'::jsonb, 0, 26
from event
union all
select event.id, 'anthem_length_ou', 'Fun', 'National anthem length (2:05)', null, 'single_choice',
  '[{"value":"Over 2:05","label":"Over 2:05"},{"value":"Under 2:05","label":"Under 2:05"}]'::jsonb, 0, 27
from event
union all
select event.id, 'first_commercial_category', 'Fun', 'First commercial category', null, 'single_choice',
  '[{"value":"Beer","label":"Beer"},{"value":"Car","label":"Car"},{"value":"Tech","label":"Tech"},{"value":"Movie/TV","label":"Movie/TV"}]'::jsonb, 0, 28
from event
union all
select event.id, 'gatorade_color', 'Fun', 'Gatorade color', null, 'single_choice',
  '[{"value":"Orange","label":"Orange"},{"value":"Yellow","label":"Yellow"},{"value":"Blue","label":"Blue"},{"value":"Clear/None","label":"Clear/None"}]'::jsonb, 0, 29
from event
union all
select event.id, 'proposal', 'Fun', 'On-field proposal?', null, 'single_choice',
  '[{"value":"Yes","label":"Yes"},{"value":"No","label":"No"}]'::jsonb, 0, 30
from event;

commit;
