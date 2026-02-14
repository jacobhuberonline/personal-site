begin;

drop function if exists public.recompute_superbowl_scores(uuid);
drop function if exists public.get_superbowl_leaderboard(uuid);
drop function if exists public.superbowl_participant_summary(uuid);
drop function if exists public.can_view_leaderboard_answers(uuid);
drop function if exists public.can_view_leaderboard_event(uuid);
drop function if exists public.can_edit_entry(uuid);
drop function if exists public.can_create_entry(uuid);
drop function if exists public.is_site_admin();

drop table if exists public.superbowl_scores cascade;
drop table if exists public.superbowl_results cascade;
drop table if exists public.superbowl_answers cascade;
drop table if exists public.superbowl_entries cascade;
drop table if exists public.superbowl_questions cascade;
drop table if exists public.superbowl_events cascade;
drop table if exists public.site_admins cascade;

commit;
