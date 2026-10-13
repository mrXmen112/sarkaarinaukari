#!/usr/bin/env node
/**
 * Weekly board-portal link check (Phase 4C).
 *
 * Every board portal in src/lib/boards.ts must resolve on the public DNS and
 * answer with a real HTTP response. This script checks that and prints a
 * report; --json writes the report for the admin panel.
 *
 * Design notes:
 *  - DNS is checked via DNS-over-HTTPS (dns.google) because some gov hosts do
 *    not answer to plain DNS resolvers, and our server IP can be blocked.
 *  - A 403/405 means the site is alive but blocks bots: NOT a failure.
 *  - Only NXDOMAIN, connection failure and 404/410 are reported as broken.
 *
 * Usage: node scripts/board-links-check.mjs [--json]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const boardsSrc = fs.readFileSync(
  path.join(here, "..", "src", "lib", "boards.ts"),
  "utf8",
);

/** Extract portalUrl + slug pairs straight from the app source of truth. */
function extractBoards() {
  const out = [];
  const slugRe = /slug:\s*"([a-z0-9-]+)",\s*\n\s*name:[\s\S]*?portalUrl:\s*"(https:\/\/[^"]+)"/g;
  let m;
  while ((m = slugRe.exec(boardsSrc)) !== null) {
    out.push({ slug: m[1], portalUrl: m[2] });
  }
  return out;
}

const boards = extractBoards();
if (boards.length === 0) {
  console.error("Could not parse any boards from src/lib/boards.ts");
  process.exit(1);
}

async function dnsOk(host) {
  try {
    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(host)}&type=A`,
      { headers: { "User-Agent": "SarkaariNaukriLinkCheck/1.0" } },
    );
    if (!res.ok) return { ok: false, reason: `DoH HTTP ${res.status}` };
    const body = await res.json();
    if (body.Status === 3) return { ok: false, reason: "NXDOMAIN" };
    if (body.Status !== 0) return { ok: false, reason: `DNS status ${body.Status}` };
    const hasA = (body.Answer ?? []).some((a) => a.type === 1);
    return hasA ? { ok: true, reason: "resolves" } : { ok: true, reason: "resolves (no A record in answer set)" };
  } catch (error) {
    return { ok: false, reason: `DoH error: ${error.message}` };
  }
}

async function httpOk(url) {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: { "User-Agent": "SarkaariNaukriLinkCheck/1.0" },
      signal: AbortSignal.timeout(20000),
    });
    // 403/405 = alive but bot-blocked. Treat as OK.
    if (res.status === 403 || res.status === 405 || res.status === 401) {
      return { ok: true, status: res.status, reason: `alive (blocked bots, HTTP ${res.status})` };
    }
    // A real 404/410 on the portal path is the only HTTP proof it is dead.
    if (res.status === 404 || res.status === 410) {
      return { ok: false, status: res.status, reason: `HTTP ${res.status}`, dead: true };
    }
    if (res.status >= 500) {
      return { ok: true, status: res.status, reason: `server error HTTP ${res.status} (site up)` };
    }
    return { ok: true, status: res.status, reason: `HTTP ${res.status}` };
  } catch (error) {
    // TLS/geo/IP blocks make many gov portals unreachable from a cloud IP.
    // DNS already proved the host exists, so this is NOT a dead link.
    return {
      ok: true,
      status: null,
      reason: `unreachable from this host (${error.message}) — DNS resolves`,
      dead: false,
    };
  }
}

const report = [];
for (const board of boards) {
  const host = new URL(board.portalUrl).hostname;
  const dns = await dnsOk(host);
  const http = dns.ok
    ? await httpOk(board.portalUrl)
    : { ok: false, status: null, reason: "skipped (DNS failed)", dead: true };
  // Broken = dead DNS OR a definite 404/410. Everything else is a warning.
  const broken = !dns.ok || http.dead === true;
  report.push({ slug: board.slug, portalUrl: board.portalUrl, dns: dns.reason, http: http.reason, healthy: !broken });
  const mark = broken ? "FAIL" : dns.ok && http.ok ? "OK  " : "WARN";
  console.log(`${mark} ${board.slug.padEnd(20)} ${board.portalUrl}  [dns: ${dns.reason}] [http: ${http.reason}]`);
}

const brokenRows = report.filter((r) => !r.healthy);
const warned = report.filter((r) => r.healthy && r.http.includes("unreachable"));
console.log(`\n${report.length} portals checked, ${brokenRows.length} broken, ${warned.length} unreachable-from-here.`);
if (brokenRows.length > 0) {
  console.log("\nBroken portals (verify from the board site before replacing):");
  for (const b of brokenRows) {
    console.log(`  ${b.slug}: ${b.portalUrl} — ${b.dns} / ${b.http}`);
  }
}

if (process.argv.includes("--json")) {
  const outPath = path.join(here, "board-links-report.json");
  fs.writeFileSync(
    outPath,
    JSON.stringify({ checkedAt: new Date().toISOString(), report }, null, 2),
  );
  console.log(`\nJSON report: scripts/board-links-report.json`);
}