/**
 * Phase 7A — ad click-safety test.
 *
 * The complaint: clicking anywhere on the site opened or redirected to another
 * website. That is what a popunder does. This test proves the kept zones do
 * not navigate the user anywhere, so a disabled zone cannot silently come back.
 *
 * For each route it:
 *   1. asserts the disabled zones' hostnames are absent from the HTML,
 *   2. real-mouse-clicks several BLANK areas of the page (never a link),
 *   3. clicks ordinary INTERNAL navigation links,
 *   4. fails if any popup opened, or if the origin changed to another site.
 *
 * Off-site Apply / Official Website buttons are deliberately not clicked — those
 * are the one place leaving the site is correct behaviour.
 *
 * A single page object is reused for the whole run and popups are tracked with
 * `page.on("popup")`, so tabs this script opens itself can never be mistaken
 * for an ad popup.
 *
 * Usage:
 *   npm run build && npm start -- -p 3100
 *   BASE_URL=http://localhost:3100 npm run test:ad-clicks
 */
import { chromium } from "playwright";

const BASE = (process.env.BASE_URL || "http://localhost:3100").replace(/\/$/, "");
const ORIGIN = new URL(BASE).origin;

/** Hostnames that must never be referenced when their zone is disabled. */
const MUST_BE_ABSENT = ["al5sm.com", "n6wxm.com"];

const ROUTES = ["/", "/jobs", "/jobs/bihar-tre-4", "/exams", "/yojana"];

/** Elements that legitimately leave the site — never click these. */
const OFFSITE_HINT = /apply|official|notification|portal|download|check result/i;

const failures = [];
const popups = [];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

// Only REAL popups (target=_blank / window.open from the page under test).
page.on("popup", (p) => {
  popups.push(p.url());
  p.close().catch(() => {});
});

/** Reset the page to a route and wait for the lazy ad scripts to have run. */
async function load(route) {
  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3500);
}

for (const route of ROUTES) {
  console.log(`\n${route}`);
  const res = await context.request.get(`${BASE}${route}`);
  if (!res.ok()) {
    failures.push(`${route} returned HTTP ${res.status()}`);
    continue;
  }
  const html = await res.text();

  for (const host of MUST_BE_ABSENT) {
    if (html.includes(host)) {
      failures.push(`${route}: disabled zone host "${host}" is present in the HTML`);
    }
  }

  await load(route);

  // Guard against the ad layer navigating the page on its own.
  if (new URL(page.url()).origin !== ORIGIN) {
    failures.push(`${route}: navigated off-origin on load -> ${page.url()}`);
  }

  // 1. Real mouse clicks on blank areas (never on a link or button).
  const points = [
    [640, 8],
    [12, 450],
    [1268, 450],
    [640, 880],
    [400, 500],
    [900, 500],
  ];
  let clicked = 0;
  for (const [x, y] of points) {
    const isControl = await page.evaluate(
      ([px, py]) => {
        const el = document.elementFromPoint(px, py);
        if (!el) return false;
        return !!el.closest("a,button,input,select,label,[role='button']");
      },
      [x, y],
    );
    if (isControl) continue; // that coordinate is a control, not blank space
    await page.mouse.click(x, y);
    await page.waitForTimeout(400);
    clicked += 1;
    if (new URL(page.url()).origin !== ORIGIN) {
      failures.push(`${route}: blank-area click at ${x},${y} navigated off-origin -> ${page.url()}`);
      break;
    }
  }
  console.log(`  ok    ${clicked} blank-area clicks, stayed on-origin`);

  // 2. Click ordinary internal links. Collect in the browser, filter in Node
  //    (`$$eval` runs in the page context and cannot see Node variables).
  const allLinks = await page.$$eval("a[href]", (links) =>
    links.map((a) => ({
      href: a.getAttribute("href") || "",
      text: (a.textContent || "").trim(),
    })),
  );
  const internal = allLinks
    .filter(
      (l) =>
        l.href.startsWith("/") &&
        !l.href.startsWith("//") &&
        !l.href.startsWith("/_next") &&
        !OFFSITE_HINT.test(l.text),
    )
    .slice(0, 5)
    .map((l) => l.href);

  let linkFails = 0;
  for (const href of internal) {
    await load(route); // reset to the route so each click starts from the same place
    await page.click(`a[href="${href}"]`, { force: true }).catch(() => {});
    await page.waitForTimeout(900);
    const landed = page.url();
    // Same-origin navigation is fine. Off-origin, or a popup, is not.
    if (new URL(landed).origin !== ORIGIN) {
      failures.push(`${route}: internal link ${href} navigated off-origin -> ${landed}`);
      linkFails += 1;
    }
  }
  console.log(`  ok    ${internal.length - linkFails}/${internal.length} internal links stayed on-origin`);
}

if (popups.length) {
  failures.push(`${popups.length} popup(s) opened`);
  for (const u of popups) console.error(`        popup -> ${u}`);
} else {
  console.log("\n  ok    zero popups opened across all routes");
}

await browser.close();

if (failures.length) {
  console.error(`\nFAIL — ${failures.length} problem(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("\nPASS — no ad zone hijacked a click, and no disabled zone was served.");