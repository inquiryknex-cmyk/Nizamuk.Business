/* NizamOk — «لمحة المبدعة المشتّتة»: the pages turning inside the book.
 *
 * Same treatment as render-book.mjs gives the 109 system, for the 19-riyal one.
 * Vertical only, because this film is for TikTok.
 *
 * The pages are REAL. They come out of the book's own PDF export: the bundle
 * renders as a React app whose scripts load from unpkg, which Chromium cannot
 * reach in this sandbox, so those two requests were served from disk and the
 * book drew itself exactly as authored — its own fonts, its own layout, its own
 * text. Each `.page` element was then captured at 2x (1588x2246). Nothing here
 * is typeset by me and nothing is invented.
 *
 * Four pages, chosen for what they say rather than for how they look:
 *   p05  الفجوات الخمس            — the five gaps
 *   p08  ٣ لحظات «آها» مُشخّصة      — you do not tire of your projects
 *   p09  إشارتكِ قبل التراجع        — the signal before the retreat
 *   p13  خلاصة الخريطة            — «قيمتي في البداية اللامعة، لا في الإنهاء الصبور»
 *
 * The ground is emerald, matching the cover. The pages themselves are ivory, so
 * unlike the 109 film there is no need to shade the far half — a light page on
 * a dark ground already separates.
 *
 *   node tools/ad/lamhat-pages.mjs          # 500 frames
 *   node tools/ad/lamhat-pages.mjs probe    # one turn, eight samples
 */
import { chromium } from '/home/user/Nizamuk.Business/node_modules/playwright/index.mjs';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { serveSite } from './stage.mjs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';

const PORT = 8989;
const SRC = '/home/user/Nizamuk.Business/build/ad/lamhat-src';
const OUT = '/home/user/Nizamuk.Business/build/ad/lamhat-book';
const FPS = 30;
const W = 1080, H = 1920;

/* 16.400s on the timeline: four holds, three turns, plus the 0.4 the crossfade
   out consumes. */
export const DUR = 16.4;
const TURNS = [{ at: 3.70, d: 0.55 }, { at: 7.95, d: 0.55 }, { at: 12.20, d: 0.55 }];

const PAGES = ['p05.png', 'p08.png', 'p09.png', 'p13.png'];
const BACKS = PAGES.map((_, i) => PAGES[(i + 2) % PAGES.length]);

/* Full page WIDTH, windowed on its top. Cropping horizontally would cut lines
   of Arabic in half; cropping vertically just stops partway down a page, which
   is what looking at a page does. 880 from a 1588 source is a downscale, so the
   headings stay crisp. */
const LEAF = { w: 880, h: 880, spineX: 970, cy: 620 };

const stack = (prefix) => `<div class="clip">${PAGES.map(
  (src, i) => `<img id="${prefix}${i}" src="/__p/${src}" alt="">`).join('')}</div>`;

