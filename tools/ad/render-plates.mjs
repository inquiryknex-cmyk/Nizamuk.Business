/* NizamOk — «المبدعة المشتّتة» YouTube ad: the picture layer.
 *
 * The advertisement is about the book, so the book carries every frame. These
 * eight plates are staged in Chromium from the SHIPPING assets — the same
 * cover-og.jpg the product page serves and the same five interior pages in its
 * gallery. Nothing here is generated, redrawn, recoloured or re-typeset: the
 * images are placed on the house velvet ground, lit, and given a physical
 * page-edge so a flat JPEG reads as an object. The Arabic printed inside them
 * is whatever the press printed.
 *
 * Plates carry NO Arabic of their own. Every word is a separate transparent
 * card from render-cards.mjs, composited after the motion in assemble.mjs, so
 * type never inherits the push-in and never gets resampled.
 *
 * Rendered at deviceScaleFactor 2 (3840x2160 / 2160x3840) purely as headroom:
 * assemble.mjs zooms into these, and a 1x plate would go soft the moment it
 * moved.
 *
 *   node tools/ad/render-plates.mjs
 */
import { chromium } from '/home/user/Nizamuk.Business/node_modules/playwright/index.mjs';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const PORT = 8933;
const SITE = '/home/user/Nizamuk.Business/site';
const OUT = '/home/user/Nizamuk.Business/build/ad/plates';

/* The authentic assets. Paths, not copies — if the product page changes its
   cover, re-running this picks the new one up. */
const A = {
  cover: '/assets/product/mubdia/cover-og.jpg',
  seal:  '/assets/img/seal.png',
  p07:   '/assets/product/mubdia/p07.webp',   // خريطة المنعطفات الأربعة
  p08:   '/assets/product/mubdia/p08.webp',   // خريطة العبور
  p23:   '/assets/product/mubdia/p23.webp',   // تجربة الوصول
  p33:   '/assets/product/mubdia/p33.webp',   // خطة ٣٠ يومًا
  p36:   '/assets/product/mubdia/p36.webp'    // قوس ٩٠ يومًا
};

/* h: the book sits left, the type column owns x>=1080 (see render-cards.mjs).
   v: book and type are ONE block in the upper two thirds. They used to sit
      lower, which put the words down where a Shorts player stacks its title,
      channel row and buttons — so the writing read as a caption pushed off the
      bottom of the picture rather than as part of it. Everything is above
      y=1350 now, and the empty band below is the platform's, not ours. */
const FORMATS = {
  h: { w: 1920, h: 1080, cx: 600, cy: 512, maxW: 900, maxH: 860, cropW: 900, cropH: 700 },
  v: { w: 1080, h: 1920, cx: 540, cy: 530, maxW: 780, maxH: 940, cropW: 880, cropH: 840 }
};

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };

/* ------------------------------------------------------------------ *
 * The stage: velvet ground, one warm key from upper right, vignette.
 * Identical family to the end card so the last cut does not change room.
 * ------------------------------------------------------------------ */
