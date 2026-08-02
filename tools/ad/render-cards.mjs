/* NizamOk — «المبدعة المشتّتة» YouTube ad: the typography and card layer.
 *
 * Every Arabic word in this advertisement is rendered HERE, in Chromium, with
 * the site's own woff2 faces — never inside a generated video frame. Two
 * reasons, both non-negotiable in the brief:
 *
 *   1. Image and video models cannot shape Arabic. They produce disconnected,
 *      mirrored or invented letterforms. The only safe Arabic is Arabic laid
 *      out by a real text engine.
 *   2. The wording is approved copy. It must survive byte-for-byte, so it is
 *      kept in ONE place (COPY below) and never retyped.
 *
 * Authentic assets — the cover, the interior pages, the seal and the wordmark
 * — are composited as-is. Nothing here redraws, recolours or restyles them.
 *
 *   node tools/ad/render-cards.mjs
 */
import { chromium } from '/home/user/Nizamuk.Business/node_modules/playwright/index.mjs';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const PORT = 8931;
const SITE = '/home/user/Nizamuk.Business/site';
const OUT = '/home/user/Nizamuk.Business/build/ad';

/* ---- Approved copy. Single source. Do not retype anywhere else. ---- */
const COPY = {
  shot1: ['تبدئين بحماس…', 'ثم تتوقفين؟'],
  shot2: ['ليس كسلًا', 'ولا ضعف إرادة'],
  shot3: ['قد يكون نمط', 'المبدعة المشتّتة'],
  shot4a: ['٤٧ صفحة تطبيقية'],
  shot4b: ['خمس مراحل عملية'],
  shot4c: ['فكرة واحدة حتى تكتمل'],
  shot5: ['احمي فكرة واحدة', 'حتى تكتمل'],
  endTitle: 'نظام المبدعة المشتّتة',
  endPrice: '١٠٩ ر.س — دفعة واحدة',
  endCta: 'خذي جولة داخل الكتاب',
  endSecondary: ['لستِ متأكدة من نمطكِ؟', 'الاختبار مجاني'],
  endUrl: 'nizamok.com',
  thumb: ['تبدئين…', 'ولا تُكملين؟']
};

/* Site palette, from assets/css/main.css */
const C = {
  ivory: '#FAF5EC', gold: '#C9A75E', goldSoft: '#E6D3A3', goldDeep: '#A6813C',
  ink: '#2A2333', charcoal: '#1A1626', rose: '#E3A8AC', plum: '#43265A'
};

const FORMATS = {
  h: { w: 1920, h: 1080, safe: 96 },     // in-stream
  v: { w: 1080, h: 1920, safe: 120 }     // shorts: >=120px from side edges
};

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };

/* ------------------------------------------------------------------ *
 * Shot lower-third: transparent PNG, burned over the generated scene.
 * ------------------------------------------------------------------ */
const shotCard = (lines, f, opts = {}) => {
  const big = f.w > 1400;
  const size = opts.size || (big ? 76 : 68);
  /* Vertical keeps text clear of the Shorts chrome: caption and controls own
     roughly the lowest 320px, the top bar the highest 180. */
  const anchor = f.w > 1400 ? 'bottom:150px' : 'bottom:430px';
  return `
<link rel="stylesheet" href="/assets/fonts/fonts.css">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${f.w}px;height:${f.h}px;overflow:hidden;background:transparent}
  .wrap{
    position:absolute;${anchor};right:${f.safe}px;left:${f.safe}px;
    direction:rtl;text-align:right;
  }
  /* A soft scrim, not a box: keeps contrast over any footage without
     turning the frame into a caption bar. */
  .scrim{
    position:absolute;inset:-46px -40px -40px -40px;
    background:linear-gradient(to top,rgba(20,16,30,.80),rgba(20,16,30,.52) 55%,transparent);
    filter:blur(2px);border-radius:8px;
  }
  .line{
    position:relative;font-family:'El Messiri','Almarai',sans-serif;font-weight:700;
    font-size:${size}px;line-height:1.62;color:${C.ivory};
    text-shadow:0 2px 18px rgba(0,0,0,.55);
  }
  .line + .line{margin-top:6px}
  .accent{color:${C.goldSoft}}
  .rule{position:relative;width:${big?120:96}px;height:2px;background:${C.gold};margin-bottom:26px;margin-right:0}
</style>
<div class="wrap">
  <div class="scrim"></div>
  <div class="rule"></div>
  ${lines.map((l, i) => `<div class="line${i === lines.length - 1 && opts.accentLast ? ' accent' : ''}">${l}</div>`).join('\n  ')}
</div>`;
};

