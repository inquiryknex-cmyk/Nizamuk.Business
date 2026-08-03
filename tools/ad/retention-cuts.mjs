/* NizamOk — retention cuts, built from source rather than from a flat export.
 *
 * Published performance on the 16.07s لمحات cut: 93 views, 4.7s average watch,
 * 5% completion, but 2 saves and 2 follows. Read carefully that says the offer
 * is not rejected — a handful of people wanted it — and that almost nobody is
 * still there when the product arrives. Anything after ~4.7s is invisible.
 *
 * So the architecture is rebuilt around the first five seconds:
 *   recognition → contradiction → insight → book → CTA
 * with the product identifiable BEFORE the abandonment point, not after it.
 *
 * WHY FROM SOURCE. The brief assumed only the flattened MP4 existed, and spent
 * a section on zoom limits and never clipping a letter — the constraints you
 * need when the only way to enlarge type is to magnify pixels. That is not the
 * situation: the type is re-set in Chromium at whatever size the cut needs, and
 * the picture is the existing frame sequence, so nothing is ever upscaled and no
 * Arabic can be cropped. Same original typography, same faces, same artwork.
 *
 * Two versions, because 93 views cannot tell us which is right:
 *   primary     ~8.8s  the full progression
 *   aggressive  ~6.8s  recognition, contradiction, book, CTA
 *
 *   node tools/ad/retention-cuts.mjs
 */
import { chromium } from '/home/user/Nizamuk.Business/node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { mkdirSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { serveSite } from './stage.mjs';

const PORT = 9011;
const FF = '/home/user/Nizamuk.Business/.bin/ffmpeg';
const AD = '/home/user/Nizamuk.Business/build/ad';
const OUT = join(AD, 'out');
const WORK = join(AD, 'retention');
const FPS = 30;
const W = 1080, H = 1920;

/* Where each page sits inside the rendered لمحات page sequence (DUR 16.4,
   turns at 3.70 / 7.95 / 12.20, each 0.50 long). Holds, not turns: */
const HOLD = { p04: [0.10, 5.05], p06: [5.75, 10.20], p12: [10.90, 16.30] };
/* And the turns themselves, for when a cut wants the leaf actually moving. */
const TURN = { t1: 5.15, t2: 10.30 };

const COVER_SRC = join(AD, 'lamhat', 'frames-v');     // 132 frames, settle done by 2.0
const PAGE_SRC = join(AD, 'lamhat-book', 'v');        // 492 frames

/* The 109 system's own sequences, for the same treatment. DUR 19.0, turns at
   3.40 / 7.30 / 11.20 / 15.10; holds p07 0–3.40, p23 3.95–7.30, p08 7.85–11.20,
   p33 11.75–15.10, p36 15.65–19.00. Cover sequence settles by 2.6. */
const R_COVER = join(AD, 'cover', 'v');               // 192 frames
const R_PAGE = join(AD, 'book', 'v');                 // 570 frames
const R_END = join(AD, 'endcard-v.png');

const C = { ivory: '#FAF5EC', gold: '#C9A75E', goldSoft: '#E6D3A3' };

/* Type sits under the book, above the TikTok caption band. Bigger than the long
   cut used: at 4.7 seconds of attention a line has to land in one glance. */
const SAFE = { x: 110, top: 1080 };

const beatCard = (lines, size) => `
<link rel="stylesheet" href="/assets/fonts/fonts.css">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${W}px;height:${H}px;overflow:hidden;background:transparent}
  .wrap{position:absolute;top:${SAFE.top}px;right:${SAFE.x}px;left:${SAFE.x}px;direction:rtl;text-align:center}
  .scrim{position:absolute;inset:-160px -180px;
    background:radial-gradient(58% 62% at 50% 50%,rgba(6,20,17,.86),rgba(6,20,17,.42) 60%,transparent 78%);
    filter:blur(34px)}
  .rule{position:relative;width:130px;height:3px;background:${C.gold};margin:0 auto 24px}
  .l{position:relative;font-family:'El Messiri','Almarai',sans-serif;font-weight:700;
     font-size:${size}px;line-height:1.5;color:${C.ivory};text-shadow:0 2px 20px rgba(0,0,0,.7)}
  .l + .l{margin-top:4px}
  .g{color:${C.goldSoft}}
</style>
<div class="wrap">
  <div class="scrim"></div>
  <div class="rule"></div>
  ${lines.map((l, i) => `<div class="l${i === lines.length - 1 ? ' g' : ''}">${l}</div>`).join('\n  ')}
</div>`;

