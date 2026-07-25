#!/usr/bin/env python3
"""
NizamOk v4 — calm walkthrough score. No voiceover. NO click of any kind.

Touches are not sounded as impacts at all: a tap is rendered as a brief
*breath* of air that swells and settles (attack 90ms, no transient), the way a
premium product film treats contact. Everything else is low, warm and slow —
brand ambient bed, a very sparse sub pulse, and soft tonal marks.
Output: build/mix_v4.wav
"""
import subprocess, numpy as np, imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
ROOT = "/tmp/claude-0/-home-user-Nizamuk-Business/b89d25c9-67ab-5837-94d1-4b605df46037/scratchpad"
SR = 48000
DUR = 62.4
NTOT = int(DUR * SR)
t = np.arange(NTOT) / SR

S1, S2, S3, S4, S5, S6, S7, SE = 4.80, 12.20, 20.60, 28.60, 35.00, 42.40, 51.20, 58.20

def load(p):
    raw = subprocess.run([FF, '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR),
                          '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()

def lowpass(x, a):
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):
        acc += a * (x[i] - acc); y[i] = acc
    return y

# ---------------- BED ----------------
src = load("/home/user/Nizamuk.Business/site/assets/audio/nizamok-ambient.mp3")
seg = src[int(8 * SR):]
if len(seg) < NTOT:
    xf = int(2.0 * SR); parts = [seg]
    while sum(len(s) for s in parts) < NTOT:
        prev = parts[-1]; nxt = seg.copy()
        prev[-xf:] *= np.linspace(1, 0, xf); nxt[:xf] *= np.linspace(0, 1, xf)
        parts.append(nxt)
    seg = np.concatenate(parts)
bed = seg[:NTOT] * 0.34
bed[:int(2.0 * SR)] *= np.linspace(0, 1, int(2.0 * SR))
g = np.ones(NTOT, dtype=np.float32)
g += 0.18 * np.clip((t - S6) / 2.0, 0, 1) * np.clip((S7 - t) / 1.5, 0, 1)
g += 0.24 * np.clip((t - S7) / 1.8, 0, 1)
g -= 0.34 * np.clip((t - (DUR - 2.6)) / 1.6, 0, 1)
bed *= g

# ---------------- SUB PULSE (very sparse) ----------------
pulse = np.zeros(NTOT, dtype=np.float32)
def thump(at, f=48, dec=0.26, amp=0.062):
    i0 = int(at * SR)
    if not (0 <= i0 < NTOT): return
    tt = np.arange(min(int(0.8 * SR), NTOT - i0)) / SR
    w = np.sin(2 * np.pi * f * tt * np.exp(-tt * 1.3)) * np.exp(-tt / dec) * amp
    w *= np.clip(tt / 0.012, 0, 1)
    pulse[i0:i0 + len(w)] += w.astype(np.float32)

m = S1
while m < S6:  thump(m); m += 60 / 46          # a slow heartbeat, not a beat
m = S6
while m < S7:  thump(m, amp=0.072); m += 60 / 58
m = S7
while m < SE:  thump(m, amp=0.055); m += 60 / 44

# ---------------- TEXTURES (no transients) ----------------
sfx = np.zeros(NTOT, dtype=np.float32)
rng = np.random.default_rng(31)

def place(x, at, amp=1.0):
    i0 = int(at * SR)
    if not (0 <= i0 < NTOT): return
    x = x[:NTOT - i0]
    sfx[i0:i0 + len(x)] += x * amp

def breath(dur=0.85, amp=0.20):
    """A tap, rendered as air — 90ms swell, no click, no edge."""
    n = int(dur * SR); tt = np.arange(n) / SR
    x = lowpass(rng.standard_normal(n).astype(np.float32), 0.035)
    env = np.clip(tt / 0.090, 0, 1) * np.exp(-np.clip(tt - 0.090, 0, None) / 0.24)
    body = np.sin(2 * np.pi * 74 * tt) * env * 0.30
    return ((x * env + body) * amp).astype(np.float32)

def air(dur=0.9, amp=0.15):
    n = int(dur * SR); tt = np.arange(n) / SR
    x = lowpass(rng.standard_normal(n).astype(np.float32), 0.05)
    return (x * (np.sin(np.pi * tt / dur) ** 2) * amp).astype(np.float32)

def tone(f=262, dur=1.6, amp=0.042):
    """Warm, slow-attack tonal mark — never a ping."""
    n = int(dur * SR); tt = np.arange(n) / SR
    a = np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 1.5 * tt + 0.3)
    env = np.clip(tt / 0.12, 0, 1) * np.exp(-np.clip(tt - 0.12, 0, None) / 0.55)
    return (a * env * amp).astype(np.float32)

def swell(dur=2.2, f=44, amp=0.17):
    n = int(dur * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt) * (np.sin(np.pi * tt / dur) ** 1.6) * amp).astype(np.float32)

def resolve(dur=3.0, amp=0.10):
    n = int(dur * SR); tt = np.arange(n) / SR
    a = np.sin(2 * np.pi * 110 * tt) + 0.5 * np.sin(2 * np.pi * 165 * tt + 0.2)
    env = np.clip(tt / 0.15, 0, 1) * np.exp(-np.clip(tt - 0.15, 0, None) / 1.1)
    return (a * env * amp).astype(np.float32)

place(tone(330, 2.0, 0.045), 0.50)              # title settles
place(breath(), 3.85, 0.95)                     # begin
for s in (S1, S2, S3, S4, S5, S6, S7):          # step turns — air only
    place(air(0.95, 0.12), s - 0.25, 1.0)
    place(tone(247, 1.4, 0.026), s + 0.20)
place(breath(), S2 + 5.40, 1.0)                 # choose closest
place(tone(392, 1.5, 0.040), S2 + 5.75)         # gold mark
place(breath(), S3 + 5.60, 0.95)                # add second
place(tone(330, 1.5, 0.036), S3 + 5.95)         # rose mark
place(air(1.0, 0.13), S4 - 1.45)                # auto-advance
place(tone(294, 1.5, 0.034), S4 + 4.10)         # progress
place(breath(), S6 - 2.10, 1.0)                 # enter chapter two
place(swell(), S6 - 1.60, 1.0)
for s in (S6 + 2.30, S6 + 4.60):                # montage turns
    place(air(0.7, 0.10), s - 0.20)
place(tone(220, 2.2, 0.050), S6 + 7.10)         # calculating
place(tone(196, 2.6, 0.058), S7 + 0.30)         # result
place(air(0.9, 0.11), S7 + 4.60)                # to email
place(tone(262, 1.6, 0.038), S7 + 5.70)         # field
place(tone(174, 2.4, 0.050), SE + 0.35)         # end card
place(resolve(), SE + 3.00, 1.0)

# ---------------- MASTER ----------------
mix = bed + pulse + sfx
x = np.tanh(mix * 1.15) * 0.94
x *= min(0.108 / (np.sqrt((x ** 2).mean()) + 1e-9), 2.4)
x = np.clip(x, -0.98, 0.98)

p = subprocess.Popen([FF, '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-',
                      '-c:a', 'pcm_s16le', f'{ROOT}/build/mix_v4.wav'],
                     stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
p.stdin.write(x.astype(np.float32).tobytes()); p.stdin.close(); p.wait()
print("wrote mix_v4.wav", round(len(x) / SR, 2), "s")
