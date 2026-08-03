/* NizamOk — «لمحة المبدعة المشتّتة» promo. 24 seconds, both native formats.
 *
 * The cheap door: 19 SAR, in the same shape as the 109 film — cover, then real
 * pages turning, then the offer.
 *
 * Earlier there were no interior pages for لمحات and the cut said so by showing
 * none. The book's own PDF export supplied them: see lamhat-pages.mjs. Every
 * word on those pages is the book's, set in the book's fonts.
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
 *   node tools/ad/lamhat-pages.mjs && node tools/ad/lamhat-tiktok.mjs
 */
import { chromium } from '/home/user/Nizamuk.Business/node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { mkdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { serveSite } from './stage.mjs';

const PORT = 8997;
const FF = '/home/user/Nizamuk.Business/.bin/ffmpeg';
const AD = '/home/user/Nizamuk.Business/build/ad';
const WORK = join(AD, 'lamhat');
const OUT = join(AD, 'out');
const FPS = 30;
const DUR = 24.0;
const XF = 0.4;
/* Three segments. The cover is a short establishing shot now, not the whole
   film: the pages are what is worth looking at. */
const COVER_D = 4.0, PAGES_D = 16.0, OFFER_D = 4.0;

const COVER = '/assets/covers/lamhat-mubdia.jpg';
const SEAL = '/assets/img/seal.png';
const MARK = '/assets/img/wordmark.png';

/* ---- Approved copy. From the live ladder on /rebuild/mubdia/ and from the
        cover's own printed subtitle. Single source; do not retype. ---- */
const COPY = {
  /* Beats two to five are QUOTED FROM THE BOOK, not written for the ad. That is
     the whole point of the change: a promo for a reading should be made of the
     reading. Sources in order — p05 الفجوات الخمس, p08 ٣ لحظات آها,
     p09 إشارتكِ قبل التراجع, p13 خلاصة الخريطة. */
  beats: [
    { at: 0.5,  to: 3.8,  size: 78, lines: ['تبدئين بحماس…', 'ثم تتوقفين؟'], accent: true },
    /* p04 — قراءة نمطكِ الغالب */
    { at: 4.6,  to: 9.0,  size: 68, lines: ['لستِ نمطًا واحدًا مغلقًا،', 'بل مزيجٌ من طبقات', 'تتداخل في قراراتكِ'], accent: true },
    /* p06 — فجوة الإنتاج المتراكم */
    { at: 9.9,  to: 14.3, size: 68, lines: ['في ملفاتكِ مشاريع', 'اكتمل معظمها…', 'ثم توقفت قبل الخروج'], accent: true },
    /* p12 — خطة ٣ أيام */
    { at: 15.2, to: 20.0, size: 66, lines: ['٣ أيام تكفي لتشعري بالفرق', 'بين يومٍ يقوده النمط', 'ويومٍ تقودينه أنتِ'], accent: true }
  ],
  /* The opposite move from the 109 film. There, naming the path would list
     cheaper doors at the moment of decision; here the path IS the argument —
     19 riyals reads as a thin thing on its own and as a first step in a
     sequence it reads as a beginning. Wording follows /almasar/. */
  offerKicker: 'أولى مراحل مسار نظامك',
  offerTitle: 'لمحة المبدعة المشتّتة',
  offerPrice: '١٩ ر.س',
  offerUrl: 'nizamok.com'
};

/* 9:16 — TikTok owns the edges: the action rail down the right from about
   y=950, the caption and handle across the bottom from about y=1500, so the
   type lives inside x 120–960 and above y=1470, centred under the book.
   16:9 — no platform chrome to dodge; the book sits left and the type takes the
   empty right column, the same arrangement as the 109 film. */
const FORMATS = {
  h: { w: 1920, h: 1080, name: '16x9', side: true,
       cover: { cx: 600, cy: 512, w: 624, h: 860 } },
  v: { w: 1080, h: 1920, name: '9x16', side: false,
       cover: { cx: 520, cy: 600, w: 711, h: 980 },
       safe: { x: 120, typeTop: 1080 } }
};

/* ------------------------------------------------------------------ *
 * The plate: emerald ground, the cover as an object.
 * ------------------------------------------------------------------ */
