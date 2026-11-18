-- RSverse Complete PostgreSQL Schema & Row Level Security (Supabase)
-- Tagline: "Two Players. One Universe. Infinite Memories."

create extension if not exists "pgcrypto";

-- 1. Authorized Users (Strict 2-player universe lock)
create table if not exists public.authorized_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text not null check (role in ('creator', 'partner')),
  added_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Enforce max 2 authorized users at the database level
create or replace function public.enforce_two_authorized_users()
returns trigger as $$
begin
  if (select count(*) from public.authorized_users) >= 2 then
    raise exception 'RSverse is strictly limited to two authorized users.';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_max_two_users on public.authorized_users;
create trigger trg_max_two_users
before insert on public.authorized_users
for each row execute function public.enforce_two_authorized_users();

-- Helper function for RLS
create or replace function public.is_authorized_player()
returns boolean as $$
  select exists (
    select 1 from public.authorized_users au
    where lower(au.email) = lower(auth.jwt() ->> 'email')
  );
$$ language sql security definer stable;

-- 2. Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_url text,
  bio text default '',
  is_online boolean not null default false,
  last_seen timestamptz not null default now(),
  theme_preference text not null default 'dark' check (theme_preference in ('dark', 'light')),
  sound_enabled boolean not null default true,
  music_enabled boolean not null default false,
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Games Catalog
create table if not exists public.games (
  id text primary key,
  slug text unique not null,
  name text not null,
  category text not null,
  description text not null,
  min_players int not null default 2,
  max_players int not null default 2,
  created_at timestamptz not null default now()
);

-- 4. Rooms
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique not null,
  host_id uuid not null references public.profiles(id) on delete cascade,
  selected_game_id text references public.games(id),
  status text not null default 'waiting' check (status in ('waiting', 'ready', 'playing', 'completed', 'expired')),
  settings jsonb not null default '{}'::jsonb,
  active_session_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_rooms_invite_code on public.rooms(invite_code);
create index if not exists idx_rooms_status on public.rooms(status);

-- 5. Room Players
create table if not exists public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  is_ready boolean not null default false,
  is_connected boolean not null default true,
  joined_at timestamptz not null default now(),
  unique (room_id, user_id)
);

create index if not exists idx_room_players_user on public.room_players(user_id);

-- 6. Game Sessions (Authoritative Server/Edge-Validated State)
create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  game_id text not null references public.games(id),
  state jsonb not null default '{}'::jsonb,
  secret_state jsonb not null default '{}'::jsonb,
  scores jsonb not null default '{}'::jsonb,
  current_turn uuid references public.profiles(id),
  winner_id uuid references public.profiles(id),
  is_draw boolean not null default false,
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  round_number int not null default 1,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists idx_game_sessions_room on public.game_sessions(room_id);

-- 7. Game Moves
create table if not exists public.game_moves (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  move_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_game_moves_session on public.game_moves(session_id, created_at);

-- 8. Game Scores
create table if not exists public.game_scores (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id text not null references public.games(id),
  points int not null default 0,
  outcome text not null check (outcome in ('win', 'loss', 'draw')),
  created_at timestamptz not null default now(),
  unique (session_id, user_id)
);

create index if not exists idx_game_scores_session on public.game_scores(session_id);
create index if not exists idx_game_scores_user on public.game_scores(user_id, created_at desc);

-- 9. Chat Messages
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  message_type text not null default 'text' check (message_type in ('text', 'emoji', 'system')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_messages_created on public.chat_messages(created_at desc);

-- 10. Memories
create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  caption text default '',
  personal_note text default '',
  special_date date not null,
  image_path text not null,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_memories_date on public.memories(special_date desc);

-- 11. Achievements Catalog
create table if not exists public.achievements (
  id text primary key,
  title text not null,
  description text not null,
  icon text not null,
  points int not null default 50
);

-- 12. User Achievements
create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id text not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);

create index if not exists idx_user_achievements_user on public.user_achievements(user_id);

-- 13. Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id, is_read, created_at desc);

-- 14. Custom Prompts (Truth or Dare / Who Knows Who)
create table if not exists public.custom_prompts (
  id uuid primary key default gen_random_uuid(),
  game_id text not null check (game_id in ('truth-or-dare', 'who-knows-who')),
  category text not null,
  prompt_type text not null,
  content text not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Row Level Security Policies
alter table public.authorized_users enable row level security;
alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.game_sessions enable row level security;
alter table public.game_moves enable row level security;
alter table public.game_scores enable row level security;
alter table public.chat_messages enable row level security;
alter table public.memories enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.notifications enable row level security;
alter table public.custom_prompts enable row level security;

create policy "Authorized read authorized_users" on public.authorized_users for select using (public.is_authorized_player());
create policy "Authorized read profiles" on public.profiles for select using (public.is_authorized_player());
create policy "Own update profile" on public.profiles for update using (auth.uid() = id and public.is_authorized_player());
create policy "Own insert profile" on public.profiles for insert with check (auth.uid() = id and public.is_authorized_player());

create policy "Authorized read games" on public.games for select using (public.is_authorized_player());
create policy "Authorized all rooms" on public.rooms for all using (public.is_authorized_player()) with check (public.is_authorized_player());
create policy "Authorized all room_players" on public.room_players for all using (public.is_authorized_player()) with check (public.is_authorized_player());
create policy "Authorized read sessions" on public.game_sessions for select using (public.is_authorized_player());
create policy "Authorized read moves" on public.game_moves for select using (public.is_authorized_player());
create policy "Authorized read scores" on public.game_scores for select using (public.is_authorized_player());
create policy "Authorized chat read" on public.chat_messages for select using (public.is_authorized_player());
create policy "Authorized chat insert" on public.chat_messages for insert with check (auth.uid() = sender_id and public.is_authorized_player());
create policy "Authorized chat update read" on public.chat_messages for update using (public.is_authorized_player()) with check (public.is_authorized_player());
create policy "Authorized memories all" on public.memories for all using (public.is_authorized_player()) with check (public.is_authorized_player());
create policy "Authorized achievements read" on public.achievements for select using (public.is_authorized_player());
create policy "Authorized user_achievements read" on public.user_achievements for select using (public.is_authorized_player());
create policy "Own notifications" on public.notifications for all using (auth.uid() = user_id and public.is_authorized_player()) with check (auth.uid() = user_id and public.is_authorized_player());
create policy "Authorized custom_prompts all" on public.custom_prompts for all using (public.is_authorized_player()) with check (auth.uid() = author_id and public.is_authorized_player());

-- Storage Buckets & RLS (Private avatars and memories)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false), ('memories', 'memories', false)
on conflict (id) do nothing;

create policy "Authorized media select"
on storage.objects for select
using (bucket_id in ('avatars', 'memories') and public.is_authorized_player());

create policy "Authorized media insert"
on storage.objects for insert
with check (bucket_id in ('avatars', 'memories') and public.is_authorized_player());

create policy "Authorized media delete"
on storage.objects for delete
using (bucket_id in ('avatars', 'memories') and public.is_authorized_player());

