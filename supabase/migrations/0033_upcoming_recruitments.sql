-- ===========================================================================
-- 0033_upcoming_recruitments.sql
-- Four distinct discovery statuses are represented by a status + source kind.
-- No vacancy numbers or eligibility are stored unless an official notice says
-- them; those fields stay NULL and the UI shows "detailed notification awaited".
-- ===========================================================================

create table if not exists public.upcoming_recruitments (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  dedupe_key text unique not null,
  title text not null,
  organization text not null,
  level text not null check (level in ('central','state','ut')),
  state text,
  category text,
  status text not null check (status in (
    'application_open','notification_scheduled','notification_expected',
    'application_opening_soon','examination_scheduled','application_closed',
    'cancelled','result_declared'
  )),
  date_confidence text not null default 'confirmed' check (date_confidence in ('confirmed','tentative')),
  notification_date date,
  application_start date,
  application_end date,
  exam_date date,
  calendar_url text,
  notification_url text,
  apply_url text,
  source_url text not null,
  eligibility_note text,
  last_verified_at timestamptz not null default now(),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists upcoming_status_idx on public.upcoming_recruitments (status, notification_date);
create index if not exists upcoming_level_state_idx on public.upcoming_recruitments (level, state);
create index if not exists upcoming_exam_date_idx on public.upcoming_recruitments (exam_date);
create index if not exists upcoming_published_idx on public.upcoming_recruitments (is_published) where is_published;

alter table public.upcoming_recruitments enable row level security;
drop policy if exists "public reads upcoming recruitments" on public.upcoming_recruitments;
create policy "public reads upcoming recruitments" on public.upcoming_recruitments
  for select using (is_published);
grant select on public.upcoming_recruitments to anon, authenticated;

create or replace function public.set_upcoming_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists upcoming_set_updated_at on public.upcoming_recruitments;
create trigger upcoming_set_updated_at before update on public.upcoming_recruitments
  for each row execute function public.set_upcoming_updated_at();
