-- 습관 트래커
create table habits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  icon text default '✅',
  color text default '#9ab4f2',
  created_at timestamptz default now()
);

create table habit_logs (
  id uuid default gen_random_uuid() primary key,
  habit_id uuid references habits(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null default current_date,
  completed boolean default true,
  created_at timestamptz default now(),
  unique(habit_id, date)
);

-- 달력/일정
create table events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  date date not null,
  start_time time,
  end_time time,
  memo text default '',
  color text default '#9ab4f2',
  created_at timestamptz default now()
);

-- 북마크
create table bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  url text not null,
  title text not null,
  description text default '',
  category text default '기타',
  favicon_url text,
  created_at timestamptz default now()
);

-- RLS 활성화
alter table habits enable row level security;
alter table habit_logs enable row level security;
alter table events enable row level security;
alter table bookmarks enable row level security;

-- RLS 정책: 본인 데이터만 접근
create policy "Users can manage own habits" on habits
  for all using (auth.uid() = user_id);

create policy "Users can manage own habit_logs" on habit_logs
  for all using (auth.uid() = user_id);

create policy "Users can manage own events" on events
  for all using (auth.uid() = user_id);

create policy "Users can manage own bookmarks" on bookmarks
  for all using (auth.uid() = user_id);
