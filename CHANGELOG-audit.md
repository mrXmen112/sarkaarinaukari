# Audit fix changelog — sarkaarinaukri.online

- **Branch:** `fix/audit-oct-2026` (from `main` @ `118cf95`)
- **Started:** 2026-10-20
- **Status:** recon complete · migration `0023` **applied** · P0/P1 audit fixes shipped · SEO map partially shipped (central metadata + `/bihar/12th-pass-jobs`) · top-traffic ranking uses the approved proxy
- **Scope:** P0 trust/correctness → P1 stage coverage → P2 SEO/perf → P3 automation

This file is the running record of what was found, what changed, and how it was verified.
Decisions that need the owner are tracked in `NEEDS-MY-DECISION.md`.

---

## 1. Baseline (before this audit)

- `npm test` 56/56; lint 0 errors / 24 warnings; `npm run build` clean.
- Current after SEO-map changes: **56/56 tests**, lint 0 errors / 17 warnings, build clean (361 pages).
- `audit:404 --limit=300`: 235/235 pages, 374 links, 0 failures.
- `audit:seo` 0 failures; `audit:index` 0 indexable / 66 noindexed; `audit:meta` OK.
- Live DB baseline: **124 jobs**, 124 published, **0 verified**, 91 active, **39 link-flagged**; 8 admit cards, 4 results, 3 answer keys.
- Verification gate is **off**; `admin_users` now reports **1 row** (earlier 0-row blocker likely resolved).

---

## 2. Confirmed findings

### P0 — trust and correctness

1. **The Apply button is not tied to a verified official destination.**
   - `jobs` has no `official_apply_url`, `official_notification_url`, `official_site_url`, `apply_link_verified`, or `last_verified_at`.
   - `src/lib/linkCheck.ts:147` checks only `official_link` and `notification_pdf_link`.
   - `src/lib/linkCheck.ts:192-196` writes `link_last_checked_at` / `link_http_status` / `link_flagged`; it never records a human apply-link verification.
   - `src/components/jobs/ApplyButton.tsx` therefore falls back to “Apply link under verification”.
   - 39 of 124 jobs are already link-flagged; 0 are verified.

2. **Future-dated admit cards/results are published and indexable as if released.**
   - `admit_cards` has 5 future release dates: `2026-11-05` (IBPS PO, Bihar TRE), `2026-11-25` (BPSC 70th), `2026-12-15` (BSSC Inter), `2026-12-20` (RRB Group D).
   - `src/app/admit-card/[slug]/page.tsx:52` hard-codes `robots: { index: true, follow: true }`.
   - `src/app/sitemap.ts:256-261` emits **every** published admit card/result/answer key, regardless of date.
   - There is no `status` or `released_at` column on any of the three tables.

3. **Vacancy/fee/salary values are published without a source-verification flag.**
   - No `source_verified` field exists.
   - `src/lib/sanity.ts` cleans formatting but cannot prove a vacancy split against the notification.
   - 0 jobs are human-verified, so there is currently no row-level evidence for any published number.

4. **Non-job content is counted and listed as a job.**
   - `bihar-deled-2026` — “Bihar DElEd 4th Semester Entrance 2026” — is `active`, `unverified`, deadline `2026-11-30`, official `https://biharedznc.in/`.
   - There is no `type` field, so entrance/admission/scholarship rows inflate job lists and “All 39 Bihar jobs”.

### P1 — stage coverage and page correctness

5. **Homepage has no DB-driven Results / Admit Cards / Answer Keys sections.**
   - `src/app/page.tsx` renders `getLatestJobs`, `getClosingJobs`, `getRecentlyClosedJobs`, `listJobs`, `listRecentUpdates(6)`, `listExams(8)`.
   - `listRecentUpdates` drives `src/components/updates/RecentUpdatesPanel.tsx`; there is no separate “latest released results / admit cards / answer keys” block.

6. **Stage detail pages have no upcoming/released state.**
   - Admit card page always says “Download Status: Available / Yet to release” from `download_link`, not from a release date.
   - Metadata emits `publishedTime` from a future `release_date`.
   - Result and answer-key detail pages follow the same pattern.