const plate = (F) => {
  const W = F.w, H = F.h, CV = F.cover;
  return `
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

  .stage{position:absolute;top:${CV.cy}px;left:${CV.cx}px;width:0;height:0;perspective:2200px;z-index:2}
  /* Never larger than the 700px source, so the artwork is never resampled up. */
  .cover{
    position:absolute;top:${-CV.h / 2}px;left:${-CV.w / 2}px;width:${CV.w}px;height:${CV.h}px;
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
  .mark{position:absolute;bottom:70px;${F.side ? 'left:80px' : 'left:50%;transform:translateX(-50%)'};
    height:40px;width:auto;opacity:.8;z-index:3}
</style>
<div class="ghost"><img src="${SEAL}" alt=""></div>
<div class="stage">
  <div class="cover" id="cover"><img src="${COVER}" alt=""><div class="sheen" id="sheen"></div></div>
</div>
<img class="mark" src="${MARK}" alt="">
<div class="vig"></div>
<script>
  const SETTLE = 2.0, DUR = ${COVER_D + XF};
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
};

/* ------------------------------------------------------------------ *
 * Type: transparent cards.
 * ------------------------------------------------------------------ */
const C = { ivory: '#FAF5EC', gold: '#C9A75E', goldSoft: '#E6D3A3' };

const beatCard = (F, lines, accent, size = 78) => `
<link rel="stylesheet" href="/assets/fonts/fonts.css">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${F.w}px;height:${F.h}px;overflow:hidden;background:transparent}
  .wrap{position:absolute;${F.side
    ? 'top:50%;transform:translateY(-50%);right:80px;width:840px;'
    : `top:${F.safe.typeTop}px;right:${F.safe.x}px;left:${F.safe.x}px;`}
    direction:rtl;text-align:${F.side ? 'right' : 'center'}}
  .scrim{position:absolute;inset:-150px -170px;
    background:radial-gradient(56% 60% at 50% 50%,rgba(6,20,17,.80),rgba(6,20,17,.38) 60%,transparent 78%);
    filter:blur(34px)}
  .rule{position:relative;width:${F.side ? 150 : 120}px;height:3px;background:${C.gold};
    margin:0 ${F.side ? '0' : 'auto'} 26px auto}
  .line{position:relative;font-family:'El Messiri','Almarai',sans-serif;font-weight:700;
    font-size:${size}px;line-height:1.52;color:${C.ivory};text-shadow:0 2px 20px rgba(0,0,0,.65)}
  .line + .line{margin-top:6px}
  .accent{color:${C.goldSoft}}
</style>
<div class="wrap">
  <div class="scrim"></div>
  <div class="rule"></div>
  ${lines.map((l, i) => `<div class="line${accent && i === lines.length - 1 ? ' accent' : ''}">${l}</div>`).join('\n  ')}
