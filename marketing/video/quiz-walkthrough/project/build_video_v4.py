#!/usr/bin/env python3
"""
NizamOk — «جولة داخل اختبار نظامك» v3: explained step-by-step walkthrough.

Per step: counter + kicker, headline, an ivory explanation card, then the real
interaction demonstrated on a full-size phone view with dotted gold pointers
and ivory callout chips. Slow, readable motion. No voiceover.
1080x1920 @ 30fps.

Usage: build_video_v3.py [--no-text] [--out NAME]
"""
import json, os, math, subprocess, sys
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
import imageio_ffmpeg

ROOT = "/tmp/claude-0/-home-user-Nizamuk-Business/b89d25c9-67ab-5837-94d1-4b605df46037/scratchpad"
ST = os.path.join(ROOT, "capture/stills")
OV = os.path.join(ROOT, "overlays/png3")
OUT_W, OUT_H, FPS = 1080, 1920, 30
DUR = 62.4
N = int(round(DUR * FPS))
DSF = 5.0

WITH_TEXT = "--no-text" not in sys.argv
OUTNAME = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else "v4_silent.mp4"

PH_W, PH_H = 950, 1330
PH_X, PH_Y = 65, 330                 # bottom = 1660, clear of the 250px safe band
CSS_W = 432
VIS_CSS = PH_H / (PH_W / CSS_W)
F_CSS = PH_W / CSS_W

def smooth(t):
    """Slow-in / slow-out with a long tail — reads as a hand easing a page."""
    t = clamp(t, 0, 1)
    return t * t * t * (t * (t * 6 - 15) + 10)
def ease_out(t): return 1 - (1 - t) ** 3
def ease_io(t):  return t * t * (3 - 2 * t)
def bez_panel(t): return 1 - (1 - t) ** 2.8
def lerp(a, b, t): return a + (b - a) * t
def clamp(v, a, b): return max(a, min(b, v))
def seg(t, a, b): return clamp((t - a) / (b - a), 0, 1)

class Plate:
    cache = {}
    def __init__(self, name):
        if name not in Plate.cache:
            Plate.cache[name] = Image.open(os.path.join(ST, name + ".png")).convert("RGB")
        self.im = Plate.cache[name]
        self.meta = json.load(open(os.path.join(ST, name + ".json")))
        self.page_h = self.meta["page"]["h"]
    def r(self, k): return self.meta["byId"].get(k)
    def opt(self, pred):
        for o in self.meta["options"]:
            if pred(o): return o["rect"]

P = {n: Plate(n) for n in
     ["S01_intro", "S02_q1_fresh", "S05_q2_fresh", "S05b_q2_closest",
      "S05c_q2_both", "S06_q3_fresh", "S10_actbreak", "S11_q7_fresh",
      "S15_q10_fresh", "S17_q12_fresh", "S18_calc", "S19_reveal", "S20_email"]}

