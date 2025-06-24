-- ───────────────────────────────
-- 0. Extensions & helper grants
-- ───────────────────────────────
create extension if not exists pgcrypto;      -- gen_random_uuid()

-- ───────────────────────────────
-- 1. USER PROFILES  (auth.login → row in profiles)
-- ───────────────────────────────
create table public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  username   text unique not null,
  avatar_url text,
  snap_score integer default 0,
  avatar_emoji text,
  avatar_color text,
  display_name text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Anyone may read every profile
create policy "Profiles - public read"
  on public.profiles
  for select
  using ( true );

-- A logged-in user may insert / update only their own row
create policy "Profiles - self write"
  on public.profiles
  for all
  using ( auth.uid() = id )
  with check ( auth.uid() = id );

-- ───────────────────────────────
-- 2. FRIENDSHIPS  (user ↔ friend)
-- ───────────────────────────────
create table public.friendships (
  user_id    uuid references public.profiles(id) on delete cascade,
  friend_id  uuid references public.profiles(id) on delete cascade,
  status     text default 'pending', -- pending | accepted
  created_at timestamptz default now(),
  primary key (user_id, friend_id)
);

alter table public.friendships enable row level security;

-- Everybody can read & write anything (open demo)
create policy "Friendships - open"
  on public.friendships
  for all
  using ( true )
  with check ( true );

-- ───────────────────────────────
-- 3. GROUPS & GROUP MEMBERS
-- ───────────────────────────────
create table public.groups (
  id         uuid default gen_random_uuid() primary key,
  owner_id   uuid references public.profiles(id) on delete cascade,
  name       text not null,
  created_at timestamptz default now()
);

create table public.group_members (
  group_id   uuid references public.groups(id)   on delete cascade,
  member_id  uuid references public.profiles(id) on delete cascade,
  primary key (group_id, member_id)
);

alter table public.groups        enable row level security;
alter table public.group_members enable row level security;

create policy "Groups - open"        on public.groups        for all using (true) with check (true);
create policy "GroupMembers - open"  on public.group_members for all using (true) with check (true);

-- ───────────────────────────────
-- 4. POSTS (“Snaps”) & RECIPIENTS
-- ───────────────────────────────
create table public.posts (
  id          uuid default gen_random_uuid() primary key,
  author_id   uuid references public.profiles(id) on delete cascade,
  media_url   text,          -- Storage reference
  media_type  text,          -- image | video
  caption     text,
  created_at  timestamptz default now()
);

create table public.post_recipients (
  post_id      uuid references public.posts(id)    on delete cascade,
  recipient_id uuid references public.profiles(id) on delete cascade,
  primary key (post_id, recipient_id)
);

alter table public.posts            enable row level security;
alter table public.post_recipients  enable row level security;

create policy "Posts - open"           on public.posts           for all using (true) with check (true);
create policy "PostRecipients - open"  on public.post_recipients for all using (true) with check (true);

-- ───────────────────────────────
-- 5. CHAT MESSAGES
-- ───────────────────────────────
create table public.messages (
  id         bigint generated always as identity primary key,
  sender_id  uuid references public.profiles(id) on delete cascade,
  room_id    uuid,              -- friend chat or group
  content    text,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

-- Separate policies for clarity
create policy "Messages - open read"
  on public.messages
  for select
  using ( true );

create policy "Messages - open write"
  on public.messages
  for insert
  with check ( true );

-- ───────────────────────────────
-- 6. OPTIONAL: GRANT anon access
-- (Supabase’s anon role already gets
--  SELECT/INSERT on new tables, but if
--  you run into 42501 errors, run:)
-- ───────────────────────────────
grant all on all tables    in schema public to anon;
grant all on all sequences in schema public to anon;
alter default privileges in schema public
  grant all on tables    to anon;

alter default privileges in schema public
  grant all on sequences to anon;

-- ───────────────────────────────
-- 7. NOTES ON STORAGE
-- ───────────────────────────────
-- 1. Create a Storage bucket named “media” in the Supabase dashboard.
-- 2. Under its Policies tab, add:
--    - “Public read/write” → `true`
-- 3. Client apps upload/download via supabase.storage.from('media')…

-- Done!  Run the whole script and you’ll have
-- a completely open, class-friendly schema.