/* Open Graph share cards, one per pattern, 1200x630.
 *
 * These are what WhatsApp, X, Telegram and Facebook show when a woman shares
 * her result. A book cover will not do: it is 2:3 portrait, so every platform
 * crops it, and it reads as an advertisement rather than as her result.
 *
 * Rendered in Chromium rather than composited with sharp, because sharp's SVG
 * path goes through librsvg, which does not shape Arabic reliably. The browser
 * already has the site's own woff2 faces and correct RTL shaping, so the card
 * is built as a real page and screenshotted.
 *
 *   node tools/share-cards.mjs            # writes site/assets/share/*.jpg
 */
import { chromium } from '/home/user/Nizamuk.Business/node_modules/playwright/index.mjs';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const PORT = 8971;
const ROOT = '/home/user/Nizamuk.Business/site';
const OUT = join(ROOT, 'assets/share');

/* Slugs are the PUBLIC ones (asirat, mutafadia), matching config.rebuildPages,
   not the internal quiz keys (asira, mutafadiya). */
const PATTERNS = [
  {
    slug: 'mubdia', name: 'المبدعة المشتّتة',
    truth: 'لا تنقصكِ الأفكار، تنقصكِ فكرة واحدة تصل.',
    para: 'البداية تعطيكِ نسخة جديدة منكِ، لكنها تسحبكِ من الشيء الذي كان على وشك الوصول.'
  },
  {
    slug: 'asirat', name: 'أسيرة الكمال',
    truth: 'نقص العمل لا يعني نقصًا فيكِ.',
    para: 'لا تخافين العمل، بل لحظة ظهوره أمام عين أخرى. فصار التعديل بيتًا آمنًا بدل التسليم.'
  },
  {
    slug: 'mutafadia', name: 'المتفادية الذكية',
    truth: 'لا تتجنبين المهمة، بل الشعور الذي خلفها.',
    para: 'يومكِ مليء بالإنجاز الصغير، وبابٌ واحد مهم يكبر في الخيال كل يوم تأجيل.'
  },
  {
    slug: 'kafua', name: 'الكفؤة المنهَكة',
    truth: 'أن تكوني قادرة لا يعني أن تكوني متاحة دائمًا.',
    para: 'الجميع يظنكِ بخير لأنكِ دائمًا تتصرفين. صارت قدرتكِ تصريح دخول للجميع، إلا لكِ.'
  }
];

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

const server = createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  /* The card itself is served, not injected with setContent, so the page has a
     real origin and the font URLs resolve without a <base> rewrite. */
  const m = url.match(/^\/__card\/([a-z]+)$/);
  if (m) {
    const p = PATTERNS.find(x => x.slug === m[1]);
    if (!p) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': MIME['.html'] });
    res.end(card(p));
    return;
  }
  try {
    const p = join(ROOT, normalize(decodeURIComponent(url)));
    if (!p.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    const buf = await readFile(p);
    res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
    res.end(buf);
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(PORT, '127.0.0.1', r));

const card = (p) => `
<link rel="stylesheet" href="/assets/fonts/fonts.css">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1200px;height:630px;overflow:hidden}
  body{
    display:flex;align-items:center;justify-content:center;
    background:
      radial-gradient(120% 90% at 82% 10%, rgba(201,167,94,0.20), transparent 58%),
      radial-gradient(100% 80% at 12% 92%, rgba(227,168,172,0.14), transparent 60%),
      linear-gradient(150deg,#43265A 0%,#2E1B41 58%,#241533 100%);
    color:#FAF5EC;direction:rtl;
  }
  .frame{
    width:1112px;height:542px;border:1px solid rgba(214,186,128,0.42);
    border-radius:14px;position:relative;
    display:flex;flex-direction:column;justify-content:center;
    padding:0 74px 86px;
  }
  .frame::before,.frame::after{
    content:'';position:absolute;width:54px;height:54px;
    border:1px solid rgba(214,186,128,0.55);
  }
  .frame::before{top:-1px;right:-1px;border-left:0;border-bottom:0;border-radius:0 14px 0 0}
  .frame::after{bottom:-1px;left:-1px;border-right:0;border-top:0;border-radius:0 0 0 14px}
  /* The mandala seal is the brand's primary mark; the wordmark alone made the
     card read as a generic quote graphic. */
  .seal{height:104px;width:104px;margin-bottom:14px;opacity:.97}
  .kicker{
    font-family:'Almarai',sans-serif;font-weight:400;font-size:24px;
    letter-spacing:.06em;color:#E6D3A3;margin-bottom:16px;
  }
  .name{
    font-family:'El Messiri','Almarai',sans-serif;font-weight:700;
    font-size:82px;line-height:1.22;color:#FAF5EC;margin-bottom:20px;
  }
  .rule{width:112px;height:1px;background:rgba(214,186,128,0.65);margin-bottom:20px}
  .truth{
    font-family:'Almarai',sans-serif;font-weight:400;font-size:33px;
    line-height:1.6;color:#E6D3A3;max-width:930px;margin-bottom:14px;
  }
  .para{
    font-family:'Almarai',sans-serif;font-weight:300;font-size:25px;
    line-height:1.78;color:rgba(250,245,236,0.80);max-width:930px;
  }
  .foot{
    position:absolute;bottom:34px;left:74px;right:74px;
    display:flex;align-items:center;justify-content:space-between;
  }
  .brand{display:flex;align-items:center;gap:14px}
  .brand img{height:34px;width:auto;opacity:.95}
  .cta{
    font-family:'Almarai',sans-serif;font-weight:400;font-size:24px;
    color:rgba(230,211,163,0.86);letter-spacing:.03em;
  }
</style>
<div class="frame">
  <img class="seal" src="/assets/img/seal.png" alt="">
  <div class="kicker">نمطي في اختبار نظامك</div>
  <div class="name">${p.name}</div>
  <div class="rule"></div>
  <div class="truth">${p.truth}</div>
  <div class="para">${p.para}</div>
  <div class="foot">
    <div class="brand"><img src="/assets/img/wordmark.png" alt=""></div>
    <div class="cta">nizamok.com</div>
  </div>
</div>`;

await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await (await b.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })).newPage();

for (const p of PATTERNS) {
  await page.goto(`http://127.0.0.1:${PORT}/__card/${p.slug}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const buf = await page.screenshot({ type: 'jpeg', quality: 88 });
  const file = join(OUT, `natija-${p.slug}.jpg`);
  await writeFile(file, buf);
  console.log(`  ${p.slug.padEnd(11)} ${(buf.length / 1024).toFixed(0)} KB  ${p.name}`);
}

await b.close();
server.close();
console.log(`\n${PATTERNS.length} بطاقات مشاركة، 1200x630، في site/assets/share/`);
