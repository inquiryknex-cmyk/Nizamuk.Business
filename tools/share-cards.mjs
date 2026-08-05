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
  const m = url.match(/^\/__card\/([a-z]+)\/([a-z]+)$/);
  if (m) {
    const p = PATTERNS.find(x => x.slug === m[1]);
    const f = FORMATS[m[2]];
    if (!p || !f) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': MIME['.html'] });
    res.end(card(p, f));
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

/* Two formats.
   `og`    1200x630  — the link preview WhatsApp, X, Telegram and Facebook fetch.
   `story` 1080x1920 — what she posts to Instagram, TikTok and Snapchat, none of
                       which accept a shared link at all. On those platforms the
                       image IS the share, so a landscape card is the wrong
                       object: it would sit in a letterboxed band in a 9:16
                       frame. */
const FORMATS = {
  og:    { w: 1200, h: 630,  suffix: '',        seal: 104, kicker: 24, name: 82,  truth: 33, para: 25, padB: 86, footB: 34, cta: false },
  story: { w: 1080, h: 1920, suffix: '-story',  seal: 168, kicker: 34, name: 108, truth: 46, para: 33, padB: 150, footB: 90, cta: true }
};

const card = (p, f) => `
<link rel="stylesheet" href="/assets/fonts/fonts.css">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${f.w}px;height:${f.h}px;overflow:hidden}
  body{
    display:flex;align-items:center;justify-content:center;
    background:
      radial-gradient(120% 90% at 82% 10%, rgba(201,167,94,0.20), transparent 58%),
      radial-gradient(100% 80% at 12% 92%, rgba(227,168,172,0.14), transparent 60%),
      linear-gradient(150deg,#43265A 0%,#2E1B41 58%,#241533 100%);
    color:#FAF5EC;direction:rtl;
  }
  .frame{
    width:${f.w - 88}px;height:${f.h - 88}px;border:1px solid rgba(214,186,128,0.42);
    border-radius:14px;position:relative;
    display:flex;flex-direction:column;justify-content:center;
    padding:0 ${f.w > 1100 ? 74 : 68}px ${f.padB}px;
  }
  .frame::before,.frame::after{
    content:'';position:absolute;width:54px;height:54px;
    border:1px solid rgba(214,186,128,0.55);
  }
  .frame::before{top:-1px;right:-1px;border-left:0;border-bottom:0;border-radius:0 14px 0 0}
  .frame::after{bottom:-1px;left:-1px;border-right:0;border-top:0;border-radius:0 0 0 14px}
  /* The mandala seal is the brand's primary mark; the wordmark alone made the
     card read as a generic quote graphic. */
  .seal{height:${f.seal}px;width:${f.seal}px;margin-bottom:${f.cta?44:14}px;opacity:.97}
  .kicker{
    font-family:'Almarai',sans-serif;font-weight:400;font-size:${f.kicker}px;
    letter-spacing:.06em;color:#E6D3A3;margin-bottom:${f.cta?40:16}px;
  }
  .name{
    font-family:'El Messiri','Almarai',sans-serif;font-weight:700;
    font-size:${f.name}px;line-height:1.22;color:#FAF5EC;margin-bottom:${f.cta?46:20}px;
  }
  .rule{width:${f.cta?150:112}px;height:1px;background:rgba(214,186,128,0.65);margin-bottom:${f.cta?46:20}px}
  .truth{
    font-family:'Almarai',sans-serif;font-weight:400;font-size:${f.truth}px;
    line-height:1.6;color:#E6D3A3;margin-bottom:${f.cta?38:14}px;
  }
  .para{
    font-family:'Almarai',sans-serif;font-weight:300;font-size:${f.para}px;
    line-height:1.78;color:rgba(250,245,236,0.80);
  }
  .invite{
    font-family:'Almarai',sans-serif;font-weight:400;font-size:34px;
    line-height:1.75;color:#E6D3A3;margin-top:84px;
    padding-top:50px;border-top:1px solid rgba(214,186,128,0.30);
  }
  .foot{
    position:absolute;bottom:${f.footB}px;left:${f.w>1100?74:68}px;right:${f.w>1100?74:68}px;
    display:flex;align-items:center;justify-content:space-between;
  }
  .brand{display:flex;align-items:center;gap:14px}
  .brand img{height:${f.cta?52:34}px;width:auto;opacity:.95}
  .cta{
    font-family:'Almarai',sans-serif;font-weight:400;font-size:${f.cta?32:24}px;
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
  ${f.cta ? '<div class="invite">اكتشفي نمطكِ في ثلاث دقائق، بلا دفع، ونمطكِ يظهر فورًا.</div>' : ''}
  <div class="foot">
    <div class="brand"><img src="/assets/img/wordmark.png" alt=""></div>
    <div class="cta">nizamok.com</div>
  </div>
</div>`;

await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const [key, f] of Object.entries(FORMATS)) {
  const ctx = await b.newContext({ viewport: { width: f.w, height: f.h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  console.log(`\n  ${key}  ${f.w}x${f.h}`);
  for (const p of PATTERNS) {
    await page.goto(`http://127.0.0.1:${PORT}/__card/${p.slug}/${key}`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const buf = await page.screenshot({ type: 'jpeg', quality: 88 });
    await writeFile(join(OUT, `natija-${p.slug}${f.suffix}.jpg`), buf);
    console.log(`    ${p.slug.padEnd(11)} ${(buf.length / 1024).toFixed(0).padStart(3)} KB  ${p.name}`);
  }
  await ctx.close();
}

await b.close();
server.close();
console.log(`\n${PATTERNS.length * Object.keys(FORMATS).length} بطاقة في site/assets/share/`);