7. **Sitemap advertises pages that should not be indexed yet.**
   - Same code path as finding 2: future stage rows are included even once they are marked noindex.

8. **Timeline and selection-process copy still need a component-level fix.**
   - Audit reports auto-numbering and a “Selection Process” note issue; `src/components/jobs/RecruitmentTimeline.tsx` is the place to confirm/fix.
   - `jobs/[slug]` currently imports `JobTable` and `JobActions` alongside `RecruitmentTimeline`; the exact render order still needs a focused read before editing.

### P2 — SEO, duplication, performance

9. **`JobPosting` structured data is still shipped, but the new brief forbids it.**
   - `src/app/jobs/[slug]/page.tsx:39` imports `jobPostingSchema`.
   - `src/lib/seo.ts:139` builds it; `src/lib/jobPosting.ts` holds the implementation and tests.
   - `Article`, `FAQPage`, `BreadcrumbList`, `Organization`/`WebSite` remain valid and should stay.

10. **Sitemap split is only 5 sections.**
    - `src/app/sitemap.ts:24` = `static`, `landing`, `jobs`, `updates`, `prep`.
    - All three stage types share `updates`; exams share `prep`. The brief asks for per-type sitemaps.

11. **No `/bihar/police-jobs`, `/bihar/teacher-jobs`, `/bihar/12th-pass-jobs`, `/bihar/10th-pass-jobs`, `/bihar/result`.**
    - Existing Bihar hubs are organisation-based (`bssc`, `bpsc`, `bihar-tre`, `bihar-police`, `bihar-panchayat`, `bihar-jal-nigam`, `bihar-home-guard`, `bihar-health`).

12. **No legacy Blogger redirect layer.**
    - Existing redirects: host normalisation and `/signup` in `next.config.ts`; slug redirects via `slug_redirects` / `src/lib/slugRedirects.ts`.
    - No campaign/legacy path map for old Blogger URLs.

13. **Robots baseline is already partly correct.**
    - `public/robots.txt` disallows `/admin/`, `/profile`, `/login`, `/auth/`, `/api/`, and filter query strings; it references `/sitemap.xml`.
    - Still needed: confirm `/sitemap` child paths, ensure no future stage pages are advertised, and re-check after split.

### P3 — automation and admin

14. **Link re-checks are bounded to 20/day, not a nightly verified-apply sweep.**
    - `src/app/api/cron/maintenance/route.ts:39` calls `runLinkCheck({ limit: 20 })`.
    - It orders by `link_last_checked_at`, so 124 jobs take ~7 days per full pass.

15. **Admin review queue / Quick Publish cannot be visually verified.**
    - `admin_users` has 0 rows; no `ADMIN_EMAIL` sign-in has been bootstrapped.

16. **No data-health admin page.**
    - Audit results currently live in scripts/reports, not an admin view.

---

## 2a. P0 resolution status (2026-10-20)

- **Apply link:** `src/lib/applyLink.ts` now requires `apply_link_verified`, a dedicated non-homepage/non-PDF `official_apply_url`, and no `link_flagged`; otherwise it falls back to `official_site_url` / derived origin (“Official Website”) or the detail page. The listing says “Apply” only for the verified case; everything else says “View details”. The detail page shows one notice plus “Official Website” when available.
- **False-positive correction:** the first sweep marked **41** apply links verified; all 41 were site homepages, not application forms. `linkCheck.ts` now rejects homepages, and those flags were cleared. **Current `apply_link_verified = 0`**, which is the honest state until a real application URL is confirmed.
- **Released-date gating:** `admit_cards`, `results`, `answer_keys` now carry `status` + `released_at`. Public lists, recent-update feeds, job timelines and the sitemap include only `status='released'`. Upcoming pages remain reachable, are `noindex`, label the date as expected, and do not expose a download link.
- **Type filtering:** all job list/count/homepage/related/sitemap queries filter `type='job'`; the entrance row no longer inflates job counts.
- **Data audit:** `src/lib/jobAudit.ts` + `scripts/audit-jobs.ts` flag vacancy-sum mismatch, uniform splits, missing source, publish-after-update, invalid dates, stale verification, and unsourced vacancy/salary. **37 of 123 job rows fail** (all 37 vacancy-sum mismatches); their vacancy total, breakdown and pay scale are withheld and the page shows a review notice. The other 86 keep their figures with a “confirm on official notification” note.
- **JobPosting:** removed from the job page and `seo.ts`; the builder/tests/sample script are now dead code pending deletion.
- **Still open:** type audit of admission/scholarship titles, P1 remainder (exam lifecycle links, Bihar landing pages, sitemap split, duplicate stage URLs), P2/P3.
- **P1 shipped:** homepage now has three released-only columns (Latest Admit Cards / Results / Answer Keys), independent of the jobs table; timeline auto-numbers present stages and explains missing ones; job/stage/exam metadata now sets per-page Twitter cards.