const stage = (f, body, opts = {}) => `
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${f.w}px;height:${f.h}px;overflow:hidden}
  body{
    background:
      radial-gradient(70% 55% at 74% ${opts.keyY || 14}%, rgba(201,167,94,.22), transparent 62%),
      radial-gradient(90% 70% at 16% 94%, rgba(227,168,172,.09), transparent 62%),
      linear-gradient(150deg,#241C36 0%,#191325 58%,#120D1B 100%);
    position:relative;
  }
  /* Vignette and a faint mandala, both behind everything. The seal is the
     brand mark, used here as ground texture at 4% — not as a logo. */
  .vig{position:absolute;inset:0;box-shadow:inset 0 0 ${Math.round(f.w*0.16)}px rgba(0,0,0,.62);pointer-events:none;z-index:5}
  .ghost{
    position:absolute;top:${opts.ghostY || '50%'};left:${opts.ghostX || '50%'};
    transform:translate(-50%,-50%);
    width:${opts.ghost || Math.round(f.w * 0.62)}px;height:${opts.ghost || Math.round(f.w * 0.62)}px;
    opacity:.045;filter:blur(.4px);
  }
  .ghost img{width:100%;height:100%;display:block}

  /* An object, not a picture of one: printed face, page-edge stack on the
     left because an Arabic book is bound on the right, and a cast shadow. */
  .obj{position:absolute;top:${f.cy}px;left:${f.cx}px;transform:translate(-50%,-50%);z-index:2}
  .sheet{position:relative;border-radius:4px}
  .sheet img{display:block;max-width:${f.maxW}px;max-height:${f.maxH}px;width:auto;height:auto;
    border-radius:4px;box-shadow:0 46px 96px rgba(0,0,0,.62), 0 0 0 1px rgba(214,186,128,.26)}
  .sheet.book::before{
    content:'';position:absolute;top:8px;bottom:8px;left:-15px;width:15px;
    background:linear-gradient(90deg,#2b2438 0%,#d8d0c0 26%,#f2ece0 46%,#c9c0ae 74%,#8f8676 100%);
    border-radius:3px 0 0 3px;box-shadow:-8px 22px 40px rgba(0,0,0,.5);
  }
  /* A single sheet of paper has an edge too, just a thin one. */
  .sheet.leaf::before{
    content:'';position:absolute;top:5px;bottom:5px;left:-5px;width:5px;
    background:linear-gradient(90deg,#3a3145,#e2dacb 55%,#b3aa99);border-radius:2px 0 0 2px;
  }
  /* Warm sheen across the printed face, matching the key light above. */
  .sheet::after{
    content:'';position:absolute;inset:0;border-radius:4px;pointer-events:none;
    background:linear-gradient(${opts.sheen || 205}deg, rgba(255,242,214,.16) 0%, rgba(255,242,214,.04) 26%, transparent 52%);
  }

  /* A whole interior page shrunk to fit the frame is unreadable — at ad scale
     its headings are a few pixels tall, so the viewer sees "a page" and learns
     nothing. These are shown the way a book ad shows an interior: a window on
     the top of the sheet, at a size where the gold heading and the first rows
     are legible, feathered at the cut so it does not read as a crude crop.
     The page itself is untouched — this is framing, not retouching. */
  .win{position:relative;width:${f.cropW}px;height:${f.cropH}px;overflow:hidden;border-radius:5px;
    box-shadow:0 44px 92px rgba(0,0,0,.66), 0 0 0 1.5px rgba(214,186,128,.42)}
  /* cover+top, so a window is always filled: the five pages have five
     different aspect ratios, and an auto height left a gap under the short
     ones. */
  .win img{display:block;width:100%;height:100%;object-fit:cover;object-position:top center}
  .win::after{
    content:'';position:absolute;inset:0;pointer-events:none;
    background:
      linear-gradient(to top, rgba(18,13,27,.92) 0%, rgba(18,13,27,.34) 11%, transparent 24%),
      linear-gradient(${opts.sheen || 205}deg, rgba(255,242,214,.13) 0%, rgba(255,242,214,.03) 24%, transparent 50%);
  }
  /* The edge lives on the wrapper: .win clips its own children. */
  .winwrap{position:relative}
  .winwrap::before{
    content:'';position:absolute;top:6px;bottom:6px;left:-6px;width:6px;
    background:linear-gradient(90deg,#3a3145,#e2dacb 55%,#b3aa99);border-radius:2px 0 0 2px;
  }
  ${opts.css || ''}
</style>
<div class="ghost"><img src="${A.seal}" alt=""></div>
${body}
<div class="vig"></div>`;

const sheet = (src, cls = 'book') => `<div class="sheet ${cls}"><img src="${src}" alt=""></div>`;
const window_ = src => `<div class="winwrap"><div class="win"><img src="${src}" alt=""></div></div>`;

