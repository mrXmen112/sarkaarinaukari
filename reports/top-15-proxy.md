# Top 15 jobs — traffic proxy (not analytics)

**Status:** proxy ranking approved 2026-10-20. This is **not** real traffic data. No Vercel Analytics, PostHog, GA or Search Console export is connected to this project.

## Method

Published `type='job'` rows with `status='active'`, scored only from data already in `jobs`:

- **+40** Bihar state (site focus)
- **+30** closes within 7 days; **+20** within 30 days; **+10** within 60 days
- **+20** total vacancies >= 1,000; **+10** >= 100
- **+10** published in the last 14 days

Ties broken by earlier application deadline, then larger vacancy count. The Bihar weight intentionally dominates; this list is a **Bihar-first** proxy, not a national popularity list.

## Ranked list

| # | Job | Slug | Vacancies | Closes | Score |
|---|---|---|---|---|---|
| 1 | Bihar Jail Sepoy (Warder) 2026 | `bihar-jail-sepoy-2026` | 22,000 | 2026-10-25 | 90 |
| 2 | BPSC 70th Combined Competitive Examination 2026 | `bpsc-70th-ccae` | 1,500 | 2026-10-28 | 80 |
| 3 | BPSC Head Teacher (Secondary) 2026 | `bpsc-headmaster-2026` | 12,000 | 2026-10-30 | 80 |
| 4 | Bihar Police Sub Inspector 2026 | `bihar-police-si-2026` | 3,000 | 2026-10-30 | 80 |
| 5 | Bihar Home Guard 2026 | `bihar-home-guard-2026` | 16,000 | 2026-10-31 | 80 |
| 6 | Bihar Fireman (Fire Fighter) 2026 | `bihar-fireman-2026` | 8,000 | 2026-11-05 | 80 |
| 7 | BSRTC Conductor 2026 | `bsrtc-conductor-2026` | 3,000 | 2026-11-05 | 80 |
| 8 | BSRTC Driver 2026 | `bsrtc-driver-2026` | 1,800 | 2026-11-05 | 80 |
| 9 | Bihar Jal Nigam Junior Engineer 2026 | `bihar-jal-nigam-je-2026` | 1,500 | 2026-11-10 | 80 |
| 10 | Bihar Anganwadi Worker & Helper 2026 | `bihar-angwanwadi-2026` | 40,000 | 2026-11-15 | 80 |
| 11 | Bihar Prohibition Constable 2026 | `bihar-prohibition-constable-2026` | 12,000 | 2026-11-15 | 80 |
| 12 | BPSC Assistant Engineer 2026 | `bpsc-ae-2026` | 900 | 2026-11-15 | 70 |
| 13 | Bihar Excise Constable 2026 | `bihar-excise-constable-2026` | 14,000 | 2026-11-20 | 70 |
| 14 | BSSC Graduate Level Examination 2026 | `bssc-graduate-level-2026` | 8,500 | 2026-11-25 | 70 |
| 15 | Bihar Special Auxiliary Police (SAP) 2026 | `bihar-sap-2026` | 20,000 | 2026-11-30 | 70 |

## How to use

- Audit these 15 first for real application URLs, source-verified vacancy totals and pay scale. All are currently `apply_link_verified = false`.
- Re-rank once an analytics export exists; replace this file rather than mixing proxy and real traffic.
- The highest-ranked audit-failing row is `bihar-cho-2026` (#17, score 70), so the top 15 do not include a withheld row as ranked today.
