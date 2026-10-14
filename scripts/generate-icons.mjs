#!/usr/bin/env node
/**
 * Generate the Phase 6 icon set from public/icon.svg.
 *
 * Produces (all under public/, referenced from src/app/layout.tsx metadata):
 *   public/icon-48.png           Google favicon size
 *   public/icon-96.png           Google favicon size
 *   public/icon-192.png          PWA / manifest
 *   public/icon-512.png          PWA / manifest (+ maskable) + Organization logo
 *   public/apple-touch-icon.png  180x180, opaque for iOS
 *   public/favicon-32.png        legacy favicon
 *   public/favicon.ico           multi-size ICO (16/32/48) for legacy browsers
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
  ["public/icon-48.png", 48, {}],
  ["public/icon-96.png", 96, {}],
  ["public/icon-192.png", 192, {}],
  ["public/icon-512.png", 512, {}],
  ["public/apple-touch-icon.png", 180, { opaque: true }],
  ["public/favicon-32.png", 32, {}],
];

for (const [rel, size, opts] of jobs) {
  const out = path.join(root, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const buffer = await render(size, opts);
  fs.writeFileSync(out, buffer);
  console.log(`${rel.padEnd(30)} ${size}x${size}  ${(buffer.length / 1024).toFixed(1)} kB`);
}

/**
 * favicon.ico — a real multi-image ICO, not a renamed PNG.
 *
 * Google fetches /favicon.ico and looks for a >=48x48 image; a 32x32-only file
 * is what produces the generic black circle in search results. The container
 * format is simple enough to write by hand: a 6-byte ICONDIR header, a
 * 16-byte directory entry per image, then the PNG payloads verbatim (PNG-in-ICO
 * is supported by every browser that matters since IE11).
 */
const ICO_SIZES = [16, 32, 48];
const pngs = [];
for (const size of ICO_SIZES) {
  pngs.push({ size, data: await render(size, {}) });
}

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type 1 = icon
header.writeUInt16LE(ICO_SIZES.length, 4);

let offset = 6 + 16 * ICO_SIZES.length;
const dir = [];
for (const { size, data } of pngs) {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0); // width  (0 means 256)
  entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2); // palette colours (0 = truecolour)
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(data.length, 8);
  entry.writeUInt32LE(offset, 12);
  dir.push(entry);
  offset += data.length;
}

const ico = Buffer.concat([header, ...dir, ...pngs.map((p) => p.data)]);
fs.writeFileSync(path.join(root, "public/favicon.ico"), ico);
console.log(
  `${"public/favicon.ico".padEnd(30)} ${ICO_SIZES.join("/")}  ${(ico.length / 1024).toFixed(1)} kB`,
);

console.log("\nIcon set generated.");