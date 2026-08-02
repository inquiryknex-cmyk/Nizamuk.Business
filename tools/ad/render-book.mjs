/* NizamOk — «المبدعة المشتّتة» ad: the pages turning inside the book.
 *
 * The middle third of the film used to be three interior pages dissolving into
 * one another. A dissolve says "here is another page"; a turn says "these pages
 * are in a book, and there are more of them." So this renders an actual open
 * book and actually turns its leaves.
 *
 * Every page is the shipping file from the product gallery — p07, p23, p33,
 * p08, p36. Nothing here is generated, redrawn or re-typeset, and the Arabic
 * printed on them is whatever the press printed.
 *
 * The turn is done in the browser, not in ffmpeg: it is a real 3-D rotation
 * about the spine, with a specular that travels with the angle and a shadow
 * that sweeps the page underneath. No 2-D filter graph does that. Chromium
 * composites it, Playwright samples one PNG per frame, and assemble.mjs strings
 * the frames back into the timeline.
 *
 * The book is bound on the RIGHT, as an Arabic book is, so the leaf that moves
 * is the left one and it sweeps rightward over the spine. The frame sits close
 * on that left leaf: a whole open spread in an ad frame puts each page at ~450
 * pixels, where the gold headings are unreadable and the shot says nothing.
 *
 *   node tools/ad/render-book.mjs          # both formats, 300 frames each
 *   node tools/ad/render-book.mjs probe    # one turn, 16:9, eight samples
 */
import { chromium } from '/home/user/Nizamuk.Business/node_modules/playwright/index.mjs';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { A, groundCss, ghost, vignette, serveSite } from './stage.mjs';

const PORT = 8971;
const OUT = '/home/user/Nizamuk.Business/build/ad/book';
const FPS = 30;

/* 19.000s: five holds and four turns. assemble.mjs eats the last 0.4s in the
   crossfade out. All FIVE interior pages are used — the book has five in its
   gallery and showing three said the sample was thinner than it is. */
export const DUR = 19.0;
const TURNS = [{ at: 3.40, d: 0.55 }, { at: 7.30, d: 0.55 },
               { at: 11.20, d: 0.55 }, { at: 15.10, d: 0.55 }];

/* What you read, in order:
     p07  خريطة المنعطفات الأربعة
     p23  تجربة الوصول
     p08  خريطة العبور
     p33  خطة ٣٠ يومًا
     p36  قوس ٩٠ يومًا
   A leaf's underside is glimpsed for a fifth of a second on its way over and is
   in shadow by the time it lands, so it borrows the page two ahead rather than
   asking for a sixth asset that does not exist. */
const PAGES = [A.p07, A.p23, A.p08, A.p33, A.p36];
const BACKS = PAGES.map((_, i) => PAGES[(i + 2) % PAGES.length]);
const ALL = [...new Set(PAGES)];

const FORMATS = {
  h: { w: 1920, h: 1080, leafW: 880, leafH: 690, spineX: 960, cy: 512 },
  v: { w: 1080, h: 1920, leafW: 860, leafH: 800, spineX: 960, cy: 530 }
};

/* Every page image, stacked and preloaded, one visible at a time. Swapping a
   src mid-render risks a frame where nothing has decoded. */
const stack = (prefix) => `<div class="clip">${ALL.map(
  (src, i) => `<img id="${prefix}${i}" src="${src}" alt="">`).join('')}</div>`;

