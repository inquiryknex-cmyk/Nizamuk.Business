/* NizamOk — «لمحة المبدعة المشتّتة» TikTok promo. 1080x1920, 18 seconds.
 *
 * The cheap door: 19 SAR. A different film from the 109 one, and deliberately
 * so — this is the object seen once, held, and turned, with the words changing
 * over it. There are no interior pages for لمحات in the repo (only the cover),
 * so nothing here pretends there are: no page turns, no invented spreads.
 *
 * The cover is site/assets/covers/lamhat-mubdia.jpg, 700x964 — small. That one
 * fact settles the whole treatment: any push past about 1.1x makes a 700-pixel
 * source visibly soft on a phone. So the shot never zooms into the artwork. It
 * keeps the cover at roughly 1:1 and gets its movement from the BOOK moving —
 * a settle, then a slow continuous drift and counter-rotation. Sharp the whole
 * way, and livelier than a zoom would have been.
 *
 * Type is rendered in Chromium with the site's own faces, exactly as in the
 * main ad, and composited last so it never inherits the motion.
 *
 * Ground is emerald rather than plum, because that is what this cover is
 * printed on. The house velvet under a green book would read as a mismatch.
 *
 *   node tools/ad/lamhat-tiktok.mjs
 */
import { chromium } from '/home/user/Nizamuk.Business/node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { mkdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { serveSite } from './stage.mjs';

const PORT = 8983;
const FF = '/home/user/Nizamuk.Business/.bin/ffmpeg';
const AD = '/home/user/Nizamuk.Business/build/ad';
const WORK = join(AD, 'lamhat');
const OUT = join(AD, 'out');
const FPS = 30;
const W = 1080, H = 1920;
const DUR = 18.0;

const COVER = '/assets/covers/lamhat-mubdia.jpg';
const SEAL = '/assets/img/seal.png';
const MARK = '/assets/img/wordmark.png';

/* ---- Approved copy. From the live ladder on /rebuild/mubdia/ and from the
        cover's own printed subtitle. Single source; do not retype. ---- */
const COPY = {
  beats: [
    { at: 0.4,  to: 3.4,  lines: ['تبدئين بحماس…', 'ثم تتوقفين؟'], accent: true },
    { at: 3.9,  to: 7.0,  lines: ['ليس كسلًا', 'ولا ضعف إرادة'] },
    { at: 7.5,  to: 10.6, lines: ['أين تتعطّلين', 'بالضبط؟'], accent: true },
    { at: 11.1, to: 14.2, lines: ['وما السلوك الذي يخدعكِ', 'وأنتِ تحسبينه إنجازًا'] }
  ],
  offerTitle: 'لمحة المبدعة المشتّتة',
  offerPrice: '١٩ ر.س — دفعة واحدة',
  offerUrl: 'nizamok.com'
};

/* TikTok owns the edges: the action rail down the right from about y=950, the
   caption and handle across the bottom from about y=1500. Everything here lives
   inside x 120–960 and above y=1430. */
const SAFE = { x: 120, typeTop: 1060, typeBottom: 1430 };

/* ------------------------------------------------------------------ *
 * The plate: emerald ground, the cover as an object.
 * ------------------------------------------------------------------ */
