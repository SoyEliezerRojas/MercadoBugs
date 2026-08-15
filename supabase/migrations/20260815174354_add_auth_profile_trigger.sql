alter table public.profiles
drop constraint profiles_username_unique;

create unique index profiles_username_case_insensitive_unique_idx
on public.profiles (lower(username));

create function public.is_username_available(candidate_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    candidate_username is not null
    and btrim(candidate_username) ~ '^[A-Za-z0-9_]{3,20}$'
    and not exists (
      select 1
      from public.profiles
      where lower(username) = lower(btrim(candidate_username))
    );
$$;

revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text := btrim(new.raw_user_meta_data ->> 'username');
begin
  if requested_username is null
    or requested_username !~ '^[A-Za-z0-9_]{3,20}$'
  then
    raise exception using
      errcode = '23514',
      message = 'invalid_username';
  end if;

  insert into public.profiles (id, username, role)
  values (new.id, requested_username, 'tester');

  return new;
exception
  when unique_violation then
    raise exception using
      errcode = '23505',
      message = 'username_unavailable';
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);
