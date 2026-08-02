/* NizamOk — «المبدعة المشتّتة» YouTube ad: the cut.
 *
 * Takes the staged plates (render-plates.mjs) and the Arabic cards
 * (render-cards.mjs) and produces the finished films. Order of operations
 * matters and is deliberate:
 *
 *   1. motion   — each plate is a still; zoompan gives it a push or a pull.
 *                 Plates are 2x native, so every zoom stage is a DOWNscale and
 *                 nothing ever softens.
 *   2. cut      — xfade. Fades between the cover beats, a soft directional
 *                 wipe between the interior pages, because that is the way a
 *                 page moves in a book bound on the right.
 *   3. type     — the Arabic is composited LAST, over the finished motion, so
 *                 it never inherits a zoom and is never resampled. This is the
 *                 whole reason the type is a separate layer.
 *
 * Audio is synthesised here from noise and a single low sine — room tone,
 * paper accents on the cuts, one soft landing under the end card. No music, no
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
  { plate: 'cover', card: 'shot1',  d: 4.0, motion: ['in',  1.00, 1.07], trans: 'fade'        },
  { plate: 'tilt',  card: 'shot2',  d: 3.2, motion: ['out', 1.09, 1.00], trans: 'fade'        },
  { plate: 'named', card: 'shot3',  d: 3.8, motion: ['in',  1.00, 1.06], trans: 'smoothright' },
  { plate: 'page1', card: 'shot4a', d: 3.2, motion: ['in',  1.00, 1.05], trans: 'smoothright' },
  { plate: 'page2', card: 'shot4b', d: 3.2, motion: ['out', 1.06, 1.00], trans: 'smoothright' },
  { plate: 'page3', card: 'shot4c', d: 3.2, motion: ['in',  1.00, 1.05], trans: 'smoothright' },
  { plate: 'fan',   card: 'shot5',  d: 4.0, motion: ['in',  1.00, 1.06], trans: 'fade'        },
  /* The end card does not move. It carries the price and the call to action,
     and a moving CTA is a CTA that is harder to read and harder to tap. */
  { plate: null,    card: null,     d: 4.4, motion: null,                trans: null          }
];

const TOTAL = SHOTS.reduce((s, x) => s + x.d, 0);
if (Math.abs(TOTAL - 29) > 1e-9) throw new Error(`shots sum to ${TOTAL}s, not 29`);

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
 * 1. Sound design. Synthesised, so there is nothing to licence.
 * ------------------------------------------------------------------ */
const PAPER = join(TMP, 'paper.wav');
const THUMP = join(TMP, 'thump.wav');
const BED = join(TMP, 'bed.wav');

/* A sheet moving: a band of noise around 2.5 kHz with a fast attack and a
   short exponential tail. Two of them, slightly apart, so it reads as a leaf
   rather than a click. */
ff(['-f', 'lavfi', '-i', 'anoisesrc=color=white:amplitude=0.6:duration=0.42:sample_rate=48000:seed=7',
  '-af', ['bandpass=f=2500:width_type=o:w=2.2',
    'afade=t=in:st=0:d=0.012',
    'afade=t=out:st=0.045:d=0.36:curve=exp',
    'aecho=0.7:0.5:38:0.35',
    'volume=0.85'].join(','),
  '-ac', '1', '-ar', '48000', PAPER], 'paper');

/* The landing under the end card: one low sine, gone in half a second. */
ff(['-f', 'lavfi', '-i', 'sine=frequency=58:duration=0.9:sample_rate=48000',
  '-af', 'afade=t=in:st=0:d=0.008,afade=t=out:st=0.03:d=0.85:curve=exp,volume=0.5',
  '-ac', '1', '-ar', '48000', THUMP], 'thump');

/* Cut points, in the finished timeline. The paper lands ON the cut. */
const cuts = [];
for (let i = 0, t = 0; i < SHOTS.length - 1; i++) { t += SHOTS[i].d; cuts.push(t); }

{
  const hits = cuts.map((t, i) =>
    `[p${i}]adelay=${Math.round(t * 1000)}|${Math.round(t * 1000)},volume=${(0.62 - i * 0.02).toFixed(2)}[h${i}]`);
  const filter = [
    /* Room tone: brown noise with everything above 210 Hz taken off it. Air,
       not a drone — it should be felt and never noticed. */
    `[0:a]lowpass=f=210,volume=0.22,afade=t=in:st=0:d=1.2,afade=t=out:st=27.6:d=1.4[tone]`,
    `[1:a]asplit=${cuts.length}${cuts.map((_, i) => `[p${i}]`).join('')}`,
    ...hits,
    `[2:a]adelay=${Math.round(cuts[cuts.length - 1] * 1000)}|${Math.round(cuts[cuts.length - 1] * 1000)}[land]`,
    `[tone]${cuts.map((_, i) => `[h${i}]`).join('')}[land]amix=inputs=${cuts.length + 2}:normalize=0:duration=longest[mix]`,
    /* Nothing here speaks, so the bed sits well under a dialogue target. */
    `[mix]loudnorm=I=-19:TP=-2.0:LRA=9,atrim=0:29,asetpts=N/SR/TB[a]`
  ].join(';');
  ff(['-f', 'lavfi', '-i', 'anoisesrc=color=brown:amplitude=0.9:duration=29:sample_rate=48000:seed=3',
    '-i', PAPER, '-i', THUMP,
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
    const src = s.plate ? join(AD, 'plates', `${s.plate}-${k}.png`) : join(AD, `endcard-${k}.png`);
    if (!existsSync(src)) throw new Error(`missing plate: ${src}`);

    const clip = s.trans ? s.d + XF : s.d;           // the outgoing overlap
    const frames = Math.round(clip * FPS);

    if (!s.motion) {
      /* Still: held by the demuxer, so the frame is never touched by a
         geometry filter and the CTA stays as crisp as it was rendered. */
      inputs.push('-loop', '1', '-t', String(clip), '-i', src);
      chains.push(`[${i}:v]fps=${FPS},format=yuv420p,setsar=1[v${i}]`);
      return;
    }
    inputs.push('-i', src);
    const [dir, z0, z1] = s.motion;
    const step = (Math.abs(z1 - z0) / (frames - 1)).toFixed(7);
    const z = dir === 'in'
      ? `min(zoom+${step},${z1})`
      : `if(eq(on,0),${z0},max(zoom-${step},${z1}))`;
    chains.push(
      `[${i}:v]zoompan=z='${z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':` +
      `d=${frames}:s=${f.w}x${f.h}:fps=${FPS},format=yuv420p,setsar=1[v${i}]`
    );
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
  const TEXT = [];
  SHOTS.forEach((s, i) => {
    if (!s.card) return;
    const start = SHOTS.slice(0, i).reduce((a, x) => a + x.d, 0) + 0.5;
    const dur = s.d - 0.5;                            // clears the incoming cut
    TEXT.push({ card: `${s.card}-${k}`, start, dur });
  });

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
