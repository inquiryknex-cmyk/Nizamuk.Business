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

/* ---- Approved copy. Single source. Do not retype anywhere else. ----
 *
 * Outcome-first, not pattern-first. The earlier cut asked the viewer to accept
 * a framework — «قد يكون نمط المبدعة المشتّتة» — before she could want the
 * thing. That is a second sale made before the first one. She already knows the
 * problem: تبدئين بحماس ثم تتوقفين. So the promise is now the result, and the
 * pattern does its work privately, after she is inside.
 *
 * The price line and the CTA are the two strings that change when the 14-day
 * entry product exists; nothing else in the film depends on them.
 *
 * «حتى يكتمل» and not «يعود إلى الحياة», in both places it appears. Coming back
 * to life is a restart, and restarting is the one thing she is already good at —
 * the whole premise is that she starts and starts. The finish line is what she
 * is buying, so the copy has to name the finish line.
 */
const COPY = {
  /* Owner's script, her timings. Line breaks are hers wherever they fit the
     column; longer ones wrap onto a third row rather than shrink to
     illegibility, and each beat carries its own size for the same reason. No
     word is altered.

     The arc is a completion story told forward: how many did you start → you
     are not lazy, you stall at the same point → without knowing why, you go
     back to zero → locate the stall and pick ONE project → restart from the
     stall, not from zero → a 30-day plan → a 90-day follow-through.

     The «brief» block that used to sit beside the cover is gone: beat two now
     occupies that slot, and what the brief carried — 47 pages, five stages, the
     price — moved to the end card where a price belongs. */
  beats: [
    { card: 'b1', size: 64, lines: ['كم مشروعًا بدأتِه بحماس…', 'ولم يكتمل؟'] },
    { card: 'b2', size: 64, lines: ['لستِ كسولة.', 'لكنكِ تتعثرين عند النقطة', 'نفسها، كل مرة.'] },
    { card: 'b3', size: 60, lines: ['وما لم تفهمي سبب هذا التعثر…', 'ستعودين إلى نقطة الصفر.'] },
    { card: 'b4', size: 64, lines: ['حدّدي أين يتعطّل مشروعكِ،', 'واختاري مشروعًا واحدًا', 'لإكماله.'] },
    { card: 'b5', size: 76, lines: ['وابدئي من موضع التعثّر…', 'لا من الصفر.'] },
    { card: 'b6', size: 72, lines: ['خطة ٣٠ يومًا', 'تنقلكِ من النيّة', 'إلى التنفيذ.'] },
    { card: 'b7', size: 66, lines: ['ومسار متابعة يمتد ٩٠ يومًا', 'يحمي تقدّمكِ', 'من الانقطاع.'] }
  ],

  endTitle: 'نظام إعادة البناء',
  endPrice: '٤٧ صفحة · خمس مراحل · ١٠٩ ر.س',
  endCta: 'خذي جولة داخل الكتاب',
  endUrl: 'nizamok.com',
  thumb: ['تبدئين…', 'ولا تُكملين؟']
};

/* Site palette, from assets/css/main.css */
const C = {
  ivory: '#FAF5EC', gold: '#C9A75E', goldSoft: '#E6D3A3', goldDeep: '#A6813C',
  ink: '#2A2333', charcoal: '#1A1626', rose: '#E3A8AC', plum: '#43265A'
};

/* `layout` follows the picture. The ad is a product film: the book is staged
   left of centre in 16:9 (see render-plates.mjs), so the type takes the empty
   right column rather than a bottom third that would sit under nothing. In
   9:16 the book is stacked above the type, so the bottom anchor still holds. */
const FORMATS = {
  h: { w: 1920, h: 1080, safe: 96,  layout: 'side'   },  // in-stream
  v: { w: 1080, h: 1920, safe: 120, layout: 'bottom' }   // shorts: >=120px from side edges
};

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };

/* ------------------------------------------------------------------ *
 * Shot lower-third: transparent PNG, burned over the generated scene.
 * ------------------------------------------------------------------ */
