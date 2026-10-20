# Decisions and open questions — audit fixes

**Status:** migration applied; P0/P1 fixes in place. Bihar 12th-pass landing and central metadata shipped. TRE 4.0 exam, BSEB Class 10/12 results and the TRE 4.0 job are now verified and published; 1 of 124 jobs is verified, 123 remain unverified. Remaining blockers are the policy inputs below.

---

## Recorded decisions

1. **Apply migration `0023` — approved and applied.** Snapshots were written to the non-exposed `backup` schema first; changes are additive.
2. **Verification visibility — hide only failing rows.** Jobs that pass the audit keep vacancy/salary with a “confirm on the official notification” note; jobs that fail withhold the figures and show a review notice. `source_verified` remains false everywhere.
3. **Strict apply links — approved.** No Apply button without a verified, non-homepage, non-PDF application URL. Otherwise show “Apply link under verification” plus “Official Website” when available.
4. **Remove `JobPosting` — approved.** Removed from the job page and `seo.ts`; `Article`, `FAQPage`, `BreadcrumbList`, `Organization` and `WebSite` remain.
5. **Type field — targeted only.** Default `job`; only `bihar-deled-2026` is set to `entrance`; ambiguous titles stay queued for review.
6. **No release date on a stage row — preserve visibility.** Keep `status='released'` and flag for audit rather than silently unpublishing.
7. **Bihar-first traffic proxy — approved.** The top-15 list in `reports/top-15-proxy.md` is a proxy, not analytics; replace it when a real export exists.
8. **Bihar 12th-pass landing copy — F1 applied to this page.** The new `/bihar/12th-pass-jobs` copy is written from existing DB rows + general recruitment process, with no invented dates, fees or vacancy numbers. Remaining Bihar guides still need the same treatment or supplied copy.

---

## Still open

### A. Failing jobs outside listings — **resolved**

Keep the current behavior: the 37 failing rows withhold vacancy/salary but remain on the homepage, featured slots and job sitemap. Decision recorded 2026-10-20.

### B. Top-15 traffic ranking — **resolved with proxy**

No analytics source is connected. A Bihar-first proxy list was approved and written to `reports/top-15-proxy.md`, using state, deadline proximity, vacancy count and recency. It is explicitly labelled a proxy, not real traffic. Replace it when a Vercel Analytics / PostHog / Search Console export is available.

### C. Closed jobs after 30 days — **not yet implemented**

- **C1. Hide from listings/homepage/sitemap after 30 days, keep page reachable with `noindex` (recommended).**
- **C2. Keep listed indefinitely.**
- **C3. Delete** (not recommended).
- **Reply:** `C1` / `C2` / `C3`.

### D. Sitemap split shape — **not yet implemented**

- **D1. Expand to 9 sections (recommended):** pages, landing, jobs, admit-cards, results, answer-keys, exams, prep, misc.
- **D2. Keep 5** and gate rows inside updates/prep.
- **Reply:** `D1` / `D2`.

### E. Legacy Blogger URLs — **blocked for 301s**

Need the actual old URLs (Search Console export or CSV) to write correct redirects. Until then only stage-slug and known duplicate paths can be covered.

- **Reply:** attach the list, or `E skip for now`.

### F. Bihar landing-page copy — **12th-pass page shipped**

`/bihar/12th-pass-jobs` now uses the F1 approach: DB-backed listings plus original process copy and FAQs, with no invented figures. Still open for `/bihar/police-jobs`, `/bihar/teacher-jobs`, `/bihar/10th-pass-jobs`, `/bihar/result`:

- **F1. I write from existing DB rows + editorial copy, marked unverified until review (recommended).**
- **F2. You supply the copy.**
- **Reply:** `F1` / `F2`.

### G. Admin verification access

`admin_users` now reports 1 row, so the review queue may be testable. Provide the `ADMIN_EMAIL` to confirm the bootstrap account, or say skip.

- **Reply:** `G <email>` or `G skip`.

### H. Telegram auto-post

`TELEGRAM_BOT_TOKEN` is not set.

- **Recommendation:** skip for this audit; keep the existing gated code path.
- **Reply:** `H skip` or `H add later`.

### I. What does “verified” mean for listings and landing pages? — **blocking SEO page gate**

`verification_status = 'verified'` is **1 row** (`bihar-tre-4`) and `source_verified = true` for that row only; the other **123** published jobs remain unverified. The verification gate is still off, so current lists show published rows that pass the audit. The new 12th-pass page follows that same public rule, not a strict `source_verified` filter.

- **I1. Use published + audit-passing rows until human verification is available (matches current site behaviour).**
- **I2. Show only `source_verified = true`; the page and most other listings will be empty until rows are verified.**
- **Reply:** `I1` / `I2`.

### J. Missing SEO targets — **partly resolved**

Added from official sources on 2026-10-20:

- `/exams/bihar-tre-4` — BPSC TRE 4.0 exam row with verified official links, pattern, eligibility and FAQs.
- `/result/bihar-board-12th-result` — BSEB Intermediate result, released 2026-03-23.
- `/result/bseb-matric-result` — BSEB Matric result, released 2026-03-29.
- `/jobs/bihar-tre-4` — verified TRE 4.0 job with 33,320 total posts and the 2026-09-25 to 2026-10-26 application window.

Still intentionally not built:

- `/exams/bssc-inter-level-2026` — no `exams.slug = 'bssc-inter-level-2026'` row; an admit-card row exists but an exam hub does not.
- `/bihar/police-jobs`, `/bihar/teacher-jobs`, `/bihar/10th-pass-jobs`, `/bihar/result` — wait for F1/F2 and a content check.

- **Reply:** `J skip until source data is loaded` or supply the BSSC source URL.
