-- Paste this entire file into Supabase > SQL Editor and run once.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  video_id text not null,
  platform text not null check (platform in ('YouTube','TikTok','Reddit','Facebook')),
  url text not null unique,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 900),
  category text not null check (category in ('Hip-Hop','Funny','Sports','News','Gaming','Other')),
  published boolean not null default false,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists videos_public_recent on public.videos (created_at desc) where published=true;
alter table public.admin_users enable row level security;
alter table public.videos enable row level security;

-- Public visitors can see ONLY live posts.
create policy "Visitors read live videos" on public.videos
 for select to anon, authenticated using (published = true);

-- Admins can see both drafts and published posts.
create policy "Admins read all videos" on public.videos
 for select to authenticated using
 (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));

create policy "Admins insert videos" on public.videos
 for insert to authenticated with check
 (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));

create policy "Admins update videos" on public.videos
 for update to authenticated using
 (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())))
 with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));

create policy "Admins delete videos" on public.videos
 for delete to authenticated using
 (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));

-- Each signed-in user can only look up their OWN admin record.
-- There is deliberately no browser-facing policy to add admin accounts.
create policy "Check own admin role" on public.admin_users
 for select to authenticated using (user_id = (select auth.uid()));

grant select on public.videos to anon;
grant select, insert, update, delete on public.videos to authenticated;
grant select on public.admin_users to authenticated;

-- IMPORTANT: After creating your Supabase Auth user in the dashboard,
-- separately execute this statement in the SQL Editor, replacing the email.
-- DO NOT publish a real owner's email in this public repository.
-- insert into public.admin_users(user_id)
-- select id from auth.users where email = 'YOUR_ADMIN_EMAIL@example.com'
-- on conflict (user_id) do nothing;
