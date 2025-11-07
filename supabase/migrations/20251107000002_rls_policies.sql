alter table users enable row level security;
alter table guides enable row level security;
alter table tours enable row level security;
alter table time_slots enable row level security;
alter table bookings enable row level security;

-- users
create policy "users can read own profile"
on users for select
to authenticated
using (auth.uid() = id);

create policy "users can update own profile"
on users for update
to authenticated
using (auth.uid() = id);

create policy "authenticated users can create own profile"
on users for insert
to authenticated
with check (auth.uid() = id);

-- guides
create policy "public can read guides"
on guides for select
to anon, authenticated
using (true);

create policy "guides can update own profile"
on guides for update
to authenticated
using (user_id = auth.uid());

create policy "authenticated users can create guide profile"
on guides for insert
to authenticated
with check (user_id = auth.uid());

-- tours
create policy "public can read public tours"
on tours for select
to anon, authenticated
using (is_public = true);

create policy "guides can read own tours"
on tours for select
to authenticated
using (
  guide_id in (
    select id from guides where user_id = auth.uid()
  )
);

create policy "guides can create tours"
on tours for insert
to authenticated
with check (
  guide_id in (
    select id from guides where user_id = auth.uid()
  )
);

create policy "guides can update own tours"
on tours for update
to authenticated
using (
  guide_id in (
    select id from guides where user_id = auth.uid()
  )
);

create policy "guides can delete own tours"
on tours for delete
to authenticated
using (
  guide_id in (
    select id from guides where user_id = auth.uid()
  )
);

-- time slots
create policy "public can read open time slots"
on time_slots for select
to anon, authenticated
using (is_open = true);

create policy "guides can read own time slots"
on time_slots for select
to authenticated
using (
  guide_id in (
    select id from guides where user_id = auth.uid()
  )
);

create policy "guides can create time slots"
on time_slots for insert
to authenticated
with check (
  guide_id in (
    select id from guides where user_id = auth.uid()
  )
);

create policy "guides can update own time slots"
on time_slots for update
to authenticated
using (
  guide_id in (
    select id from guides where user_id = auth.uid()
  )
);

create policy "guides can delete own time slots"
on time_slots for delete
to authenticated
using (
  guide_id in (
    select id from guides where user_id = auth.uid()
  )
);

-- bookings
create policy "anyone can create bookings"
on bookings for insert
to anon, authenticated
with check (true);

create policy "users can read own bookings"
on bookings for select
to authenticated
using (user_id = auth.uid());

-- tokenless guests: client filters by edit_token in query
create policy "anyone can read bookings"
on bookings for select
to anon, authenticated
using (true);

create policy "guides can read bookings for their slots"
on bookings for select
to authenticated
using (
  time_slot_id in (
    select ts.id 
    from time_slots ts
    join guides g on g.id = ts.guide_id
    where g.user_id = auth.uid()
  )
);

create policy "users can update own bookings"
on bookings for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "users can cancel own bookings"
on bookings for update
to authenticated
using (
  user_id = auth.uid() and
  status = 'confirmed'
)
with check (
  user_id = auth.uid() and
  status in ('confirmed', 'cancelled')
);

-- helpers
create or replace function get_current_guide_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from guides where user_id = auth.uid() limit 1;
$$;

create or replace function is_guide()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1 from guides where user_id = auth.uid()
  );
$$;

create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1 from users 
    where id = auth.uid() and user_type = 'admin'
  );
$$;
