-- helper to generate secure edit tokens for bookings
create or replace function generate_edit_token()
returns text
language plpgsql
set search_path = extensions, public
as $$
declare
  token text;
begin
  token := encode(extensions.gen_random_bytes(24), 'hex');
  return token;
end;
$$;

-- sample data inserter
-- usage: select insert_sample_data('AUTHUSERUUIDHERE');
create or replace function insert_sample_data(guide_user_id uuid)
returns void
language plpgsql
security definer
set search_path = extensions, public
as $$
declare
  guide_record_id uuid;
  tour_classic_id uuid;
  tour_hidden_id uuid;
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
  )
  returning id into tour_classic_id;

  insert into tours (guide_id, title, description, base_price_cents, is_public)
  values (
    guide_record_id,
    'Hidden Gems of Budapest',
    'discover the secret spots locals love. ruin bars, hidden courtyards, local markets, and lesser-known viewpoints. 2.5 hour adventure off the beaten path.',
    0,
    true
  )
  returning id into tour_hidden_id;

  -- create next 7 days of time slots (morning + afternoon)
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
