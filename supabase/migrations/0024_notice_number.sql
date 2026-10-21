-- 0024_notice_number.sql
--
-- Adds the advertisement / CEN number so every job page can cite the exact
-- official notice it was verified against (e.g. "15/2026", "CEN 06/2026").
-- ADDITIVE ONLY.

begin;

alter table public.jobs
  add column if not exists notice_number text;

comment on column public.jobs.notice_number is
  'Official advertisement/CEN number exactly as printed on the notice, e.g. 15/2026 or CEN 06/2026.';

commit;