const page = (f) => `
<style>
  ${groundCss(f, { keyY: 15 })}

  /* The slow push lives out here, as a plain 2-D scale. It must not be a 3-D
     transform: the moment this element joins the 3-D context it starts sorting
     against the leaf below it. */
  .push{position:absolute;inset:0;transform-origin:${f.spineX - f.leafW / 2}px ${f.cy}px}

  /* ONE 3-D element in the whole page, and it is .turner.
     The first cut of this had a preserve-3d stack of three leaves. They were
     coplanar, so z-index stopped ordering them, document order won, and the
     bottom page painted over the top one — the turn read as a jump cut. Nesting
     3-D contexts to fix it only moved the problem. So: the book is flat, the
     page underneath is an ordinary 2-D element, and exactly one leaf ever
     rotates. Nothing is left to sort. */
  .book{position:absolute;top:${f.cy}px;left:${f.spineX}px;width:0;height:0;perspective:2600px}

  .leafbox{
    position:absolute;top:${-f.leafH / 2}px;left:${-f.leafW}px;
    width:${f.leafW}px;height:${f.leafH}px;border-radius:5px 2px 2px 5px;
  }
  .under{z-index:1}
  .turner{z-index:3;transform-origin:right center;will-change:transform}

  .face{
    position:absolute;inset:0;border-radius:5px 2px 2px 5px;
    box-shadow:0 40px 84px rgba(0,0,0,.62), 0 0 0 1.5px rgba(214,186,128,.40);
  }
  .clip{position:absolute;inset:0;overflow:hidden;border-radius:5px 2px 2px 5px}
  .clip img{
    position:absolute;inset:0;display:block;width:100%;height:100%;
    object-fit:cover;object-position:top center;opacity:0;
  }
  /* Feather at the bottom of the window, so the crop is a frame and not a cut. */
  .clip::after{
    content:'';position:absolute;inset:0;pointer-events:none;
    background:linear-gradient(to top, rgba(18,13,27,.92) 0%, rgba(18,13,27,.34) 11%, transparent 24%);
  }
  /* Specular that travels with the angle: a flat page has no highlight, a
     lifted one catches the key. */
  .sheen{
    position:absolute;inset:0;pointer-events:none;border-radius:5px 2px 2px 5px;
    background:linear-gradient(258deg, rgba(255,242,214,.42) 0%, rgba(255,242,214,.10) 34%, transparent 62%);
    opacity:0;
  }
  /* Cut edge, on the outside — the spine is on the right. */
  .leafbox::before{
    content:'';position:absolute;top:5px;bottom:5px;left:-6px;width:6px;
    background:linear-gradient(90deg,#3a3145,#e2dacb 55%,#b3aa99);border-radius:2px 0 0 2px;
  }

  /* The other half of the book, present from frame one so the object reads as
     open rather than as a single floating sheet. Deliberately unlit. */
  .right{
    position:absolute;top:${-f.leafH / 2}px;left:0;
    width:${Math.round(f.leafW * 0.62)}px;height:${f.leafH}px;z-index:0;
    background:linear-gradient(90deg,#332942 0%,#241c33 46%,#181223 100%);
    border-radius:2px 5px 5px 2px;
    box-shadow:inset 16px 0 40px rgba(0,0,0,.72), 0 30px 70px rgba(0,0,0,.55);
  }
  /* The shadow the lifting leaf throws on the page it uncovers. */
  .cast{
    position:absolute;top:${-f.leafH / 2}px;left:${-f.leafW}px;
    width:${f.leafW}px;height:${f.leafH}px;z-index:2;
    background:linear-gradient(268deg, rgba(0,0,0,.62) 0%, rgba(0,0,0,.22) 38%, transparent 72%);
    opacity:0;pointer-events:none;border-radius:5px 2px 2px 5px;
  }
  /* The shadow a spine throws into the fold. */
  .gutter{
    position:absolute;top:${-f.leafH / 2 - 6}px;left:-30px;width:34px;height:${f.leafH + 12}px;z-index:4;
    background:linear-gradient(90deg,transparent,rgba(0,0,0,.55));pointer-events:none;filter:blur(3px);
  }
  /* Everything past the spine sinks into shadow: a turned leaf lands there at
     full brightness otherwise, competing with the page being read and sitting
     under the Arabic column at x>=1080. Outside .push, so the slow scale does
     not drag it across the frame. */
  .rightshade{
    position:absolute;top:0;bottom:0;left:${f.spineX}px;right:0;z-index:6;pointer-events:none;
    background:linear-gradient(90deg,
      rgba(18,13,27,0) 0%, rgba(18,13,27,.62) 22%, rgba(18,13,27,.90) 52%, rgba(18,13,27,.97) 100%);
  }
</style>
${ghost()}
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
${vignette()}
<script>
  const TURNS = ${JSON.stringify(TURNS)};
  const ALL   = ${JSON.stringify(ALL)};
  const PAGES = ${JSON.stringify(PAGES)};
  const BACKS = ${JSON.stringify(BACKS)};
  const DUR   = ${DUR};
  const ix = src => ALL.indexOf(src);
  /* Slow in, slow out. A page a hand turns does not move linearly. */
  const ease = p => p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p + 2, 3) / 2;
  const show = (prefix, i) => ALL.forEach((_, k) => {
    document.getElementById(prefix + k).style.opacity = (k === i ? '1' : '0');
  });

  window.setT = (t) => {
    document.getElementById('push').style.transform =
      'scale(' + (1 + 0.030 * (t / DUR)).toFixed(5) + ')';

    /* How many turns have finished, and how far into the next one we are. */
    let cur = 0, p = 0;
    for (let i = 0; i < TURNS.length; i++) {
      if (t >= TURNS[i].at + TURNS[i].d) { cur = i + 1; continue; }
      if (t > TURNS[i].at) p = ease((t - TURNS[i].at) / TURNS[i].d);
      break;
    }

    /* The leaf carries the page being read; the page it is about to uncover
       lies underneath it, already in place. */
    const last = PAGES.length - 1;
    show('u', ix(PAGES[Math.min(cur + 1, last)]));

    /* Past ninety degrees the sheet is seen from behind: counter-rotate the
       face so it is not mirrored, and show its underside. */
    const flipped = p >= 0.5;
    document.getElementById('tface').style.transform = flipped ? 'rotateY(180deg)' : 'none';
    show('t', ix(flipped && BACKS[cur] ? BACKS[cur] : PAGES[cur]));

    document.getElementById('turner').style.transform = 'rotateY(' + (-180 * p).toFixed(3) + 'deg)';
    document.getElementById('sheen').style.opacity = (Math.sin(Math.PI * p) * 0.9).toFixed(3);
    document.getElementById('cast').style.opacity = (Math.sin(Math.PI * p) * 0.95).toFixed(3);
  };
  window.setT(0);
</script>`;

