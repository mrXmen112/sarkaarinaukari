# SEO_CHECKLIST.md — sarkaarinaukri.online

Status after Phase 0 + Phase 1. Everything marked **DONE** is in the code;
**YOU DO** items need your account access (Vercel/Supabase/Google/Bing).

## Phase 0 — Critical fixes

| Item | Status |
|---|---|
| `naukari` -> `naukri` domain typo fixed everywhere (code, robots, sitemap, env, package name, supabase project_id) | **DONE** |
| Single hostname: `https://www.sarkaarinaukri.online` as primary; bare domain 301-redirects via `next.config.ts` host rule | **DONE** (redirect logic) |
| `NEXT_PUBLIC_SITE_URL=https://www.sarkaarinaukri.online` set in `.env.local` + example | **DONE** (local) |
| Removed `keywords` meta (Google ignores it) | **DONE** |
| Search-style job titles/descriptions (`Bihar Home Guard Bharti 2026: 16000 Posts, Last Date 31 Oct, Apply Online`) | **DONE** |
| Homepage has Hindi intro paragraph under the H1 | **DONE** |
| robots.txt: disallows `/admin`, `/profile`, `/login`, `/auth`, `/api` and query-param filter URLs; references sitemap | **DONE** |
| Sitemap index at `/sitemap.xml` -> `/sitemap/static.xml`, `jobs.xml`, `updates.xml`, `prep.xml` with real `updated_at` lastmod | **DONE** |
| Twitter `summary_large_image` cards | **DONE** |
| Default Open Graph image (generated, 1200x630, navy/saffron brand) | **DONE** |
| Logo applied: `/public/icon.svg`, header mark + wordmark, `manifest.webmanifest`, metadata icons | **DONE** (SVG) |

### YOU DO — hostname & search consoles
1. **Vercel -> Domains**: make `www.sarkaarinaukri.online` the primary domain and confirm `sarkaarinaukri.online` redirects to it (the app redirect is in `next.config.ts`; Vercel should also serve the apex as a redirect).
2. **Vercel -> Environment Variables (Production + Preview)**: set
   - `NEXT_PUBLIC_SITE_URL=https://www.sarkaarinaukri.online`
   - `CRON_SECRET=<same value as .env.local>`
   - (optional) `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
   - existing Supabase keys + `LLM_API_KEY` if not already set
3. **Google Search Console**: add the property `https://www.sarkaarinaukri.online`, submit `https://www.sarkaarinaukri.online/sitemap.xml`, then use "Removals" only if the old apex URL is indexed.
4. **Bing Webmaster Tools**: add site + submit sitemap (import from GSC is fastest).
5. **Rich Results Test**: verify one job page (JobPosting + FAQPage JSON-LD) after deploy.

### YOU DO — icons (PNG set)
The SVG icon is wired. Drop your PNGs into `/public` when ready and re-add to
`src/app/layout.tsx` metadata:
- `apple-touch-icon.png` (180x180) — Apple ignores SVG
- `icon-192.png`, `icon-512.png` — then list them in `public/manifest.webmanifest` alongside `/icon.svg`

## Phase 1 — Vacancy pipeline & automation

| Item | Status |
|---|---|
| `sources` table (`scrape_sources`) with per-source active + trusted "auto-publish" toggle and parser note | **DONE** (migration 0016, `/admin/sources`) |
| Scheduler: Vercel cron `vercel.json` (daily — Hobby limit) hitting `/api/cron/pipeline` + `/api/cron/maintenance`, `CRON_SECRET` protected | **DONE** |
| Supabase `pg_cron` 30-60 min snippet (pg_net) documented in migration 0016 for higher frequency | **DONE** (SQL ready to run) |
| Scrape -> hash dedupe -> `raw_scrapes` -> LLM structuring (nulls for missing fields, never guesses) -> `pending_entries` | **DONE** (was already built; cron now drives it) |
| Review queue approve/reject/edit at `/admin/review-queue` with one-click actions | **DONE** (existing) |
| Link gate before publish: approve fails on empty/placeholder official link | **DONE** |
| Link validation: HEAD (GET+Range fallback), DoH NXDOMAIN check, flags ONLY provably-dead links (404/410 or non-existent domain); `/admin/link-report` + "Run now" | **DONE** (migration 0016) |
| One-time audit of ALL existing jobs (done `2026-10-13`): cleared **61 dead seeded PDF links** (report: `scripts/link-audit/last-report.json`), **39 jobs keep a dead seeded official URL** — flagged in `/admin/link-report`, Apply button hidden on them | **DONE** |
| Auto-expiry: `refresh_job_statuses()` flips past-deadline jobs to `closed` (kept, never deleted); "Recently Closed" = closed <= 30 days; `/jobs/archive` = closed > 90 days | **DONE** |
| "Similar Open Jobs" block on closed job pages | **DONE** |
| Recruitment Timeline block (Notification -> Apply -> Admit Card -> Exam -> Answer Key -> Result) from real linked records | **DONE** |
| Telegram auto-post on approve, toggle in `/admin` dashboard, env-var tokens | **DONE** |
| New pages: `/jobs/archive`, `/admin/sources`, `/admin/link-report` | **DONE** |
| Job tables show "Closed" instead of "Apply" after the last date | **DONE** |

### YOU DO — to switch the pipeline on
1. Apply migration 0016: `supabase db push` (or run the SQL file in the Supabase SQL editor).
2. In Supabase SQL editor, enable 30-60 min scraping (Vercel Hobby crons are daily-only):
   ```sql
   create extension if not exists pg_cron;
   create extension if not exists pg_net;
   alter database postgres set app.cron_secret = '<same value as CRON_SECRET>';
   select cron.schedule('sarkaari-pipeline', '17,47 * * * *',
     $$select net.http_post(
        url := 'https://www.sarkaarinaukri.online/api/cron/pipeline',
        headers := jsonb_build_object('Authorization','Bearer ' || current_setting('app.cron_secret', true)),
        body := '{}'::jsonb)$$);
   ```
   If your Supabase plan lacks pg_cron, ask me and I'll wire the daily Vercel cron to loop sources instead.
3. Verify the first run: `curl -H "Authorization: Bearer <CRON_SECRET>" https://www.sarkaarinaukri.online/api/cron/maintenance`.
4. Telegram: create a bot with @BotFather, add it as admin to your channel, set `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` in Vercel env, then flip **Auto-post ON** on `/admin`.
5. First pipeline run requires the CSBC adapter to pass isolated testing: run `npm run scraper -- --live --source "CSBC Bihar Police Recruitment"` once from your machine before flipping more sources active in `/admin/sources`.

## Open questions for you
1. Do you have the PNG icon set ready to drop in, or should I generate PNGs from the SVG?
2. Vercel plan: Hobby (daily crons only) or Pro (allows 30-60 min crons)?
3. Phase 2 next: per-page generated OG images + `Organization`/`WebSite` JSON-LD + `BreadcrumbList` on inner pages. Say the word and I'll continue with Phase 2.