const plate = () => `
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${W}px;height:${H}px;overflow:hidden}
  body{
    background:
      radial-gradient(66% 44% at 70% 12%, rgba(201,167,94,.20), transparent 62%),
      radial-gradient(90% 60% at 20% 92%, rgba(120,190,160,.07), transparent 62%),
      linear-gradient(158deg,#12312A 0%,#0D241F 56%,#071613 100%);
    position:relative;
  }
  .vig{position:absolute;inset:0;box-shadow:inset 0 0 300px rgba(0,0,0,.70);z-index:9;pointer-events:none}
  .ghost{position:absolute;top:${Math.round(H * 0.30)}px;left:50%;transform:translate(-50%,-50%);
    width:900px;height:900px;opacity:.05}
  .ghost img{width:100%;height:100%;display:block}

  .stage{position:absolute;top:600px;left:520px;width:0;height:0;perspective:2200px;z-index:2}
  /* 711px wide from a 700px source: 1:1, so the artwork is never resampled up. */
  .cover{
    position:absolute;top:-490px;left:-356px;width:711px;height:980px;
    transform-origin:50% 50%;will-change:transform;
  }
  .cover img{display:block;width:100%;height:100%;border-radius:5px;
    box-shadow:0 46px 96px rgba(0,0,0,.68), 0 0 0 1px rgba(214,186,128,.30)}
  .cover::before{
    content:'';position:absolute;top:8px;bottom:8px;left:-13px;width:13px;
    background:linear-gradient(90deg,#1c2b26 0%,#d8d0c0 26%,#f2ece0 46%,#c9c0ae 74%,#8f8676 100%);
    border-radius:3px 0 0 3px;box-shadow:-7px 20px 36px rgba(0,0,0,.55);
  }
  .sheen{position:absolute;inset:0;pointer-events:none;border-radius:5px;
    background:linear-gradient(250deg, rgba(255,246,222,.38) 0%, rgba(255,246,222,.08) 32%, transparent 60%);
    opacity:0}
  .mark{position:absolute;bottom:${H - SAFE.typeBottom - 90}px;left:50%;transform:translateX(-50%);
    height:44px;width:auto;opacity:.85;z-index:3}
</style>
<div class="ghost"><img src="${SEAL}" alt=""></div>
<div class="stage">
  <div class="cover" id="cover"><img src="${COVER}" alt=""><div class="sheen" id="sheen"></div></div>
</div>
<img class="mark" src="${MARK}" alt="">
<div class="vig"></div>
<script>
  const SETTLE = 2.4, DUR = ${DUR};
  const out = p => 1 - Math.pow(1 - p, 3);
  window.setT = (t) => {
    const p = out(Math.min(t / SETTLE, 1));
    /* After the settle it does not stop: a slow sine on both axes, under two
       degrees, so the object breathes instead of freezing. */
    const idle = Math.max(0, t - SETTLE);
    const ry = -14 * (1 - p) + Math.sin(idle * 0.42) * 1.8;
    const rz = -2.0 * (1 - p) + Math.sin(idle * 0.31 + 1) * 0.7;
    const s  = (0.96 + 0.04 * p) * (1 + 0.014 * (t / DUR));
    document.getElementById('cover').style.transform =
      'scale(' + s.toFixed(5) + ') rotateY(' + ry.toFixed(3) + 'deg) rotateZ(' + rz.toFixed(3) + 'deg)';
    document.getElementById('sheen').style.opacity =
      ((1 - p) * 0.8 + Math.abs(Math.sin(idle * 0.42)) * 0.18).toFixed(3);
  };
  window.setT(0);
</script>`;

/* ------------------------------------------------------------------ *
 * Type: transparent cards, centred under the object.
 * ------------------------------------------------------------------ */
const C = { ivory: '#FAF5EC', gold: '#C9A75E', goldSoft: '#E6D3A3' };

const beatCard = (lines, accent) => `
<link rel="stylesheet" href="/assets/fonts/fonts.css">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${W}px;height:${H}px;overflow:hidden;background:transparent}
  .wrap{position:absolute;top:${SAFE.typeTop}px;right:${SAFE.x}px;left:${SAFE.x}px;
    direction:rtl;text-align:center}
  .scrim{position:absolute;inset:-150px -170px;
    background:radial-gradient(56% 60% at 50% 50%,rgba(6,20,17,.80),rgba(6,20,17,.38) 60%,transparent 78%);
    filter:blur(34px)}
  .rule{position:relative;width:120px;height:3px;background:${C.gold};margin:0 auto 26px}
  .line{position:relative;font-family:'El Messiri','Almarai',sans-serif;font-weight:700;
    font-size:80px;line-height:1.6;color:${C.ivory};text-shadow:0 2px 20px rgba(0,0,0,.6)}
  .line + .line{margin-top:6px}
  .accent{color:${C.goldSoft}}
</style>
<div class="wrap">
  <div class="scrim"></div>
  <div class="rule"></div>
  ${lines.map((l, i) => `<div class="line${accent && i === lines.length - 1 ? ' accent' : ''}">${l}</div>`).join('\n  ')}
</div>`;