/* ------------------------------------------------------------------ */
const ROUTES = {};
for (const [k, f] of Object.entries(FORMATS)) ROUTES[k] = [page(f), f];

const server = await serveSite(PORT, url => {
  const m = url.match(/^\/__book\/(.+)$/);
  return m && ROUTES[m[1]] ? ROUTES[m[1]][0] : null;
});

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const frames = Math.round(DUR * FPS);

/* Set the time, then WAIT for the compositor to present it. Screenshotting
   straight after setT() can sample between the style change and the raster of
   the rotated layer. Two animation frames is one settled frame. */
const frame = (p, t) => p.evaluate(x => {
  window.setT(x);
  return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
}, t);

const open = async (f, k) => {
  const ctx = await b.newContext({ viewport: { width: f.w, height: f.h }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const missing = [];
  p.on('response', r => { if (r.status() >= 400) missing.push(r.url()); });
  await p.goto(`http://127.0.0.1:${PORT}/__book/${k}`, { waitUntil: 'networkidle' });
  /* A page that 404s would silently render an empty book. */
  if (missing.length) throw new Error(`book ${k}: missing ${missing.join(', ')}`);
  return [ctx, p];
};

/* `probe` samples one turn only. Six hundred full frames take five minutes; a
   broken rotation should not cost that to discover. */
if (process.argv[2] === 'probe') {
  const dir = join(OUT, 'probe');
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const [, p] = await open(FORMATS.h, 'h');
  for (const t of [3.00, 3.15, 3.25, 3.32, 3.40, 3.50, 3.60, 3.80]) {
    await frame(p, t);
    await writeFile(join(dir, `t${t.toFixed(2)}.png`), await p.screenshot({ type: 'png' }));
  }
  console.log(`  probe: 8 frames in ${dir}`);
  await b.close(); server.close();
  process.exit(0);
}

for (const [k, [, f]] of Object.entries(ROUTES)) {
  const dir = join(OUT, k);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const [ctx, p] = await open(f, k);
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
console.log(`\n${frames * 2} frames in build/ad/book/`);
