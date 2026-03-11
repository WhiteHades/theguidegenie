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
    next_user_type
  )
  on conflict (id) do update
    set email = excluded.email,
        user_type = excluded.user_type;

  return new;
end;
$$;