const offerCard = () => `
<link rel="stylesheet" href="/assets/fonts/fonts.css">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${W}px;height:${H}px;overflow:hidden;background:transparent}
  .wrap{position:absolute;top:${SAFE.typeTop - 40}px;right:${SAFE.x}px;left:${SAFE.x}px;
    direction:rtl;text-align:center}
  .scrim{position:absolute;inset:-170px -180px;
    background:radial-gradient(58% 62% at 50% 50%,rgba(6,20,17,.86),rgba(6,20,17,.44) 60%,transparent 78%);
    filter:blur(36px)}
  h1{position:relative;font-family:'El Messiri','Almarai',sans-serif;font-weight:700;
    font-size:76px;line-height:1.26;color:${C.ivory};margin-bottom:20px;
    text-shadow:0 2px 20px rgba(0,0,0,.6)}
  .price{position:relative;font-family:'Almarai',sans-serif;font-weight:400;
    font-size:44px;line-height:1.5;color:${C.goldSoft};margin-bottom:34px}
  .cta{position:relative;display:inline-block;padding:26px 58px;
    border:1px solid rgba(214,186,128,.75);border-radius:999px;
    background:linear-gradient(180deg,rgba(201,167,94,.26),rgba(201,167,94,.12));
    font-family:'Almarai',sans-serif;font-weight:700;font-size:46px;color:#FBF5E9;
    box-shadow:0 10px 34px rgba(0,0,0,.4)}
  .url{position:relative;margin-top:28px;font-family:'Almarai',sans-serif;font-weight:400;
    font-size:34px;color:rgba(230,211,163,.88);letter-spacing:.04em;direction:ltr}
</style>
<div class="wrap">
  <div class="scrim"></div>
  <h1>${COPY.offerTitle}</h1>
  <div class="price">${COPY.offerPrice}</div>
  <div class="cta">ابدئي من هنا</div>
  <div class="url">${COPY.offerUrl}</div>
</div>`;

/* ------------------------------------------------------------------ */
const ROUTES = { plate: plate(), offer: offerCard() };
COPY.beats.forEach((b, i) => { ROUTES['beat' + i] = beatCard(b.lines, b.accent); });

const server = await serveSite(PORT, url => {
  const m = url.match(/^\/__l\/(.+)$/);
  return m && ROUTES[m[1]] ? ROUTES[m[1]] : null;
});

await rm(WORK, { recursive: true, force: true });
await mkdir(join(WORK, 'frames'), { recursive: true });
mkdirSync(OUT, { recursive: true });

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });

/* Type first — cheap, and a missing font shows up before the long render. */
for (const name of Object.keys(ROUTES)) {
  if (name === 'plate') continue;
  const p = await ctx.newPage();
  const missing = [];
  p.on('response', r => { if (r.status() >= 400) missing.push(r.url()); });
  await p.goto(`http://127.0.0.1:${PORT}/__l/${name}`, { waitUntil: 'networkidle' });
  if (missing.length) throw new Error(`${name}: missing ${missing.join(', ')}`);
  await p.evaluate(() => document.fonts.ready);
  await writeFile(join(WORK, `${name}.png`), await p.screenshot({ type: 'png', omitBackground: true }));
  await p.close();
}
console.log(`  ${Object.keys(ROUTES).length - 1} cards`);