const shotCard = (lines, f, opts = {}) => {
  const side = f.layout === 'side';
  /* Large. The type was set at magazine-caption size against a full-height
     book, so it read as a footnote to the picture rather than as the thing being
     said. On a phone-sized Shorts frame it was barely legible at all. */
  const size = opts.size || (side ? 90 : 80);
  /* side   — a column at x>=1080, vertically centred on the staged book.
     bottom — anchored by its TOP, directly under the book, ending above
              y=1350. Two reasons it is a top anchor and not a bottom one:
              a bottom anchor put the words down in the Shorts player's own
              title-and-buttons band, where they read as a caption rather than
              as part of the picture; and it made one-line cards sit lower than
              two-line ones, so the type jumped between shots. */
  const place = side
    ? `top:50%;transform:translateY(-50%);right:80px;width:840px;`
    : `top:1060px;right:${f.safe}px;left:${f.safe}px;`;
  /* A scrim, not a box. Under a column it has to be radial or it reads as a
     panel edge against the velvet; under a bottom third a rise is right. */
  /* Radial in BOTH layouts. The bottom third used to be a linear gradient,
     which is opaque at its own left, right and bottom edges — over generated
     footage that reads as a caption bar, but over the staged velvet ground it
     drew a visible rectangle around the words. A radial reaches transparent
     before the box does, so there is no edge to see. */
  const scrim = side
    ? `inset:-90px -110px;background:radial-gradient(58% 52% at 52% 50%,rgba(18,14,27,.80),rgba(18,14,27,.42) 62%,transparent 78%);filter:blur(26px);`
    : `inset:-150px -170px;background:radial-gradient(56% 58% at 50% 50%,rgba(18,14,27,.72),rgba(18,14,27,.34) 60%,transparent 76%);filter:blur(34px);`;
  return `
<link rel="stylesheet" href="/assets/fonts/fonts.css">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${f.w}px;height:${f.h}px;overflow:hidden;background:transparent}
  /* 16:9 sets the type as a right-aligned column beside the book; 9:16 centres
     it, because there the book is dead centre and a right-aligned block under a
     centred object reads as misaligned rather than as editorial. */
  .wrap{position:absolute;${place}direction:rtl;text-align:${side ? 'right' : 'center'};}
  .scrim{position:absolute;${scrim}}
  .line{
    position:relative;font-family:'El Messiri','Almarai',sans-serif;font-weight:700;
    font-size:${size}px;line-height:1.62;color:${C.ivory};
    text-shadow:0 2px 18px rgba(0,0,0,.55);
  }
  .line + .line{margin-top:6px}
  .accent{color:${C.goldSoft}}
  .rule{position:relative;width:${side?150:120}px;height:3px;background:${C.gold};
    margin:0 ${side ? '0' : 'auto'} 26px ${side ? 'auto' : 'auto'}}
</style>
<div class="wrap">
  <div class="scrim"></div>
  <div class="rule"></div>
  ${lines.map((l, i) => `<div class="line${i === lines.length - 1 && opts.accentLast ? ' accent' : ''}">${l}</div>`).join('\n  ')}
</div>`;
};

/* ------------------------------------------------------------------ *
 * The brief: what the book IS, set beside the cover before a page is shown.
 *
 * This is the beat the first cut was missing. It held the cover for eleven
 * seconds and said only "you start and stop" — the viewer looked at an object
 * for a third of the ad without being told what it was. One shot, two beats:
 * the hook, then this.
 *
 * Set as a title page rather than a caption: kicker, title, rule, three short
 * lines. Naming what is inside the book is allowed; explaining how it is built
 * is not.
 * ------------------------------------------------------------------ */
