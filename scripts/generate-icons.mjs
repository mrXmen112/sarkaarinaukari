#!/usr/bin/env node
/**
 * Generate the Phase 6 icon set from public/icon.svg.
 *
 * Produces (all under public/, referenced from src/app/layout.tsx metadata):
 *   public/icon-192.png          PWA / manifest
 *   public/icon-512.png          PWA / manifest (+ maskable)
 *   public/apple-touch-icon.png  180x180, opaque for iOS
 *   public/favicon-32.png        legacy favicon
 *   public/favicon.ico           32x32 (PNG-encoded, accepted everywhere)
 *
 * NOTE: these deliberately do NOT live in app/. With Next 16.3.4 + Turbopack,
 * putting app/icon.png and app/apple-icon.png in the app directory breaks
 * route-type generation (AppRoutes collapses to `never` and every PageProps<>
 * usage fails to type-check). Serving them from public/ with explicit metadata
 * icons is the stable equivalent.
 *
 * Run: node scripts/generate-icons.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const source = path.join(root, "public", "icon.svg");

if (!fs.existsSync(source)) {
  console.error("public/icon.svg not found — cannot generate icons.");
  process.exit(1);
}

const svg = fs.readFileSync(source);

/** Flatten onto an opaque navy square so iOS/Android never show transparency. */
async function render(size, { opaque = false } = {}) {
  let pipeline = sharp(svg, { density: 384 }).resize(size, size, {
    fit: "cover",
  });
  if (opaque) {
    pipeline = pipeline.flatten({ background: "#0B3D6E" });
  }
  return pipeline.png({ compressionLevel: 9 }).toBuffer();
}

const jobs = [
  ["public/icon-192.png", 192, {}],
  ["public/icon-512.png", 512, {}],
  ["public/apple-touch-icon.png", 180, { opaque: true }],
  ["public/favicon-32.png", 32, {}],
  ["public/favicon.ico", 32, {}],
];

for (const [rel, size, opts] of jobs) {
  const out = path.join(root, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const buffer = await render(size, opts);
  fs.writeFileSync(out, buffer);
  console.log(`${rel.padEnd(30)} ${size}x${size}  ${(buffer.length / 1024).toFixed(1)} kB`);
}

console.log("\nIcon set generated.");