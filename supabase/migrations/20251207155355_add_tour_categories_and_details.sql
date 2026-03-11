do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'tour_category'
  ) then
    create type tour_category as enum ('free', 'paid', 'boat', 'museum');
  end if;
end;
$$;

alter table public.tours
  add column if not exists category tour_category default 'paid'::tour_category,
  add column if not exists provider_name text,
  add column if not exists tips_enabled boolean default false,
  add column if not exists meeting_point text;

create index if not exists idx_tours_category on public.tours(category);
