-- ============================================================================
-- SarkaariNaukari.online — Initial Schema
-- Phase 1 (Foundation)
--
-- NOTE ON ORDERING: the brief listed `jobs` before `syllabus`, but `jobs`
-- has a FK to `syllabus(id)`. Tables are therefore created in dependency
-- order below. Behaviour is identical to the spec.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at fresh
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. Reference / taxonomy
-- ---------------------------------------------------------------------------

-- central, state, psu, judiciary, teaching, healthcare, local-body
create table if not exists public.job_categories (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text unique not null,
  parent_category text,                       -- e.g. 'state' -> 'bihar'
  sort_order      int  not null default 100,
  created_at      timestamptz not null default now()
);

create index if not exists job_categories_slug_idx   on public.job_categories (slug);
create index if not exists job_categories_parent_idx on public.job_categories (parent_category);

-- ---------------------------------------------------------------------------
-- 2. Syllabus (must precede jobs + exams — both reference it)
-- ---------------------------------------------------------------------------
create table if not exists public.syllabus (
  id         uuid primary key default gen_random_uuid(),
  exam_name  text not null,
  slug       text unique not null,
  subjects   jsonb not null default '[]'::jsonb,  -- structured subject-wise breakdown
  stage      text,                                -- prelims / mains / interview
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists syllabus_slug_idx  on public.syllabus (slug);
create index if not exists syllabus_stage_idx on public.syllabus (stage);

create trigger syllabus_set_updated_at
  before update on public.syllabus
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Jobs (core content table)
-- ---------------------------------------------------------------------------
create table if not exists public.jobs (
  id                    uuid primary key default gen_random_uuid(),
  title                 text not null,
  slug                  text unique not null,
  category_id           uuid references public.job_categories(id) on delete set null,
  state                 text,               -- null = central; 'bihar', 'up', ...
  department            text,
  short_description     text,
  eligibility_education text,
  eligibility_age_min   int,
  eligibility_age_max   int,
  age_relaxation        jsonb default '{}'::jsonb,  -- { "sc_st": 5, "obc": 3, "ews": 0 }
  vacancy_total         int,
  vacancy_breakdown     jsonb default '{}'::jsonb,  -- category-wise counts
  application_fee       jsonb default '{}'::jsonb,  -- { "general": 100, "sc_st": 0 }
  selection_process     text[] default '{}',        -- ['Prelims','Mains','Interview']
  pay_scale             text,
  how_to_apply          text[] default '{}',        -- numbered steps (Section 4.2 #8)
  notification_pdf_link text,
  notification_date     date,
  application_start     date,
  application_end       date not null,
  exam_date             date,
  official_link         text not null,
  syllabus_id           uuid references public.syllabus(id) on delete set null,
  status                text not null default 'active'
                          check (status in ('active','closed','upcoming')),
  source_url            text,               -- provenance, for verification (Section 6)
  is_published          boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint jobs_age_range_chk
    check (eligibility_age_min is null
           or eligibility_age_max is null
           or eligibility_age_min <= eligibility_age_max)
);

-- Indexes: these columns are queried constantly (Section 3 requirement)
create index if not exists jobs_slug_idx            on public.jobs (slug);
create index if not exists jobs_state_idx           on public.jobs (state);
create index if not exists jobs_category_id_idx     on public.jobs (category_id);
create index if not exists jobs_application_end_idx on public.jobs (application_end);
create index if not exists jobs_status_idx          on public.jobs (status);
create index if not exists jobs_created_at_idx      on public.jobs (created_at desc);
-- Composite for the hottest query: active jobs in a state, closing soonest
create index if not exists jobs_status_state_end_idx
  on public.jobs (status, state, application_end);
-- Eligibility auto-match for /profile (Section 4.3)
create index if not exists jobs_age_range_idx
  on public.jobs (eligibility_age_min, eligibility_age_max);

create trigger jobs_set_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Job-derived content: admit cards, results, answer keys
-- ---------------------------------------------------------------------------
create table if not exists public.admit_cards (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid references public.jobs(id) on delete cascade,
  title         text not null,
  slug          text unique not null,
  description   text,
  release_date  date,
  exam_date     date,
  download_link text,
  official_link text,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists admit_cards_slug_idx    on public.admit_cards (slug);
create index if not exists admit_cards_job_id_idx  on public.admit_cards (job_id);
create index if not exists admit_cards_release_idx on public.admit_cards (release_date desc);

create trigger admit_cards_set_updated_at
  before update on public.admit_cards
  for each row execute function public.set_updated_at();


create table if not exists public.results (
  id               uuid primary key default gen_random_uuid(),
  job_id           uuid references public.jobs(id) on delete cascade,
  title            text not null,
  slug             text unique not null,
  description      text,
  result_date      date,
  cutoff_data      jsonb default '{}'::jsonb,   -- category-wise cutoff marks
  merit_list_link  text,
  official_link    text,
  is_published     boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists results_slug_idx   on public.results (slug);
create index if not exists results_job_id_idx on public.results (job_id);
create index if not exists results_date_idx   on public.results (result_date desc);

create trigger results_set_updated_at
  before update on public.results
  for each row execute function public.set_updated_at();


create table if not exists public.answer_keys (
  id                  uuid primary key default gen_random_uuid(),
  job_id              uuid references public.jobs(id) on delete cascade,
  title               text not null,
  slug                text unique not null,
  description         text,
  type                text check (type in ('provisional','final')),
  release_date        date,
  objection_last_date date,
  download_link       text,
  official_link       text,
  is_published        boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists answer_keys_slug_idx    on public.answer_keys (slug);
create index if not exists answer_keys_job_id_idx  on public.answer_keys (job_id);
create index if not exists answer_keys_release_idx on public.answer_keys (release_date desc);

create trigger answer_keys_set_updated_at
  before update on public.answer_keys
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. Sarkari Yojana (schemes)
-- ---------------------------------------------------------------------------
create table if not exists public.yojana (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  slug          text unique not null,
  level         text check (level in ('central','state')),
  state         text,
  description   text,
  benefits_summary text,                    -- short line for the listing table
  eligibility   text,
  benefits      text,
  how_to_apply  text,
  official_link text,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists yojana_slug_idx  on public.yojana (slug);
create index if not exists yojana_level_idx on public.yojana (level);
create index if not exists yojana_state_idx on public.yojana (state);

create trigger yojana_set_updated_at
  before update on public.yojana
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. Competitive exams
-- ---------------------------------------------------------------------------
create table if not exists public.exams (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  slug                 text unique not null,
  short_name           text,
  conducting_body      text,
  overview             text,
  eligibility          text,
  exam_pattern         jsonb default '[]'::jsonb,  -- stage-wise: marks, duration, negative marking
  syllabus_id          uuid references public.syllabus(id) on delete set null,
  preparation_strategy text,
  recommended_books    jsonb default '[]'::jsonb,  -- [{title, author, affiliate_link}]
  previous_year_papers jsonb default '[]'::jsonb,  -- [{year, link}]
  cutoff_trends        jsonb default '[]'::jsonb,
  faqs                 jsonb default '[]'::jsonb,  -- [{question, answer}] -> FAQPage schema
  is_published         boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists exams_slug_idx        on public.exams (slug);
create index if not exists exams_syllabus_id_idx on public.exams (syllabus_id);

create trigger exams_set_updated_at
  before update on public.exams
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. Current affairs
-- ---------------------------------------------------------------------------
create table if not exists public.current_affairs (
  id           uuid primary key default gen_random_uuid(),
  date         date not null,
  title        text,
  slug         text unique,
  content      text,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists current_affairs_date_idx on public.current_affairs (date desc);
create index if not exists current_affairs_slug_idx on public.current_affairs (slug);

create trigger current_affairs_set_updated_at
  before update on public.current_affairs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 8. Quizzes
-- ---------------------------------------------------------------------------
create table if not exists public.quizzes (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  slug         text unique not null,
  subject      text,
  description  text,
  questions    jsonb not null default '[]'::jsonb, -- [{question, options[], correct_index, explanation}]
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists quizzes_slug_idx    on public.quizzes (slug);
create index if not exists quizzes_subject_idx on public.quizzes (subject);

create trigger quizzes_set_updated_at
  before update on public.quizzes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 9. User-facing tables
-- ---------------------------------------------------------------------------
create table if not exists public.user_profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  age        int check (age is null or (age between 10 and 100)),
  education  text,
  category   text check (category is null or category in ('general','obc','sc','st','ews')),
  state      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_profiles_set_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();


create table if not exists public.applied_jobs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  job_id     uuid not null references public.jobs(id) on delete cascade,
  applied_on date not null default current_date,
  status     text not null default 'applied'
               check (status in ('applied','admit_card_downloaded','exam_given','result_awaited')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, job_id)
);

create index if not exists applied_jobs_user_id_idx on public.applied_jobs (user_id);
create index if not exists applied_jobs_job_id_idx  on public.applied_jobs (job_id);

create trigger applied_jobs_set_updated_at
  before update on public.applied_jobs
  for each row execute function public.set_updated_at();


-- ADDITION (not in the original spec): Section 4.3 refers to "applied/saved list"
-- and deadline emails "for saved jobs", which requires a bookmark table.
create table if not exists public.saved_jobs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  job_id     uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, job_id)
);

create index if not exists saved_jobs_user_id_idx on public.saved_jobs (user_id);
create index if not exists saved_jobs_job_id_idx  on public.saved_jobs (job_id);


-- ADDITION (not in the original spec): Section 4.5 says "save score to profile
-- if logged in", which requires somewhere to store attempts.
create table if not exists public.quiz_attempts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  quiz_id      uuid not null references public.quizzes(id) on delete cascade,
  score        int  not null,
  total        int  not null,
  attempted_at timestamptz not null default now()
);

create index if not exists quiz_attempts_user_id_idx on public.quiz_attempts (user_id);
create index if not exists quiz_attempts_quiz_id_idx on public.quiz_attempts (quiz_id);


-- ADDITION (not in the original spec): Phase 10 needs an auth gate for /admin.
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.admin_users a where a.user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- 10. Row Level Security
--
-- Public content: readable by anyone (anon + authenticated).
--                 Writes go through the service-role key (admin panel) which
--                 bypasses RLS, OR through an admin_users membership check.
-- User data:      owner-only, full CRUD.
-- ---------------------------------------------------------------------------

alter table public.job_categories  enable row level security;
alter table public.syllabus        enable row level security;
alter table public.jobs            enable row level security;
alter table public.admit_cards     enable row level security;
alter table public.results         enable row level security;
alter table public.answer_keys     enable row level security;
alter table public.yojana          enable row level security;
alter table public.exams           enable row level security;
alter table public.current_affairs enable row level security;
alter table public.quizzes         enable row level security;
alter table public.user_profiles   enable row level security;
alter table public.applied_jobs    enable row level security;
alter table public.saved_jobs      enable row level security;
alter table public.quiz_attempts   enable row level security;
alter table public.admin_users     enable row level security;

-- Public read on published content
do $$
declare t text;
begin
  foreach t in array array[
    'job_categories','syllabus','jobs','admit_cards','results',
    'answer_keys','yojana','exams','current_affairs','quizzes'
  ]
  loop
    execute format(
      'drop policy if exists "public_read_%1$s" on public.%1$I;', t);
    execute format(
      'create policy "public_read_%1$s" on public.%1$I for select to anon, authenticated using (true);', t);

    execute format(
      'drop policy if exists "admin_write_%1$s" on public.%1$I;', t);
    execute format(
      'create policy "admin_write_%1$s" on public.%1$I for all to authenticated using (public.is_admin()) with check (public.is_admin());', t);
  end loop;
end
$$;

-- Owner-only policies for user data
create policy "own_profile_select" on public.user_profiles
  for select to authenticated using (auth.uid() = id);
create policy "own_profile_insert" on public.user_profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "own_profile_update" on public.user_profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "own_profile_delete" on public.user_profiles
  for delete to authenticated using (auth.uid() = id);

create policy "own_applied_jobs" on public.applied_jobs
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_saved_jobs" on public.saved_jobs
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_quiz_attempts" on public.quiz_attempts
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "admin_users_self_read" on public.admin_users
  for select to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 11. Auto-create a profile row on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 12. Maintenance helper: flip jobs to 'closed' once the last date passes.
--     Call from a pg_cron job or a Supabase Edge Function.
-- ---------------------------------------------------------------------------
create or replace function public.refresh_job_statuses()
returns void
language sql
security definer
set search_path = public
as $$
  update public.jobs
     set status = 'closed'
   where status <> 'closed'
     and application_end < current_date;
$$;
