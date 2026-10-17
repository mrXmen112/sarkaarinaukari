-- ===========================================================================
-- 0019_slug_redirects.sql
--
-- Permanent redirect map for job URLs, so a legacy or renamed slug never
-- answers 404 and never leaves a dead end in the Google index.
--
-- WHY THIS EXISTS
-- Search Console (Oct 2026) reported these as "Not found (404)", all crawled
-- 7-12 Oct 2026:
--   /jobs/bihar-jail-sepoy-2026-3
--   /jobs/agniveer-2026-1
--   /jobs/ibps-po-17-5
--   /jobs/ssc-gd-2026-0
--
-- All four are a CURRENT slug plus a trailing dedupe counter. The base slugs
-- all exist and are published:
--   bihar-jail-sepoy-2026 / agniveer-2026 / ibps-po-17 / ssc-gd-2026
--
-- The suffixed variants are not in any migration and not in any commit in git
-- history (the repo's first commit is 2026-09-11). src/lib/utils.ts slugify()
-- has no counter, and jobs.slug carries UNIQUE INDEX jobs_slug_key, so a
-- colliding insert would have errored rather than auto-suffixed. These rows
-- were therefore created outside this repo's seed path and later removed or
-- renamed. Nothing in the current code can recreate them.
--
-- HOW IT IS SERVED
-- src/lib/slugRedirects.ts resolves a missing slug in two steps:
--   1. an explicit row in this table, or
--   2. strip a trailing -<number> and check whether the base slug is a live job
-- Step 2 is a general rule, so the whole "-N" family is covered without
-- enumerating every variant.
--
-- If neither matches, the request falls through to the real 404. There is
-- deliberately NO catch-all route and no soft-404.
--
-- Idempotent. No data deletion. Touches nothing in auth or storage.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. The table
--
-- target_kind distinguishes the two outcomes:
--   'job'  -> 301/308 to /jobs/<to_slug>
--   'path' -> 301/308 to an in-repo path such as /exams/<slug>
--   'gone' -> no sensible target; the page is permanently withdrawn.
--             target_slug is then NULL by the check below, and the resolver
--             returns 410 Gone.
--
-- The four seeded rows below all have target_kind = 'job'. No 'gone' rows are
-- seeded: a slug with no sensible target should simply 404, and adding a
-- 'gone' row is a deliberate editorial decision made later through the admin
-- panel, not a bulk default.
-- ---------------------------------------------------------------------------
create table if not exists public.slug_redirects (
  from_slug    text primary key,
  to_slug      text,
  target_kind  text not null default 'job',
  reason       text,
  created_at   timestamptz not null default now(),

  constraint slug_redirects_target_chk
    check (target_kind in ('job', 'path', 'gone')),

  -- A 'job' or 'path' row must name a target; a 'gone' row must not.
  constraint slug_redirects_target_present_chk
    check (
      (target_kind in ('job', 'path') and to_slug is not null and to_slug <> '')
      or
      (target_kind = 'gone' and to_slug is null)
    ),

  -- A slug that redirects to itself would loop forever.
  constraint slug_redirects_no_self_chk
    check (from_slug <> to_slug)
);

comment on table public.slug_redirects is
  'Legacy job slugs -> their current target. Read by src/lib/slugRedirects.ts on the public job page.';

comment on column public.slug_redirects.target_kind is
  'job = /jobs/<to_slug>; path = in-repo path in to_slug; gone = permanently withdrawn, serve 410.';

-- Reverse lookups ("what used to point here") when a job is renamed again.
create index if not exists slug_redirects_to_slug_idx
  on public.slug_redirects (to_slug);

-- ---------------------------------------------------------------------------
-- 2. Seed the four slugs Search Console actually reported
--
-- Idempotent: ON CONFLICT DO UPDATE keeps the reason fresh if this file is
-- re-applied. Re-pointing an existing row is intentional — if a job is renamed
-- again, re-applying this file corrects the target rather than duplicating it.
-- ---------------------------------------------------------------------------
insert into public.slug_redirects (from_slug, to_slug, target_kind, reason)
values
  ('bihar-jail-sepoy-2026-3', 'bihar-jail-sepoy-2026', 'job',
   'Deduped slug reported 404 in Search Console (crawled Oct 2026)'),
  ('agniveer-2026-1',        'agniveer-2026',        'job',
   'Deduped slug reported 404 in Search Console (crawled Oct 2026)'),
  ('ibps-po-17-5',           'ibps-po-17',           'job',
   'Deduped slug reported 404 in Search Console (crawled Oct 2026)'),
  ('ssc-gd-2026-0',          'ssc-gd-2026',          'job',
   'Deduped slug reported 404 in Search Console (crawled Oct 2026)')
on conflict (from_slug) do update
  set to_slug     = excluded.to_slug,
      target_kind = excluded.target_kind,
      reason      = excluded.reason;

-- ---------------------------------------------------------------------------
-- 3. RLS
--
-- READ must be available to `anon`: the public job page reads through
-- createStaticClient(), which uses the anon key, so the resolver has to be
-- able to read this table or redirects silently stop working on cached pages.
-- That is safe — a slug-to-slug map is public information, and disclosing it
-- leaks nothing that is not already in the sitemap or on the page itself.
--
-- WRITE is left entirely to service_role (which bypasses RLS). No INSERT,
-- UPDATE or DELETE policy exists for anon or authenticated, so those roles
-- cannot modify the map even if someone obtains the anon key.
-- ---------------------------------------------------------------------------
alter table public.slug_redirects enable row level security;

drop policy if exists "public_read_slug_redirects" on public.slug_redirects;

create policy "public_read_slug_redirects"
  on public.slug_redirects
  for select
  to anon, authenticated
  using (true);

revoke insert, update, delete on public.slug_redirects from anon, authenticated;

-- ===========================================================================
-- ROLLBACK
-- ===========================================================================
-- Nothing here is destructive to job data. To undo the feature entirely:
--
--    drop table if exists public.slug_redirects;
--
-- To undo only the seeded rows and keep the mechanism:
--
--    delete from public.slug_redirects
--     where from_slug in ('bihar-jail-sepoy-2026-3','agniveer-2026-1',
--                         'ibps-po-17-5','ssc-gd-2026-0');
--
-- To add a permanently-withdrawn page later:
--
--    insert into public.slug_redirects (from_slug, to_slug, target_kind, reason)
--    values ('some-old-slug', null, 'gone', 'Withdrawn: duplicate of ...');
-- ===========================================================================