const page = () => `
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${W}px;height:${H}px;overflow:hidden}
  body{
    background:
      radial-gradient(66% 44% at 70% 10%, rgba(201,167,94,.20), transparent 62%),
      radial-gradient(90% 60% at 20% 92%, rgba(120,190,160,.07), transparent 62%),
      linear-gradient(158deg,#12312A 0%,#0D241F 56%,#071613 100%);
    position:relative;
  }
  .vig{position:absolute;inset:0;box-shadow:inset 0 0 300px rgba(0,0,0,.68);z-index:9;pointer-events:none}
  .ghost{position:absolute;top:32%;left:50%;transform:translate(-50%,-50%);
    width:900px;height:900px;opacity:.05;z-index:0}
  .ghost img{width:100%;height:100%;display:block}

  .push{position:absolute;inset:0;transform-origin:${LEAF.spineX - LEAF.w / 2}px ${LEAF.cy}px}
  /* One 3-D element only — see render-book.mjs for why. */
  .book{position:absolute;top:${LEAF.cy}px;left:${LEAF.spineX}px;width:0;height:0;perspective:2600px}
  .leafbox{position:absolute;top:${-LEAF.h / 2}px;left:${-LEAF.w}px;
    width:${LEAF.w}px;height:${LEAF.h}px;border-radius:4px 2px 2px 4px}
  .under{z-index:1}
  .turner{z-index:3;transform-origin:right center;will-change:transform}
  .face{position:absolute;inset:0;border-radius:4px 2px 2px 4px;
    box-shadow:0 40px 84px rgba(0,0,0,.66), 0 0 0 1px rgba(214,186,128,.34)}
  .clip{position:absolute;inset:0;overflow:hidden;border-radius:4px 2px 2px 4px}
  .clip img{position:absolute;top:0;left:0;width:100%;height:auto;display:block;opacity:0}
  /* The page is ivory, so the fade at the cut is to ivory, not to the ground. */
  .clip::after{content:'';position:absolute;inset:0;pointer-events:none;
    background:linear-gradient(to top, rgba(246,242,232,.98) 0%, rgba(246,242,232,.55) 9%, transparent 22%)}
  .sheen{position:absolute;inset:0;pointer-events:none;border-radius:4px 2px 2px 4px;
    background:linear-gradient(258deg, rgba(255,255,255,.55) 0%, rgba(255,255,255,.14) 34%, transparent 62%);
    opacity:0}
  .leafbox::before{content:'';position:absolute;top:4px;bottom:4px;left:-6px;width:6px;
    background:linear-gradient(90deg,#1c2b26,#efe9dc 55%,#c2b9a6);border-radius:2px 0 0 2px}
  .right{position:absolute;top:${-LEAF.h / 2}px;left:0;
    width:${Math.round(LEAF.w * 0.6)}px;height:${LEAF.h}px;z-index:0;
    background:linear-gradient(90deg,#1d3b33 0%,#122a24 50%,#0a1a16 100%);
    border-radius:2px 4px 4px 2px;
    box-shadow:inset 16px 0 40px rgba(0,0,0,.7), 0 30px 70px rgba(0,0,0,.55)}
  .cast{position:absolute;top:${-LEAF.h / 2}px;left:${-LEAF.w}px;
    width:${LEAF.w}px;height:${LEAF.h}px;z-index:2;
    background:linear-gradient(268deg, rgba(0,0,0,.58) 0%, rgba(0,0,0,.2) 38%, transparent 72%);
    opacity:0;pointer-events:none;border-radius:4px 2px 2px 4px}
  .gutter{position:absolute;top:${-LEAF.h / 2 - 5}px;left:-28px;width:32px;height:${LEAF.h + 10}px;z-index:4;
    background:linear-gradient(90deg,transparent,rgba(0,0,0,.5));pointer-events:none;filter:blur(3px)}
  .rightshade{position:absolute;top:0;bottom:0;left:${LEAF.spineX}px;right:0;z-index:6;pointer-events:none;
    background:linear-gradient(90deg, rgba(7,22,19,0) 0%, rgba(7,22,19,.70) 26%, rgba(7,22,19,.95) 60%)}
</style>
<div class="ghost"><img src="/assets/img/seal.png" alt=""></div>
<div class="push" id="push">
  <div class="book">
    <div class="right"></div>
    <div class="leafbox under"><div class="face">${stack('u')}</div></div>
    <div class="cast" id="cast"></div>
    <div class="leafbox turner" id="turner">
      <div class="face" id="tface">${stack('t')}<div class="sheen" id="sheen"></div></div>
    </div>
    <div class="gutter"></div>
  </div>
</div>
<div class="rightshade"></div>
<div class="vig"></div>
<script>
  const TURNS = ${JSON.stringify(TURNS)};
  const PAGES = ${JSON.stringify(PAGES)};
  const BACKS = ${JSON.stringify(BACKS)};
  const DUR = ${DUR};
  const ix = f => PAGES.indexOf(f);
  const ease = p => p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p + 2, 3) / 2;
  const show = (prefix, i) => PAGES.forEach((_, k) => {
    document.getElementById(prefix + k).style.opacity = (k === i ? '1' : '0');
  });

  window.setT = (t) => {
    document.getElementById('push').style.transform =
      'scale(' + (1 + 0.026 * (t / DUR)).toFixed(5) + ')';
    let cur = 0, p = 0;
    for (let i = 0; i < TURNS.length; i++) {
      if (t >= TURNS[i].at + TURNS[i].d) { cur = i + 1; continue; }
      if (t > TURNS[i].at) p = ease((t - TURNS[i].at) / TURNS[i].d);
      break;
    }
    show('u', ix(PAGES[Math.min(cur + 1, PAGES.length - 1)]));
    const flipped = p >= 0.5;
    document.getElementById('tface').style.transform = flipped ? 'rotateY(180deg)' : 'none';
    show('t', ix(flipped && BACKS[cur] ? BACKS[cur] : PAGES[cur]));
    document.getElementById('turner').style.transform = 'rotateY(' + (-180 * p).toFixed(3) + 'deg)';
    document.getElementById('sheen').style.opacity = (Math.sin(Math.PI * p) * 0.85).toFixed(3);
    document.getElementById('cast').style.opacity = (Math.sin(Math.PI * p) * 0.9).toFixed(3);
  };
  window.setT(0);
</script>`;

/* The page PNGs live in build/, not site/, so they need their own route. */
const server = await serveSite(PORT, url => (url === '/__book' ? page() : null));
const extra = createServer(async (req, res) => {
  const m = req.url.match(/^\/__p\/(p\d+\.png)$/);
  if (!m) { res.writeHead(404).end(); return; }
  try {
    res.writeHead(200, { 'Content-Type': 'image/png' });
    res.end(await readFile(join(SRC, m[1])));
  } catch { res.writeHead(404).end(); }
});
/* serveSite already owns PORT; page images are proxied through it instead. */
extra.close();

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const frames = Math.round(DUR * FPS);
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await ctx.route('**/__p/*', async route => {
  const name = route.request().url().split('/').pop();
  if (!existsSync(join(SRC, name))) return route.fulfill({ status: 404, body: '' });
  route.fulfill({ status: 200, contentType: 'image/png', body: await readFile(join(SRC, name)) });
});
const p = await ctx.newPage();
const missing = [];
p.on('response', r => { if (r.status() >= 400) missing.push(r.url()); });
await p.goto(`http://127.0.0.1:${PORT}/__book`, { waitUntil: 'networkidle' });
if (missing.length) throw new Error(`missing ${missing.join(', ')}`);

const frame = (t) => p.evaluate(x => {
  window.setT(x);
  return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
}, t);

if (process.argv[2] === 'probe') {
  const dir = join(OUT, 'probe');
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  for (const t of [3.6, 3.85, 3.95, 4.05, 4.15, 4.25, 4.4, 4.8]) {
    await frame(t);
    await writeFile(join(dir, `t${t.toFixed(2)}.png`), await p.screenshot({ type: 'png' }));
  }
  console.log(`  probe in ${dir}`);
  await b.close(); server.close(); process.exit(0);
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
const t0 = Date.now();
for (let i = 0; i < frames; i++) {
  await frame(i / FPS);
  await writeFile(join(OUT, `f${String(i).padStart(4, '0')}.png`), await p.screenshot({ type: 'png' }));
}
console.log(`  pages  ${W}x${H}  ${frames} frames  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
await b.close();
server.close();
