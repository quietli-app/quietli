create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.blips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 240),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.blips enable row level security;

create policy if not exists "Profiles are viewable by everyone"
on public.profiles for select
using (true);

create policy if not exists "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy if not exists "Users can update own profile"
on public.profiles for update
using (auth.uid() = id);

create policy if not exists "Blips are viewable by everyone"
on public.blips for select
using (true);

create policy if not exists "Users can insert own blips"
on public.blips for insert
with check (auth.uid() = user_id);

create policy if not exists "Users can update own blips"
on public.blips for update
using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    lower(regexp_replace(split_part(coalesce(new.email, new.id::text), '@', 1), '[^a-zA-Z0-9_]', '', 'g')),
    null
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage policies for avatars bucket
create policy if not exists "Avatar images are publicly viewable"
on storage.objects
for select
using (bucket_id = 'avatars');

create policy if not exists "Authenticated users can upload avatar images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'avatars');

create policy if not exists "Authenticated users can update avatar images"
on storage.objects
for update
to authenticated
using (bucket_id = 'avatars')
with check (bucket_id = 'avatars');

create policy if not exists "Authenticated users can delete avatar images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'avatars');
