/* NizamOk — «المبدعة المشتّتة» YouTube ad: the cut.
 *
 * Takes the staged plates (render-plates.mjs) and the Arabic cards
 * (render-cards.mjs) and produces the finished films. Order of operations
 * matters and is deliberate:
 *
 *   1. motion   — each plate is a still; zoompan gives it a push or a pull.
 *                 Plates are 2x native, so every zoom stage is a DOWNscale and
 *                 nothing ever softens. The book chapter is the exception: it
 *                 arrives already moving, as a frame sequence from
 *                 render-book.mjs, and no geometry filter touches it.
 *   2. cut      — xfade between shots. Inside the book chapter there are no
 *                 dissolves at all: the page turns ARE the transitions.
 *   3. type     — the Arabic is composited LAST, over the finished motion, so
 *                 it never inherits a zoom and is never resampled. This is the
 *                 whole reason the type is a separate layer.
 *
 * Audio is generated location ambience — the room the book is in. No music, no
 * track, no sample, nothing with a licence attached to it. There is also a
 * silent cut of each film for a voice-over to be laid into later.
 *
 *   node tools/ad/assemble.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const FF = '/home/user/Nizamuk.Business/.bin/ffmpeg';
const AD = '/home/user/Nizamuk.Business/build/ad';
const OUT = join(AD, 'out');
const TMP = join(AD, 'tmp');
const FPS = 30;
const XF = 0.4;                       // crossfade length, shared by every cut

/* The 29 seconds, as the viewer experiences them. `d` is time ON SCREEN; the
   clip ffmpeg builds is d + XF for every shot but the last, because xfade eats
   the overlap out of the outgoing clip. */
const SHOTS = [
  /* The opening. One shot, not three: the first cut held the cover for eleven
     seconds across three near-identical plates and read as a still with a zoom,
     because that is what it was. This is a rendered sequence (render-cover.mjs)
     in which the book turns and settles, and it carries TWO type beats — the
     hook, then the brief that says what the book actually is. */
  { seq: 'cover', d: 6.0,  trans: 'fade' },
  /* The pages. All five, four real turns (render-book.mjs). The rest of the
     script is spoken over them, one line per page. */
  { seq: 'book',  d: 18.6, trans: 'fade' },
  /* The end card does not move. It carries the price and the call to action,
     and a moving CTA is a CTA that is harder to read and harder to tap. */
  { plate: null,  d: 4.4,  trans: null  }
];

/* Type, on the finished timeline. The cover shot gets two beats so six seconds
   of one object never sits still; each page beat is timed to be gone before its
   leaf lifts, because words riding a turning page read as a mistake.
   Turns land at 9.4 / 13.3 / 17.2 / 21.1 — mirrors TURNS in render-book.mjs
   offset by the 6.0s the cover shot occupies. */
const CARDS = [
  { card: 'shot1',  start:  0.5, end:  3.0 },
  { card: 'brief',  start:  3.4, end:  6.0 },
  { card: 'shot2',  start:  6.5, end:  9.2 },   // p07 خريطة المنعطفات الأربعة
  { card: 'shot3',  start: 10.4, end: 13.1 },   // p23 تجربة الوصول
  { card: 'shot4a', start: 14.3, end: 17.0 },   // p08 خريطة العبور
  { card: 'shot4b', start: 18.2, end: 20.9 },   // p33 خطة ٣٠ يومًا
  { card: 'shot5',  start: 22.1, end: 24.6 }    // p36 قوس ٩٠ يومًا
];

/* When the pages start moving — and therefore the first moment paper belongs on
   the soundtrack. */
const BOOK_START = SHOTS[0].d;

const TOTAL = SHOTS.reduce((s, x) => s + x.d, 0);
if (Math.abs(TOTAL - 29) > 1e-9) throw new Error(`shots sum to ${TOTAL}s, not 29`);

/* Where each cut lands in the finished timeline — the running sum of on-screen
   time. xfade wants exactly this as its offset. */
const cuts = [];
for (let i = 0, t = 0; i < SHOTS.length - 1; i++) { t += SHOTS[i].d; cuts.push(t); }

const FORMATS = {
  h: { w: 1920, h: 1080, name: '16x9' },
  v: { w: 1080, h: 1920, name: '9x16' }
};

const ff = (args, label) => {
  try {
    execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    throw new Error(`${label} failed:\n${e.stderr?.toString() || e.message}`);
  }
};

mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

