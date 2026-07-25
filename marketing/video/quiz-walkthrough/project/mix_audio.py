#!/usr/bin/env python3
"""
NizamOk «داخل الاختبار» — sound design & mix.

Layers:
  VO     — 7 ElevenLabs/Vesper lines, edge-trimmed, internal pauses tightened,
           auto-fitted to slots (atempo cap 1.07 per the brand audio doctrine).
  BED    — the brand's own ambient master (site/assets/audio/nizamok-ambient.mp3),
           ducked under VO.
  PULSE  — synthesized soft low pulse; rate/level follows the beat structure.
  SFX    — synthesized tactile accents (impact, selection ticks, whoosh, drop,
           bloom, resolve) — no stock, no trailer booms.
Outputs: build/mix_full.wav (VO+bed+pulse+sfx), build/mix_novo.wav (no VO).
"""
import subprocess, numpy as np, imageio_ffmpeg, os

FF = imageio_ffmpeg.get_ffmpeg_exe()
ROOT = "/tmp/claude-0/-home-user-Nizamuk-Business/b89d25c9-67ab-5837-94d1-4b605df46037/scratchpad"
SR = 48000
DUR = 22.0
NTOT = int(DUR * SR)

def load(path, rate=1.0):
    af = f"atempo={rate}" if rate != 1.0 else "anull"
    raw = subprocess.run([FF, '-v', 'error', '-i', path, '-af', af,
                          '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()

def edge_trim(x, thr_db=-45, pad=0.06):
    win = int(0.02 * SR)
    ma = np.convolve(np.abs(x), np.ones(win) / win, 'same')
    idx = np.where(ma > 10 ** (thr_db / 20))[0]
    if len(idx) == 0: return x
    a = max(0, idx[0] - int(pad * SR))
    b = min(len(x), idx[-1] + int(pad * SR))
    return x[a:b]

def tighten_pauses(x, thr_db=-45, max_sil=0.30, keep=0.22):
    win = int(0.02 * SR)
    ma = np.convolve(np.abs(x), np.ones(win) / win, 'same')
    sil = ma < 10 ** (thr_db / 20)
    out, i = [], 0
    while i < len(x):
        j = i
        while j < len(x) and sil[j]: j += 1
        if j - i > max_sil * SR:
            out.append(x[i:i + int(keep * SR)])
        else:
            out.append(x[i:j])
        i = j
        j = i
        while j < len(x) and not sil[j]: j += 1
        out.append(x[i:j]); i = j
    return np.concatenate([o for o in out if len(o)])

# ---------------- VO assembly ----------------
SLOTS = [  # (file, start, must_end_by)
    ("vo1",  0.10,  2.60),
    ("vo2c", 2.45,  5.55),
    ("vo3c", 5.55,  8.45),
    ("vo4c", 8.60, 11.95),
    ("vo5c", 12.05, 14.85),
    ("vo6",  14.80, 18.20),
    ("vo7c", 18.30, 21.80),
]
vo_track = np.zeros(NTOT, dtype=np.float32)
vo_env = np.zeros(NTOT, dtype=np.float32)      # for ducking
report = []
for name, start, end_by in SLOTS:
    x = edge_trim(load(f"{ROOT}/audio/vo/{name}.mp3"))
    x = tighten_pauses(x)
    avail = end_by - start
    dur = len(x) / SR
    rate = 1.0
    if dur > avail:
        rate = min(dur / avail, 1.07)
        x = edge_trim(load(f"{ROOT}/audio/vo/{name}.mp3", rate=round(rate, 4)))
        x = tighten_pauses(x)
        dur = len(x) / SR
    # fades
    f = int(0.015 * SR)
    x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
    x = x / (np.abs(x).max() + 1e-9) * 0.70
    i0 = int(start * SR)
    i1 = min(i0 + len(x), NTOT)
    vo_track[i0:i1] += x[:i1 - i0]
    vo_env[i0:i1] = np.maximum(vo_env[i0:i1], 1.0)
    report.append((name, start, round(start + dur, 2), round(rate, 3),
                   "OVER" if start + dur > end_by + 0.05 else "ok"))
for r in report: print("VO", r)

# smooth duck envelope (attack 0.12s, release 0.4s)
k_a, k_r = int(0.12 * SR), int(0.40 * SR)
env = np.convolve(vo_env, np.ones(k_a) / k_a, 'same')
env = np.maximum.reduce([np.roll(env, s) for s in range(0, k_r, k_r // 8)])
duck = 1.0 - 0.55 * np.clip(env, 0, 1)

# ---------------- BED (real brand ambient) ----------------
bed_src = load("/home/user/Nizamuk.Business/site/assets/audio/nizamok-ambient.mp3")
seg = bed_src[int(18 * SR): int(18 * SR) + NTOT]
if len(seg) < NTOT: seg = np.pad(seg, (0, NTOT - len(seg)))
bed = seg * 0.16
bed[:int(1.0 * SR)] *= np.linspace(0, 1, int(1.0 * SR))
# open the bed slightly at completion beat (13.7+) for the "reward" feel
gain = np.ones(NTOT, dtype=np.float32)
t = np.arange(NTOT) / SR
gain += 0.35 * np.clip((t - 13.7) / 1.2, 0, 1)          # opens
gain -= 0.25 * np.clip((t - 21.1) / 0.9, 0, 1)          # resolves down
bed *= gain * duck

# ---------------- PULSE ----------------
pulse = np.zeros(NTOT, dtype=np.float32)
def thump(at, freq=57, decay=0.16, amp=0.16):
    n = int(0.5 * SR)
    i0 = int(at * SR)
    if i0 >= NTOT: return
    tt = np.arange(min(n, NTOT - i0)) / SR
    w = np.sin(2 * np.pi * freq * tt * np.exp(-tt * 1.6)) * np.exp(-tt / decay) * amp
    pulse[i0:i0 + len(w)] += w.astype(np.float32)

tmark = 1.30
while tmark < 6.90:  thump(tmark, amp=0.11); tmark += 60 / 88
tmark = 10.60
while tmark < 13.70: thump(tmark, amp=0.15); tmark += 60 / 104
tmark = 13.70
while tmark < 16.9:  thump(tmark, amp=0.09); tmark += 60 / 52
pulse *= duck * 0.9

# ---------------- SFX ----------------
sfx = np.zeros(NTOT, dtype=np.float32)
rng = np.random.default_rng(7)

def place(x, at, amp=1.0):
    i0 = int(at * SR)
    if i0 >= NTOT: return
    x = x[:NTOT - i0]
    sfx[i0:i0 + len(x)] += x * amp

def lowpass(x, alpha):
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):
        acc += alpha * (x[i] - acc); y[i] = acc
    return y

def impact():
    n = int(0.5 * SR); tt = np.arange(n) / SR
    body = np.sin(2 * np.pi * 95 * tt * np.exp(-tt * 2.2)) * np.exp(-tt / 0.10)
    tick = lowpass(rng.standard_normal(n).astype(np.float32), 0.35) * np.exp(-tt / 0.012)
    return (body * 0.9 + tick * 0.35).astype(np.float32)

def tick(bright=0.5):
    n = int(0.12 * SR); tt = np.arange(n) / SR
    x = lowpass(rng.standard_normal(n).astype(np.float32), bright) * np.exp(-tt / 0.018)
    return (x * 0.8).astype(np.float32)

def whoosh(dur=0.42):
    n = int(dur * SR); tt = np.arange(n) / SR
    x = rng.standard_normal(n).astype(np.float32)
    x = lowpass(x, 0.15)
    envl = np.sin(np.pi * tt / dur) ** 2
    return (x * envl * 0.8).astype(np.float32)

def subswell(dur=1.1, f=46):
    n = int(dur * SR); tt = np.arange(n) / SR
    envl = np.sin(np.pi * tt / dur) ** 1.5
    return (np.sin(2 * np.pi * f * tt) * envl * 0.30).astype(np.float32)

def bloom():
    n = int(1.4 * SR); tt = np.arange(n) / SR
    a = np.sin(2 * np.pi * 220 * tt) + 0.6 * np.sin(2 * np.pi * 330 * tt + 0.4)
    envl = np.exp(-tt / 0.55) * np.clip(tt / 0.03, 0, 1)
    return (a * envl * 0.10).astype(np.float32)

def resolve():
    n = int(2.2 * SR); tt = np.arange(n) / SR
    a = np.sin(2 * np.pi * 110 * tt) + 0.5 * np.sin(2 * np.pi * 165 * tt + 0.2)
    envl = np.exp(-tt / 0.9) * np.clip(tt / 0.05, 0, 1)
    return (a * envl * 0.12).astype(np.float32)

place(impact(), 0.03, 1.0)                 # tactile opening
place(tick(0.45), 4.95, 0.8)               # «الأقرب إليّ» appears
place(tick(0.30), 5.95, 0.6)               # «تشبهني أيضًا» appears (softer)
place(whoosh(0.38), 6.82, 0.7)             # into the act break
place(subswell(1.2), 7.00, 1.0)            # emotional drop
place(whoosh(0.5), 9.30, 0.5)              # portal wipe
place(bloom(), 9.55, 0.9)
place(tick(0.5), 11.75, 0.5)               # progression joins
place(tick(0.5), 12.80, 0.5)
place(bloom(), 13.75, 0.7)                 # calc reward opens
place(bloom(), 14.90, 0.8)                 # reveal
place(resolve(), 21.15, 1.0)               # final resolution
sfx *= 0.9

# ---------------- MASTER ----------------
def master(mix):
    x = np.tanh(mix * 1.15) * 0.94
    rms = np.sqrt((x ** 2).mean())
    x = x * min(0.115 / (rms + 1e-9), 2.2)
    return np.clip(x, -0.98, 0.98)

full = master(vo_track + bed + pulse + sfx)
novo = master(bed * 1.12 + pulse + sfx)

for name, data in [("mix_full", full), ("mix_novo", novo)]:
    p = subprocess.Popen([FF, '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1',
                          '-i', '-', '-c:a', 'pcm_s16le',
                          f'{ROOT}/build/{name}.wav'],
                         stdin=subprocess.PIPE, stdout=subprocess.DEVNULL,
                         stderr=subprocess.DEVNULL)
    p.stdin.write(data.astype(np.float32).tobytes()); p.stdin.close(); p.wait()
    print("wrote", name + ".wav")
