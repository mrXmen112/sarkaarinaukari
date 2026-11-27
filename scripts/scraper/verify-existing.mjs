/**
 * Re-check hidden (published but unverified) rows against their original
 * official URLs. A row is promoted to verified ONLY when its title, notice
 * number, dates and figures can be found in the official source text.
 * Everything else stays hidden and is logged with a concrete reason.
 *
 * Run: node scripts/scraper/verify-existing.mjs [--limit=120] [--dry-run]
 */
import { createRequire } from 'node:module';
const require = createRequire('D:/sarkaarinaukari/package.json');
const pdfParse = require('pdf-parse');
import { loadEnv } from './lib/config.mjs';

const UA = 'Mozilla/5.0 (compatible; SarkaariNaukriBot/1.0; +https://sarkaarinaukri.online/contact)';
const { url, serviceKey } = loadEnv();
const base = url.replace(/\/$/, '');
const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };
const args = process.argv.slice(2);
const limit = Number(args.find(a => a.startsWith('--limit='))?.split('=')[1] ?? 120);
const dryRun = args.includes('--dry-run');

const sleep = ms => new Promise(r => setTimeout(r, ms));
const norm = s => String(s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();

function dateInText(iso, text) {
  if (!iso) return true;
  const [y, m, d] = String(iso).slice(0, 10).split('-');
  const t = norm(text);
  return [`${y}-${m}-${d}`, `${d}-${m}-${y}`, `${d}/${m}/${y}`, `${d}.${m}.${y}`].some(x => t.includes(x));
}

function titleInText(title, text) {
  const tokens = norm(title).split(/[^a-z0-9]+/).filter(t => t.length > 3).slice(0, 8);
  if (!tokens.length) return false;
  const t = norm(text);
  return tokens.filter(x => t.includes(x)).length >= Math.min(3, tokens.length);
}

async function fetchSource(target) {
  const res = await fetch(target, { headers: { 'User-Agent': UA, Accept: 'text/html,application/pdf' }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get('content-type') ?? '';
  if (/pdf/i.test(ct) || /\.pdf($|[?#])/i.test(target)) {
    const data = await pdfParse(Buffer.from(await res.arrayBuffer()));
    return String(data.text ?? '').replace(/\s+/g, ' ').trim();
  }
  const html = await res.text();
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

const res = await fetch(`${base}/rest/v1/jobs?select=id,slug,title,notice_number,official_link,source_url,application_end,vacancy_total,is_published,verification_status&or=(verification_status.eq.unverified,verification_status.eq.needs_review)&is_published=eq.true&limit=${limit}`, { headers });
const rows = await res.json();
console.log(`Re-checking ${rows.length} hidden published rows (dryRun=${dryRun}).`);

let verified = 0, failed = 0, archived = 0;
const reasons = {};
for (const row of rows) {
  await sleep(150);
  const target = row.source_url || row.official_link;
  const problems = [];
  let text = '';
  if (!target || !/^https?:\/\//i.test(target)) problems.push('no_source_url');
  else {
    try { text = await fetchSource(target); }
    catch (e) { problems.push(`source_unreachable:${String(e.message).slice(0, 60)}`); }
  }
  if (text && text.length < 150) problems.push('source_text_too_short');
  if (text && !titleInText(row.title, text)) problems.push('title_not_in_source');
  if (text && row.notice_number && !norm(text).includes(norm(row.notice_number))) problems.push('notice_number_not_in_source');
  if (text && !dateInText(row.application_end, text)) problems.push('deadline_not_in_source');
  if (text && row.vacancy_total && !text.includes(String(row.vacancy_total))) problems.push('vacancy_not_in_source');

  if (problems.length === 0) {
    if (!dryRun) {
      const v = await fetch(`${base}/rest/v1/rpc/mark_auto_verified`, {
        method: 'POST', headers,
        body: JSON.stringify({ p_job_id: row.id, p_source: `recheck:${new URL(target).hostname}`, p_note: 'Original official URL re-fetched and fields cross-checked' }),
      });
      if (!v.ok) problems.push(`verification_stamp_failed:${v.status}`);
      else verified++;
    } else verified++;
  }
  if (problems.length) {
    failed++;
    const code = problems[0].split(':')[0];
    reasons[code] = (reasons[code] ?? 0) + 1;
    if (!dryRun) {
      await fetch(`${base}/rest/v1/import_errors`, {
        method: 'POST', headers,
        body: JSON.stringify({ phase: 'validate', code: `recheck_${code}`, message: `${row.slug}: ${problems.join(', ')}`, details: { url: target } }),
      });
      const today = new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
      if (row.application_end < today) {
        await fetch(`${base}/rest/v1/jobs?id=eq.${row.id}`, { method: 'PATCH', headers, body: JSON.stringify({ status: 'closed' }) });
        archived++;
      }
    }
  }
}
console.log(JSON.stringify({ checked: rows.length, verified, failed, archived, reasons }, null, 2));
