create extension if not exists pgcrypto;

alter table public.users
  drop column if exists password_hash;

alter table public.guides
  add column if not exists updated_at timestamptz not null default now();

alter table public.tours
  add column if not exists cover_image text,
  add column if not exists duration_minutes integer not null default 180,
  add column if not exists updated_at timestamptz not null default now();

alter table public.time_slots
  add column if not exists updated_at timestamptz not null default now();

alter table public.bookings
  add column if not exists cancelled_at timestamptz,
  add column if not exists manage_token_hash text;

update public.bookings
set manage_token_hash = encode(extensions.digest(edit_token, 'sha256'), 'hex')
where manage_token_hash is null
  and edit_token is not null;

alter table public.time_slots
  alter column tour_id set not null;

alter table public.tours
  drop constraint if exists tours_duration_minutes_check,
  add constraint tours_duration_minutes_check check (duration_minutes > 0);

alter table public.bookings
  alter column manage_token_hash set not null;

drop index if exists public.idx_bookings_token;

alter table public.bookings
  drop constraint if exists bookings_edit_token_key;

alter table public.bookings
  drop column if exists edit_token;

create unique index if not exists bookings_manage_token_hash_key on public.bookings(manage_token_hash);
create index if not exists idx_bookings_slot_status on public.bookings(time_slot_id, status);
create index if not exists idx_tours_guide on public.tours(guide_id);
create index if not exists idx_time_slots_tour_start on public.time_slots(tour_id, start_utc);

create or replace function public.update_updated_at_column()
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

drop trigger if exists update_guides_updated_at on public.guides;
create trigger update_guides_updated_at before update on public.guides
for each row execute function public.update_updated_at_column();

drop trigger if exists update_tours_updated_at on public.tours;
create trigger update_tours_updated_at before update on public.tours
for each row execute function public.update_updated_at_column();

drop trigger if exists update_time_slots_updated_at on public.time_slots;
create trigger update_time_slots_updated_at before update on public.time_slots
for each row execute function public.update_updated_at_column();

create or replace function public.sync_time_slot_guide_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select guide_id
  into new.guide_id
  from public.tours
  where id = new.tour_id;

  if new.guide_id is null then
    raise exception 'tour_not_found';
  end if;

  return new;
end;
$$;

drop trigger if exists sync_time_slot_guide_id on public.time_slots;
create trigger sync_time_slot_guide_id
before insert or update of tour_id on public.time_slots
for each row execute function public.sync_time_slot_guide_id();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_user_type user_type := 'tourist'::user_type;
begin
  begin
    next_user_type := coalesce((new.raw_user_meta_data->>'user_type')::user_type, 'tourist'::user_type);
  exception
    when others then
      next_user_type := 'tourist'::user_type;
  end;

  insert into public.users (id, email, name, user_type)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1), 'user'),
    case when next_user_type = 'admin'::user_type then 'tourist'::user_type else next_user_type end
  )
  on conflict (id) do update
    set email = excluded.email,
        name = excluded.name,
        user_type = case when excluded.user_type = 'admin'::user_type then public.users.user_type else excluded.user_type end;

  return new;
end;
$$;

create or replace function public.generate_manage_token()
returns text
language plpgsql
set search_path = public
as $$
declare
  token text;
begin
  token := encode(extensions.gen_random_bytes(24), 'hex');
  return token;
end;
$$;

create or replace function public.generate_edit_token()
returns text
language sql
set search_path = public
as $$
  select public.generate_manage_token();
$$;

create or replace function public.hash_manage_token(token text)
returns text
language sql
immutable
set search_path = public
as $$
  select encode(extensions.digest(token, 'sha256'), 'hex');
$$;

create or replace function public.get_current_guide_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.guides where user_id = (select auth.uid()) limit 1;
$$;

create or replace function public.is_guide()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.guides where user_id = (select auth.uid())
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.users where id = (select auth.uid()) and user_type = 'admin'
  );
$$;

