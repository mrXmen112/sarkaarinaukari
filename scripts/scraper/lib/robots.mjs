/**
 * robots.txt handling (Section 6.3 — always check before scraping).
 *
 * Pure parsing in `parseRobotsTxt` / `isAllowed` (unit-testable, no I/O).
 * `fetchRobotsTxt` performs the single network fetch; Phase B+ calls it
 * once per source and stores the result timestamp in
 * scrape_sources.robots_txt_checked_at.
 */

/**
 * Parse robots.txt into a list of { agents: string[], rules: { allow|disallow: path }[] }.
 * Only Allow/Disallow/User-agent lines are honoured; everything else ignored.
 */
export function parseRobotsTxt(text) {
  const groups = [];
  let current = null;
  for (const rawLine of String(text ?? "").split(/\r?\n/)) {
    const line = rawLine.split("#")[0].trim();
    if (!line) continue;
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const field = m[1].toLowerCase();
    const value = m[2].trim();
    if (field === "user-agent") {
      if (!current || current.rules.length > 0) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if ((field === "allow" || field === "disallow") && current) {
      if (value) current.rules.push({ [field]: value });
    }
  }
  return groups;
}

/**
 * Decide whether `path` (e.g. "/notices") may be fetched for `userAgent`.
 * Longest-match rule wins; Allow beats Disallow on ties. A group with no
 * rules allows everything. Unknown agents fall back to the "*" group.
 */
export function isAllowed(groups, userAgent, path) {
  const ua = String(userAgent).toLowerCase().split("/")[0];
  const candidates = groups.filter(
    (g) => g.agents.includes("*") || g.agents.includes(ua),
  );
  if (candidates.length === 0) return true; // no rules apply to us
  // Prefer the most specific group (non-"*" beats "*").
  candidates.sort((a, b) => {
    const score = (g) => (g.agents.includes(ua) && !g.agents.includes("*") ? 2 : g.agents.includes(ua) ? 1 : 0);
    return score(b) - score(a);
  });
  const rules = candidates[0].rules;
  let best = null; // { len, allow }
  for (const r of rules) {
    const rulePath = r.allow ?? r.disallow;
    if (path.startsWith(rulePath)) {
      if (!best || rulePath.length > best.len || (rulePath.length === best.len && r.allow)) {
        best = { len: rulePath.length, allow: Boolean(r.allow) };
      }
    }
  }
  return best ? best.allow : true;
}

export async function fetchRobotsTxt(baseUrl, userAgent) {
  const robotsUrl = new URL("/robots.txt", baseUrl).toString();
  const res = await fetch(robotsUrl, {
    headers: { "User-Agent": userAgent },
    redirect: "follow",
  });
  if (!res.ok) return null; // no robots.txt -> nothing disallows us
  return await res.text();
}