### 2b. SEO keyword map (2026-10-20)

- **Central metadata:** `src/lib/seo.ts` now owns `buildMeta()` plus `clampSeoTitle()` / `clampSeoDescription()`. Every content template gets a keyword-first absolute title of at most 60 characters, a 140-160 character description, a self-referencing absolute canonical, and matching Open Graph/Twitter fields. Four tests cover the limits.
- **Templates refactored:** job, admit-card, result, answer-key, exam and landing metadata now call `buildMeta`; the homepage metadata was moved onto it as well. Job titles drop the parenthetical post name for SEO and fall back to omitting the vacancy count when the full title would exceed 60.
- **New page:** `/bihar/12th-pass-jobs` (`src/app/bihar/12th-pass-jobs/page.tsx` + `BIHAR_GUIDE_PAGES`). It filters `state='bihar'` + `qualification='12th'`, has original intro/FAQ copy, live listings, related guides, canonical and indexability based on the same landing-page rule as the other hubs.
- **Internal links:** homepage “Trending in Bihar” rail (7 live links), Bihar hub guide chip, job-page “Explore More Government Jobs” links, and exam hub “Recruitment Linked to This Exam” links. Stage pages already link back through `JobLinkPanel`.
- **Sitemap:** the new Bihar guide is included in `sitemap/landing.xml`; no fake `lastmod` was added.
- **IndexNow:** dynamic publish paths already ping after publish. Added `scripts/indexnow-submit.mjs` + `npm run submit:indexnow` for static landing pages after deploy.
- **Missing targets:** `bssc-inter-level-2026` exam, `bihar-tre-4` exam, `bihar-board-12th-result`, `bseb-matric-result` are absent from the DB and are listed in `NEEDS-MY-DECISION.md` rather than invented.
- **Verification:** landing page returns 200 with 15 live job rows, 54-char title, 156-char description, correct canonical, no `JobPosting`, no noindex; homepage/trending/sitemap links present.

---

## 3. Migration `0023_audit_trust_fields` (applied)

File: `supabase/migrations/0023_audit_trust_fields.sql`

Applied 2026-10-20. Snapshots of `jobs`, `admit_cards`, `results`, `answer_keys` were written to the non-exposed `backup` schema before the additive changes.

Adds, with snapshots in a non-exposed `backup` schema first:

- `jobs.official_apply_url`, `official_notification_url`, `official_site_url`
- `jobs.apply_link_verified` (default `false`)
- `jobs.last_verified_at`
- `jobs.source_verified` (default `false`)
- `jobs.type` (`job | entrance | admission | scholarship`, default `job`)
- `admit_cards.status` + `released_at`
- `results.status` + `released_at`
- `answer_keys.status` + `released_at`
- indexes for type/status, apply verification, verification age, and released ordering

Backfills are deliberately conservative:

- `official_apply_url ← official_link` (preserves the existing meaning used by `linkCheck`).
- `official_notification_url ← notification_pdf_link`.
- `type ← entrance` only for `bihar-deled-2026`.
- `released_at ← release_date/result_date` at midnight IST; `status ← upcoming` only when that timestamp is in the future.
- Nothing is marked `verified` or `source_verified`.