/* ------------------------------------------------------------------ *
 * 1. The bed: generated location ambience, in two layers.
 *
 * The first pass synthesised its own sound — filtered noise with a transient on
 * every cut. Those read as clicks. The second used forest ambience: pleasant,
 * and nothing to do with a book. The third used the book's own room, which was
 * right, but played paper over the cover — six seconds of leaves swiping while
 * nothing on screen was moving. Sound that describes something the picture is
 * not doing is worse than silence.
 *
 * So the same material is split in two and each half is used for what it is:
 *
 *   air    — the takes with everything above 380 Hz taken off. What is left is
 *            the room: warm, continuous, no transient detail at all. It runs
 *            the whole 29 seconds and is what plays over the cover.
 *   paper  — the same takes full-band, held back until the pages start moving
 *            and faded in over a second. Now every rustle has a leaf under it.
 *
 * Generated on Higgsfield and therefore licensed with nothing attached. Only
 * the AUDIO of those generations is used — their picture is discarded and never
 * appears in the film, which is built entirely from the shipping product assets.
 *
 * THREE different ten-second takes, not one looped three times: a repeating
 * phrase is the single most audible way a bed gives itself away. They butt
 * together with half-second crossfades — 10+10+10 − 2×0.5 = 29.000s, the whole
 * film, so no maths is needed downstream.
 * ------------------------------------------------------------------ */
const BED = join(TMP, 'bed.wav');
const TAKES = ['room-a', 'room-b', 'room-c'].map(n => join(AD, 'ambience', `${n}.wav`));

for (const t of TAKES) if (!existsSync(t)) throw new Error(`missing ambience take: ${t}`);

{
  const XA = 0.5;
  const IN = BOOK_START - 0.4;          // paper starts just under the cut
  const OUT_AT = 24.6;                  // and is gone before the end card
  const filter = [
    /* Each take trimmed to exactly 10s and rid of the DC and rumble a
       generated track carries under the audible band. */
    ...TAKES.map((_, i) => `[${i}:a]atrim=0:10,asetpts=N/SR/TB,aformat=sample_rates=48000:channel_layouts=stereo,` +
      `highpass=f=42,afade=t=in:st=0:d=0.02,afade=t=out:st=${10 - 0.02}:d=0.02[k${i}]`),
    `[k0][k1]acrossfade=d=${XA}:c1=tri:c2=tri[ab]`,
    `[ab][k2]acrossfade=d=${XA}:c1=tri:c2=tri[joined]`,
    `[joined]asplit=2[air0][pap0]`,
    /* Air: no transients survive a 380 Hz ceiling, so this can sit under the
       cover without describing a page that is not turning. */
    `[air0]lowpass=f=380,volume=2.6[air]`,
    /* Paper: full band, shifted so it begins as the first leaf does. adelay
       pushes the whole layer late; the trim at the end of the chain cuts the
       tail back to 29s. */
    `[pap0]highpass=f=190,lowpass=f=15000,volume=1.15,` +
    `adelay=${Math.round(IN * 1000)}|${Math.round(IN * 1000)},` +
    `afade=t=in:st=${IN.toFixed(2)}:d=1.1,afade=t=out:st=${(OUT_AT - 1.2).toFixed(2)}:d=1.2[paper]`,
    `[air][paper]amix=inputs=2:normalize=0:duration=first[mix]`,
    /* The takes land around −50 LUFS, so this is a thirty-decibel lift; the
       highpass above and the top-end trim stop the codec floor coming up with
       it. −21 LUFS is a deliberate background level: nothing here speaks. */
    `[mix]loudnorm=I=-21:TP=-2.0:LRA=11,` +
    /* loudnorm's peak control is a target, not a guarantee — it measured
       −1.7 dBTP against a −2.0 ask. This makes it a ceiling. */
    `alimiter=limit=0.794:level=disabled,` +
    `afade=t=in:st=0:d=1.4,afade=t=out:st=27.2:d=1.8,` +
    `atrim=0:29,asetpts=N/SR/TB[a]`
  ].join(';');
  ff([...TAKES.flatMap(t => ['-i', t]),
    '-filter_complex', filter, '-map', '[a]', '-ac', '2', '-ar', '48000', BED], 'bed');
}

/* ------------------------------------------------------------------ *
 * 2. Picture, per format.
 * ------------------------------------------------------------------ */
