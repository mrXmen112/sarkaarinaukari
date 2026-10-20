import test from "node:test";
import assert from "node:assert/strict";

import {
  buildMeta,
  clampSeoDescription,
  clampSeoTitle,
  SEO_DESCRIPTION_MAX,
  SEO_DESCRIPTION_MIN,
  SEO_TITLE_MAX,
} from "./seo.ts";

test("clampSeoTitle keeps short titles and caps long ones at 60", () => {
  assert.equal(
    clampSeoTitle("Bihar 12th Pass Jobs 2026: Latest Vacancies"),
    "Bihar 12th Pass Jobs 2026: Latest Vacancies",
  );

  const long = clampSeoTitle(
    "Bihar Jail Sepoy Warder Recruitment 2026: 22000 Posts, Last Date 25 October, Apply Online Now",
  );
  assert.ok(long.length <= SEO_TITLE_MAX, `title was ${long.length} chars`);
  assert.ok(long.startsWith("Bihar Jail Sepoy"));
  assert.ok(long.endsWith("…"));
});

test("clampSeoDescription always lands inside 140-160 characters", () => {
  const short = clampSeoDescription("Bihar 12th pass jobs 2026.");
  assert.ok(short.length >= SEO_DESCRIPTION_MIN);
  assert.ok(short.length <= SEO_DESCRIPTION_MAX);

  const long = clampSeoDescription(
    "Bihar 12th pass government jobs 2026 with post name, vacancy, eligibility, age limit, last date, fee and official apply link. " +
      "This extra sentence exists only to push the source copy past the maximum so truncation is exercised.",
  );
  assert.ok(long.length >= SEO_DESCRIPTION_MIN);
  assert.ok(long.length <= SEO_DESCRIPTION_MAX);
  assert.ok(long.endsWith("…"));
});

test("buildMeta emits canonical, Open Graph and Twitter fields", () => {
  const meta = buildMeta({
    kind: "job",
    title: "Bihar Jail Sepoy 2026: 22000 Posts, Last Date 25 Oct, Apply",
    description: "Bihar Jail Sepoy 2026 vacancy details with eligibility, fee and official apply link.",
    path: "/jobs/bihar-jail-sepoy-2026",
    robots: { index: true, follow: true },
    publishedTime: "2026-09-25",
    modifiedTime: "2026-10-01",
  });

  assert.deepEqual(meta.title, {
    absolute: "Bihar Jail Sepoy 2026: 22000 Posts, Last Date 25 Oct, Apply",
  });
  assert.equal(
    meta.alternates?.canonical,
    "https://www.sarkaarinaukri.online/jobs/bihar-jail-sepoy-2026",
  );
  const openGraph = meta.openGraph as { type?: string; url?: string };
  const twitter = meta.twitter as { card?: string };
  assert.equal(openGraph.type, "article");
  assert.equal(openGraph.url, meta.alternates?.canonical);
  assert.equal(twitter.card, "summary_large_image");
  assert.deepEqual(meta.robots, { index: true, follow: true });

  const description = meta.description ?? "";
  assert.ok(description.length >= SEO_DESCRIPTION_MIN);
  assert.ok(description.length <= SEO_DESCRIPTION_MAX);
});

test("landing metadata stays under the limits and is indexable by default", () => {
  const meta = buildMeta({
    kind: "landing",
    title:
      "Bihar 12th Pass Jobs 2026: Latest Bihar Government Vacancies for Intermediate Candidates",
    description: "Bihar 12th pass jobs 2026.",
    path: "/bihar/12th-pass-jobs",
  });

  assert.equal((meta.openGraph as { type?: string }).type, "website");
  assert.ok((meta.title as { absolute: string }).absolute.length <= SEO_TITLE_MAX);
  assert.ok((meta.description ?? "").length >= SEO_DESCRIPTION_MIN);
  assert.equal(meta.robots, undefined);
});
