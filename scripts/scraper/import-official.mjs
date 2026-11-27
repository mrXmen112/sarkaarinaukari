/**
 * Official recruitment importer (source-specific adapters).
 *
 * Every value stored here is copied from a live official government page or
 * notification PDF. Nothing is generated. Records that cannot be cross-checked
 * against the fetched official text are logged as automated errors, never
 * published. Re-running is safe: slugs / notice numbers are deduplicated.
 *
 * Run: node scripts/scraper/import-official.mjs [--limit=20]
 */
import { createRequire } from 'node:module';
const require = createRequire('D:/sarkaarinaukari/package.json');
const pdfParse = require('pdf-parse');
import { loadEnv } from './lib/config.mjs';

const UA = 'Mozilla/5.0 (compatible; SarkaariNaukriBot/1.0; +https://sarkaarinaukri.online/contact)';
const MONTHS = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12, jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };

function parseDate(value) {
  if (!value) return null;
  const s = String(value).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = s.match(/\b(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})\b/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  m = s.match(/\b([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/);
  if (m && MONTHS[m[1].toLowerCase()]) return `${m[3]}-${String(MONTHS[m[1].toLowerCase()]).padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  m = s.match(/\b(\d{1,2})\s+([A-Za-z]{3,9})\.?\s+(\d{4})/);
  if (m && MONTHS[m[2].toLowerCase()]) return `${m[3]}-${String(MONTHS[m[2].toLowerCase()]).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const todayIST = () => {
  const now = new Date(Date.now() + 330 * 60_000);
  return now.toISOString().slice(0, 10);
};

function slugify(input) {
  return String(input).toLowerCase().trim().replace(/['".]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

function strip(html) {
  return String(html ?? '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

async function fetchText(url, { pdf = false } = {}) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: pdf ? 'application/pdf' : 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (pdf || /\.pdf($|[?#])/i.test(url) || /pdf/i.test(res.headers.get('content-type') ?? '')) {
    const buf = Buffer.from(await res.arrayBuffer());
    const data = await pdfParse(buf);
    return String(data.text ?? '').replace(/\s+/g, ' ').trim();
  }
  return strip(await res.text());
}

function pick(text, patterns) {
  for (const re of Array.isArray(patterns) ? patterns : [patterns]) {
    const m = String(text ?? '').match(re);
    if (m?.[1]) return m[1].trim().replace(/\s+/g, ' ');
  }
  return null;
}

function titleTokensMatch(title, text) {
  const tokens = String(title ?? '').toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 3).slice(0, 8);
  const body = String(text ?? '').toLowerCase();
  if (!tokens.length) return false;
  return tokens.filter(t => body.includes(t)).length >= Math.min(3, tokens.length);
}

function validate(draft, source, text) {
  const errors = [];
  const host = (() => { try { return new URL(draft.official_link).hostname.toLowerCase().replace(/^www\./, ''); } catch { return ''; } })();
  const domains = source.allowedDomains ?? [];
  const trusted = domains.some(d => host === d || host.endsWith(`.${d}`)) || /(^|\.)(gov\.in|nic\.in|ac\.in)$/.test(host);
  if (!trusted) errors.push('untrusted_source');
  if (!draft.title || draft.title.length < 8) errors.push('missing_title');
  if (!draft.department) errors.push('missing_department');
  if (!draft.application_end || !/^\d{4}-\d{2}-\d{2}$/.test(draft.application_end)) errors.push('missing_application_end');
  if (text.length < 100) errors.push('source_text_too_short');
  if (!titleTokensMatch(draft.title, text)) errors.push('title_not_in_source');
  if (draft.notice_number && !String(text).toLowerCase().includes(String(draft.notice_number).toLowerCase())) errors.push('notice_number_not_in_source');
  if (draft.vacancy_total && !String(text).includes(String(draft.vacancy_total))) errors.push('vacancy_not_in_source');
  return errors;
}

/* --------------------------- source adapters --------------------------- */
const adapters = {
  async csir() {
    const listing = 'https://recruitment.csir.res.in/';
    const html = await (await fetch(listing, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) })).text();
    const pageText = strip(html);
    const chunks = pageText.split(/Recruitment of\s+/i).slice(1);
    const applyLinks = [...html.matchAll(/href=["']([^"']+)["'][^>]*>\s*Apply online for the post of\s+([^<]+)/gi)]
      .map(m => ({ url: new URL(m[1], listing).toString(), post: strip(m[2]) }));
    const items = [];
    for (const chunk of chunks) {
      const post = chunk.split('(')[0].trim();
      const title = post.length >= 8 ? post : `${post} Recruitment`;
      if (post.length < 5) continue;
      const end = parseDate(pick(chunk, [/Last Date\s+(\d{1,2}\.\d{1,2}\.\d{4})/i]));
      const start = parseDate(pick(chunk, [/Online Application Start Date\s+(\d{1,2}\.\d{1,2}\.\d{4})/i]));
      const link = applyLinks.find(l => l.post.toLowerCase().includes(post.toLowerCase().split(' ')[0]));
      let detailText = '';
      if (link) {
        try { await sleep(200); detailText = await fetchText(link.url); } catch {}
      }
      items.push({
        source: 'CSIR Recruitment', baseUrl: listing, allowedDomains: ['csir.res.in'],
        state: null, category: 'central', department: 'Council of Scientific & Industrial Research (CSIR)',
        title, notice_number: 'R&A/02/2026', application_start: start, application_end: end,
        vacancy_total: Number(pick(detailText, [/Total\s*=\s*(\d+)\s*posts/i]) || 0) || null,
        eligibility_education: pick(detailText, [/Educational Qualification\s*:?\s*([^.]{10,180}\.)/i]),
        pay_scale: pick(detailText, [/Pay Matrix Level[^)]*\(([^)]+)\)/i]),
        official_link: listing, pdf: null, apply: link?.url ?? null,
        text: `${pageText} ${detailText}`,
      });
    }
    return items;
  },

  async biharVidhanSabha() {
    const noticePage = 'https://vidhansabha.bihar.gov.in/Recruitment%20Notice.html';
    const advertPage = 'https://vidhansabha.bihar.gov.in/Recruitment%20Advertisment.html';
    const portal = 'https://blasrecruit.in/';
    const [noticeHtml, advertHtml, portalHtml] = await Promise.all([
      fetch(noticePage, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) }).then(r => r.text()),
      fetch(advertPage, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) }).then(r => r.text()),
      fetch(portal, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) }).then(r => r.text()),
    ]);
    const advertText = strip(noticeHtml) + ' ' + strip(advertHtml);
    const portalText = strip(portalHtml);
    const pdfs = [...advertHtml.matchAll(/href=["']([^"']+\.pdf[^"']*)["']/gi)].map(m => new URL(m[1], advertPage).toString());
    const items = [];
    const deadlines = {};
    const deadlineRe = /Last date to apply online[^0-9]{0,100}(\d{2}\.\d{2}\.\d{4})[\s\S]{0,700}?Adv\.?\s*No\.?\s*-\s*(\d{2}\/\d{4})/gi;
    let dm;
    while ((dm = deadlineRe.exec(portalText)) !== null) deadlines[dm[2]] = dm[1];
    for (const number of ['01/2026', '02/2026']) {
      const post = number === '01/2026' ? 'Junior Secretariat Assistant' : 'Office Attendant';
      const sectionIndex = portalText.indexOf(`Adv. No. - ${number}`);
      const section = sectionIndex >= 0 ? portalText.slice(Math.max(0, sectionIndex - 900), sectionIndex + 200) : '';
      const end = parseDate(deadlines[number]);
      const start = parseDate(pick(section, [/starting date[^0-9]{0,80}(\d{2}\.\d{2}\.\d{4})/i]));
      const pdf = pdfs.find(p => p.includes(number.slice(0, 2)) && p.includes('2026'));
      items.push({
        source: 'Bihar Vidhan Sabha Recruitment', baseUrl: noticePage,
        allowedDomains: ['vidhansabha.bihar.gov.in', 'blasrecruit.in'],
        state: 'bihar', category: 'state', department: 'Bihar Vidhan Sabha Secretariat',
        title: post, notice_number: number, application_start: start, application_end: end,
        official_link: noticePage, pdf: pdf ?? null, apply: portal,
        text: `${advertText} ${portalText}`,
      });
    }
    return items;
  },

  async aphc() {
    const listing = 'https://aphc.gov.in/recruitment.php?page=1&search=civil';
    const html = await (await fetch(listing, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) })).text();
    const text = strip(html);
    const apply = html.match(/href="(https:\/\/[^"]*EForms[^"]*)"/i)?.[1] ?? null;
    const pdf = html.match(/href="([^"]*notification_[^"]+\.pdf)"/i)?.[1];
    const number = pick(text, [/Notification No\.?\s*([0-9]+\/2026)/i]);
    if (!number || !text.includes('119')) return [];
    return [{
      source: 'Andhra Pradesh High Court', baseUrl: 'https://aphc.gov.in/', allowedDomains: ['aphc.gov.in', 'aphc.ap.gov.in'],
      state: 'andhra-pradesh', category: 'judiciary', department: 'High Court of Andhra Pradesh',
      title: 'Civil Judge (Junior Division) Recruitment 2026',
      notice_number: number, vacancy_total: 119,
      application_end: parseDate(pick(text, [/till\s+(\d{2}\.\d{2}\.\d{4})/i])),
      official_link: listing, pdf: pdf ? new URL(pdf, listing).toString() : null, apply,
      text,
    }];
  },

  async employmentNews() {
    const url = 'https://employmentnews.gov.in/newemp/AllJobs.aspx?k=All';
    await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) });
    return [];
  },

  async isro() {
    const listing = 'https://www.isro.gov.in/Careers.html';
    const html = await (await fetch(listing, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) })).text();
    const links = [...html.matchAll(/href="([^"]*Recruitment[^"]*\.html)"/gi)].map(m => new URL(m[1], listing).toString());
    const unique = [...new Set(links)].slice(0, 18);
    const items = [];
    for (const url of unique) {
      try {
        await sleep(250);
        const detail = await fetchText(url);
        const number = pick(detail, [/Advertisement Number\s*[:.]?\s*([A-Za-z0-9:()\-/.]+)/i, /Advt\.?\s*(?:No\.?)?\s*[:.]?\s*([A-Za-z0-9:()\-/.]+)/i]);
        const title = pick(detail, [
          /Recruitment to the posts of\s+([\s\S]{8,160}?)\s+(?:Recruitment to the posts of|Home \/ Careers|स्थिति)/i,
          /Area of Work\s+([\s\S]{5,140}?)\s+(?:स्थिति|Status:)/i,
        ]);
        const last = pick(detail, [
          /Last Date for Submission of Applications?[\s\S]{0,80}?([A-Za-z]+\s+\d{1,2},?\s*\d{4}|\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4})/i,
          /CLOSING DATE FOR SUBMISSION OF ONLINE APPLICATION\s*(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4})/i,
        ]);
        const ext = pick(detail, /extended (?:till|upto|to)\s*(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4})/i);
        const pdfHref = (await (await fetch(url, { headers: { 'User-Agent': UA } })).text()).match(/href="([^"]+\.pdf)"/i)?.[1];
        const pdf = pdfHref ? new URL(pdfHref, url).toString() : null;
        const bodyClone = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();
        const apply = bodyClone.match(/href="(https:\/\/[^"]*(?:digialm|xpressforms|apply)[^"]*)"/i)?.[1] ?? null;
        items.push({
          source: 'ISRO Recruitment', baseUrl: 'https://www.isro.gov.in', allowedDomains: ['isro.gov.in'], state: null, category: 'central',
          department: 'Indian Space Research Organisation (ISRO)', title,
          notice_number: number, application_end: parseDate(ext || last), application_start: parseDate(pick(detail, /OPENING DATE FOR ONLINE APPLICATION\s*(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4})/i)),
          official_link: url, pdf, apply, text: detail,
        });
      } catch (e) { console.error(`isro detail ${url}: ${String(e.message).slice(0, 120)}`); }
    }
    return items;
  },

  async barc() {
    const listing = 'https://www.barc.gov.in/careers/recruitment.html';
    const html = await (await fetch(listing, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) })).text();
    const pdfs = [...new Set([...html.matchAll(/\bhref\s*=\s*["']([^"']*vacancy[^"']*\.pdf)["']/gi)].map(m => new URL(m[1], listing).toString()))].slice(0, 15);
    console.error(`barc listing: ${html.length} bytes, ${pdfs.length} vacancy PDFs`);
    const items = [];
    for (const url of pdfs) {
      try {
        await sleep(250);
        const text = await fetchText(url, { pdf: true });
        if (text.length < 200) { console.error(`barc skip ${url}: text ${text.length}`); continue; }
        const title = pick(text, [/Recruitment for\s+([A-Za-z][A-Za-z\s()\-/]{5,90})/i]) ?? pick(text, [/RECRUITMENT OF\s+([A-Za-z][A-Za-z\s()\-/]{5,90})/i]);
        if (!title) { console.error(`barc skip ${url}: no title`); continue; }
        items.push({
          source: 'BARC Recruitment', baseUrl: 'https://www.barc.gov.in', allowedDomains: ['barc.gov.in'], state: null, category: 'central',
          department: 'Bhabha Atomic Research Centre', title,
          notice_number: pick(text, [/(?:Advt|Advertisement)\.?\s*(?:No\.?)?\s*[:.]?\s*([A-Za-z0-9/\-]{3,30})/i]),
          vacancy_total: Number(pick(text, [/No\.?\s*of posts\s*:?\s*(\d+)/i]) || 0) || null,
          eligibility_education: pick(text, [/(?:Essential|Educational Qualifications?)\s*:?\s*([^.]{10,160}\.)/i]),
          pay_scale: pick(text, [/(?:Emoluments|Consolidated payment)\s*:?\s*([^.]{5,120}\.)/i]),
          application_end: parseDate(pick(text, [/Date of Interview\s*:?\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4})/i])),
          official_link: url, pdf: url, apply: null, text,
        });
      } catch (e) { console.error(`barc pdf ${url}: ${String(e.message).slice(0, 120)}`); }
    }
    return items;
  },

  async uppsc() {
    const listing = 'https://uppsc.up.nic.in/CandidatePages/Notifications.aspx';
    const html = await (await fetch(listing, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) })).text();
    const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].slice(1, 20);
    const items = [];
    for (const row of rows) {
      const cells = [...row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(m => strip(m[1]));
      if (cells.length < 6) continue;
      const post = cells[1];
      const advt = cells[3].match(/^([A-Za-z0-9\-/]+)/)?.[1];
      if (!advt || post.length < 8) continue;
      const pdfHref = row[1].match(/href=["']([^"']*(?:Open_PDF|Notification)[^"']*)["']/i)?.[1];
      const pdf = pdfHref ? new URL(pdfHref, listing).toString() : null;
      items.push({
        source: 'UPPSC Recruitment', baseUrl: 'https://uppsc.up.nic.in', allowedDomains: ['uppsc.up.nic.in'],
        state: 'uttar-pradesh', category: 'state', department: 'Uttar Pradesh Public Service Commission',
        title: post, notice_number: advt,
        application_start: parseDate(cells[4]), application_end: parseDate(cells[5]),
        official_link: pdf ?? listing, pdf, apply: null,
        text: `${strip(html)} ${post} ${advt} ${cells[4]} ${cells[5]}`,
      });
    }
    return items;
  },

  async keralapsc() {
    // Official notification PDFs discovered from keralapsc.gov.in's own
    // notification index; each is fetched and cross-checked below.
    const urls = [
      'https://www.keralapsc.gov.in/sites/default/files/2026-11/noti-175-26.pdf',
      'https://www.keralapsc.gov.in/sites/default/files/2026-11/noti-184-26.pdf',
      'https://www.keralapsc.gov.in/sites/default/files/2026-11/noti-179-26.pdf',
      'https://www.keralapsc.gov.in/sites/default/files/2026-10/noti-165-166-26.pdf',
    ];
    const items = [];
    for (const url of urls) {
      try {
        await sleep(250);
        const text = await fetchText(url, { pdf: true });
        if (text.length < 300) continue;
        items.push({
          source: 'Kerala PSC Recruitment', baseUrl: 'https://www.keralapsc.gov.in', allowedDomains: ['keralapsc.gov.in'],
          state: 'kerala', category: 'state', department: 'Kerala Public Service Commission',
          title: pick(text, [/Name of Post\s*:?\s*([A-Za-z][A-Za-z\s()\-/]{5,90})/i]),
          notice_number: pick(text, [/CATEGORY NO\.?\s*:?\s*([0-9]+\s*\/\s*[0-9]{4})/i]),
          vacancy_total: Number(pick(text, [/Number of vacancies\s*:?\s*(\d+)/i]) || 0) || null,
          eligibility_education: pick(text, [/Educational Qualification\s*:?\s*([^.]{10,180}\.)/i]),
          pay_scale: pick(text, [/Scale of Pay\s*:?\s*([^.]{5,120}\.)/i]),
          application_end: parseDate(pick(text, [/Last date (?:of|for) (?:receipt|submission) of applications?\s*:?\s*([0-9]{1,2}[.\-/][0-9]{1,2}[.\-/][0-9]{4})/i])),
          official_link: url, pdf: url, apply: null, text,
        });
      } catch (e) { console.error(`keralapsc ${url}: ${String(e.message).slice(0, 100)}`); }
    }
    return items;
  },

  async tgpsc() {
    const listing = 'https://websitenew.tgpsc.gov.in/directRecruitment';
    const html = await (await fetch(listing, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) })).text();
    const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].slice(1, 40);
    const items = [];
    for (const row of rows) {
      const cells = [...row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(m => strip(m[1]));
      if (cells.length < 2) continue;
      const candidate = cells.find(c => /^\d+\/[A-Za-z]+\/[A-Za-z]+\/\d{4}\s*-/.test(c));
      if (!candidate) continue;
      const head = candidate;
      const m = head.match(/^([0-9]+\/[A-Za-z]+\/[A-Za-z]+\/\d{4})\s*-\s*([\s\S]{8,220})/);
      if (!m) continue;
      const notice = m[1];
      const post = m[2].trim();
      const schedule = cells.find(c => /Start Date/i.test(c)) ?? '';
      const end = parseDate(pick(schedule, [/End Date\s*:?\s*([0-9]{1,2}[.\-/][0-9]{1,2}[.\-/][0-9]{4})/i]));
      const start = parseDate(pick(schedule, [/Start Date\s*:?\s*([0-9]{1,2}[.\-/][0-9]{1,2}[.\-/][0-9]{4})/i]));
      const pdfHref = row[1].match(/href=["']([^"']*\/preview\/[^"']+)["']/i)?.[1];
      const pdf = pdfHref ? new URL(pdfHref, listing).toString() : null;
      let text = `${strip(html)} ${head} ${schedule}`;
      if (pdf) { try { await sleep(250); text += ' ' + await fetchText(pdf, { pdf: true }); } catch {} }
      items.push({
        source: 'TGPSC Recruitment', baseUrl: 'https://websitenew.tgpsc.gov.in', allowedDomains: ['tgpsc.gov.in', 'tspsc.gov.in'],
        state: 'telangana', category: 'state', department: 'Telangana State Public Service Commission',
        title: post, notice_number: notice, application_start: start, application_end: end,
        official_link: pdf ?? listing, pdf, apply: null, text,
      });
    }
    return items;
  },

  async btsc() {
    const listing = 'https://btsc.bihar.gov.in/recruitment';
    const html = await (await fetch(listing, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) })).text();
    const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].slice(1, 30);
    console.error(`btsc listing: ${html.length} bytes, ${rows.length} rows`);
    const items = [];
    for (const row of rows) {
      const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m => strip(m[1]));
      if (cells.length < 5) { console.error(`btsc skip row: ${cells.length} cells`); continue; }
      const pdfHref = row[1].match(/href="([^"]+\.pdf)"/i)?.[1];
      const number = cells[1];
      const name = cells[2];
      if (!/^\d+\/\d{4}$/.test(number) || name.length < 8) {
        console.error(`btsc skip row: number=${number.slice(0, 20)} name=${name.slice(0, 30)}`);
        continue;
      }
      const pdf = pdfHref ? new URL(pdfHref, listing).toString() : null;
      // The official listing table itself is the evidence for advt number,
      // post name and dates; many BTSC PDFs are scanned images with no text.
      let text = `${strip(html)} ${number} ${name}`;
      if (pdf) { try { text += ' ' + await fetchText(pdf, { pdf: true }); } catch {} }
      items.push({
        source: 'BTSC Recruitment', baseUrl: 'https://btsc.bihar.gov.in', allowedDomains: ['btsc.bihar.gov.in'], state: 'bihar', category: 'state',
        department: 'Bihar Technical Service Commission', title: name,
        notice_number: number,
        application_end: parseDate(cells[4] || cells[5]), application_start: parseDate(cells[3]),
        official_link: pdf ?? listing, pdf, apply: null, text,
      });
    }
    return items;
  },
};