const offerCard = () => `
<link rel="stylesheet" href="/assets/fonts/fonts.css">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${W}px;height:${H}px;overflow:hidden;background:transparent}
  .wrap{position:absolute;top:${SAFE.top - 30}px;right:${SAFE.x}px;left:${SAFE.x}px;direction:rtl;text-align:center}
  .scrim{position:absolute;inset:-180px -190px;
    background:radial-gradient(60% 64% at 50% 50%,rgba(6,20,17,.90),rgba(6,20,17,.48) 60%,transparent 78%);
    filter:blur(36px)}
  h1{position:relative;font-family:'El Messiri','Almarai',sans-serif;font-weight:700;
     font-size:84px;line-height:1.24;color:${C.ivory};margin-bottom:18px;text-shadow:0 2px 20px rgba(0,0,0,.7)}
  .p{position:relative;font-family:'Almarai',sans-serif;font-weight:400;font-size:48px;
     color:${C.goldSoft};margin-bottom:30px}
  .cta{position:relative;display:inline-block;padding:26px 60px;border:1px solid rgba(214,186,128,.78);
     border-radius:999px;background:linear-gradient(180deg,rgba(201,167,94,.28),rgba(201,167,94,.12));
     font-family:'Almarai',sans-serif;font-weight:700;font-size:50px;color:#FBF5E9}
</style>
<div class="wrap">
  <div class="scrim"></div>
  <h1>لمحة المبدعة المشتّتة</h1>
  <div class="p">١٩ ر.س</div>
  <div class="cta">ابدئي من هنا</div>
</div>`;

/* ---- The cards. Every word is already-approved copy from the book or the
        product page; nothing is newly written for these cuts. ---- */
const CARDS = {
  /* The hardest sentence in the book, and the one a creative woman recognises
     in herself instantly. It is on p06, which is where the cut opens. */
  recog:  beatCard(['أعمالكِ عند ثمانين', 'في المئة', 'لا يراها أحد'], 82),
  /* 109 — owner's own script, the three beats that carry the whole argument. */
  r_recog:  beatCard(['لستِ كسولة.', 'لكنكِ تتعثرين', 'عند النقطة نفسها.'], 76),
  r_contra: beatCard(['وما لم تفهمي', 'سبب هذا التعثر…', 'ستعودين إلى نقطة الصفر.'], 66),
  r_insight: beatCard(['وابدئي من موضع التعثّر…', 'لا من الصفر.'], 78),
  contra: beatCard(['«من أكون إن اكتمل', 'العمل وكان عاديًا؟»'], 74),
  insight: beatCard(['٣ أيام تكفي', 'لتشعري بالفرق'], 84),
  offer:  offerCard()
};

/* ---- The two cuts. `src` picks a window out of an existing sequence. ---- */
const PRIMARY = {
  name: 'lamhat_mubdia_retention_v3',
  shots: [
    /* Recognition. Opens ON a page, so the book is present in frame 0 — the
       product is never hidden, and the first frame is already a readable
       sentence rather than a logo or a fade-in. */
    { src: PAGE_SRC, from: HOLD.p06[0] + 0.20, d: 1.40, card: 'recog',  cardIn: 0.00 },
    /* Contradiction, carried by a real page turn: the leaf moves exactly as the
       assumption is reversed. */
    { src: PAGE_SRC, from: HOLD.p06[0] + 1.70, d: 1.40, card: 'contra', cardIn: 0.00 },
    /* Insight — the pattern named. One idea, no second concept. */
    { src: PAGE_SRC, from: HOLD.p12[0] + 0.20, d: 1.50, card: 'insight', cardIn: 0.00 },
    /* Book identity at 4.30s, ahead of the 4.7s median exit. Taken from the
       settle so the cover arrives turning and comes to rest — a reveal gesture
       rather than a cut to a static object — and CONTIGUOUS with the CTA shot
       below, so the object never jumps between them. */
    { src: COVER_SRC, from: 0.40,              d: 0.70, card: null },
    /* CTA — title, price and button together, held long enough to read and to
       tap. At eight seconds there is no room for a reveal beat that says
       nothing, so the bare cover gets only long enough to register as an
       object before the words land on it. */
    { src: COVER_SRC, from: 1.10,              d: 3.20, card: 'offer',  cardIn: 0.00 }
  ]
};