/* ------------------------------------------------------------------ *
 * End card: authentic cover + authentic wordmark + approved hierarchy.
 * ------------------------------------------------------------------ */
const endCard = (f) => {
  const vertical = f.w < 1400;
  return `
<link rel="stylesheet" href="/assets/fonts/fonts.css">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${f.w}px;height:${f.h}px;overflow:hidden}
  body{
    background:
      radial-gradient(120% 90% at 78% 12%, rgba(201,167,94,.16), transparent 58%),
      radial-gradient(100% 80% at 14% 92%, rgba(227,168,172,.10), transparent 60%),
      linear-gradient(150deg,#221B33 0%,#191325 58%,#140F1E 100%);
    color:${C.ivory};direction:rtl;
    display:flex;align-items:center;justify-content:center;
    ${vertical ? 'flex-direction:column;' : ''}
    gap:${vertical ? '52px' : '96px'};
    padding:${vertical ? '260px 110px 380px' : '90px 150px'};
  }
  .cover{
    flex:none;border-radius:6px;overflow:hidden;
    box-shadow:0 40px 90px rgba(0,0,0,.55), 0 0 0 1px rgba(214,186,128,.30);
  }
  .cover img{display:block;height:${vertical ? 620 : 720}px;width:auto}
  .col{display:flex;flex-direction:column;align-items:${vertical ? 'center' : 'flex-start'};
       text-align:${vertical ? 'center' : 'right'};max-width:${vertical ? '860px' : '820px'}}
  .brand{display:flex;align-items:center;gap:${vertical ? 22 : 20}px;margin-bottom:${vertical ? 26 : 22}px}
  .seal{height:${vertical ? 92 : 84}px;width:${vertical ? 92 : 84}px;opacity:.97}
  .mark{height:${vertical ? 62 : 56}px;width:auto;opacity:.95}
  h1{font-family:'El Messiri','Almarai',sans-serif;font-weight:700;
     font-size:${vertical ? 82 : 84}px;line-height:1.3;color:${C.ivory};margin-bottom:${vertical ? 20 : 18}px}
  .price{font-family:'Almarai',sans-serif;font-weight:400;
     font-size:${vertical ? 44 : 44}px;line-height:1.6;color:${C.goldSoft};margin-bottom:${vertical ? 40 : 38}px}
  /* A premium button, deliberately unlike any YouTube control: pill, gold
     hairline, no play glyph, no red, no rounded-rect platform styling. */
  .cta{
    display:inline-block;padding:${vertical ? '28px 62px' : '26px 58px'};
    border:1px solid rgba(214,186,128,.72);border-radius:999px;
    background:linear-gradient(180deg,rgba(201,167,94,.24),rgba(201,167,94,.12));
    font-family:'Almarai',sans-serif;font-weight:700;
    font-size:${vertical ? 46 : 44}px;color:#FBF5E9;letter-spacing:.01em;
    box-shadow:0 10px 34px rgba(0,0,0,.35);
  }
  .sec{margin-top:${vertical ? 40 : 36}px;font-family:'Almarai',sans-serif;font-weight:300;
     font-size:${vertical ? 34 : 32}px;line-height:1.75;color:rgba(250,245,236,.72)}
  .url{margin-top:${vertical ? 26 : 24}px;font-family:'Almarai',sans-serif;font-weight:400;
     font-size:${vertical ? 34 : 32}px;color:rgba(230,211,163,.86);letter-spacing:.04em;direction:ltr}
</style>
<div class="cover"><img src="/assets/product/mubdia/cover-og.jpg" alt=""></div>
<div class="col">
  <div class="brand">
    <img class="seal" src="/assets/img/seal.png" alt="">
    <img class="mark" src="/assets/img/wordmark.png" alt="">
  </div>
  <h1>${COPY.endTitle}</h1>
  <div class="price">${COPY.endPrice}</div>
  <div class="cta">${COPY.endCta}</div>
  <div class="sec">${COPY.endSecondary[0]}<br>${COPY.endSecondary[1]}</div>
  <div class="url">${COPY.endUrl}</div>
</div>`;
};

/* ------------------------------------------------------------------ *
 * Thumbnail 1280x720: authentic cover, two approved lines, nothing else.
 * ------------------------------------------------------------------ */