Backfill note: `official_apply_url ← official_link` copied many site homepages. The strict classifier now refuses those as apply destinations, and the incorrect `apply_link_verified` flags were cleared; the column remains the single place to record a confirmed application form.

---

## 4. Change log

### Unreleased (branch `fix/audit-oct-2026`)

- **DB:** applied `0023_audit_trust_fields`; added `jobs.official_apply_url`, `official_notification_url`, `official_site_url`, `apply_link_verified`, `last_verified_at`, `source_verified`, `type`; added stage `status`/`released_at`; indexes + conservative backfills.
- **Apply:** strict classifier (`src/lib/applyLink.ts`), new CTA (`src/components/jobs/ApplyButton.tsx`), listing Apply/View logic (`src/components/jobs/JobTable.tsx`), homepage/PDF/flag rejection, website fallback, 11 tests.
- **Link checker:** `src/lib/linkCheck.ts` now records apply verification only for real non-homepage HTML pages; dead links downgrade, bot blocks/timeouts do not.
- **Stages:** released/upcoming gating in `admit-card/[slug]`, `result/[slug]`, `answer-key/[slug]`; noindex + expected copy + link hiding for upcoming; released-only lists/timeline.
- **Types:** `type='job'` filters in every job list/homepage/related/sitemap query; entrance row excluded.
- **Audit:** `src/lib/jobAudit.ts` + 9 tests; `scripts/audit-jobs.ts` + `audit:jobs` script; report at `reports/jobs-audit.json`.
- **Job detail:** audit banner, withheld vacancy/salary/breakdown for the 37 failing rows, note for unverified-but-passing rows, `ApplyCta` wired to the new fields.
- **Sitemap:** jobs `type='job'`; updates `status='released'`.
- **Homepage:** added `src/components/updates/HomeStages.tsx` with three released-only columns; removed the stage list from the old thin-list fallback so it no longer depends on a jobs shortage.
- **Timeline:** `RecruitmentTimeline` numbers only the stages that exist (no gaps/duplicate labels) and states that missing stages are not assumed.
- **Metadata:** per-page `twitter` cards on job, admit-card, result, answer-key and exam pages.
- **Schema cleanup:** removed `JobPosting` usage from `jobs/[slug]` and `seo.ts`.
- **Docs:** this changelog, `NEEDS-MY-DECISION.md`, and `reports/top-15-proxy.md` (explicit Bihar-first proxy, not analytics).
- **QA:** 52/52 tests at the P0/P1 checkpoint; after the SEO map: **56/56 tests**, lint 0 errors / 17 warnings, build 361 pages; local pages checked (released vs upcoming, verified-apply fallback, failing-job withholding, entrance exclusion, sitemap counts, metadata limits).

### 2026-10-21 production cleanup (live-site report)

- **Jobs unpublished (6):** `bpsc-70th-ccae` (70th prelims was held Dec 2024 / re-exam Jan 2025), `bihar-deled-2026` (entrance, dead official domain), `bihar-home-guard-2026` (no 16,000-post notice; 13,500 still proposed), `bihar-train-conductor-2026` (no BSRTC train-conductor notice), `indian-army-soldier-gd-2026` (no 60,000-post rally; Agniveer is separate), `bihar-tre-5-2026` (no TRE-5 notice; TRE 4.0 is current).
- **Admit cards:** the four future rows (IBPS PO, Bihar TRE 4.0, BSSC Inter, RRB Group D) are now `upcoming`, noindex, no release timestamp, no download link, and point at the correct official portal. `bpsc-70th-prelims-admit-card` and the three unverifiable "released" rows are unpublished.
- **Redirects:** added `bihar-deled-2026 → /jobs/bed`, `bpsc-70th-ccae → /bihar/bpsc`, `bihar-home-guard-2026 → /bihar/bihar-home-guard`, `bihar-tre-5-2026 → /bihar/bihar-tre`, `bihar-train-conductor-2026 → /bihar`, `indian-army-soldier-gd-2026 → /jobs/category/defence`.
- **Results / answer keys:** removed fabricated deep paths, normalised old domains (`bpsc.bih.nic.in`, `bssc.bih.nic.in`), and kept only official roots (BSEB links unchanged).
- **Bihar hub:** count and table now use the same `open` filter (34 rows), and the "vacancyies" pluralisation bug is fixed.
- **Internal links:** `/bihar/12th-pass-jobs` added to the homepage quick links and footer Jobs column; Home Guard trending link now points at the hub.
- **QA:** build clean (355 static pages), 56/56 tests, lint 0 errors / 17 warnings; local checks: `/` shows Latest Results + Latest Answer Keys, `/bihar` shows "34 vacancies", redirects return 308, future admit cards are noindex/Expected with no download, removed rows are 404 or redirected, sitemaps exclude unpublished rows.

