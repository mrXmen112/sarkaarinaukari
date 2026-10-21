-- ===========================================================================
-- 0025_homepage_visibility_cleanup.sql
--
-- Production still showed withdrawn rows on the homepage:
--   * 97 unverified jobs were visible because NEXT_PUBLIC_VERIFICATION_GATE
--     was not set in Vercel (the code now makes the gate unconditional)
--   * 5 future-dated admit cards were published with status = 'released'
--   * removed slugs fell through to 404 instead of a redirect/410
--
-- Idempotent. No job rows are deleted.
-- ===========================================================================

-- 1. Future-dated admit cards are not released yet. Hide them until the date
--    arrives (the code also rejects release_date > today).
update public.admit_cards
set is_published = false
where status = 'upcoming'
   or release_date > current_date;

-- 2. Redirects for removed slugs.
--    Genuine historical exams/replacements get a real successor. Fabricated
--    notifications with no official source are marked gone (real 404).
insert into public.slug_redirects (from_slug, to_slug, target_kind, reason)
values
  ('bpsc-70th-ccae', '/exams/bpsc-70th', 'path',
   'BPSC 70th CCE was held in 2024-25; 2026 job record was not official. Point at the exam guide.'),
  ('bihar-jail-sepoy-2026', '/bihar/bihar-police', 'path',
   'Withdrawn 2026-10-21: no verified Jail Sepoy 2026 notification. Point at the Bihar Police hub.'),
  ('bihar-jail-sepoy-2026-3', '/bihar/bihar-police', 'path',
   'Deduped variant of the withdrawn Jail Sepoy slug. Point at the Bihar Police hub.'),
  ('bihar-police-si-2026', '/jobs/bpssc-si-2026', 'path',
   'Unverified duplicate; the verified BPSC SI 2026 record is the live page.'),
  ('ibps-crp-17', '/jobs/category/banking', 'path',
   'No verified IBPS CRP 17 job record; point at the banking jobs hub.'),
  ('ibps-crp-17-2026', '/jobs/category/banking', 'path',
   'No verified IBPS CRP 17 job record; point at the banking jobs hub.'),
  ('bihar-home-guard-2026', null, 'gone',
   'Withdrawn 2026-10-21: no 16,000-post 2026 notification or 31 Oct deadline.'),
  ('indian-army-soldier-gd-2026', null, 'gone',
   'Withdrawn 2026-10-21: no 60,000-post Soldier GD 2026 rally.'),
  ('bihar-train-conductor-2026', null, 'gone',
   'Withdrawn 2026-10-21: no BSRTC train-conductor notification.'),
  ('bihar-tre-5-2026', null, 'gone',
   'Withdrawn 2026-10-21: no TRE-5 2026 notification; TRE 4.0 is current.')
on conflict (from_slug) do update
  set to_slug     = excluded.to_slug,
      target_kind = excluded.target_kind,
      reason      = excluded.reason;

-- 3. No future card may stay in the sitemap by accident.
create index if not exists admit_cards_release_date_idx
  on public.admit_cards (release_date)
  where is_published = true and status = 'released';
