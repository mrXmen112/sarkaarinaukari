create or replace function public.increment_source_failure(
  p_source_id uuid,
  p_error text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.scrape_sources
     set consecutive_failures = consecutive_failures + 1,
         last_error = left(p_error, 1000)
   where id = p_source_id;
end;
$$;

revoke all on function public.increment_source_failure(uuid, text) from public, anon, authenticated;
grant execute on function public.increment_source_failure(uuid, text) to service_role;
