const fs = require('fs');
const env = {};
fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).forEach((l) => {
  const i = l.indexOf('=');
  if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
});
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data: exams, error } = await sb
    .from('exams')
    .select('slug, name, syllabus_id, is_published, exam_pattern')
    .order('slug');
  if (error) return console.error('ERR:', error.message);
  const { data: syl, error: e2 } = await sb.from('syllabus').select('id, slug').order('id');
  console.log('EXAMS:', exams.length);
  const map = new Map((syl || []).map((r) => [r.id, r.slug]));
  exams.forEach((ex) =>
    console.log(' -', ex.slug.padEnd(14), '| published', ex.is_published, '| syllabus ->', map.get(ex.syllabus_id), '| pattern stages:', ex.exam_pattern.length)
  );
  console.log('STAGE rows total:', exams.reduce((a, e) => a + e.exam_pattern.length, 0));
  if (e2) console.error('SYL ERR:', e2.message);
})().catch((e) => console.error(e));