/* The moving plate. */
{
  const p = await ctx.newPage();
  const missing = [];
  p.on('response', r => { if (r.status() >= 400) missing.push(r.url()); });
  await p.goto(`http://127.0.0.1:${PORT}/__l/plate`, { waitUntil: 'networkidle' });
  if (missing.length) throw new Error(`plate: missing ${missing.join(', ')}`);
  const frames = Math.round(DUR * FPS);
  const t0 = Date.now();
  for (let i = 0; i < frames; i++) {
    /* Wait for the compositor to present, not just for the style to be set. */
    await p.evaluate(t => {
      window.setT(t);
      return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    }, i / FPS);
    await writeFile(join(WORK, 'frames', `f${String(i).padStart(4, '0')}.png`),
      await p.screenshot({ type: 'png' }));
  }
  console.log(`  plate  ${W}x${H}  ${frames} frames  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
await b.close();
server.close();

/* ------------------------------------------------------------------ *
 * Assemble.
 * ------------------------------------------------------------------ */
const ff = (args, label) => {
  try {
    execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) { throw new Error(`${label} failed:\n${e.stderr?.toString() || e.message}`); }
};

/* Air only — the low end of the room takes, with every transient filtered out.
   There are no pages in this film, so paper would be describing something that
   is not happening, which is the mistake the main ad already made once. */
const BED = join(WORK, 'bed.wav');
{
  const takes = ['room-a', 'room-b'].map(n => join(AD, 'ambience', `${n}.wav`));
  for (const t of takes) if (!existsSync(t)) throw new Error(`missing ambience take: ${t}`);
  ff([...takes.flatMap(t => ['-i', t]), '-filter_complex',
    [`[0:a]atrim=0:10,asetpts=N/SR/TB,aformat=sample_rates=48000:channel_layouts=stereo[k0]`,
     `[1:a]atrim=0:10,asetpts=N/SR/TB,aformat=sample_rates=48000:channel_layouts=stereo[k1]`,
     `[k0][k1]acrossfade=d=0.5:c1=tri:c2=tri[j]`,
     `[j]highpass=f=42,lowpass=f=380,volume=3.0,` +
     `aloop=loop=1:size=${19.5 * 48000}:start=0,` +
     `loudnorm=I=-23:TP=-2.0:LRA=9,alimiter=limit=0.794:level=disabled,` +
     `afade=t=in:st=0:d=1.2,afade=t=out:st=${DUR - 1.6}:d=1.6,` +
     `atrim=0:${DUR},asetpts=N/SR/TB[a]`].join(';'),
    '-map', '[a]', '-ac', '2', '-ar', '48000', BED], 'bed');
}

const inputs = ['-framerate', String(FPS), '-i', join(WORK, 'frames', 'f%04d.png')];
const chains = [`[0:v]fps=${FPS},format=yuv420p,setsar=1[base]`];

/* Every card lives on the same continuous shot: no cuts at all, the words
   simply change. A cut here would break the one thing this film has, which is
   an unbroken look at the object. */
const CARDS = [
  ...COPY.beats.map((x, i) => ({ file: `beat${i}.png`, ...x })),
  { file: 'offer.png', at: 14.7, to: DUR }
];

let stream = '[base]';
CARDS.forEach((c, i) => {
  const idx = i + 1;
  const dur = c.to - c.at;
  inputs.push('-loop', '1', '-t', String(dur.toFixed(3)), '-i', join(WORK, c.file));
  const fd = 0.32;
  chains.push(
    `[${idx}:v]format=rgba,fps=${FPS},` +
    `fade=t=in:st=0:d=${fd}:alpha=1,fade=t=out:st=${(dur - fd).toFixed(3)}:d=${fd}:alpha=1,` +
    `setpts=PTS+${c.at.toFixed(3)}/TB[c${i}]`);
  const out = i === CARDS.length - 1 ? '[vout]' : `[s${i}]`;
  chains.push(`${stream}[c${i}]overlay=0:0:eof_action=pass:repeatlast=0:format=auto${out}`);
  stream = out;
});

const enc = ['-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '17',
  '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart',
  '-t', String(DUR), '-fps_mode', 'cfr'];

const withSound = join(OUT, 'nizamok-lamhat-tiktok-9x16-18s.mp4');
const silent = join(OUT, 'nizamok-lamhat-tiktok-9x16-18s-silent.mp4');

ff([...inputs, '-i', BED, '-filter_complex', chains.join(';'),
  '-map', '[vout]', '-map', `${CARDS.length + 1}:a`,
  ...enc, '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-shortest', withSound], 'sound');
ff([...inputs, '-filter_complex', chains.join(';'), '-map', '[vout]', '-an', ...enc, silent], 'silent');

/* A vertical cover frame doubles as the TikTok thumbnail. */
const poster = join(OUT, 'nizamok-lamhat-tiktok-poster-1080x1920.jpg');
ff(['-i', join(WORK, 'frames', 'f0090.png'), '-i', join(WORK, 'beat0.png'),
  '-filter_complex', '[0:v][1:v]overlay', '-frames:v', '1', '-q:v', '2', poster], 'poster');

console.log('\n  check');
for (const file of [withSound, silent]) {
  const out = execFileSync('sh', ['-c', `${FF} -hide_banner -i '${file}' -f null - 2>&1`]).toString();
  const d = out.match(/Duration: (\d+):(\d+):([\d.]+)/);
  const secs = d ? (+d[1] * 3600 + +d[2] * 60 + parseFloat(d[3])) : NaN;
  const fm = [...out.matchAll(/frame=\s*(\d+)/g)].pop();
  console.log(`    ${file.split('/').pop().padEnd(44)} ${secs.toFixed(2)}s  ${fm ? fm[1] : '?'}f  ` +
    `${(statSync(file).size / 1048576).toFixed(1)} MB`);
  if (Math.abs(secs - DUR) > 0.05) throw new Error(`${file}: ${secs}s, expected ${DUR}`);
}
console.log(`    ${poster.split('/').pop()}`);