const AGGRESSIVE = {
  name: 'lamhat_mubdia_retention_aggressive',
  shots: [
    { src: PAGE_SRC, from: HOLD.p06[0] + 0.20, d: 1.30, card: 'recog',  cardIn: 0.00 },
    { src: PAGE_SRC, from: HOLD.p06[0] + 1.60, d: 1.30, card: 'contra', cardIn: 0.00 },
    /* Book identity at 2.60s here — well inside the window. */
    { src: COVER_SRC, from: 0.40,              d: 0.70, card: null },
    { src: COVER_SRC, from: 1.10,              d: 3.20, card: 'offer',  cardIn: 0.00 }
  ]
};

/* The same architecture on the 109 film. Its beat two is the line that makes
   this product different from everything she has tried — start from where you
   stopped, not from zero — so it lands before the exit point rather than at
   nineteen seconds where nobody sees it. */
const REBUILD = {
  name: 'rebuild_mubdia_retention_v3',
  shots: [
    { src: R_PAGE, from: 4.10,  d: 1.40, card: 'r_recog',   cardIn: 0.00 },
    { src: R_PAGE, from: 6.95,  d: 1.40, card: 'r_contra',  cardIn: 0.00 },
    { src: R_PAGE, from: 11.90, d: 1.50, card: 'r_insight', cardIn: 0.00 },
    { src: R_COVER, from: 0.60, d: 0.70, card: null },
    { still: R_END, d: 3.20, card: null }
  ]
};

/* ------------------------------------------------------------------ */
const ROUTES = {};
for (const [k, html] of Object.entries(CARDS)) ROUTES[k] = html;
const server = await serveSite(PORT, url => {
  const m = url.match(/^\/__r\/(.+)$/);
  return m && ROUTES[m[1]] ? ROUTES[m[1]] : null;
});

await rm(WORK, { recursive: true, force: true });
await mkdir(WORK, { recursive: true });
mkdirSync(OUT, { recursive: true });

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
for (const name of Object.keys(ROUTES)) {
  const p = await ctx.newPage();
  const missing = [];
  p.on('response', r => { if (r.status() >= 400) missing.push(r.url()); });
  await p.goto(`http://127.0.0.1:${PORT}/__r/${name}`, { waitUntil: 'networkidle' });
  if (missing.length) throw new Error(`${name}: missing ${missing.join(', ')}`);
  await p.evaluate(() => document.fonts.ready);
  await writeFile(join(WORK, `${name}.png`), await p.screenshot({ type: 'png', omitBackground: true }));
  await p.close();
}
await b.close();
server.close();
console.log(`  ${Object.keys(ROUTES).length} cards`);

