import { createHash } from "node:crypto";

/**
 * sha256 hex digest of cleaned text — stored as raw_scrapes.content_hash
 * for dedup (the UNIQUE constraint skips re-storing identical content).
 */
export function sha256Hex(text) {
  return createHash("sha256").update(String(text ?? ""), "utf8").digest("hex");
}
