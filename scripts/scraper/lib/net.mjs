/**
 * fetch() with bounded retries for TRANSIENT network/TLS failures.
 *
 * Some public-sector sites we scrape (notably ibps.in) intermittently abort a
 * TLS handshake (ERR_SSL_UNEXPECTED_MESSAGE) or drop a connection under load.
 * A single such blip should not fail an entire scrape run, so we retry the
 * request a few times with exponential backoff. HTTP error *responses* are NOT
 * retried here — callers decide what a non-ok status means.
 */

const TRANSIENT =
  /fetch failed|ERR_SSL|ECONNRESET|ETIMEDOUT|ECONNREFUSED|EAI_AGAIN|socket hang up|UND_ERR|other side closed/i;

function isTransient(err) {
  const code = err?.cause?.code ?? err?.code ?? "";
  const msg = `${err?.message ?? ""} ${code}`;
  return TRANSIENT.test(msg);
}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchWithRetry(url, options = {}, { attempts = 3, baseDelayMs = 800, sleep } = {}) {
  const wait = sleep ?? defaultSleep;
  let lastErr;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      lastErr = err;
      if (attempt === attempts || !isTransient(err)) throw err;
      await wait(baseDelayMs * 2 ** (attempt - 1));
    }
  }
  throw lastErr;
}
