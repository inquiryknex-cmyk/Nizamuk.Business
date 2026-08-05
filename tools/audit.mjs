import { chromium } from '/home/user/Nizamuk.Business/node_modules/playwright/index.mjs';

const BASE = process.argv[2] || 'https://nizamok.com';
/* القائمة يدوية، وقد تخلّفت: /lamhat/ و/rebuild/ نُشرتا وفهرسُهما لم
   يُفحَص، ومرآة النعم كذلك. فأي صفحةٍ جديدة تُضاف هنا وإلا مرّت بلا فحص. */
const PAGES = [
  '/', '/almasar/', '/ikhtibar/', '/interdash/', '/shukran/',
  '/rebuild/mubdia/', '/rebuild/asirat/', '/rebuild/mutafadia/', '/rebuild/kafua/',
  '/lamhat/mubdia/', '/lamhat/asirat/', '/lamhat/mutafadia/', '/lamhat/kafua/',
  '/lamhat/', '/rebuild/', '/juthur/', '/rukn/',
  '/juthur/mubdia/', '/juthur/asirat/', '/juthur/mutafadia/', '/juthur/kafua/',
  '/mirrors/', '/mirrors/bidayat/', '/mirrors/irsal/', '/mirrors/muhimma/', '/mirrors/naam/',
  '/maqalat/', '/maqalat/limadha-abda-wala-ukmil/', '/maqalat/idman-al-bidayat/',
  '/maqalat/al-kasal-wa-ilajuh/', '/maqalat/al-taswif-laysa-mushkilat-waqt/',
  '/maqalat/mbti-wa-mada-baad/', '/maqalat/limadha-tufakkir-alnisa-kathiran/',
  '/natija/mubdia/', '/natija/asirat/', '/natija/mutafadia/', '/natija/kafua/',
  '/privacy/', '/terms/', '/refund/',
  '/en/', '/en/quiz/', '/en/interdash/', '/en/privacy/', '/en/terms/', '/en/refund/'
];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const problems = [];
let checks = 0;

for (const path of PAGES) {
  for (const [tag, w, h] of [['mob', 390, 844], ['desk', 1440, 900]]) {
    const c = await b.newContext({ viewport: { width: w, height: h } });
    const p = await c.newPage();
    const jsErrors = [], badResponses = [];
    p.on('pageerror', e => jsErrors.push(e.message));
    p.on('response', r => {
      const u = r.url();
      if (r.status() >= 400 && (u.startsWith(BASE) || u.startsWith('http://127.0.0.1'))) {
        badResponses.push(r.status() + ' ' + u.replace(BASE, ''));
      }
    });

    const resp = await p.goto(BASE + path, { waitUntil: 'domcontentloaded' }).catch(e => ({ status: () => 'NETFAIL:' + e.message.slice(0, 40) }));
    if (typeof resp.status === 'function' && resp.status() !== 200) problems.push([path, tag, 'status ' + resp.status()]);

    await p.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); }
      scrollTo(0, 0);
    }).catch(() => {});
    await p.waitForTimeout(900);

    const r = await p.evaluate(() => {
      const out = {};
      out.overflowX = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      out.brokenImgs = [...document.querySelectorAll('img')]
        .filter(i => i.complete && i.naturalWidth === 0 && (i.currentSrc || i.src))
        .map(i => (i.currentSrc || i.src).split('/').pop());
      out.emptyAlt = [...document.querySelectorAll('img')].filter(i => i.getAttribute('alt') === null).length;
      out.title = (document.title || '').length;
      out.h1 = document.querySelectorAll('h1').length;
      out.canonical = !!document.querySelector('link[rel=canonical]');
      out.desc = (document.querySelector('meta[name=description]') || {}).content ? 1 : 0;
      // structured data must parse
      out.badSchema = [...document.querySelectorAll('script[type="application/ld+json"]')]
        .filter(s => { try { JSON.parse(s.textContent); return false; } catch (e) { return true; } }).length;
      // internal links that point nowhere on this page
      out.deadAnchors = [...document.querySelectorAll('a[href^="#"]')]
        .filter(a => { const h = a.getAttribute('href'); return h.length > 1 && !document.querySelector(h); })
        .map(a => a.getAttribute('href'));
      const ls = document.querySelector('.lang-switch');
      out.langSwitch = ls ? ls.getAttribute('href') : null;
      // any text clipped out of its box
      out.clipped = [...document.querySelectorAll('h1,h2,h3,.btn,.rb-sticky span,.mx-title')]
        .filter(e => e.scrollHeight > e.clientHeight + 4 && getComputedStyle(e).overflow !== 'visible').length;
      return out;
    }).catch(e => ({ evalFail: e.message.slice(0, 60) }));

    checks++;
    if (jsErrors.length) problems.push([path, tag, 'JS: ' + jsErrors[0].slice(0, 70)]);
    if (badResponses.length) problems.push([path, tag, 'HTTP: ' + [...new Set(badResponses)].slice(0, 3).join(', ')]);
    if (r.evalFail) { problems.push([path, tag, 'eval: ' + r.evalFail]); await c.close(); continue; }
    if (r.overflowX > 0) problems.push([path, tag, 'overflow-x ' + r.overflowX + 'px']);
    if (r.brokenImgs.length) problems.push([path, tag, 'broken img: ' + r.brokenImgs.slice(0, 3).join(', ')]);
    if (r.emptyAlt) problems.push([path, tag, r.emptyAlt + ' img without alt']);
    if (r.h1 !== 1) problems.push([path, tag, 'h1 count = ' + r.h1]);
    if (!r.canonical) problems.push([path, tag, 'no canonical']);
    if (!r.desc) problems.push([path, tag, 'no meta description']);
    if (r.badSchema) problems.push([path, tag, r.badSchema + ' invalid JSON-LD']);
    if (r.deadAnchors.length) problems.push([path, tag, 'dead anchor: ' + r.deadAnchors.join(', ')]);
    if (r.clipped) problems.push([path, tag, r.clipped + ' clipped text box(es)']);
    if (!r.langSwitch && !path.startsWith('/en/')) problems.push([path, tag, 'no language switch']);

    await c.close();
  }
}
await b.close();

console.log(`\n${BASE} — ${PAGES.length} pages x 2 viewports = ${checks} checks\n`);
if (!problems.length) {
  console.log('لا أخطاء.');
} else {
  const byPage = {};
  problems.forEach(([pg, tag, msg]) => { (byPage[pg] ||= []).push(`${tag}: ${msg}`); });
  for (const [pg, list] of Object.entries(byPage)) {
    console.log(pg);
    [...new Set(list)].forEach(l => console.log('   ' + l));
  }
  console.log(`\nالمجموع: ${problems.length} ملاحظة على ${Object.keys(byPage).length} صفحة`);
}