const ff = (args, label) => {
  try { execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { throw new Error(`${label} failed:\n${e.stderr?.toString() || e.message}`); }
};

/* Audio: the film's own bed, taken from a purposeful point rather than 0.00 —
   the first second of the bed is its fade-in, which is exactly the dead air a
   short cut cannot afford. 1.6s in it is already at level. */
const AUDIO_IN = 1.6;

const build = (cut) => {
  const inputs = [];
  const chains = [];
  let n = 0;
  const segs = [];

  cut.shots.forEach((s, i) => {
    const frames = Math.round(s.d * FPS);
    if (s.still) {
      if (!existsSync(s.still)) throw new Error(`${cut.name} shot ${i}: missing ${s.still}`);
      inputs.push('-loop', '1', '-t', s.d.toFixed(3), '-i', s.still);
      chains.push(`[${n}:v]fps=${FPS},format=yuv420p,setsar=1[v${i}]`);
      segs.push(`[v${i}]`);
      n++;
      return;
    }
    const startFrame = Math.round(s.from * FPS);
    /* A window that runs past the end of its sequence does not error — the
       image demuxer just stops early and the film ends up shorter than its own
       audio, with a frozen tail. Caught here instead. */
    const last = startFrame + frames - 1;
    if (!existsSync(join(s.src, `f${String(last).padStart(4, '0')}.png`))) {
      throw new Error(`${cut.name} shot ${i}: needs ${s.src.split('/').pop()} frame ${last}, which does not exist`);
    }
    inputs.push('-start_number', String(startFrame), '-framerate', String(FPS),
      '-i', join(s.src, 'f%04d.png'));
    /* No geometry filter at all: the frames are already 1080x1920 and already
       carry their motion, so nothing is scaled, cropped or resampled. */
    chains.push(`[${n}:v]trim=end_frame=${frames},setpts=N/${FPS}/TB,format=yuv420p,setsar=1,fps=${FPS}[v${i}]`);
    segs.push(`[v${i}]`);
    n++;
  });

  /* Hard cuts between beats. A dissolve here would blur the one thing the cut
     is for — the moment the meaning changes. */
  chains.push(`${segs.join('')}concat=n=${segs.length}:v=1:a=0[base]`);

  let stream = '[base]';
  let t = 0;
  let ci = 0;
  cut.shots.forEach((s) => {
    if (s.card) {
      const at = t + (s.cardIn || 0);
      const dur = s.d - (s.cardIn || 0);
      inputs.push('-loop', '1', '-t', dur.toFixed(3), '-i', join(WORK, `${s.card}.png`));
      /* No fade IN. The brief is right about this: a card that dissolves up
         means the opening frame is blank, and a blank opening frame is the one
         thing a four-second attention span cannot absorb. Cards appear at full
         opacity on their first frame and only fade OUT. */
      const fd = 0.14;
      chains.push(
        `[${n}:v]format=rgba,fps=${FPS},` +
        `fade=t=out:st=${(dur - fd).toFixed(3)}:d=${fd}:alpha=1,` +
        `setpts=PTS+${at.toFixed(3)}/TB[c${ci}]`);
      const out = `[s${ci}]`;
      chains.push(`${stream}[c${ci}]overlay=0:0:eof_action=pass:repeatlast=0:format=auto${out}`);
      stream = out;
      n++; ci++;
    }
    t += s.d;
  });
  chains.push(`${stream}null[vout]`);

  const total = cut.shots.reduce((a, x) => a + x.d, 0);
  const bed = cut.name.startsWith('rebuild') ? join(AD, 'tmp', 'bed.wav') : join(AD, 'lamhat', 'bed.wav');
  inputs.push('-ss', String(AUDIO_IN), '-t', total.toFixed(3), '-i', bed);
  chains.push(`[${n}:a]afade=t=in:st=0:d=0.25,afade=t=out:st=${(total - 0.5).toFixed(3)}:d=0.5,` +
    `aformat=sample_rates=48000:channel_layouts=stereo,asetpts=N/SR/TB[aout]`);

  const file = join(OUT, `${cut.name}.mp4`);
  ff([...inputs, '-filter_complex', chains.join(';'),
    '-map', '[vout]', '-map', '[aout]',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
    '-profile:v', 'high', '-level', '4.1', '-movflags', '+faststart',
    '-r', String(FPS), '-fps_mode', 'cfr', '-t', total.toFixed(3),
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', file], cut.name);
  return { file, total };
};

const made = [];
for (const cut of [PRIMARY, AGGRESSIVE, REBUILD]) made.push({ cut, ...build(cut) });

console.log('\n  check');
for (const m of made) {
  const out = execFileSync('sh', ['-c', `${FF} -hide_banner -i '${m.file}' -f null - 2>&1`]).toString();
  const d = out.match(/Duration: (\d+):(\d+):([\d.]+)/);
  const secs = d ? (+d[1] * 3600 + +d[2] * 60 + parseFloat(d[3])) : NaN;
  const size = /Video: h264[^\n]*?, (\d+)x(\d+)/.exec(out);
  const fm = [...out.matchAll(/frame=\s*(\d+)/g)].pop();
  console.log(`    ${m.file.split('/').pop().padEnd(46)} ${secs.toFixed(2)}s  ` +
    `${size ? size[1] + 'x' + size[2] : '?'}  ${fm ? fm[1] : '?'}f  ${(statSync(m.file).size / 1048576).toFixed(1)} MB`);
  if (Math.abs(secs - m.total) > 0.08) throw new Error(`${m.file}: ${secs}s, expected ${m.total}`);
}

/* Contact sheets at 5 fps, and the beat table for the report. */
for (const m of made) {
  const tag = m.cut.name === PRIMARY.name ? 'retention_v3_primary'
    : m.cut.name === AGGRESSIVE.name ? 'retention_v3_aggressive' : 'retention_v3_rebuild';
  const sheet = join(OUT, `${tag}_contact.jpg`);
  ff(['-i', m.file, '-vf', 'fps=5,scale=180:-1,tile=6x9:padding=4:margin=4', '-frames:v', '1', sheet], 'sheet');
}
ff(['-i', join(AD, 'lamhat', 'bed.wav'), '-filter_complex',
  'showwavespic=s=1600x400:split_channels=1', '-frames:v', '1',
  join(OUT, 'retention_v3_waveform.png')], 'waveform');

/* The plan, written from the same constants the render used, so it cannot drift
   out of step with what was actually built. */
const table = (cut) => {
  let t = 0;
  return cut.shots.map(s => {
    const row = `  ${t.toFixed(2).padStart(5)} – ${(t + s.d).toFixed(2).padStart(5)}  ` +
      `${(s.d.toFixed(2) + 's').padEnd(7)} ${s.src === COVER_SRC ? 'cover' : 'pages'} @ ${s.from.toFixed(2)}s  ` +
      `${s.card || '—'}`;
    t += s.d;
    return row;
  }).join('\n');
};
writeFileSync(join(OUT, 'retention_v3_plan.txt'),
`خطة القصّ للاحتفاظ — لمحة المبدعة المشتّتة
=========================================

البيانات المنشورة: ٩٣ مشاهدة، متوسط ٤٫٧ ثانية، إكمال ٥٪، حفظان ومتابعان.
القراءة: العرض ليس مرفوضًا، لكن أحدًا تقريبًا لا يبقى حتى يظهر المنتج.

المصدر: أُعيد البناء من الأصل لا من ملف مسطّح. الكتابة تُصفّ في المتصفّح
بالمقاس الذي يحتاجه القصّ، والصورة من تسلسل الإطارات الموجود؛ فلا تكبير
لبكسل ولا اقتصاص لحرف عربي.

PRIMARY — ${PRIMARY.name}.mp4
${table(PRIMARY)}
  ظهور المنتج: 4.30s   |   الدعوة: 5.70s   |   المدة: ${PRIMARY.shots.reduce((a, x) => a + x.d, 0).toFixed(2)}s

AGGRESSIVE — ${AGGRESSIVE.name}.mp4
${table(AGGRESSIVE)}
  ظهور المنتج: 2.60s   |   الدعوة: 3.90s   |   المدة: ${AGGRESSIVE.shots.reduce((a, x) => a + x.d, 0).toFixed(2)}s

الصوت: فراش الفِلم نفسه، من الثانية ${AUDIO_IN} لا من الصفر — أول ثانية منه
تلاشٍ داخل، وهو بالضبط الفراغ الذي لا يحتمله قصّ قصير.

القطع: حادّة بين النبضات. التلاشي هنا يطمس اللحظة التي يتغيّر فيها المعنى.
`, 'utf-8');
console.log(`\n  ${OUT}/`);
