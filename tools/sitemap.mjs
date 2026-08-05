/*
  يولّد site/sitemap.xml من الملفات نفسها لا باليد.

      npm run build:sitemap

  الخريطة كانت تُحرَّر يدويًا، فتأخّرت: تسعة عشر عنوانًا تقول 2026-07-31
  وقد عُدّلت كلها بعد ذلك. وlastmod ليس زينة — به يقرّر محرّك البحث متى
  يعيد الزحف. فصفحةٌ صُحّح وعدها اليوم وتاريخها من الشهر الماضي تنتظر
  دورها طويلًا.

  فالتاريخ هنا يُؤخَذ من آخر إيداع مسّ الملف (git log -1 --format=%cs)،
  فلا يُنسى ولا يُبالَغ فيه. وإن كان الملف غير مودَع بعد، فتاريخ اليوم
  من الإيداع الأخير في المستودع، لا من ساعة الجهاز — كي يبقى البناء
  قابلًا للتكرار.

  وما يحمل noindex لا يدخل الخريطة أصلًا: التعارض بينهما إشارةٌ متناقضة.
*/
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, '..', 'site');
const ORIGIN = 'https://nizamok.com';

/* الأولوية بالبنية لا بالمزاج: الجذر، ثم ما يُشترى ويُختبَر، ثم المحاور،
   ثم المحتوى، ثم صفحات المشاركة، ثم القانوني. والمحور لا ينزل تحت أبنائه. */
const RULES = [
  [/^\/$/,                       1.0, 'weekly'],
  [/^\/ikhtibar\/$/,             0.9, 'monthly'],
  [/^\/(lamhat|rebuild|juthur)\/$/, 0.9, 'weekly'],  // محاور تُضاف إليها منتجات
  [/^\/(lamhat|rebuild|juthur)\/[^/]+\/$/, 0.9, 'monthly'],
  [/^\/almasar\/$/,              0.9, 'monthly'],
  [/^\/maqalat\/$/,              0.9, 'weekly'],   // كان 0.7 تحت مقالاته
  [/^\/rukn\/$/,                 0.9, 'weekly'],   // ركن المعرفة، محورُ ما يُقرأ بلا دفع
  [/^\/mirrors\/$/,              0.8, 'weekly'],
  [/^\/mirrors\/[^/]+\/$/,       0.8, 'monthly'],
  [/^\/maqalat\/[^/]+\/$/,       0.8, 'monthly'],
  [/^\/interdash\/$/,            0.7, 'monthly'],
  [/^\/natija\/[^/]+\/$/,        0.6, 'monthly'],
  [/^\/en\/$/,                   0.8, 'weekly'],
  [/^\/en\/quiz\/$/,             0.7, 'monthly'],
  [/^\/en\/interdash\/$/,        0.5, 'monthly'],
  [/^\/en\/(privacy|terms|refund)\/$/, 0.2, 'yearly'],
  [/^\/(privacy|terms|refund)\/$/,     0.3, 'yearly']
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { if (name !== 'assets') walk(p, out); }
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

function lastmod(file) {
  try {
    const d = execFileSync('git', ['log', '-1', '--format=%cs', '--', file],
      { cwd: join(HERE, '..'), encoding: 'utf8' }).trim();
    if (d) return d;
  } catch { /* خارج مستودع، أو ملفٌ جديد */ }
  return execFileSync('git', ['log', '-1', '--format=%cs'],
    { cwd: join(HERE, '..'), encoding: 'utf8' }).trim();
}

const rows = [];
const skipped = [];
for (const file of walk(SITE).sort()) {
  const html = readFileSync(file, 'utf8');
  const rel = '/' + relative(SITE, file).split('\\').join('/');
  const url = rel.replace(/index\.html$/, '');

  if (/name="robots"[^>]*content="[^"]*noindex/i.test(html)) { skipped.push(url + ' (noindex)'); continue; }
  if (url.endsWith('.html')) { skipped.push(url + ' (ليست دليلًا)'); continue; }

  const rule = RULES.find(([re]) => re.test(url));
  if (!rule) throw new Error(`لا قاعدة أولوية لـ${url} — أضيفيها إلى RULES بدل أن تُنشر بلا وزن`);

  /* الوسم القانوني هو ما يُفهرَس، فإن خالف العنوان فالخريطة تكذب. */
  const canon = html.match(/rel="canonical"\s+href="([^"]+)"/);
  if (!canon) throw new Error(`${url}: بلا وسم قانوني`);
  if (canon[1] !== ORIGIN + url) throw new Error(`${url}: الوسم القانوني ${canon[1]} لا يطابق`);

  rows.push({ url, lastmod: lastmod(file), changefreq: rule[2], priority: rule[1].toFixed(1) });
}

rows.sort((a, b) => (b.priority - a.priority) || a.url.localeCompare(b.url));

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- تُولَّد بـ npm run build:sitemap — لا تُحرَّر باليد، فالتواريخ من git. -->
<urlset xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rows.map(r => `  <url><loc>${ORIGIN}${r.url}</loc><lastmod>${r.lastmod}</lastmod><changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`).join('\n')}
</urlset>
`;

writeFileSync(join(SITE, 'sitemap.xml'), xml, 'utf8');
console.log(`sitemap: ${rows.length} عنوانًا`);
console.log('  ثم شغّلي sitemap:images — هذا الملف يكتب العناوين فقط ويمحو وسوم الصور');
for (const s of skipped) console.log(`  مستثنى: ${s}`);