const thumbnail = () => `
<link rel="stylesheet" href="/assets/fonts/fonts.css">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1280px;height:720px;overflow:hidden}
  body{
    background:
      radial-gradient(120% 100% at 80% 10%, rgba(201,167,94,.18), transparent 58%),
      linear-gradient(150deg,#241C36 0%,#191325 60%,#130E1C 100%);
    color:${C.ivory};direction:rtl;
    display:flex;align-items:center;gap:74px;padding:0 86px;
  }
  .cover{flex:none;border-radius:5px;overflow:hidden;
    box-shadow:0 30px 70px rgba(0,0,0,.6), 0 0 0 1px rgba(214,186,128,.32)}
  .cover img{display:block;height:560px;width:auto}
  .txt{text-align:right}
  /* Sized for a phone-width YouTube grid cell, where 1280x720 is ~160px wide. */
  .l1{font-family:'El Messiri','Almarai',sans-serif;font-weight:700;font-size:118px;
      line-height:1.28;color:${C.ivory};text-shadow:0 3px 20px rgba(0,0,0,.5)}
  .l2{font-family:'El Messiri','Almarai',sans-serif;font-weight:700;font-size:118px;
      line-height:1.28;color:${C.goldSoft};text-shadow:0 3px 20px rgba(0,0,0,.5)}
  .rule{width:132px;height:3px;background:${C.gold};margin:26px 0 0 auto}
  .tseal{height:74px;width:74px;margin:28px 0 0 auto;display:block;opacity:.95}
</style>
<div class="cover"><img src="/assets/product/mubdia/cover-og.jpg" alt=""></div>
<div class="txt">
  <div class="l1">${COPY.thumb[0]}</div>
  <div class="l2">${COPY.thumb[1]}</div>
  <div class="rule"></div>
  <img class="tseal" src="/assets/img/seal.png" alt="">
</div>`;

/* ------------------------------------------------------------------ */
const ROUTES = {};
for (const [k, f] of Object.entries(FORMATS)) {
  ROUTES[`shot1-${k}`]  = [shotCard(COPY.shot1, f, { accentLast: true }), f];
  ROUTES[`shot2-${k}`]  = [shotCard(COPY.shot2, f), f];
  ROUTES[`shot3-${k}`]  = [shotCard(COPY.shot3, f, { accentLast: true }), f];
  ROUTES[`shot4a-${k}`] = [shotCard(COPY.shot4a, f, { size: f.w > 1400 ? 84 : 72 }), f];
  ROUTES[`shot4b-${k}`] = [shotCard(COPY.shot4b, f, { size: f.w > 1400 ? 84 : 72 }), f];
  ROUTES[`shot4c-${k}`] = [shotCard(COPY.shot4c, f, { size: f.w > 1400 ? 84 : 72 }), f];
  ROUTES[`shot5-${k}`]  = [shotCard(COPY.shot5, f, { accentLast: true }), f];
  ROUTES[`endcard-${k}`] = [endCard(f), f];
}
ROUTES['thumbnail'] = [thumbnail(), { w: 1280, h: 720 }];

const server = createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  const m = url.match(/^\/__card\/(.+)$/);
  if (m && ROUTES[m[1]]) {
    res.writeHead(200, { 'Content-Type': MIME['.html'] });
    res.end(ROUTES[m[1]][0]);
    return;
  }
  try {
    const p = join(SITE, normalize(decodeURIComponent(url)));
    if (!p.startsWith(SITE)) { res.writeHead(403).end(); return; }
    const buf = await readFile(p);
    res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
    res.end(buf);
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(PORT, '127.0.0.1', r));

await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

for (const [name, [, f]] of Object.entries(ROUTES)) {
  const ctx = await b.newContext({ viewport: { width: f.w, height: f.h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`http://127.0.0.1:${PORT}/__card/${name}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  /* Overlays keep their alpha; end card and thumbnail are opaque by design. */
  const transparent = /^shot/.test(name);
  const buf = await page.screenshot({
    type: 'png',
    omitBackground: transparent
  });
  await writeFile(join(OUT, `${name}.png`), buf);
  console.log(`  ${name.padEnd(14)} ${f.w}x${f.h}  ${(buf.length / 1024).toFixed(0).padStart(4)} KB${transparent ? '  (alpha)' : ''}`);
  await ctx.close();
}

await b.close();
server.close();
console.log(`\n${Object.keys(ROUTES).length} cards in build/ad/`);