/* ------------------------------------------------------------------ *
 * The eight plates.
 * ------------------------------------------------------------------ */
const PLATES = {
  /* 1 — the cover, square on, the object the ad is about. */
  cover: f => stage(f, `<div class="obj">${sheet(A.cover)}</div>`),

  /* 2 — same cover, turned. Nothing is redrawn; it is the same file under a
         perspective transform, which is what a hand holding it would do. */
  tilt: f => stage(f, `<div class="obj tilted">${sheet(A.cover)}</div>`, {
    keyY: 22, sheen: 235,
    css: `.obj{perspective:2400px}
          .tilted .sheet{transform:rotateY(-17deg) rotateZ(-1.2deg);transform-style:preserve-3d}
          .tilted .sheet img{box-shadow:0 54px 110px rgba(0,0,0,.66), 0 0 0 1px rgba(214,186,128,.24)}`
  }),

  /* 3 — the cover held against a stronger mandala, for the beat that names
         the pattern. */
  named: f => stage(f, `<div class="obj">${sheet(A.cover)}</div>`, {
    ghost: Math.round(f.w * 0.86), keyY: 10,
    css: `.ghost{opacity:.065}`
  }),

  /* 4,5,6 — three interior pages, as printed, framed close enough to read. */
  page1: f => stage(f, `<div class="obj">${window_(A.p07)}</div>`, { keyY: 16, sheen: 212 }),
  page2: f => stage(f, `<div class="obj">${window_(A.p23)}</div>`, { keyY: 12, sheen: 198 }),
  page3: f => stage(f, `<div class="obj">${window_(A.p33)}</div>`, { keyY: 18, sheen: 220 }),

  /* 7 — the thing as a whole: two more pages fanned behind the cover. */
  fan: f => stage(f, `
    <div class="obj fan">
      <div class="lay back">${sheet(A.p36, 'leaf')}</div>
      <div class="lay mid">${sheet(A.p08, 'leaf')}</div>
      <div class="lay front">${sheet(A.cover)}</div>
    </div>`, {
    keyY: 12,
    css: `.fan{position:absolute}
          .fan .lay{position:absolute;top:0;left:0;transform-origin:50% 100%}
          .fan .back{transform:translate(-50%,-50%) rotate(-9deg) scale(.80);z-index:1;filter:brightness(.72)}
          .fan .mid{transform:translate(-50%,-50%) rotate(6.5deg) scale(.86);z-index:2;filter:brightness(.84)}
          .fan .front{transform:translate(-50%,-50%) rotate(-1deg);z-index:3}
          .fan .lay .sheet img{max-width:${Math.round(f.maxW * 0.92)}px;max-height:${Math.round(f.maxH * 0.92)}px}`
  })
};

/* ------------------------------------------------------------------ */
const ROUTES = {};
for (const [k, f] of Object.entries(FORMATS)) {
  for (const [name, build] of Object.entries(PLATES)) ROUTES[`${name}-${k}`] = [build(f), f];
}

const server = createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  const m = url.match(/^\/__plate\/(.+)$/);
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
  const ctx = await b.newContext({ viewport: { width: f.w, height: f.h }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const missing = [];
  page.on('response', r => { if (r.status() >= 400) missing.push(r.url()); });
  await page.goto(`http://127.0.0.1:${PORT}/__plate/${name}`, { waitUntil: 'networkidle' });
  /* An asset that 404s would silently stage an empty book. Fail instead. */
  if (missing.length) throw new Error(`plate ${name}: missing ${missing.join(', ')}`);
  const buf = await page.screenshot({ type: 'png' });
  await writeFile(join(OUT, `${name}.png`), buf);
  console.log(`  ${name.padEnd(10)} ${f.w * 2}x${f.h * 2}  ${(buf.length / 1024 / 1024).toFixed(1)} MB`);
  await ctx.close();
}

await b.close();
server.close();
console.log(`\n${Object.keys(ROUTES).length} plates in build/ad/plates/`);