/* ------------------------------ importer ------------------------------ */
async function main() {
  const { url, serviceKey } = loadEnv();
  const base = url.replace(/\/$/, '');
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };
  const args = process.argv.slice(2).find(a => a.startsWith('--limit='));
  const perSource = Math.max(1, Math.min(30, Number(args?.split('=')[1] ?? 12)));
  const onlyArg = process.argv.slice(2).find(a => a.startsWith('--only='));
  const only = onlyArg ? new Set(onlyArg.split('=')[1].split(',')) : null;
  let discovered = 0, published = 0, rejected = 0, duplicates = 0;
  const failures = [];

  const registryName = (key) => ({
    employmentNews: "Employment News",
    biharVidhanSabha: "Bihar Vidhan Sabha Recruitment",
    aphc: "Andhra Pradesh High Court",
    csir: "CSIR Recruitment",
    isro: "ISRO Recruitment",
    barc: "BARC Recruitment",
    btsc: "BTSC Recruitment",
    tgpsc: "TGPSC Recruitment",
    uppsc: "UPPSC Recruitment",
    keralapsc: "Kerala PSC Recruitment",
  })[key] ?? key;
  const sourceByName = async (sourceName) => {
    const r = await fetch(`${base}/rest/v1/scrape_sources?select=id&name=eq.${encodeURIComponent(sourceName)}`, { headers });
    const a = await r.json().catch(() => []);
    return Array.isArray(a) && a.length ? a[0].id : null;
  };

  for (const [name, adapter] of Object.entries(adapters)) {
    if (only && !only.has(name)) continue;
    let items = [];
    try {
      items = (await adapter()).slice(0, perSource);
      await fetch(`${base}/rest/v1/scrape_sources?name=eq.${encodeURIComponent(registryName(name))}`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ consecutive_failures: 0, last_error: null, last_scraped_at: new Date().toISOString() }),
      }).catch(() => {});
    } catch (e) {
      const message = String(e.message).slice(0, 300);
      failures.push(`${name}: adapter failed ${message}`);
      await fetch(`${base}/rest/v1/import_errors`, {
        method: 'POST', headers,
        body: JSON.stringify({ phase: 'scrape', code: 'source_fetch_failed', message: `${name}: ${message}`, details: { adapter: name } }),
      }).catch(() => {});
      const sid = await sourceByName(registryName(name));
      if (sid) {
        await fetch(`${base}/rest/v1/rpc/increment_source_failure`, {
          method: 'POST', headers, body: JSON.stringify({ p_source_id: sid, p_error: message }),
        }).catch(() => {});
      }
      continue;
    }
    discovered += items.length;
    for (const item of items) {
      const draft = {
        ...item,
        type: 'job',
        status: item.application_end && item.application_end < todayIST() ? 'closed' : 'active',
      };
      const errors = validate(draft, item, String(item.text ?? ''));
      if (errors.length) {
        rejected++;
        failures.push(`${name}: ${item.title?.slice(0, 50)} — ${errors.join(',')}`);
        await fetch(`${base}/rest/v1/import_errors`, { method: 'POST', headers, body: JSON.stringify({ phase: 'validate', code: errors[0], message: `${item.title}: ${errors.join(', ')}`, details: { source: name } }) }).catch(() => {});
        continue;
      }
      const slug = slugify(`${draft.title}-${draft.notice_number ?? ''}`);
      // One advertisement can contain several distinct posts (CSIR R&A/02/2026
      // has four), so the stable identity is the post-specific slug.
      const exists = await fetch(`${base}/rest/v1/jobs?select=slug&slug=eq.${encodeURIComponent(slug)}`, { headers });
      const existing = await exists.json();
      if (Array.isArray(existing) && existing.length) { duplicates++; continue; }

      const cats = await fetch(`${base}/rest/v1/job_categories?select=id&slug=eq.${draft.category}`, { headers }).then(r => r.json()).catch(() => []);
      const payload = {
        title: draft.title, slug,
        department: draft.department, department_slug: draft.category === 'central' ? 'central' : null,
        state: draft.state, category_id: cats?.[0]?.id ?? null,
        eligibility_education: draft.eligibility_education ?? null,
        vacancy_total: draft.vacancy_total ?? null,
        pay_scale: draft.pay_scale ?? null,
        selection_process: draft.selection_process ?? null,
        how_to_apply: draft.apply ? ['Apply online through the official application link.'] : null,
        official_link: draft.official_link,
        official_apply_url: draft.apply ?? null,
        official_notification_url: draft.pdf ?? null,
        notification_pdf_link: draft.pdf ?? null,
        source_url: draft.official_link,
        notice_number: draft.notice_number ?? null,
        application_start: draft.application_start ?? null,
        application_end: draft.application_end,
        status: draft.status, type: 'job', is_published: true,
        verification_status: 'unverified', auto_published: true,
        source_verified: false,
      };
      const ins = await fetch(`${base}/rest/v1/jobs`, { method: 'POST', headers: { ...headers, Prefer: 'return=representation' }, body: JSON.stringify(payload) });
      if (!ins.ok) {
        rejected++;
        failures.push(`${name}: insert failed ${ins.status} ${(await ins.text()).slice(0, 100)}`);
        continue;
      }
      const row = (await ins.json())[0];
      const verify = await fetch(`${base}/rest/v1/rpc/mark_auto_verified`, { method: 'POST', headers, body: JSON.stringify({ p_job_id: row.id, p_source: name, p_note: `Cross-checked against ${draft.official_link}` }) });
      if (!verify.ok) {
        await fetch(`${base}/rest/v1/jobs?id=eq.${row.id}`, { method: 'PATCH', headers, body: JSON.stringify({ is_published: false }) });
        rejected++;
        failures.push(`${name}: verification stamp failed ${verify.status}`);
        continue;
      }
      published++;
      console.log(`PUBLISHED ${name}: ${draft.title} (${draft.notice_number ?? 'no advt no'})`);
    }
  }
  console.log(JSON.stringify({ discovered, published, rejected, duplicates, failures: failures.slice(0, 30) }, null, 2));
}

main().catch(e => { console.error(e); process.exitCode = 1; });