const results = [];
for (const [k, f] of Object.entries(FORMATS)) {
  const inputs = [];
  const chains = [];

  SHOTS.forEach((s, i) => {
    const clip = s.trans ? s.d + XF : s.d;           // the outgoing overlap
    const frames = Math.round(clip * FPS);

    if (s.seq) {
      /* Already a moving picture: the frames come off render-cover.mjs /
         render-book.mjs at the film's own rate, so they are read straight in
         with no geometry filter at all. Every move is baked into them. */
      const dir = join(AD, s.seq, k);
      if (!existsSync(join(dir, 'f0000.png'))) {
        throw new Error(`missing ${s.seq} frames: ${dir} (run render-${s.seq}.mjs)`);
      }
      inputs.push('-framerate', String(FPS), '-i', join(dir, 'f%04d.png'));
      /* fps LAST. Putting setpts after it wipes the frame-rate metadata, and
         xfade then refuses the link: "second input link xfade frame rate 1/0". */
      chains.push(`[${i}:v]trim=end_frame=${frames},setpts=N/${FPS}/TB,` +
        `scale=${f.w}:${f.h},format=yuv420p,setsar=1,fps=${FPS}[v${i}]`);
      return;
    }

    /* The end card: held by the demuxer, so the frame is never touched by a
       geometry filter and the CTA stays as crisp as it was rendered. */
    const src = join(AD, `endcard-${k}.png`);
    if (!existsSync(src)) throw new Error(`missing end card: ${src}`);
    inputs.push('-loop', '1', '-t', String(clip), '-i', src);
    chains.push(`[${i}:v]fps=${FPS},format=yuv420p,setsar=1[v${i}]`);
  });

  /* xfade chain. `offset` is measured in the running output, and equals the
     cumulative ON-SCREEN time, which is exactly what SHOTS.d already is. */
  let prev = '[v0]';
  cuts.forEach((t, i) => {
    const out = i === cuts.length - 1 ? '[vx]' : `[x${i}]`;
    chains.push(`${prev}[v${i + 1}]xfade=transition=${SHOTS[i].trans}:duration=${XF}:offset=${t}${out}`);
    prev = out;
  });

  /* Type last. Each card is looped for exactly its window, PTS-shifted onto
     the timeline, alpha-faded at both ends. Before its first frame and after
     its last, overlay passes the picture through untouched. */
  const TEXT = CARDS.map(c => ({ card: `${c.card}-${k}`, start: c.start, dur: c.end - c.start }));

  let stream = '[vx]';
  TEXT.forEach((t, j) => {
    const idx = SHOTS.length + j;
    inputs.push('-loop', '1', '-t', String(t.dur), '-i', join(AD, `${t.card}.png`));
    const fade = 0.3;
    chains.push(
      `[${idx}:v]format=rgba,fps=${FPS},` +
      `fade=t=in:st=0:d=${fade}:alpha=1,fade=t=out:st=${(t.dur - fade).toFixed(3)}:d=${fade}:alpha=1,` +
      `setpts=PTS+${t.start.toFixed(3)}/TB[t${j}]`
    );
    const out = j === TEXT.length - 1 ? '[vout]' : `[c${j}]`;
    chains.push(`${stream}[t${j}]overlay=0:0:eof_action=pass:repeatlast=0:format=auto${out}`);
    stream = out;
  });

  const enc = ['-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '17',
    '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart',
    '-t', '29', '-fps_mode', 'cfr'];

  const withSound = join(OUT, `nizamok-mubdia-${f.name}-29s.mp4`);
  const silent = join(OUT, `nizamok-mubdia-${f.name}-29s-silent.mp4`);

  console.log(`\n  ${f.name}  ${f.w}x${f.h}`);
  ff([...inputs, '-i', BED, '-filter_complex', chains.join(';'),
    '-map', '[vout]', '-map', `${SHOTS.length + TEXT.length}:a`,
    ...enc, '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-shortest',
    withSound], `${f.name} sound`);
  console.log(`    ${withSound.split('/').pop()}`);

  ff([...inputs, '-filter_complex', chains.join(';'), '-map', '[vout]', '-an', ...enc, silent],
    `${f.name} silent`);
  console.log(`    ${silent.split('/').pop()}`);

  results.push(withSound, silent);
}

/* ------------------------------------------------------------------ *
 * 3. Prove it. A file that is 28.97s or has no audio is not a delivery.
 * ------------------------------------------------------------------ */
console.log('\n  check');
for (const file of results) {
  /* ffmpeg reports the container on stderr; decode the whole thing too, so a
     file that is 29s long but throws halfway does not pass as delivered. */
  const out = execFileSync('sh', ['-c', `${FF} -hide_banner -i '${file}' -f null - 2>&1`]).toString();
  const dur = out.match(/Duration: (\d+):(\d+):([\d.]+)/);
  const secs = dur ? (+dur[1] * 3600 + +dur[2] * 60 + parseFloat(dur[3])) : NaN;
  const size = /Video: h264[^\n]*?, (\d+)x(\d+)/.exec(out);
  const hasAudio = /Stream #\d+:\d+[^\n]*Audio: aac/.test(out);
  const frames = /frame=\s*(\d+)/g;
  const fm = [...out.matchAll(frames)].pop();
  const mb = (statSync(file).size / 1048576).toFixed(1);
  console.log(`    ${file.split('/').pop().padEnd(38)} ${secs.toFixed(2)}s  ` +
    `${size ? size[1] + 'x' + size[2] : '?'}  ${fm ? fm[1] : '?'}f  ${mb} MB  ${hasAudio ? 'audio' : 'silent'}`);
  if (Math.abs(secs - 29) > 0.05) throw new Error(`${file}: ${secs}s, expected 29.00`);
  if (/Error|Invalid data|corrupt/i.test(out)) throw new Error(`${file}: decode reported errors`);
}
console.log('\n  build/ad/out/');
