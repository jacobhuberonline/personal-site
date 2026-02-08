# Personal Site

## Super Bowl Props

### Migrations
- Apply the new schema with your Supabase workflow (for CLI users: `supabase db push`).

### Admin setup
- After your first login, add yourself as an admin:
  ```sql
  insert into public.site_admins (user_id) values ('<your-auth-user-id>');
  ```

### Local testing
- Start the dev server: `npm run dev`.
- Log in at `/superbowl/login` (OTP), then visit `/superbowl`.
- Make a draft, submit picks, and verify the leaderboard behavior before/after kickoff.
- As an admin, enter results at `/superbowl/admin` and recompute scores.
