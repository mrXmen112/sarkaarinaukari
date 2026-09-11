/**
 * Per-domain rate limiter (Section 6.4).
 *
 * Guarantees a minimum delay between consecutive requests to the same host
 * so we never hammer government servers. In-memory only — one limiter
 * instance per scraper process is all we need.
 */

export class RateLimiter {
  /** @param {number} minDelayMs minimum gap between requests per host */
  constructor(minDelayMs) {
    this.minDelayMs = minDelayMs;
    this.lastHit = new Map(); // host -> timestamp ms
  }

  /** Sleep until `host` is allowed again, then record the hit. */
  async wait(host) {
    const now = Date.now();
    const last = this.lastHit.get(host) ?? 0;
    const waitMs = this.minDelayMs - (now - last);
    if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));
    this.lastHit.set(host, Date.now());
  }

  /** Convenience: wait for the host of `url`, then return the URL. */
  async gate(url) {
    await this.wait(new URL(url).host);
    return url;
  }
}
