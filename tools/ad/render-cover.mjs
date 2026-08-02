/* NizamOk — «المبدعة المشتّتة» ad: the opening, as a moving shot.
 *
 * The first cut held the cover for eleven seconds across three nearly identical
 * plates with a zoom on each. It read as a still with a slow push, because that
 * is what it was.
 *
 * This is one shot instead of three, and the book actually moves in it: it comes
 * in turned away, settles square to camera, and the key light travels across the
 * board as it does. Six seconds, then straight into the pages.
 *
 * Same machinery as render-book.mjs — one 3-D element, sampled a frame at a
 * time in Chromium, strung back together by assemble.mjs.
 *
 *   node tools/ad/render-cover.mjs
 */
import { chromium } from '/home/user/Nizamuk.Business/node_modules/playwright/index.mjs';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { A, groundCss, ghost, vignette, serveSite } from './stage.mjs';

const PORT = 8977;
const OUT = '/home/user/Nizamuk.Business/build/ad/cover';
const FPS = 30;

/* 6.4s: six on screen, plus the 0.4 the crossfade into the pages eats. */
export const DUR = 6.4;
const SETTLE = 2.6;          // how long the book takes to come to rest

const FORMATS = {
  h: { w: 1920, h: 1080, cx: 600, cy: 512, maxH: 860 },
  v: { w: 1080, h: 1920, cx: 540, cy: 530, maxH: 940 }
};

const page = (f) => `
<style>
  ${groundCss(f, { keyY: 13 })}
  .book{position:absolute;top:${f.cy}px;left:${f.cx}px;width:0;height:0;perspective:2400px;z-index:2}
  /* Exactly one 3-D element, for the same reason as render-book.mjs: anything
     else in the context has to be sorted against it. */
  .cover{
    position:absolute;top:${-f.maxH / 2}px;left:${-Math.round(f.maxH * 1000 / 1500 / 2)}px;
    width:${Math.round(f.maxH * 1000 / 1500)}px;height:${f.maxH}px;
    transform-origin:50% 50%;will-change:transform;
  }
  .cover img{
    display:block;width:100%;height:100%;border-radius:5px;
    box-shadow:0 48px 100px rgba(0,0,0,.66), 0 0 0 1px rgba(214,186,128,.28);
  }
  /* The stack of pages, on the left because the spine is on the right. */
  .cover::before{
    content:'';position:absolute;top:8px;bottom:8px;left:-15px;width:15px;
    background:linear-gradient(90deg,#2b2438 0%,#d8d0c0 26%,#f2ece0 46%,#c9c0ae 74%,#8f8676 100%);
    border-radius:3px 0 0 3px;box-shadow:-8px 22px 40px rgba(0,0,0,.5);
  }
  /* Specular that travels as the board turns. */
  .sheen{
    position:absolute;inset:0;pointer-events:none;border-radius:5px;
    background:linear-gradient(252deg, rgba(255,242,214,.40) 0%, rgba(255,242,214,.09) 32%, transparent 60%);
    opacity:0;
  }
</style>
${ghost()}
<div class="book">
  <div class="cover" id="cover">
    <img src="${A.cover}" alt="">
    <div class="sheen" id="sheen"></div>
  </div>
</div>
${vignette()}
<script>
  const SETTLE = ${SETTLE}, DUR = ${DUR};
  /* Ease out only: it arrives with momentum and comes to rest, which is how a
     hand sets a book down. An ease-in-out would look mechanical. */
  const out = p => 1 - Math.pow(1 - p, 3);

  window.setT = (t) => {
    const p = out(Math.min(t / SETTLE, 1));
    const ang = -15 * (1 - p);                 // turned away, then square on
    const tilt = -2.2 * (1 - p);
    /* The push keeps running after the settle, so the shot never sits still. */
    const s = (0.965 + 0.035 * p) * (1 + 0.020 * (t / DUR));
    document.getElementById('cover').style.transform =
      'scale(' + s.toFixed(5) + ') rotateY(' + ang.toFixed(3) + 'deg) rotateZ(' + tilt.toFixed(3) + 'deg)';
    document.getElementById('sheen').style.opacity = ((1 - p) * 0.85).toFixed(3);
  };
  window.setT(0);
</script>`;

const ROUTES = {};
for (const [k, f] of Object.entries(FORMATS)) ROUTES[k] = [page(f), f];

const server = await serveSite(PORT, url => {
  const m = url.match(/^\/__cover\/(.+)$/);
  return m && ROUTES[m[1]] ? ROUTES[m[1]][0] : null;
});

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const frames = Math.round(DUR * FPS);

/* Wait for the compositor to present, not just for the style to be set. */
const frame = (p, t) => p.evaluate(x => {
  window.setT(x);
  return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
}, t);

for (const [k, [, f]] of Object.entries(ROUTES)) {
  const dir = join(OUT, k);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const ctx = await b.newContext({ viewport: { width: f.w, height: f.h }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const missing = [];
  p.on('response', r => { if (r.status() >= 400) missing.push(r.url()); });
  await p.goto(`http://127.0.0.1:${PORT}/__cover/${k}`, { waitUntil: 'networkidle' });
  if (missing.length) throw new Error(`cover ${k}: missing ${missing.join(', ')}`);
  const t0 = Date.now();
  for (let i = 0; i < frames; i++) {
    await frame(p, i / FPS);
    await writeFile(join(dir, `f${String(i).padStart(4, '0')}.png`), await p.screenshot({ type: 'png' }));
  }
  console.log(`  ${k}  ${f.w}x${f.h}  ${frames} frames  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  await ctx.close();
}

await b.close();
server.close();
console.log(`\n${frames * 2} frames in build/ad/cover/`);