create or replace function public.become_guide(
  guide_name text,
  guide_city text,
  guide_contact_email text,
  guide_phone text default null,
  guide_bio text default null,
  guide_avatar_url text default null
)
returns public.guides
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_guide record;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  update public.users
  set
    name = trim(guide_name),
    phone = nullif(trim(coalesce(guide_phone, '')), ''),
    user_type = 'guide'::user_type
  where id = current_user_id;

  insert into public.guides (
    user_id,
    name,
    city,
    contact_email,
    phone,
    bio,
    avatar_url
  )
  values (
    current_user_id,
    trim(guide_name),
    trim(guide_city),
    lower(trim(guide_contact_email)),
    nullif(trim(coalesce(guide_phone, '')), ''),
    nullif(trim(coalesce(guide_bio, '')), ''),
    nullif(trim(coalesce(guide_avatar_url, '')), '')
  )
  on conflict (user_id) do update
    set
      name = excluded.name,
      city = excluded.city,
      contact_email = excluded.contact_email,
      phone = excluded.phone,
      bio = excluded.bio,
      avatar_url = coalesce(excluded.avatar_url, public.guides.avatar_url),
      updated_at = now()
  returning * into current_guide;

  return current_guide;
end;
$$;

create or replace function public.update_account_profile(
  next_name text,
  next_phone text default null
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user record;
begin
  update public.users
  set
    name = trim(next_name),
    phone = nullif(trim(coalesce(next_phone, '')), '')
  where id = (select auth.uid())
  returning * into current_user;

  if not found then
    raise exception 'not_authenticated';
  end if;

  return current_user;
end;
$$;

create or replace function public.create_tour_with_slots(
  p_title text,
  p_description text,
  p_category tour_category,
  p_provider_name text,
  p_base_price_cents integer,
  p_tips_enabled boolean,
  p_meeting_point text,
  p_cover_image text,
  p_duration_minutes integer,
  p_is_public boolean,
  p_slots jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_guide_id uuid := public.get_current_guide_id();
  new_tour_id uuid;
begin
  if current_guide_id is null then
    raise exception 'guide_not_found';
  end if;

  if length(trim(coalesce(p_title, ''))) < 5 then
    raise exception 'title_too_short';
  end if;

  if p_duration_minutes is null or p_duration_minutes < 30 then
    raise exception 'duration_invalid';
  end if;

  insert into public.tours (
    guide_id,
    title,
    description,
    category,
    provider_name,
    base_price_cents,
    tips_enabled,
    meeting_point,
    cover_image,
    duration_minutes,
    is_public
  )
  values (
    current_guide_id,
    trim(p_title),
    nullif(trim(coalesce(p_description, '')), ''),
    p_category,
    nullif(trim(coalesce(p_provider_name, '')), ''),
    case when p_category = 'free'::tour_category then null else p_base_price_cents end,
    case when p_category = 'free'::tour_category then true else coalesce(p_tips_enabled, false) end,
    nullif(trim(coalesce(p_meeting_point, '')), ''),
    nullif(trim(coalesce(p_cover_image, '')), ''),
    p_duration_minutes,
    coalesce(p_is_public, true)
  )
  returning id into new_tour_id;

  insert into public.time_slots (
    guide_id,
    tour_id,
    start_utc,
    end_utc,
    capacity,
    is_open
  )
  select
    current_guide_id,
    new_tour_id,
    slot.start_utc,
    slot.end_utc,
    slot.capacity,
    true
  from jsonb_to_recordset(coalesce(p_slots, '[]'::jsonb)) as slot(
    start_utc timestamptz,
    end_utc timestamptz,
    capacity integer
  )
  where slot.start_utc > now()
    and slot.end_utc > slot.start_utc
    and slot.capacity > 0;

  return new_tour_id;
end;
$$;

create or replace function public.get_guide_tours()
returns table (
  id uuid,
  title text,
  description text,
  category tour_category,
  provider_name text,
  base_price_cents integer,
  tips_enabled boolean,
  meeting_point text,
  cover_image text,
  duration_minutes integer,
  is_public boolean,
  created_at timestamptz,
  updated_at timestamptz,
  slot_count bigint,
  upcoming_slot_count bigint,
  confirmed_guest_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.id,
    t.title,
    t.description,
    t.category,
    t.provider_name,
    t.base_price_cents,
    t.tips_enabled,
    t.meeting_point,
    t.cover_image,
    t.duration_minutes,
    t.is_public,
    t.created_at,
    t.updated_at,
    count(distinct ts.id) as slot_count,
    count(distinct ts.id) filter (where ts.start_utc > now()) as upcoming_slot_count,
    coalesce(sum(b.party_size) filter (where b.status = 'confirmed'), 0)::bigint as confirmed_guest_count
  from public.tours t
  left join public.time_slots ts on ts.tour_id = t.id
  left join public.bookings b on b.time_slot_id = ts.id
  where t.guide_id = public.get_current_guide_id()
  group by t.id
  order by t.created_at desc;
$$;

create or replace function public.get_guide_slots()
returns table (
  slot_id uuid,
  tour_id uuid,
  tour_title text,
  start_utc timestamptz,
  end_utc timestamptz,
  capacity integer,
  remaining_capacity integer,
  is_open boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ts.id as slot_id,
    ts.tour_id,
    t.title as tour_title,
    ts.start_utc,
    ts.end_utc,
    ts.capacity,
    greatest(ts.capacity - coalesce(sum(b.party_size) filter (where b.status = 'confirmed'), 0), 0)::integer as remaining_capacity,
    ts.is_open
  from public.time_slots ts
  join public.tours t on t.id = ts.tour_id
  left join public.bookings b on b.time_slot_id = ts.id
  where ts.guide_id = public.get_current_guide_id()
    and ts.start_utc > now()
  group by ts.id, t.id
  order by ts.start_utc asc;
$$;

create or replace function public.get_guide_bookings()
returns table (
  booking_id uuid,
  guest_name text,
  guest_email text,
  guest_phone text,
  party_size integer,
  status booking_status,
  created_at timestamptz,
  slot_id uuid,
  slot_start_utc timestamptz,
  slot_end_utc timestamptz,
  tour_id uuid,
  tour_title text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.id as booking_id,
    b.guest_name,
    b.guest_email,
    b.guest_phone,
    b.party_size,
    b.status,
    b.created_at,
    ts.id as slot_id,
    ts.start_utc as slot_start_utc,
    ts.end_utc as slot_end_utc,
    t.id as tour_id,
    t.title as tour_title
  from public.bookings b
  join public.time_slots ts on ts.id = b.time_slot_id
  join public.tours t on t.id = ts.tour_id
  where ts.guide_id = public.get_current_guide_id()
  order by ts.start_utc asc, b.created_at desc;
$$;

create or replace function public.get_account_bookings()
returns table (
  booking_id uuid,
  status booking_status,
  guest_name text,
  guest_email text,
  guest_phone text,
  party_size integer,
  created_at timestamptz,
  cancelled_at timestamptz,
  slot_id uuid,
  slot_start_utc timestamptz,
  slot_end_utc timestamptz,
  tour_id uuid,
  tour_title text,
  tour_description text,
  tour_category tour_category,
  provider_name text,
  base_price_cents integer,
  tips_enabled boolean,
  meeting_point text,
  cover_image text,
  duration_minutes integer,
  guide_id uuid,
  guide_name text,
  guide_city text,
  guide_contact_email text,
  guide_phone text,
  guide_avatar_url text,
  has_guest_manage_token boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.id as booking_id,
    b.status,
    b.guest_name,
    b.guest_email,
    b.guest_phone,
    b.party_size,
    b.created_at,
    b.cancelled_at,
    ts.id as slot_id,
    ts.start_utc as slot_start_utc,
    ts.end_utc as slot_end_utc,
    t.id as tour_id,
    t.title as tour_title,
    t.description as tour_description,
    t.category as tour_category,
    t.provider_name,
    t.base_price_cents,
    t.tips_enabled,
    t.meeting_point,
    t.cover_image,
    t.duration_minutes,
    g.id as guide_id,
    g.name as guide_name,
    g.city as guide_city,
    g.contact_email as guide_contact_email,
    g.phone as guide_phone,
    g.avatar_url as guide_avatar_url,
    false as has_guest_manage_token
  from public.bookings b
  join public.time_slots ts on ts.id = b.time_slot_id
  join public.tours t on t.id = ts.tour_id
  join public.guides g on g.id = ts.guide_id
  where b.user_id = (select auth.uid())
  order by ts.start_utc asc, b.created_at desc;
$$;

create or replace function public.list_public_tour_slots(p_tour_id uuid)
returns table (
  id uuid,
  tour_id uuid,
  guide_id uuid,
  start_utc timestamptz,
  end_utc timestamptz,
  capacity integer,
  remaining_capacity integer,
  is_open boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ts.id,
    ts.tour_id,
    ts.guide_id,
    ts.start_utc,
    ts.end_utc,
    ts.capacity,
    greatest(ts.capacity - coalesce(sum(b.party_size) filter (where b.status = 'confirmed'), 0), 0)::integer as remaining_capacity,
    ts.is_open
  from public.time_slots ts
  join public.tours t on t.id = ts.tour_id
  left join public.bookings b on b.time_slot_id = ts.id
  where ts.tour_id = p_tour_id
    and t.is_public = true
    and ts.is_open = true
    and ts.start_utc > now()
  group by ts.id
  having greatest(ts.capacity - coalesce(sum(b.party_size) filter (where b.status = 'confirmed'), 0), 0) > 0
  order by ts.start_utc asc;
$$;

create or replace function public.get_public_slot_details(p_slot_id uuid)
returns table (
  slot_id uuid,
  tour_id uuid,
  guide_id uuid,
  start_utc timestamptz,
  end_utc timestamptz,
  capacity integer,
  remaining_capacity integer,
  is_open boolean,
  tour_title text,
  tour_description text,
  tour_category tour_category,
  provider_name text,
  base_price_cents integer,
  tips_enabled boolean,
  meeting_point text,
  cover_image text,
  duration_minutes integer,
  guide_name text,
  guide_city text,
  guide_contact_email text,
  guide_phone text,
  guide_avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ts.id as slot_id,
    ts.tour_id,
    ts.guide_id,
    ts.start_utc,
    ts.end_utc,
    ts.capacity,
    greatest(ts.capacity - coalesce(sum(b.party_size) filter (where b.status = 'confirmed'), 0), 0)::integer as remaining_capacity,
    ts.is_open,
    t.title as tour_title,
    t.description as tour_description,
    t.category as tour_category,
    t.provider_name,
    t.base_price_cents,
    t.tips_enabled,
    t.meeting_point,
    t.cover_image,
    t.duration_minutes,
    g.name as guide_name,
    g.city as guide_city,
    g.contact_email as guide_contact_email,
    g.phone as guide_phone,
    g.avatar_url as guide_avatar_url
  from public.time_slots ts
  join public.tours t on t.id = ts.tour_id
  join public.guides g on g.id = ts.guide_id
  left join public.bookings b on b.time_slot_id = ts.id
  where ts.id = p_slot_id
    and t.is_public = true
    and ts.is_open = true
    and ts.start_utc > now()
  group by ts.id, t.id, g.id;
$$;

create or replace function public.create_booking(
  p_slot_id uuid,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text default null,
  p_party_size integer default 1
)
returns table (
  booking_id uuid,
  manage_token text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  slot_row record;
  confirmed_seats integer := 0;
  new_token text;
begin
  if p_party_size is null or p_party_size < 1 then
    raise exception 'party_size_invalid';
  end if;

  if length(trim(coalesce(p_guest_name, ''))) < 2 then
    raise exception 'guest_name_invalid';
  end if;

  if position('@' in trim(coalesce(p_guest_email, ''))) = 0 then
    raise exception 'guest_email_invalid';
  end if;

  select
    ts.id,
    ts.capacity,
    ts.start_utc,
    ts.is_open,
    ts.guide_id,
    ts.tour_id,
    t.is_public,
    g.user_id as guide_user_id
  into slot_row
  from public.time_slots ts
  join public.tours t on t.id = ts.tour_id
  join public.guides g on g.id = ts.guide_id
  where ts.id = p_slot_id
  for update;

  if not found then
    raise exception 'slot_not_found';
  end if;

  if not slot_row.is_public or not slot_row.is_open or slot_row.start_utc <= now() then
    raise exception 'slot_unavailable';
  end if;

  if (select auth.uid()) is not null and slot_row.guide_user_id = (select auth.uid()) then
    raise exception 'cannot_book_own_tour';
  end if;

  select coalesce(sum(party_size), 0)
  into confirmed_seats
  from public.bookings
  where time_slot_id = p_slot_id
    and status = 'confirmed';

  if confirmed_seats + p_party_size > slot_row.capacity then
    raise exception 'slot_full';
  end if;

  new_token := public.generate_manage_token();

  insert into public.bookings (
    time_slot_id,
    user_id,
    guest_name,
    guest_email,
    guest_phone,
    party_size,
    status,
    manage_token_hash
  )
  values (
    p_slot_id,
    (select auth.uid()),
    trim(p_guest_name),
    lower(trim(p_guest_email)),
    nullif(trim(coalesce(p_guest_phone, '')), ''),
    p_party_size,
    'confirmed'::booking_status,
    public.hash_manage_token(new_token)
  )
  returning id into booking_id;

  manage_token := new_token;
  return next;
end;
$$;

create or replace function public.get_guest_booking(
  p_booking_id uuid,
  p_manage_token text
)
returns table (
  booking_id uuid,
  status booking_status,
  guest_name text,
  guest_email text,
  guest_phone text,
  party_size integer,
  created_at timestamptz,
  cancelled_at timestamptz,
  slot_id uuid,
  slot_start_utc timestamptz,
  slot_end_utc timestamptz,
  tour_id uuid,
  tour_title text,
  tour_description text,
  tour_category tour_category,
  provider_name text,
  base_price_cents integer,
  tips_enabled boolean,
  meeting_point text,
  cover_image text,
  duration_minutes integer,
  guide_id uuid,
  guide_name text,
  guide_city text,
  guide_contact_email text,
  guide_phone text,
  guide_avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.id as booking_id,
    b.status,
    b.guest_name,
    b.guest_email,
    b.guest_phone,
    b.party_size,
    b.created_at,
    b.cancelled_at,
    ts.id as slot_id,
    ts.start_utc as slot_start_utc,
    ts.end_utc as slot_end_utc,
    t.id as tour_id,
    t.title as tour_title,
    t.description as tour_description,
    t.category as tour_category,
    t.provider_name,
    t.base_price_cents,
    t.tips_enabled,
    t.meeting_point,
    t.cover_image,
    t.duration_minutes,
    g.id as guide_id,
    g.name as guide_name,
    g.city as guide_city,
    g.contact_email as guide_contact_email,
    g.phone as guide_phone,
    g.avatar_url as guide_avatar_url
  from public.bookings b
  join public.time_slots ts on ts.id = b.time_slot_id
  join public.tours t on t.id = ts.tour_id
  join public.guides g on g.id = ts.guide_id
  where b.id = p_booking_id
    and b.manage_token_hash = public.hash_manage_token(p_manage_token)
  limit 1;
$$;

create or replace function public.get_booking_details(
  p_booking_id uuid,
  p_manage_token text default null
)
returns table (
  booking_id uuid,
  status booking_status,
  guest_name text,
  guest_email text,
  guest_phone text,
  party_size integer,
  created_at timestamptz,
  cancelled_at timestamptz,
  slot_id uuid,
  slot_start_utc timestamptz,
  slot_end_utc timestamptz,
  tour_id uuid,
  tour_title text,
  tour_description text,
  tour_category tour_category,
  provider_name text,
  base_price_cents integer,
  tips_enabled boolean,
  meeting_point text,
  cover_image text,
  duration_minutes integer,
  guide_id uuid,
  guide_name text,
  guide_city text,
  guide_contact_email text,
  guide_phone text,
  guide_avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.id as booking_id,
    b.status,
    b.guest_name,
    b.guest_email,
    b.guest_phone,
    b.party_size,
    b.created_at,
    b.cancelled_at,
    ts.id as slot_id,
    ts.start_utc as slot_start_utc,
    ts.end_utc as slot_end_utc,
    t.id as tour_id,
    t.title as tour_title,
    t.description as tour_description,
    t.category as tour_category,
    t.provider_name,
    t.base_price_cents,
    t.tips_enabled,
    t.meeting_point,
    t.cover_image,
    t.duration_minutes,
    g.id as guide_id,
    g.name as guide_name,
    g.city as guide_city,
    g.contact_email as guide_contact_email,
    g.phone as guide_phone,
    g.avatar_url as guide_avatar_url
  from public.bookings b
  join public.time_slots ts on ts.id = b.time_slot_id
  join public.tours t on t.id = ts.tour_id
  join public.guides g on g.id = ts.guide_id
  where b.id = p_booking_id
    and (
      b.user_id = (select auth.uid())
      or (
        p_manage_token is not null
        and b.manage_token_hash = public.hash_manage_token(p_manage_token)
      )
    )
  limit 1;
$$;

create or replace function public.cancel_booking(
  p_booking_id uuid,
  p_manage_token text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  booking_row record;
begin
  select b.*
  into booking_row
  from public.bookings b
  join public.time_slots ts on ts.id = b.time_slot_id
  where b.id = p_booking_id
    and (
      (select auth.uid()) = b.user_id
      or (
        p_manage_token is not null
        and b.manage_token_hash = public.hash_manage_token(p_manage_token)
      )
    )
  for update;

  if not found then
    raise exception 'booking_not_found';
  end if;

  if booking_row.status <> 'confirmed'::booking_status then
    return booking_row;
  end if;

  if exists (
    select 1
    from public.time_slots ts
    where ts.id = booking_row.time_slot_id
      and ts.start_utc <= now()
  ) then
    raise exception 'booking_started';
  end if;

  update public.bookings
  set
    status = 'cancelled'::booking_status,
    cancelled_at = now()
  where id = booking_row.id
  returning * into booking_row;

  return booking_row;
end;
$$;

drop policy if exists "authenticated users can create own profile" on public.users;
drop policy if exists "users can read own profile" on public.users;
drop policy if exists "users can update own profile" on public.users;

drop policy if exists "authenticated users can create guide profile" on public.guides;
drop policy if exists "guides can update own profile" on public.guides;
drop policy if exists "public can read guides" on public.guides;

drop policy if exists "public can read public tours" on public.tours;
drop policy if exists "guides can read own tours" on public.tours;
drop policy if exists "guides can create tours" on public.tours;
drop policy if exists "guides can update own tours" on public.tours;
drop policy if exists "guides can delete own tours" on public.tours;

drop policy if exists "public can read open time slots" on public.time_slots;
drop policy if exists "guides can read own time slots" on public.time_slots;
drop policy if exists "guides can create time slots" on public.time_slots;
drop policy if exists "guides can update own time slots" on public.time_slots;
drop policy if exists "guides can delete own time slots" on public.time_slots;

drop policy if exists "anyone can create bookings" on public.bookings;
drop policy if exists "users can read own bookings" on public.bookings;
drop policy if exists "anyone can read bookings" on public.bookings;
drop policy if exists "guides can read bookings for their slots" on public.bookings;
drop policy if exists "users can update own bookings" on public.bookings;
drop policy if exists "users can cancel own bookings" on public.bookings;

create policy "users can read own profile"
on public.users for select
to authenticated
using (id = (select auth.uid()));

create policy "users can create own profile"
on public.users for insert
to authenticated
with check (
  id = (select auth.uid())
  and email = coalesce((select auth.jwt()->>'email'), email)
  and user_type in ('tourist'::user_type, 'guide'::user_type)
);

create policy "public can read guides"
on public.guides for select
to anon, authenticated
using (true);

create policy "guides can update own profile"
on public.guides for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "public can read public tours"
on public.tours for select
to anon, authenticated
using (is_public = true);

create policy "guides can read own tours"
on public.tours for select
to authenticated
using (guide_id = public.get_current_guide_id());

create policy "guides can create tours"
on public.tours for insert
to authenticated
with check (guide_id = public.get_current_guide_id());

create policy "guides can update own tours"
on public.tours for update
to authenticated
using (guide_id = public.get_current_guide_id())
with check (guide_id = public.get_current_guide_id());

create policy "guides can delete own tours"
on public.tours for delete
to authenticated
using (guide_id = public.get_current_guide_id());

create policy "public can read public open time slots"
on public.time_slots for select
to anon, authenticated
using (
  is_open = true
  and start_utc > now()
  and exists (
    select 1 from public.tours t
    where t.id = time_slots.tour_id
      and t.is_public = true
  )
);

create policy "guides can read own time slots"
on public.time_slots for select
to authenticated
using (guide_id = public.get_current_guide_id());

create policy "guides can create own time slots"
on public.time_slots for insert
to authenticated
with check (
  tour_id in (
    select id from public.tours where guide_id = public.get_current_guide_id()
  )
);

create policy "guides can update own time slots"
on public.time_slots for update
to authenticated
using (guide_id = public.get_current_guide_id())
with check (
  tour_id in (
    select id from public.tours where guide_id = public.get_current_guide_id()
  )
);

create policy "guides can delete own time slots"
on public.time_slots for delete
to authenticated
using (guide_id = public.get_current_guide_id());

create policy "users can read own bookings"
on public.bookings for select
to authenticated
using (user_id = (select auth.uid()));

create policy "guides can read own slot bookings"
on public.bookings for select
to authenticated
using (
  exists (
    select 1
    from public.time_slots ts
    where ts.id = bookings.time_slot_id
      and ts.guide_id = public.get_current_guide_id()
  )
);
