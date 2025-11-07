create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create type user_type as enum ('tourist', 'guide', 'admin');
create type booking_status as enum ('confirmed', 'cancelled');

-- users: tourists (optional account), guides (required account), admins
create table users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  password_hash text,
  user_type user_type not null default 'tourist',
  name text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table guides (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique references users(id) on delete cascade,
  name text not null,
  city text not null,
  contact_email text not null,
  phone text,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table tours (
  id uuid primary key default uuid_generate_v4(),
  guide_id uuid references guides(id) on delete cascade not null,
  title text not null,
  description text,
  base_price_cents int,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table time_slots (
  id uuid primary key default uuid_generate_v4(),
  guide_id uuid references guides(id) on delete cascade not null,
  start_utc timestamptz not null,
  end_utc timestamptz not null,
  capacity int not null default 1 check (capacity > 0),
  is_open boolean not null default true,
  constraint unique_guide_time unique (guide_id, start_utc),
  constraint valid_time_range check (end_utc > start_utc)
);

create table bookings (
  id uuid primary key default uuid_generate_v4(),
  time_slot_id uuid references time_slots(id) on delete restrict not null,
  user_id uuid references users(id) on delete set null,
  guest_name text not null,
  guest_email text not null,
  guest_phone text,
  party_size int not null default 1 check (party_size > 0),
  status booking_status not null default 'confirmed',
  edit_token text unique not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_time_slots_guide_start on time_slots(guide_id, start_utc);
create index idx_bookings_time_slot on bookings(time_slot_id);
create index idx_bookings_user on bookings(user_id) where user_id is not null;
create index idx_bookings_token on bookings(edit_token);
create index idx_guides_user on guides(user_id);

create or replace function update_updated_at_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_users_updated_at before update on users
  for each row execute function update_updated_at_column();
  
create trigger update_bookings_updated_at before update on bookings
  for each row execute function update_updated_at_column();