const briefCard = (f) => {
  const side = f.layout === 'side';
  const place = side
    ? `top:50%;transform:translateY(-50%);right:80px;width:840px;`
    : `top:980px;right:${f.safe}px;left:${f.safe}px;`;
  return `
<link rel="stylesheet" href="/assets/fonts/fonts.css">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${f.w}px;height:${f.h}px;overflow:hidden;background:transparent}
  .wrap{position:absolute;${place}direction:rtl;text-align:${side ? 'right' : 'center'}}
  .scrim{
    position:absolute;inset:${side ? '-100px -120px' : '-140px -170px'};
    background:radial-gradient(60% 56% at 50% 50%,rgba(18,14,27,.82),rgba(18,14,27,.44) 62%,transparent 78%);
    filter:blur(30px);
  }
  .kicker{
    position:relative;font-family:'Almarai',sans-serif;font-weight:400;
    font-size:${side ? 38 : 36}px;letter-spacing:.10em;color:${C.goldSoft};
    margin-bottom:${side ? 14 : 12}px;
  }
  .title{
    position:relative;font-family:'El Messiri','Almarai',sans-serif;font-weight:700;
    font-size:${side ? 100 : 88}px;line-height:1.22;color:${C.ivory};
    text-shadow:0 2px 20px rgba(0,0,0,.55);margin-bottom:${side ? 26 : 22}px;
  }
  /* A rule with a diamond on it — the house ornament, not a plain divider. */
  .orn{position:relative;display:flex;align-items:center;gap:12px;
    justify-content:${side ? 'flex-start' : 'center'};margin-bottom:${side ? 30 : 26}px}
  .orn i{display:block;height:2px;width:${side ? 140 : 112}px;background:${C.gold};opacity:.85}
  .orn b{display:block;width:7px;height:7px;background:${C.gold};transform:rotate(45deg)}
  .l{
    position:relative;font-family:'Almarai',sans-serif;font-weight:300;
    font-size:${side ? 46 : 42}px;line-height:1.86;color:rgba(250,245,236,.90);
    text-shadow:0 2px 14px rgba(0,0,0,.5);
  }
  .l.gold{font-weight:400;color:${C.goldSoft};letter-spacing:.03em}
  .path{
    position:relative;margin-top:${side ? 30 : 26}px;padding-top:${side ? 24 : 20}px;
    border-top:1px solid rgba(214,186,128,.30);
    font-family:'Almarai',sans-serif;font-weight:400;font-size:${side ? 34 : 32}px;
    color:rgba(230,211,163,.82);letter-spacing:.03em;
  }
</style>
<div class="wrap">
  <div class="scrim"></div>
  <div class="kicker">${COPY.briefKicker}</div>
  <div class="title">${COPY.briefTitle}</div>
  <div class="orn"><i></i><b></b><i></i></div>
  <div class="l">${COPY.briefLines[0]}</div>
  <div class="l gold">${COPY.briefLines[1]}</div>
  <div class="l">${COPY.briefLines[2]}</div>
  <div class="path">${COPY.briefPath}</div>
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
    /* DOM order is [text, cover]; the flow puts the cover where the film has
       been keeping the book for 25 seconds — left of the type in 16:9, above
       it in 9:16 — so the last cut does not slide the object across frame. */
    flex-direction:${vertical ? 'column-reverse' : 'row'};
    gap:${vertical ? '52px' : '96px'};
    /* Bottom-heavy padding on purpose: it lifts the whole end card out of the
       band a Shorts player covers with its own title and buttons. */
    padding:${vertical ? '200px 110px 520px' : '90px 150px'};
  }
  /* Same physical page-edge the plates give it. Without it the end card shows
     a flat rectangle where the film showed an object. */
  .cover{flex:none;position:relative}
  .cover img{
    display:block;height:${vertical ? 620 : 720}px;width:auto;border-radius:6px;
    box-shadow:0 40px 90px rgba(0,0,0,.55), 0 0 0 1px rgba(214,186,128,.30);
  }
  .cover::before{
    content:'';position:absolute;top:7px;bottom:7px;left:-13px;width:13px;
    background:linear-gradient(90deg,#2b2438 0%,#d8d0c0 26%,#f2ece0 46%,#c9c0ae 74%,#8f8676 100%);
    border-radius:3px 0 0 3px;box-shadow:-7px 20px 36px rgba(0,0,0,.5);
  }
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
<div class="col">
  <div class="brand">
    <img class="seal" src="/assets/img/seal.png" alt="">
    <img class="mark" src="/assets/img/wordmark.png" alt="">
  </div>
  <h1>${COPY.endTitle}</h1>
  <div class="price">${COPY.endPrice}</div>
  <div class="cta">${COPY.endCta}</div>
  <div class="url">${COPY.endUrl}</div>
</div>
<div class="cover"><img src="/assets/product/mubdia/cover-og.jpg" alt=""></div>`;
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
  .cover{flex:none;position:relative}
  .cover img{display:block;height:560px;width:auto;border-radius:5px;
    box-shadow:0 30px 70px rgba(0,0,0,.6), 0 0 0 1px rgba(214,186,128,.32)}
  .cover::before{
    content:'';position:absolute;top:6px;bottom:6px;left:-11px;width:11px;
    background:linear-gradient(90deg,#2b2438 0%,#d8d0c0 26%,#f2ece0 46%,#c9c0ae 74%,#8f8676 100%);
    border-radius:3px 0 0 3px;box-shadow:-6px 16px 30px rgba(0,0,0,.5);
  }
  .txt{text-align:right}
  /* Sized for a phone-width YouTube grid cell, where 1280x720 is ~160px wide. */
  .l1{font-family:'El Messiri','Almarai',sans-serif;font-weight:700;font-size:118px;
      line-height:1.28;color:${C.ivory};text-shadow:0 3px 20px rgba(0,0,0,.5)}
  .l2{font-family:'El Messiri','Almarai',sans-serif;font-weight:700;font-size:118px;
      line-height:1.28;color:${C.goldSoft};text-shadow:0 3px 20px rgba(0,0,0,.5)}
  .rule{width:132px;height:3px;background:${C.gold};margin:26px 0 0 auto}
  .tseal{height:74px;width:74px;margin:28px 0 0 auto;display:block;opacity:.95}
</style>
<div class="txt">
  <div class="l1">${COPY.thumb[0]}</div>
  <div class="l2">${COPY.thumb[1]}</div>
  <div class="rule"></div>
  <img class="tseal" src="/assets/img/seal.png" alt="">
</div>
<div class="cover"><img src="/assets/product/mubdia/cover-og.jpg" alt=""></div>`;

/* ------------------------------------------------------------------ */
const ROUTES = {};
for (const [k, f] of Object.entries(FORMATS)) {
  for (const b of COPY.beats) {
    ROUTES[`${b.card}-${k}`] = [shotCard(b.lines, f, { size: b.size, accentLast: true }), f];
  }
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
  const transparent = /^b\d/.test(name);
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
