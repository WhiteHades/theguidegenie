drop function if exists public.get_account_bookings();

create function public.get_account_bookings()
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
