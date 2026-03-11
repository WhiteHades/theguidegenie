alter table public.time_slots
  add column if not exists tour_id uuid references public.tours(id) on delete cascade;

create index if not exists idx_time_slots_tour_id on public.time_slots(tour_id);
