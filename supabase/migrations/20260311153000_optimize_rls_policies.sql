drop policy if exists "users can read own bookings" on public.bookings;
drop policy if exists "guides can read own slot bookings" on public.bookings;

create policy "authenticated users can read relevant bookings"
on public.bookings for select
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.time_slots ts
    where ts.id = bookings.time_slot_id
      and ts.guide_id = public.get_current_guide_id()
  )
);

drop policy if exists "public can read public tours" on public.tours;
drop policy if exists "guides can read own tours" on public.tours;

create policy "public can read relevant tours"
on public.tours for select
to anon, authenticated
using (
  is_public = true
  or guide_id = public.get_current_guide_id()
);

drop policy if exists "public can read public open time slots" on public.time_slots;
drop policy if exists "guides can read own time slots" on public.time_slots;

create policy "public can read relevant time slots"
on public.time_slots for select
to anon, authenticated
using (
  guide_id = public.get_current_guide_id()
  or (
    is_open = true
    and start_utc > now()
    and exists (
      select 1
      from public.tours t
      where t.id = time_slots.tour_id
        and t.is_public = true
    )
  )
);

drop policy if exists "users can create own profile" on public.users;

create policy "users can create own profile"
on public.users for insert
to authenticated
with check (
  id = (select auth.uid())
  and email = coalesce((select auth.jwt()->>'email'), email)
  and user_type in ('tourist'::user_type, 'guide'::user_type)
);
