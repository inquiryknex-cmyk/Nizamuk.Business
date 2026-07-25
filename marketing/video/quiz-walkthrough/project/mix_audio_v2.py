#!/usr/bin/env python3
"""
NizamOk «جولة داخل الاختبار» v2 — music & interface sound design (no voiceover).

BED   — brand ambient master (site/assets/audio/nizamok-ambient.mp3).
PULSE — soft low pulse, calm walkthrough tempo, lifts during the montage.
SFX   — tactile UI accents synced to the demo actions: taps, mark appears,
        auto-advance, chapter door, result bloom, final resolve.
Output: build/mix_v2.wav
"""
import subprocess, numpy as np, imageio_ffmpeg, os

FF = imageio_ffmpeg.get_ffmpeg_exe()
ROOT = "/tmp/claude-0/-home-user-Nizamuk-Business/b89d25c9-67ab-5837-94d1-4b605df46037/scratchpad"
SR = 48000
DUR = 34.6
NTOT = int(DUR * SR)
t = np.arange(NTOT) / SR

def load(path):
    raw = subprocess.run([FF, '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR),
                          '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()

# ---------------- BED ----------------
src = load("/home/user/Nizamuk.Business/site/assets/audio/nizamok-ambient.mp3")
seg = src[int(12 * SR): int(12 * SR) + NTOT]
if len(seg) < NTOT: seg = np.pad(seg, (0, NTOT - len(seg)))
bed = seg * 0.30
bed[:int(1.2 * SR)] *= np.linspace(0, 1, int(1.2 * SR))
g = np.ones(NTOT, dtype=np.float32)
g += 0.30 * np.clip((t - 22.0) / 1.0, 0, 1) * np.clip((25.6 - t) / 0.8, 0, 1)  # montage lift
g += 0.25 * np.clip((t - 25.6) / 1.0, 0, 1)                                    # result opens
g -= 0.35 * np.clip((t - 33.6) / 0.9, 0, 1)                                    # resolve
bed *= g

# ---------------- PULSE ----------------
pulse = np.zeros(NTOT, dtype=np.float32)
def thump(at, freq=55, decay=0.17, amp=0.13):
    i0 = int(at * SR)
    if i0 >= NTOT or i0 < 0: return
    tt = np.arange(min(int(0.5 * SR), NTOT - i0)) / SR
    w = np.sin(2 * np.pi * freq * tt * np.exp(-tt * 1.6)) * np.exp(-tt / decay) * amp
    pulse[i0:i0 + len(w)] += w.astype(np.float32)

m = 3.4
while m < 22.0: thump(m, amp=0.10); m += 60 / 76      # calm walkthrough
m = 22.0
while m < 25.5: thump(m, amp=0.15); m += 60 / 112     # montage accelerates
m = 25.6
while m < 31.6: thump(m, amp=0.09); m += 60 / 58      # reward, half-time

# ---------------- SFX ----------------
sfx = np.zeros(NTOT, dtype=np.float32)
rng = np.random.default_rng(11)

def place(x, at, amp=1.0):
    i0 = int(at * SR)
    if i0 >= NTOT or i0 < 0: return
    x = x[:NTOT - i0]
    sfx[i0:i0 + len(x)] += x * amp

def lowpass(x, a):
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):
        acc += a * (x[i] - acc); y[i] = acc
    return y

def tap():
    n = int(0.18 * SR); tt = np.arange(n) / SR
    click = lowpass(rng.standard_normal(n).astype(np.float32), 0.42) * np.exp(-tt / 0.014)
    body = np.sin(2 * np.pi * 140 * tt) * np.exp(-tt / 0.05) * 0.35
    return ((click * 0.9 + body) * 0.75).astype(np.float32)

def chime(f=520, dur=0.9, amp=0.10):
    n = int(dur * SR); tt = np.arange(n) / SR
    a = np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * f * 1.5 * tt + 0.3)
    return (a * np.exp(-tt / 0.30) * np.clip(tt / 0.008, 0, 1) * amp).astype(np.float32)

def swipe(dur=0.34):
    n = int(dur * SR); tt = np.arange(n) / SR
    x = lowpass(rng.standard_normal(n).astype(np.float32), 0.16)
    return (x * (np.sin(np.pi * tt / dur) ** 2) * 0.55).astype(np.float32)

def door(dur=1.3, f=48):
    n = int(dur * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt) * (np.sin(np.pi * tt / dur) ** 1.5) * 0.26).astype(np.float32)

def bloom(dur=1.6, amp=0.11):
    n = int(dur * SR); tt = np.arange(n) / SR
    a = np.sin(2 * np.pi * 220 * tt) + 0.6 * np.sin(2 * np.pi * 330 * tt + 0.4)
    return (a * np.exp(-tt / 0.6) * np.clip(tt / 0.03, 0, 1) * amp).astype(np.float32)

def resolve(dur=2.4, amp=0.13):
    n = int(dur * SR); tt = np.arange(n) / SR
    a = np.sin(2 * np.pi * 110 * tt) + 0.5 * np.sin(2 * np.pi * 165 * tt + 0.2)
    return (a * np.exp(-tt / 0.95) * np.clip(tt / 0.05, 0, 1) * amp).astype(np.float32)

place(chime(660, 1.0, 0.09), 0.25)    # title in
place(tap(), 2.55, 0.95)              # tap «ابدئي الفصل الأول»
place(swipe(), 3.30, 0.6)             # -> scene 1
place(swipe(0.3), 6.60, 0.55)         # -> scene 2
place(tap(), 8.00, 1.0)               # tap closest answer
place(chime(700, 0.7, 0.085), 8.30)   # gold mark appears
place(tap(), 12.60, 0.9)              # tap second answer
place(chime(560, 0.7, 0.075), 12.88)  # rose mark appears
place(swipe(0.32), 14.92, 0.65)       # auto-advance
place(swipe(0.3), 15.85, 0.5)         # scroll to progress line
place(chime(620, 0.8, 0.07), 16.55)   # progress highlight
place(swipe(0.34), 18.62, 0.6)        # -> chapter break
place(tap(), 21.15, 0.95)             # tap «ادخلي الفصل الثاني»
place(door(), 21.55, 1.0)             # chapter door opens
for i, at in enumerate((22.85, 23.70, 24.55)):
    place(swipe(0.22), at - 0.1, 0.45)
place(bloom(), 25.55, 0.8)            # calculating opens
place(bloom(), 26.55, 0.95)           # result lands
place(swipe(0.3), 28.62, 0.55)        # -> email step
place(chime(600, 0.8, 0.08), 29.35)   # field highlight
place(bloom(1.3, 0.09), 31.75)        # end card in
place(resolve(), 33.30, 1.0)

# ---------------- MASTER ----------------
mix = bed + pulse + sfx
x = np.tanh(mix * 1.2) * 0.94
x *= min(0.115 / (np.sqrt((x ** 2).mean()) + 1e-9), 2.4)
x = np.clip(x, -0.98, 0.98)

p = subprocess.Popen([FF, '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-',
                      '-c:a', 'pcm_s16le', f'{ROOT}/build/mix_v2.wav'],
                     stdin=subprocess.PIPE, stdout=subprocess.DEVNULL,
                     stderr=subprocess.DEVNULL)
p.stdin.write(x.astype(np.float32).tobytes()); p.stdin.close(); p.wait()
print("wrote mix_v2.wav", round(len(x) / SR, 2), "s")
