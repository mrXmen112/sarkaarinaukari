<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project conventions — SarkaariNaukari.online

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript, `src/` directory.
- Tailwind CSS v4 — **CSS-first config**. There is no `tailwind.config.js`. Brand tokens live in `src/app/globals.css` under `@theme` (e.g. `--color-navy`, `--color-saffron`, `--color-ingreen`, `--color-alert`, `--color-rule`). Do NOT create a tailwind config file; extend tokens in globals.css instead.
- Postgres + Supabase (`@supabase/ssr` + `@supabase/supabase-js`).

## Commands
- `npm run dev` — dev server
- `npm run build` — production build (this catches TS + static-generation errors — always run before finishing a phase)
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)

## Conventions
- Only add comments when they explain *why*, per repo default (no decorative comments).
- Dates: use `src/lib/date.ts` (IST-aware). Render as `DD MMM YYYY`. Deadlines computed via `daysUntil()` / `deadlineTone()`.
- Supabase clients in `src/lib/supabase/`:
  - `createClient()` (cookie-aware, DYNAMIC — for auth/user routes)
  - `createStaticClient()` (anon, for public/cached content — use for ISR pages)
  - `createAdminClient()` (service role, server-only — admin panel)
  - Never import service-role key into client components.
- DB types are hand-maintained in `src/types/database.ts` — keep in sync with `supabase/migrations/`.
- SEO: every data page gets unique `<title>` + description via `generateMetadata`, `JobPosting` JSON-LD on job pages, dynamic sitemap.xml. See Section 5 of the PRD.
- Design system: SEE `src/lib/site.ts` + `src/app/globals.css`. No gradients, no glassmorphism, minimal shadows. Navy `#0B3D6E`, saffron `#FF9933`, green `#138808`, page bg `#F4F6F8`, table borders `#CBD5E1`.
- `middleware.ts` is **deprecated** in Next 16 — auth cookie refresh lives in `src/proxy.ts` (narrow matcher + Node runtime).
- Build phases in the PRD; Phase 2 starts referencing Supabase. When Supabase env vars are absent, pages must render empty states, not crash (see `isSupabaseConfigured`).

## Gotchas
- `params` / `searchParams` are **Promises** in Next 15/16 — `await` them in pages and `generateMetadata`.
- Data fetching for public pages should use ISR (`export const revalidate`, tags in `next.config.ts`) — never client-side fetch for critical content.
- Keep table-driven layout: use `DataTable` / `DetailTable` components, not card grids.
- **Windows + `next start`:** a leftover `next start` process keeps OLD route manifests in memory and 404s newly built routes. Its cmdline (`...\next" start -p 3100`) defeats `*next start*` globs — always kill the process owning the port: `Get-NetTCPConnection -LocalPort 3100 | Stop-Process -Id $(.OwningProcess)` before trusting a smoke test.