# ---------- backdrop (Higgsfield: calm velvet field, heavily diffused) ----------
BDD = os.path.join(ROOT, "bd_calm")
BD = sorted(os.listdir(BDD))
_bdc = {}
def backdrop(t):
    """Ping-pong the ambient clip at half speed; blur it to pure atmosphere so
    nothing in the field competes with the type or the phone."""
    n = len(BD)
    i = int(t * 15 * 0.5) % (2 * n - 2)
    if i >= n: i = 2 * n - 2 - i
    f = BD[i]
    if f not in _bdc:
        if len(_bdc) > 40: _bdc.clear()
        im = Image.open(os.path.join(BDD, f)).convert("RGB")
        im = im.resize((OUT_W // 3, OUT_H // 3), Image.LANCZOS)
        im = im.filter(ImageFilter.GaussianBlur(9))
        im = im.resize((OUT_W, OUT_H), Image.BILINEAR)
        _bdc[f] = np.asarray(im, dtype=np.float32) * 0.78
    return _bdc[f].copy()

# ---------- phone chrome ----------
_m = Image.new("L", (PH_W, PH_H), 0)
ImageDraw.Draw(_m).rounded_rectangle([0, 0, PH_W - 1, PH_H - 1], radius=44, fill=255)
PH_MASK = np.asarray(_m, dtype=np.float32)[..., None] / 255.0
_b = Image.new("L", (PH_W, PH_H), 0)
ImageDraw.Draw(_b).rounded_rectangle([1, 1, PH_W - 2, PH_H - 2], radius=44, outline=255, width=3)
PH_BORDER = np.asarray(_b, dtype=np.float32)[..., None] / 255.0
GOLD = np.array([201.0, 167.0, 94.0])

_sh = None
def shadow():
    global _sh
    if _sh is None:
        s = Image.new("L", (OUT_W, OUT_H), 0)
        ImageDraw.Draw(s).rounded_rectangle(
            [PH_X - 6, PH_Y + 10, PH_X + PH_W + 6, PH_Y + PH_H + 28], radius=50, fill=145)
        _sh = np.asarray(s.filter(ImageFilter.GaussianBlur(30)), dtype=np.float32)[..., None] / 255.0
    return _sh

def phone(base, plate, scroll, mix=None, anchor="options"):
    """Render the phone screen. When mixing two plates, align them on `anchor`
    so a state change (e.g. the prompt line shortening after the first pick)
    cross-fades in place instead of ghosting."""
    y0 = clamp(scroll, 0, plate.page_h - VIS_CSS) * DSF
    im = plate.im.resize((PH_W, PH_H), Image.LANCZOS, box=(0, y0, 2160, y0 + VIS_CSS * DSF))
    arr = np.asarray(im, dtype=np.float32)
    if mix is not None:
        p2, q = mix
        d = 0.0
        if anchor:
            a1, a2 = plate.r(anchor), p2.r(anchor)
            if a1 and a2: d = a2["y"] - a1["y"]
        y2 = clamp(scroll + d, 0, p2.page_h - VIS_CSS) * DSF
        im2 = p2.im.resize((PH_W, PH_H), Image.LANCZOS, box=(0, y2, 2160, y2 + VIS_CSS * DSF))
        arr = arr * (1 - q) + np.asarray(im2, dtype=np.float32) * q
    base *= (1 - shadow() * 0.55)
    reg = base[PH_Y:PH_Y + PH_H, PH_X:PH_X + PH_W]
    reg[:] = reg * (1 - PH_MASK) + arr * PH_MASK
    reg[:] = reg * (1 - PH_BORDER * 0.5) + GOLD * (PH_BORDER * 0.5)
    return y0 / DSF

def c2c(x, y, scroll):
    return PH_X + x * F_CSS, PH_Y + (y - scroll) * F_CSS

# ---------- annotations ----------
def dotted_arrow(arr, x0, y0, x1, y1, alpha, grow=1.0):
    """Dotted gold pointer with a soft nib at the target."""
    if alpha <= 0: return
    ov = Image.new("RGBA", (OUT_W, OUT_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    mx = (x0 + x1) / 2 + (y1 - y0) * 0.16
    my = (y0 + y1) / 2 - abs(x1 - x0) * 0.08 - 26
    pts = []
    STEPS = 90
    lim = max(2, int(STEPS * clamp(grow, 0, 1)))
    for i in range(lim + 1):
        tt = i / STEPS
        pts.append(((1 - tt) ** 2 * x0 + 2 * (1 - tt) * tt * mx + tt ** 2 * x1,
                    (1 - tt) ** 2 * y0 + 2 * (1 - tt) * tt * my + tt ** 2 * y1))
    for i in range(0, len(pts) - 1, 3):     # dashes: draw 1 of every 3 segments
        a, b = pts[i], pts[i + 1]
        d.line([a, b], fill=(20, 12, 34, int(170 * alpha)), width=8)
        d.line([a, b], fill=(216, 182, 110, int(255 * alpha)), width=4)
    if grow >= 0.98:
        ex, ey = pts[-1]
        d.ellipse([ex - 11, ey - 11, ex + 11, ey + 11],
                  fill=(216, 182, 110, int(255 * alpha)))
        d.ellipse([ex - 19, ey - 19, ex + 19, ey + 19],
                  outline=(216, 182, 110, int(120 * alpha)), width=3)
    o = np.asarray(ov, dtype=np.float32); a_ = o[..., 3:4] / 255.0
    arr *= (1 - a_); arr += o[..., :3] * a_

def ripple(arr, cx, cy, tr):
    """Very soft tap indication, 0.75s."""
    if not (0 <= tr <= 1.05): return
    p = tr / 1.05
    ov = Image.new("RGBA", (OUT_W, OUT_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    r = 16 + 78 * ease_out(p)
    a = int(200 * (1 - p) ** 1.4)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(235, 217, 169, a), width=5)
    r2 = 14 * (1 - p * 0.4)
    d.ellipse([cx - r2, cy - r2, cx + r2, cy + r2], fill=(235, 217, 169, int(a * 0.7)))
    o = np.asarray(ov, dtype=np.float32); al = o[..., 3:4] / 255.0
    arr *= (1 - al); arr += o[..., :3] * al

def ring(arr, x0, y0, x1, y1, alpha, color=(222, 190, 120)):
    if alpha <= 0: return
    ov = Image.new("RGBA", (OUT_W, OUT_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    d.rounded_rectangle([x0 - 9, y0 - 9, x1 + 9, y1 + 9], radius=22,
                        outline=(20, 12, 34, int(170 * alpha)), width=9)
    d.rounded_rectangle([x0 - 9, y0 - 9, x1 + 9, y1 + 9], radius=22,
                        outline=color + (int(255 * alpha),), width=4)
    o = np.asarray(ov, dtype=np.float32); a_ = o[..., 3:4] / 255.0
    arr *= (1 - a_); arr += o[..., :3] * a_

class Ov:
    cache = {}
    def __init__(self, name, scale):
        k = (name, scale)
        if k not in Ov.cache:
            s = Image.open(os.path.join(OV, name + ".png")).convert("RGBA")
            Ov.cache[k] = s.resize((int(s.width * scale), int(s.height * scale)), Image.LANCZOS)
        self.im = Ov.cache[k]

def put(arr, name, y, t, t_in, t_out, scale=0.5, x=None, rise=20, ind=0.34, outd=0.28):
    if t < t_in or t > t_out: return
    im = Ov(name, scale).im
    if t < t_in + ind:
        p = ease_out((t - t_in) / ind); al, dy = p, (1 - p) * rise
    elif t > t_out - outd:
        al, dy = (t_out - t) / outd, 0
    else:
        al, dy = 1.0, 0
    px = (OUT_W - im.width) // 2 if x is None else int(x)
    py = int(y + dy)
    a = np.asarray(im.split()[3], dtype=np.float32)[..., None] / 255 * al
    rgb = np.asarray(im.convert("RGB"), dtype=np.float32)
    y0, y1 = max(0, py), min(OUT_H, py + im.height)
    x0, x1 = max(0, px), min(OUT_W, px + im.width)
    if y1 <= y0 or x1 <= x0: return
    sa = a[y0 - py:y1 - py, x0 - px:x1 - px]
    arr[y0:y1, x0:x1] = arr[y0:y1, x0:x1] * (1 - sa) + rgb[y0 - py:y1 - py, x0 - px:x1 - px] * sa

def chip(arr, name, t, t_in, t_out, y, x=None, scale=0.5):
    put(arr, name, y, t, t_in, t_out, scale, x, rise=14)

# ---------- geometry ----------
def dy(a, b, key="options"):
    """Scroll delta that keeps `key` in the same screen position across plates."""
    ra, rb = P[a].r(key), P[b].r(key)
    return (rb["y"] - ra["y"]) if (ra and rb) else 0.0

def opt_i(name, i): return P[name].meta["options"][i]["rect"]
def idx_of(name, flag):
    for i, o in enumerate(P[name].meta["options"]):
        if o[flag]: return i
    return 0

IDX_C = idx_of("S05b_q2_closest", "closest")
IDX_S = idx_of("S05c_q2_both", "second")

q1q = P["S02_q1_fresh"].r("questionText")
q2q = P["S05_q2_fresh"].r("questionText")
# Step 2 renders S05_q2_fresh as the base (S05b is mixed in, anchored to it),
# so pointers must use the fresh plate's geometry. Step 3's base is S05b.
q2c = opt_i("S05_q2_fresh", IDX_C)
q2s = opt_i("S05b_q2_closest", IDX_S)
startB = P["S01_intro"].r("startBtn")
prog6 = P["S06_q3_fresh"].r("progressLine")
actB = P["S10_actbreak"].r("actContinueBtn")
actH = P["S10_actbreak"].r("actH2")
revK = P["S19_reveal"].r("revealKicker")
revN = P["S19_reveal"].r("revealName")
mailIn = P["S20_email"].r("email")
q12q = P["S17_q12_fresh"].r("questionText")
calcC = P["S18_calc"].r("calcCard")

def ctr(r): return r["x"] + r["w"] / 2, r["y"] + r["h"] / 2

SC_I0, SC_I1 = 0, startB["y"] - 430
SC_Q1 = q1q["y"] - 150
SC_Q2 = q2c["y"] - 310                                   # fresh-plate frame (step 2)
SC_Q3_START = SC_Q2 + dy("S05_q2_fresh", "S05b_q2_closest")   # seamless handoff
SC_Q2B = q2s["y"] - 330                                  # S05b frame (step 3)
SC_Q4_START = SC_Q2B + dy("S05c_q2_both", "S06_q3_fresh")
SC_TOP = 0
SC_ACT = actH["y"] - 320
SC_Q12 = q12q["y"] - 175
SC_CALC = max(0, (calcC["y"] + calcC["h"] / 2) - VIS_CSS / 2)
SC_REV = revK["y"] - 140
SC_MAIL = P["S20_email"].r("emailKicker")["y"] - 130

# step boundaries
S1, S2, S3, S4, S5, S6, S7, SE = 4.80, 12.20, 20.60, 28.60, 35.00, 42.40, 51.20, 58.20

# header/headline/explanation layout
Y_HDR, Y_HL, Y_EX = 54, 150, 352

def head(arr, i, t, a, b):
    """counter+kicker+headline for step i, and the explanation card (first ~3.1s)."""
    put(arr, f"hdr{i}", Y_HDR, t, a + 0.15, b - 0.22, 0.5, x=40, rise=12, ind=0.5, outd=0.4)
    put(arr, f"hl{i}",  Y_HL,  t, a + 0.34, b - 0.22, 0.5, x=40, rise=22, ind=0.55, outd=0.42)
    put(arr, f"ex{i}",  Y_EX,  t, a + 0.70, a + 4.10, 0.5, rise=18, ind=0.55, outd=0.45)

def frame(t):
    arr = backdrop(t)

    # ---------------- INTRO ----------------
    if t < S1:
        sc = lerp(SC_I0, SC_I1, smooth(seg(t, 1.10, 3.70)))
        used = phone(arr, P["S01_intro"], sc)
        if 3.85 <= t <= 4.65:
            cx, cy = c2c(*ctr(startB), used)
            ripple(arr, cx, cy, t - 3.85)
        if WITH_TEXT:
            put(arr, "p_title", 92, t, 0.40, 4.55, 0.5)

    # ---------------- STEP 1 — live the scene ----------------
    elif t < S2:
        q = seg(t, S1, S1 + 0.70)
        if q < 1:
            phone(arr, P["S01_intro"], SC_I1, mix=(P["S02_q1_fresh"], smooth(q)))
            used = SC_Q1
        else:
            used = phone(arr, P["S02_q1_fresh"], SC_Q1 + 30 * smooth(seg(t, S1 + 0.9, S2 - 0.5)))
        if WITH_TEXT:
            head(arr, 1, t, S1, S2)
            if t > S1 + 4.35:
                a = seg(t, S1 + 4.35, S1 + 4.85) * (1 - seg(t, S2 - 0.6, S2 - 0.25))
                tx, ty = c2c(q1q["x"] + q1q["w"] * 0.5, q1q["y"] + 8, used)
                dotted_arrow(arr, 760, 560, tx, ty, a, seg(t, S1 + 4.35, S1 + 5.25))
                chip(arr, "co_scene", t, S1 + 4.70, S2 - 0.25, 428, x=110)

    # ---------------- STEP 2 — choose the closest ----------------
    elif t < S3:
        q = seg(t, S2, S2 + 0.70)
        tap = S2 + 5.40
        mq = seg(t, tap, tap + 0.46)
        if q < 1:
            phone(arr, P["S02_q1_fresh"], SC_Q1 + 34, mix=(P["S05_q2_fresh"], smooth(q)))
            used = SC_Q2
        else:
            used = phone(arr, P["S05_q2_fresh"], SC_Q2,
                         mix=(P["S05b_q2_closest"], mq) if mq > 0 else None)
        cx, cy = c2c(*ctr(q2c), used)
        if tap <= t <= tap + 0.75:
            ripple(arr, cx, cy, t - tap)
        if WITH_TEXT:
            head(arr, 2, t, S2, S3)
            if S2 + 4.45 < t < tap + 0.12:
                a = seg(t, S2 + 4.45, S2 + 4.95) * (1 - seg(t, tap - 0.20, tap + 0.12))
                dotted_arrow(arr, 330, 560, cx - 40, cy - 44, a, seg(t, S2 + 4.45, S2 + 5.35))
                chip(arr, "co_closest", t, S2 + 4.80, tap + 0.06, 428, x=90)
            if t > tap + 0.70:
                a = seg(t, tap + 0.70, tap + 1.10) * (1 - seg(t, S3 - 0.55, S3 - 0.20))
                x0, y0 = c2c(q2c["x"], q2c["y"] - 14, used)
                x1, y1 = c2c(q2c["x"] + q2c["w"], q2c["y"] + q2c["h"], used)
                ring(arr, x0, y0, x1, y1, a * (0.86 + 0.14 * math.sin(t * 2.1)))
                chip(arr, "co_mark", t, tap + 0.95, S3 - 0.20, int(clamp(y1 + 26, 420, 1520)), x=150)

    # ---------------- STEP 3 — the optional second answer ----------------
    elif t < S4:
        sc = lerp(SC_Q3_START, SC_Q2B, smooth(seg(t, S3 + 0.20, S3 + 2.60)))
        tap = S3 + 5.60
        mq = seg(t, tap, tap + 0.46)
        adv = seg(t, S4 - 1.45, S4 - 0.20)
        if adv > 0:
            used = phone(arr, P["S05c_q2_both"], SC_Q2B, mix=(P["S06_q3_fresh"], bez_panel(adv)))
        else:
            used = phone(arr, P["S05b_q2_closest"], sc,
                         mix=(P["S05c_q2_both"], mq) if mq > 0 else None)
        cx, cy = c2c(*ctr(q2s), used)
        if tap <= t <= tap + 0.75 and adv == 0:
            ripple(arr, cx, cy, t - tap)
        if WITH_TEXT:
            head(arr, 3, t, S3, S4)
            if S3 + 4.60 < t < tap + 0.12:
                a = seg(t, S3 + 4.60, S3 + 5.10) * (1 - seg(t, tap - 0.20, tap + 0.12))
                dotted_arrow(arr, 330, 560, cx - 40, cy - 44, a, seg(t, S3 + 4.60, S3 + 5.50))
                chip(arr, "co_second", t, S3 + 4.95, tap + 0.06, 428, x=140)
            if tap + 0.70 < t and adv < 0.4:
                a = seg(t, tap + 0.70, tap + 1.10) * (1 - seg(t, S4 - 1.55, S4 - 1.20))
                chip(arr, "co_auto", t, tap + 0.80, S4 - 1.20, 428, x=120)

    # ---------------- STEP 4 — your progress ----------------
    elif t < S5:
        sc = lerp(SC_Q4_START, SC_TOP, smooth(seg(t, S4 + 0.15, S4 + 2.80)))
        used = phone(arr, P["S06_q3_fresh"], sc)
        if WITH_TEXT:
            head(arr, 4, t, S4, S5)
            if t > S4 + 4.45 and prog6:
                a = seg(t, S4 + 4.45, S4 + 5.00) * (1 - seg(t, S5 - 0.55, S5 - 0.20))
                x0, y0 = c2c(prog6["x"], prog6["y"] - 6, used)
                x1, y1 = c2c(prog6["x"] + prog6["w"], prog6["y"] + prog6["h"] + 24, used)
                ring(arr, x0, y0, x1, y1, a)
                chip(arr, "co_prog", t, S4 + 4.75, S5 - 0.20, int(clamp(y1 + 34, 400, 1520)), x=560)

    # ---------------- STEP 5 — chapter two ----------------
    elif t < S6:
        q = seg(t, S5, S5 + 0.70)
        tap = S6 - 2.10
        if q < 1:
            phone(arr, P["S06_q3_fresh"], SC_TOP, mix=(P["S10_actbreak"], smooth(q)))
            used = SC_ACT
        else:
            used = phone(arr, P["S10_actbreak"], SC_ACT)
        if tap <= t <= tap + 0.75:
            cx, cy = c2c(*ctr(actB), used)
            ripple(arr, cx, cy, t - tap)
        if WITH_TEXT:
            head(arr, 5, t, S5, S6)
            if S5 + 4.35 < t < tap + 0.12:
                a = seg(t, S5 + 4.35, S5 + 4.85) * (1 - seg(t, tap - 0.20, tap + 0.12))
                ex, ey = c2c(*ctr(actB), used)
                dotted_arrow(arr, 740, 560, ex + 40, ey - 46, a, seg(t, S5 + 4.35, S5 + 5.25))
                chip(arr, "co_enter2", t, S5 + 4.70, tap + 0.06, 428, x=120)

    # ---------------- STEP 6 — the picture completes ----------------
    elif t < S7:
        if t < S6 + 2.30:                       # act-2 scene
            q = seg(t, S6, S6 + 0.75)
            if q < 1:
                phone(arr, P["S10_actbreak"], SC_ACT, mix=(P["S11_q7_fresh"], smooth(q)))
            else:
                used = phone(arr, P["S11_q7_fresh"],
                             P["S11_q7_fresh"].r("questionText")["y"] - 175 +
                             16 * smooth(seg(t, S6 + 0.8, S6 + 2.30)))
        elif t < S6 + 4.60:                     # a later scene
            q = seg(t, S6 + 2.30, S6 + 2.85)
            base = P["S15_q10_fresh"]
            sc = base.r("questionText")["y"] - 175 + 16 * smooth(seg(t, S6 + 2.85, S6 + 4.60))
            if q < 1:
                phone(arr, P["S11_q7_fresh"],
                      P["S11_q7_fresh"].r("questionText")["y"] - 157,
                      mix=(base, smooth(q)))
            else:
                phone(arr, base, sc)
        elif t < S6 + 7.00:                     # scene 12 of 12
            q = seg(t, S6 + 4.60, S6 + 5.15)
            sc = SC_Q12 + 14 * smooth(seg(t, S6 + 5.15, S6 + 7.0))
            if q < 1:
                phone(arr, P["S15_q10_fresh"],
                      P["S15_q10_fresh"].r("questionText")["y"] - 157,
                      mix=(P["S17_q12_fresh"], smooth(q)))
                used = SC_Q12
            else:
                used = phone(arr, P["S17_q12_fresh"], sc)
            if WITH_TEXT and t > S6 + 5.30:
                chip(arr, "co_12", t, S6 + 5.30, S6 + 6.85, 428, x=95)
        else:                                    # calculating
            q = seg(t, S6 + 7.00, S6 + 7.60)
            if q < 1:
                phone(arr, P["S17_q12_fresh"], SC_Q12 + 16, mix=(P["S18_calc"], smooth(q)))
            else:
                phone(arr, P["S18_calc"], SC_CALC)
        if WITH_TEXT:
            head(arr, 6, t, S6, S7)

    # ---------------- STEP 7 — your reading & report ----------------
    elif t < SE:
        if t < S7 + 0.75:
            phone(arr, P["S18_calc"], SC_CALC, mix=(P["S19_reveal"], smooth(seg(t, S7, S7 + 0.75))))
            used = SC_REV
        elif t < S7 + 4.60:
            used = phone(arr, P["S19_reveal"], SC_REV + 14 * smooth(seg(t, S7 + 0.9, S7 + 4.3)))
            if WITH_TEXT and t > S7 + 1.80:
                x0, y0 = c2c(revN["x"] + 34, revN["y"], used)
                chip(arr, "co_result", t, S7 + 1.80, S7 + 4.35,
                     int(clamp(y0 + revN["h"] * F_CSS + 40, 420, 1520)), x=250)
        else:
            q = seg(t, S7 + 4.60, S7 + 5.30)
            if q < 1:
                phone(arr, P["S19_reveal"], SC_REV + 14, mix=(P["S20_email"], smooth(q)))
                used = SC_MAIL
            else:
                used = phone(arr, P["S20_email"], SC_MAIL)
            if WITH_TEXT and t > S7 + 5.55:
                a = seg(t, S7 + 5.55, S7 + 6.05) * (1 - seg(t, SE - 0.55, SE - 0.20))
                cx, cy = c2c(*ctr(mailIn), used)
                dotted_arrow(arr, 720, 560, cx + 60, cy - 44, a, seg(t, S7 + 5.55, S7 + 6.45))
                x0, y0 = c2c(mailIn["x"], mailIn["y"], used)
                x1, y1 = c2c(mailIn["x"] + mailIn["w"], mailIn["y"] + mailIn["h"], used)
                ring(arr, x0, y0, x1, y1, a, color=(227, 168, 172))
                chip(arr, "co_email", t, S7 + 5.90, SE - 0.20, 428, x=250)
        if WITH_TEXT:
            head(arr, 7, t, S7, SE)

    # ---------------- END CARD ----------------
    else:
        arr *= 0.9
        if WITH_TEXT:
            put(arr, "p_endline", 460, t, SE + 0.35, DUR, 0.5, ind=0.55)
            put(arr, "p_cta", 1090, t, SE + 1.45, DUR, 0.5, ind=0.5)
            put(arr, "p_bio", 1310, t, SE + 2.20, DUR, 0.5, ind=0.45)
            if t >= SE + 3.10:
                a = min((t - (SE + 3.10)) / 0.45, 1) * 0.95
                wm = WORDMARK
                px, py = (OUT_W - wm.width) // 2, 1500
                aa = np.asarray(wm.split()[3], dtype=np.float32)[..., None] / 255 * a
                rgb = np.asarray(wm.convert("RGB"), dtype=np.float32)
                arr[py:py + wm.height, px:px + wm.width] = \
                    arr[py:py + wm.height, px:px + wm.width] * (1 - aa) + rgb * aa
    return arr

WORD = Image.open("/home/user/Nizamuk.Business/site/assets/img/wordmark.png").convert("RGBA")
WORDMARK = WORD.resize((380, int(WORD.height * 380 / WORD.width)), Image.LANCZOS)

_vig = None
def grade(arr):
    global _vig
    if _vig is None:
        yy, xx = np.mgrid[0:OUT_H, 0:OUT_W]
        d = np.sqrt(((xx - OUT_W / 2) / (OUT_W * 0.74)) ** 2 +
                    ((yy - OUT_H / 2) / (OUT_H * 0.64)) ** 2)
        _vig = (1 - 0.26 * np.clip(d - 0.55, 0, 1) ** 1.6)[..., None]
    a = arr / 255.0
    a = np.clip(a * 1.03 - 0.008, 0, 1)
    return a * _vig * 255.0

def main():
    FF = imageio_ffmpeg.get_ffmpeg_exe()
    os.makedirs(os.path.join(ROOT, "build"), exist_ok=True)
    out = os.path.join(ROOT, "build", OUTNAME)
    proc = subprocess.Popen(
        [FF, "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{OUT_W}x{OUT_H}",
         "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "17",
         "-pix_fmt", "yuv420p", "-movflags", "+faststart", out],
        stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for i in range(N):
        t = i / FPS
        arr = grade(frame(t))
        if t > DUR - 0.4: arr *= max(0.8, 1 - (t - (DUR - 0.4)) * 0.5)
        proc.stdin.write(np.clip(arr, 0, 255).astype(np.uint8).tobytes())
        if i % 150 == 0: print(f"  frame {i}/{N}", flush=True)
    proc.stdin.close(); proc.wait()
    print("wrote", out)

if __name__ == "__main__":
    main()
