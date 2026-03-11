create or replace function public.insert_sample_data(guide_user_id uuid)
returns void
language plpgsql
security definer
set search_path = extensions, public
as $$
declare
  guide_record_id uuid;
begin
  insert into guides (user_id, name, city, contact_email, phone, bio)
  values (
    guide_user_id,
    'Leo the Guide',
    'budapest',
    'leo@guidegenie.com',
    '+36 30 123 4567',
    'passionate local guide showing the best of budapest for 10+ years'
  )
  returning id into guide_record_id;

  insert into tours (guide_id, title, description, base_price_cents, is_public)
  values (
    guide_record_id,
    'Classic Budapest Walking Tour',
    'explore the iconic landmarks of budapest: parliament, chain bridge, st stephens basilica, and more. 3 hour comprehensive tour perfect for first-time visitors.',
    0,
    true
  );

  insert into tours (guide_id, title, description, base_price_cents, is_public)
  values (
    guide_record_id,
    'Hidden Gems of Budapest',
    'discover the secret spots locals love. ruin bars, hidden courtyards, local markets, and lesser-known viewpoints. 2.5 hour adventure off the beaten path.',
    0,
    true
  );

  for day_offset in 0..6 loop
    insert into time_slots (guide_id, start_utc, end_utc, capacity, is_open)
    values (
      guide_record_id,
      (current_date + day_offset + interval '10 hours')::timestamptz,
      (current_date + day_offset + interval '13 hours')::timestamptz,
      8,
      true
    );

    insert into time_slots (guide_id, start_utc, end_utc, capacity, is_open)
    values (
      guide_record_id,
      (current_date + day_offset + interval '15 hours')::timestamptz,
      (current_date + day_offset + interval '18 hours')::timestamptz,
      8,
      true
    );
  end loop;

  raise notice 'sample data created for guide: %', guide_record_id;
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
  user_record record;
begin
  update public.users
  set
    name = trim(next_name),
    phone = nullif(trim(coalesce(next_phone, '')), '')
  where id = (select auth.uid())
  returning * into user_record;

  if not found then
    raise exception 'not_authenticated';
  end if;

  return user_record;
end;
$$;