### 2026-10-21 Batch 1 trust cleanup (live DB)

- **Batch 1 unpublished (16):** all 16 high-risk rows failed verification against current official notices or had no matching notification. Rows retained for audit with `verification_status='unverified'`, `source_verified=false`, `apply_link_verified=false`, unpublished, `status='closed'`, and a row-level `verification_note`.
  - `bihar-jail-sepoy-2026`, `bihar-police-si-2026`, `bihar-police-clerk-2026`, `bihar-police-constable-2026`
  - `bssc-inter-level-2026`, `bssc-graduate-level-2026`, `bihar-sap-2026`, `bihar-fireman-2026`
  - `ssc-cgl-2026`, `ssc-chsl-2026`, `ssc-gd-2026`, `ibps-po-17`
  - `sbi-po-2026`, `rrb-ntpc-2026`, `rrb-group-d-2026`, `upsc-cse-2027`
- **Evidence:** CSBC's 16-06-2026 notice rebuts fake Jail Warder news; BPSSC Advt 09/2026 is 150 SI posts (09 Jul–09 Aug), not 3,000; SSC CGL/CHSL/GD notices exist but DB dates/vacancies and `/Advt/*.pdf` links do not match; IBPS has CRP PO/MT-XVI, not CRP 17; SBI PO 2026-27 is 1,500 posts (18 Jun–08 Jul); RRB 2026 NTPC is 5,236 posts across CEN 06/2026 + 07/2026; Group D is CEN 09/2025 with 22,195 posts; UPSC CSE 2027 is not yet notified.
- **Fake URLs removed:** cleared `official_notification_url`, `notification_pdf_link`, and `official_apply_url` on rejected rows; kept an official root in `official_site_url` for audit.
- **QA:** DB now has 1 verified published job; `jobs.xml` still 3 URLs; production pages are ISR-cached for up to 3 hours, so a deploy is required to publish the removals as 404s.

### Baseline commits before this task

`c4c1adc` → `b155c9e` → `a29c36b` → `be0ae74` → `118cf95` (W4 adapters, Quick Publish, pipeline fixes, checkpoint).

---

## 5. Verification log

