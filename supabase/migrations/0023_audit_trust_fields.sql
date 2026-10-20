-- 0023_audit_trust_fields.sql
--
-- Audit-fix foundation (2026-10-20). ADDITIVE ONLY — no drops, no deletes.
--
-- Adds the trust/verification and released-date fields needed by the P0 work:
--   * jobs: separate official apply / notification / site URLs + verification flags
--   * jobs: content type (job | entrance | admission | scholarship)
--   * admit_cards / results / answer_keys: status (upcoming | released) + released_at
--
-- Snapshots of every touched table are written to the `backup` schema first.
-- That schema is not exposed through the Supabase API (grants revoked).
--
-- Rollback (manual, only if needed):
--   alter table public.jobs
--     drop column if exists official_apply_url,
--     drop column if exists official_notification_url,
--     drop column if exists official_site_url,
--     drop column if exists apply_link_verified,
--     drop column if exists last_verified_at,
--     drop column if exists source_verified,
--     drop column if exists type;
--   alter table public.admit_cards drop column if exists status, drop column if exists released_at;
--   alter table public.results drop column if exists status, drop column if exists released_at;
--   alter table public.answer_keys drop column if exists status, drop column if exists released_at;
--   drop schema if exists backup cascade;

begin;

/* ------------------------------------------------------------------ */
/* 1. Backups                                                          */
/* ------------------------------------------------------------------ */

create schema if not exists backup;
revoke all on schema backup from anon, authenticated;

create table if not exists backup.jobs_20261020 as select * from public.jobs;
create table if not exists backup.admit_cards_20261020 as select * from public.admit_cards;
create table if not exists backup.results_20261020 as select * from public.results;
create table if not exists backup.answer_keys_20261020 as select * from public.answer_keys;

revoke all on all tables in schema backup from anon, authenticated;

/* ------------------------------------------------------------------ */
/* 2. Jobs: official destinations + trust flags                        */
/* ------------------------------------------------------------------ */

alter table public.jobs
  add column if not exists official_apply_url text,
  add column if not exists official_notification_url text,
  add column if not exists official_site_url text,
  add column if not exists apply_link_verified boolean not null default false,
  add column if not exists last_verified_at timestamptz,
  add column if not exists source_verified boolean not null default false,
  add column if not exists type text not null default 'job';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'jobs_type_check'
  ) then
    alter table public.jobs
      add constraint jobs_type_check
      check (type in ('job', 'entrance', 'admission', 'scholarship'));
  end if;
end $$;

comment on column public.jobs.official_apply_url is
  'Direct official apply/registration URL. NULL = not established yet.';
comment on column public.jobs.apply_link_verified is
  'True only after a human opened the apply URL and confirmed it is the official application page.';
comment on column public.jobs.last_verified_at is
  'When a human last verified the apply/notification links (independent of automated link checks).';
comment on column public.jobs.source_verified is
  'True only when vacancy/fee/salary/dates were checked against the official notification.';
comment on column public.jobs.type is
  'Content type: job, entrance, admission, scholarship. Non-job rows must not appear in job counts/lists.';

-- `official_link` was already used as the apply URL by src/lib/linkCheck.ts.
-- Preserve that meaning without marking anything verified.
update public.jobs
set official_apply_url = official_link
where official_apply_url is null
  and official_link is not null;

update public.jobs
set official_notification_url = notification_pdf_link
where official_notification_url is null
  and notification_pdf_link is not null;

-- Known miscategorised row called out in the audit. All other rows keep the
-- default 'job' until the audit script / human review classifies them.
update public.jobs
set type = 'entrance'
where slug = 'bihar-deled-2026';

create index if not exists jobs_type_status_idx
  on public.jobs (type, status) where is_published;
create index if not exists jobs_apply_link_verified_idx
  on public.jobs (apply_link_verified) where is_published;
create index if not exists jobs_last_verified_at_idx
  on public.jobs (last_verified_at);

/* ------------------------------------------------------------------ */
/* 3. Admit cards / results / answer keys: released vs upcoming        */
/* ------------------------------------------------------------------ */

alter table public.admit_cards
  add column if not exists status text not null default 'released',
  add column if not exists released_at timestamptz;

alter table public.results
  add column if not exists status text not null default 'released',
  add column if not exists released_at timestamptz;

alter table public.answer_keys
  add column if not exists status text not null default 'released',
  add column if not exists released_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'admit_cards_status_check') then
    alter table public.admit_cards
      add constraint admit_cards_status_check
      check (status in ('upcoming', 'released'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'results_status_check') then
    alter table public.results
      add constraint results_status_check
      check (status in ('upcoming', 'released'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'answer_keys_status_check') then
    alter table public.answer_keys
      add constraint answer_keys_status_check
      check (status in ('upcoming', 'released'));
  end if;
end $$;

comment on column public.admit_cards.status is
  'upcoming = release date is in the future; released = publicly available.';
comment on column public.results.status is
  'upcoming = result date is in the future; released = publicly available.';
comment on column public.answer_keys.status is
  'upcoming = release date is in the future; released = publicly available.';

-- Backfill only from the dates already on the row (midnight IST). Rows with no
-- date stay NULL and keep their current public status.
update public.admit_cards
set released_at = (release_date::timestamp at time zone 'Asia/Kolkata')
where released_at is null and release_date is not null;

update public.results
set released_at = (result_date::timestamp at time zone 'Asia/Kolkata')
where released_at is null and result_date is not null;

update public.answer_keys
set released_at = (release_date::timestamp at time zone 'Asia/Kolkata')
where released_at is null and release_date is not null;

update public.admit_cards
set status = case
  when released_at is not null and released_at > now() then 'upcoming'
  else 'released'
end;

update public.results
set status = case
  when released_at is not null and released_at > now() then 'upcoming'
  else 'released'
end;

update public.answer_keys
set status = case
  when released_at is not null and released_at > now() then 'upcoming'
  else 'released'
end;

create index if not exists admit_cards_status_released_idx
  on public.admit_cards (status, released_at desc) where is_published;
create index if not exists results_status_released_idx
  on public.results (status, released_at desc) where is_published;
create index if not exists answer_keys_status_released_idx
  on public.answer_keys (status, released_at desc) where is_published;

commit;