</div>`;

/* Opaque, and it carries the cover: the last thing on screen should be the
   object she is buying, not words floating on a ground. */
const offerCard = (F) => `
<link rel="stylesheet" href="/assets/fonts/fonts.css">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${F.w}px;height:${F.h}px;overflow:hidden}
  body{background:
      radial-gradient(66% 44% at 70% 10%, rgba(201,167,94,.20), transparent 62%),
      linear-gradient(158deg,#12312A 0%,#0D241F 56%,#071613 100%)}
  .cov{position:absolute;${F.side
    ? 'top:50%;left:600px;transform:translate(-50%,-50%);width:480px;height:661px'
    : 'top:250px;left:50%;transform:translateX(-50%);width:540px;height:744px'}}
  .cov img{display:block;width:100%;height:100%;border-radius:5px;
    box-shadow:0 40px 84px rgba(0,0,0,.66), 0 0 0 1px rgba(214,186,128,.30)}
  .cov::before{content:'';position:absolute;top:7px;bottom:7px;left:-11px;width:11px;
    background:linear-gradient(90deg,#1c2b26,#efe9dc 55%,#c2b9a6);border-radius:3px 0 0 3px}
  .wrap{position:absolute;${F.side
    ? 'top:50%;transform:translateY(-50%);right:80px;width:840px;'
    : `top:${F.safe.typeTop + 20}px;right:${F.safe.x}px;left:${F.safe.x}px;`}
    direction:rtl;text-align:${F.side ? 'right' : 'center'}}
  .scrim{position:absolute;inset:-170px -180px;
    background:radial-gradient(58% 62% at 50% 50%,rgba(6,20,17,.86),rgba(6,20,17,.44) 60%,transparent 78%);
    filter:blur(36px)}
  .kicker{position:relative;font-family:'Almarai',sans-serif;font-weight:400;
    font-size:36px;letter-spacing:.08em;color:${C.goldSoft};margin-bottom:16px}
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
<div class="cov"><img src="${COVER}" alt=""></div>
<div class="wrap">
  <div class="scrim"></div>
  <div class="kicker">${COPY.offerKicker}</div>
  <h1>${COPY.offerTitle}</h1>
  <div class="price">${COPY.offerPrice}</div>
  <div class="cta">ابدئي من هنا</div>
  <div class="url">${COPY.offerUrl}</div>
</div>`;

/* ------------------------------------------------------------------ */
const ROUTES = {};
for (const [k, F] of Object.entries(FORMATS)) {
  ROUTES[`plate-${k}`] = plate(F);
  ROUTES[`offer-${k}`] = offerCard(F);
  COPY.beats.forEach((b, i) => { ROUTES[`beat${i}-${k}`] = beatCard(F, b.lines, b.accent, b.size); });
}

const server = await serveSite(PORT, url => {
  const m = url.match(/^\/__l\/(.+)$/);
  return m && ROUTES[m[1]] ? ROUTES[m[1]] : null;
});

await mkdir(WORK, { recursive: true });
mkdirSync(OUT, { recursive: true });

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

/* Set the time, then WAIT for the compositor to present it. */
const frame = (p, t) => p.evaluate(x => {
  window.setT(x);
  return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
}, t);

const FRAME_COUNT = Math.round((COVER_D + XF) * FPS);

for (const [k, F] of Object.entries(FORMATS)) {
  const ctx = await b.newContext({ viewport: { width: F.w, height: F.h }, deviceScaleFactor: 1 });

  /* Type first — cheap, and a missing font shows up before the long render. */
  for (const name of Object.keys(ROUTES).filter(n => n.endsWith(`-${k}`) && !n.startsWith('plate'))) {
    const p = await ctx.newPage();
    const missing = [];
    p.on('response', r => { if (r.status() >= 400) missing.push(r.url()); });
    await p.goto(`http://127.0.0.1:${PORT}/__l/${name}`, { waitUntil: 'networkidle' });
    if (missing.length) throw new Error(`${name}: missing ${missing.join(', ')}`);
    await p.evaluate(() => document.fonts.ready);
    await writeFile(join(WORK, `${name}.png`),
      await p.screenshot({ type: 'png', omitBackground: !name.startsWith('offer') }));
    await p.close();
  }

  /* The moving cover. Kept if a full set is already on disk: it takes minutes
     and nothing about it depends on the type, which is the layer that changes. */
  const fdir = join(WORK, `frames-${k}`);
  if (existsSync(join(fdir, `f${String(FRAME_COUNT - 1).padStart(4, '0')}.png`))) {
    console.log(`  cover ${k}  ${FRAME_COUNT} frames already rendered, kept`);
  } else {
    await rm(fdir, { recursive: true, force: true });
    await mkdir(fdir, { recursive: true });
    const p = await ctx.newPage();
    const missing = [];
    p.on('response', r => { if (r.status() >= 400) missing.push(r.url()); });
    await p.goto(`http://127.0.0.1:${PORT}/__l/plate-${k}`, { waitUntil: 'networkidle' });
    if (missing.length) throw new Error(`plate-${k}: missing ${missing.join(', ')}`);
    const t0 = Date.now();
    for (let i = 0; i < FRAME_COUNT; i++) {
      await frame(p, i / FPS);
      await writeFile(join(fdir, `f${String(i).padStart(4, '0')}.png`), await p.screenshot({ type: 'png' }));
    }
    console.log(`  cover ${k}  ${F.w}x${F.h}  ${FRAME_COUNT} frames  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    await p.close();
  }
  await ctx.close();
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
   There are no pages moving in the cover shot, so full-band paper would be
   describing something that is not happening. */
const BED = join(WORK, 'bed.wav');
{
  const takes = ['room-a', 'room-b'].map(n => join(AD, 'ambience', `${n}.wav`));
  for (const t of takes) if (!existsSync(t)) throw new Error(`missing ambience take: ${t}`);
  ff([...takes.flatMap(t => ['-i', t]), '-filter_complex',
    [`[0:a]atrim=0:10,asetpts=N/SR/TB,aformat=sample_rates=48000:channel_layouts=stereo[k0]`,
     `[1:a]atrim=0:10,asetpts=N/SR/TB,aformat=sample_rates=48000:channel_layouts=stereo[k1]`,
     `[k0][k1]acrossfade=d=0.5:c1=tri:c2=tri[j]`,
     `[j]highpass=f=42,lowpass=f=380,volume=3.0,` +
     `aloop=loop=2:size=${19.5 * 48000}:start=0,` +
     `loudnorm=I=-23:TP=-2.0:LRA=9,alimiter=limit=0.794:level=disabled,` +
     `afade=t=in:st=0:d=1.2,afade=t=out:st=${DUR - 1.6}:d=1.6,` +
     `atrim=0:${DUR},asetpts=N/SR/TB[a]`].join(';'),
    '-map', '[a]', '-ac', '2', '-ar', '48000', BED], 'bed');
}

const enc = ['-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '17',
  '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart',
  '-t', String(DUR), '-fps_mode', 'cfr'];

const results = [];
for (const [k, F] of Object.entries(FORMATS)) {
  const PAGEDIR = join(AD, 'lamhat-book', k);
  if (!existsSync(join(PAGEDIR, 'f0000.png'))) {
    throw new Error(`missing page frames: ${PAGEDIR} (run lamhat-pages.mjs)`);
  }
  const inputs = [
    '-framerate', String(FPS), '-i', join(WORK, `frames-${k}`, 'f%04d.png'),
    '-framerate', String(FPS), '-i', join(PAGEDIR, 'f%04d.png'),
    '-loop', '1', '-t', String(OFFER_D), '-i', join(WORK, `offer-${k}.png`)
  ];
  const chains = [
    /* fps LAST in each chain: setpts after it wipes the frame-rate metadata and
       xfade then refuses the link. */
    `[0:v]trim=end_frame=${Math.round((COVER_D + XF) * FPS)},setpts=N/${FPS}/TB,format=yuv420p,setsar=1,fps=${FPS}[v0]`,
    `[1:v]trim=end_frame=${Math.round((PAGES_D + XF) * FPS)},setpts=N/${FPS}/TB,format=yuv420p,setsar=1,fps=${FPS}[v1]`,
    `[2:v]format=yuv420p,setsar=1,fps=${FPS}[v2]`,
    `[v0][v1]xfade=transition=fade:duration=${XF}:offset=${COVER_D}[x0]`,
    `[x0][v2]xfade=transition=fade:duration=${XF}:offset=${COVER_D + PAGES_D}[base]`
  ];

  let stream = '[base]';
  COPY.beats.forEach((c, i) => {
    const idx = 3 + i;
    const dur = c.to - c.at;
    inputs.push('-loop', '1', '-t', String(dur.toFixed(3)), '-i', join(WORK, `beat${i}-${k}.png`));
    const fd = 0.32;
    chains.push(
      `[${idx}:v]format=rgba,fps=${FPS},` +
      `fade=t=in:st=0:d=${fd}:alpha=1,fade=t=out:st=${(dur - fd).toFixed(3)}:d=${fd}:alpha=1,` +
      `setpts=PTS+${c.at.toFixed(3)}/TB[c${i}]`);
    const out = i === COPY.beats.length - 1 ? '[vout]' : `[s${i}]`;
    chains.push(`${stream}[c${i}]overlay=0:0:eof_action=pass:repeatlast=0:format=auto${out}`);
    stream = out;
  });

  const withSound = join(OUT, `nizamok-lamhat-${F.name}-24s.mp4`);
  const silent = join(OUT, `nizamok-lamhat-${F.name}-24s-silent.mp4`);
  ff([...inputs, '-i', BED, '-filter_complex', chains.join(';'),
    '-map', '[vout]', '-map', `${COPY.beats.length + 3}:a`,
    ...enc, '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-shortest', withSound], `${F.name} sound`);
  ff([...inputs, '-filter_complex', chains.join(';'), '-map', '[vout]', '-an', ...enc, silent], `${F.name} silent`);
  results.push(withSound, silent);
}

const poster = join(OUT, 'nizamok-lamhat-poster-1080x1920.jpg');
ff(['-i', join(WORK, 'frames-v', 'f0100.png'), '-i', join(WORK, 'beat0-v.png'),
  '-filter_complex', '[0:v][1:v]overlay', '-frames:v', '1', '-q:v', '2', poster], 'poster');

console.log('\n  check');
for (const file of results) {
  const out = execFileSync('sh', ['-c', `${FF} -hide_banner -i '${file}' -f null - 2>&1`]).toString();
  const d = out.match(/Duration: (\d+):(\d+):([\d.]+)/);
  const secs = d ? (+d[1] * 3600 + +d[2] * 60 + parseFloat(d[3])) : NaN;
  const fm = [...out.matchAll(/frame=\s*(\d+)/g)].pop();
  console.log(`    ${file.split('/').pop().padEnd(40)} ${secs.toFixed(2)}s  ${fm ? fm[1] : '?'}f  ` +
    `${(statSync(file).size / 1048576).toFixed(1)} MB`);
  if (Math.abs(secs - DUR) > 0.05) throw new Error(`${file}: ${secs}s, expected ${DUR}`);
}
console.log(`    ${poster.split('/').pop()}`);