| Date | Check | Result |
|---|---|---|
| 2026-10-20 | Read-only DB counts | 124 jobs / 0 verified / 39 flagged; 8 admit / 4 result / 3 answer key |
| 2026-10-20 | Future stage-date query | 5 admit cards dated after 2026-10-20 |
| 2026-10-20 | `bihar-deled-2026` query | active, unverified, `2026-11-30`, `biharedznc.in` |
| 2026-10-20 | Baseline audits (pre-task) | 0 404s, 0 SEO failures, build clean, 56/56 tests |
| 2026-10-20 | Migration `0023` | applied; backup snapshots in `backup` schema |
| 2026-10-20 | Link sweep (125 rows) | 41 auto-verified, 41 flagged; later found all 41 verified were homepages |
| 2026-10-20 | Apply-link correction | 41 homepage flags cleared; `apply_link_verified = 0`; classifier rejects homepages |
| 2026-10-20 | Jobs audit | 123 published jobs, 37 failing (37 vacancy-sum mismatches), 0 uniform splits / missing source / publish-after-update |
| 2026-10-20 | Tests | 52/52 pass |
| 2026-10-20 | Lint | 0 errors / 24 warnings |
| 2026-10-20 | Build | clean, 360 static pages |
| 2026-10-20 | Local stage pages | `up-police-constable-2026-admit-card` indexed + released; `ibps-po-17-admit-card` noindex + expected + no download |
| 2026-10-20 | Local apply/audit pages | `esic-various-2026` shows notice + Official Website (no false Apply); `bihar-cho-2026` withholds figures; `afcat-2026` keeps figures + note |
| 2026-10-20 | Local sitemaps | `updates.xml`: released only (no IBPS upcoming); `jobs.xml`: 125 URLs incl. 2 static, no entrance row |
| 2026-10-20 | Homepage stages | three columns render; upcoming `bpsc-70th-prelims-admit-card` absent |
| 2026-10-20 | Per-page Twitter | job page has its own `twitter:title` + `summary_large_image` |
| 2026-10-20 | SEO metadata | `/`, 3 jobs, admit card, result, answer key and exam pages: titles 42-60 chars, descriptions 142-159 chars, canonical present |
| 2026-10-20 | Bihar 12th landing | 200; 15 live job rows; 54-char title; 156-char description; canonical; no `JobPosting`; no noindex |
| 2026-10-20 | Internal links | homepage “Trending in Bihar” + new page link; job page explore block; exam related-jobs block |
| 2026-10-20 | Sitemap | `/sitemap/landing.xml` includes `/bihar/12th-pass-jobs` |
| 2026-10-20 | TRE 4.0 data | BPSC ad 15/2026, 33,320 posts (32,388 + 932), apply 25 Sep–26 Oct 2026; job + exam verified |
| 2026-10-20 | BSEB results | Class 12 released 23 Mar 2026 13:30 IST; Matric released 29 Mar 2026 13:15 IST |
| 2026-10-20 | Link sweep (final) | 115 unique URLs; 51 OK, 64 unverified/blocked, 0 provably dead |
| 2026-10-20 | Final build | clean, 364 static pages; TRE job/exam and both BSEB results indexable |
| 2026-10-21 | Production cleanup | 6 jobs + 4 admit cards unpublished; 4 future admit cards Expected/noindex; 6 redirects added |
| 2026-10-21 | Bihar hub | 34 jobs in both homepage link and hub count; "vacancies" spelling fixed |
| 2026-10-21 | Post-cleanup build | clean, 355 static pages; 56/56 tests; lint 0 errors / 17 warnings |
| 2026-10-21 | Local verification | Latest Results/Answer Keys render; deled/BPSC/Home Guard rows absent; stage pages noindex + no download |
| 2026-10-21 | Indexing policy | Unverified jobs noindex + out of `jobs.xml`; landing pages show verified jobs only and noindex below 10 verified open jobs; info/result/exam pages stay indexable |
| 2026-10-21 | Batch 1 verification | 16/16 rows rejected; 0 verified; all 16 unpublished with audit notes |
| 2026-10-21 | Post-Batch-1 DB | 1 verified published job; 16 unpublished; `jobs.xml` 3 URLs |

---

## 6. Next changes (in order)

1. **Resolve the “verified” definition (I1/I2).** Only `bihar-tre-4` is verified; strict filtering would leave one job and empty most pages.
2. **Load or supply the missing source rows (J).** BSSC Inter exam is still missing; TRE 4.0 and both BSEB results are now live.
3. **Complete the remaining Bihar guides (F1/F2):** police, teacher, 10th-pass and result hubs.
4. **Review the 37 failing rows for real vacancy totals**, then decide whether any become verified. The other 86 unverified rows still need an official source before they can be verified.
5. **Run `npm run submit:indexnow` after deploying** the new landing page; confirm the key file is live at `/<key>.txt`.
6. **P2/P3:** sitemap split decision, closed-job retention, legacy redirects, nightly link sweep, admin data health.
