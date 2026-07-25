#!/usr/bin/env python3
"""
NizamOk — «جولة داخل الاختبار» v2: step-by-step walkthrough demo.

Presentation: the real quiz (pixel-true dsf5 plates of the recorded session's
twin) shown as a full-width phone screen on a Higgsfield-generated living
velvet backdrop. Directive captions + step chips, gold pointers/arrows,
tap ripples, highlight rings, natural scrolls. No voiceover. 1080x1920@30fps.

Usage: build_video_v2.py [--no-text] [--out NAME]
"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
import imageio_ffmpeg

ROOT = "/tmp/claude-0/-home-user-Nizamuk-Business/b89d25c9-67ab-5837-94d1-4b605df46037/scratchpad"
ST = os.path.join(ROOT, "capture/stills")
OV2 = os.path.join(ROOT, "overlays/png2")
OV1 = os.path.join(ROOT, "overlays/png")
OUT_W, OUT_H, FPS = 1080, 1920, 30
DUR = 34.6
N = int(round(DUR * FPS))
DSF = 5.0
CSS2CANVAS = None  # set after phone geometry

WITH_TEXT = "--no-text" not in sys.argv
OUTNAME = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else "v2_silent.mp4"

# phone-screen geometry
PH_W, PH_H = 950, 1330            # canvas size of phone view
PH_X, PH_Y = 65, 330              # top-left on canvas (bottom 1660 < safe line)
CSS_W = 432                       # css columns shown
VIS_CSS = PH_H / (PH_W / CSS_W)   # css rows visible ≈ 605
F_CSS = PH_W / CSS_W              # canvas px per css px ≈ 2.199

def smooth(t): return t * t * (3 - 2 * t)
def ease_out(t): return 1 - (1 - t) ** 3
def bez_panel(t): return 1 - (1 - t) ** 2.8
def lerp(a, b, t): return a + (b - a) * t
def clamp(v, a, b): return max(a, min(b, v))

class Plate:
    cache = {}
    def __init__(self, name):
        if name not in Plate.cache:
            Plate.cache[name] = Image.open(os.path.join(ST, name + ".png")).convert("RGB")
        self.im = Plate.cache[name]
        self.meta = json.load(open(os.path.join(ST, name + ".json")))
        self.page_h = self.meta["page"]["h"]
    def r(self, key):
        return self.meta["byId"].get(key)
    def opt(self, pred):
        for o in self.meta["options"]:
            if pred(o): return o["rect"]
        return None

P = {n: Plate(n) for n in
     ["S01_intro", "S02_q1_fresh", "S05_q2_fresh", "S05b_q2_closest",
      "S05c_q2_both", "S06_q3_fresh", "S10_actbreak", "S11_q7_fresh",
      "S13_q8_fresh", "S15_q10_fresh", "S16_q11_fresh", "S18_calc",
      "S19_reveal", "S20_email"]}

# ---- backdrop (Higgsfield) ----
BD_FRAMES = sorted(os.listdir(os.path.join(ROOT, "bd_frames"))) if os.path.isdir(os.path.join(ROOT, "bd_frames")) else []
if BD_FRAMES:
    _bd_cache = {}
    def backdrop(t):
        n = len(BD_FRAMES)
        idx = int(t * FPS) % (2 * n - 2) if n > 1 else 0
        if idx >= n: idx = 2 * n - 2 - idx      # ping-pong loop
        f = BD_FRAMES[idx]
        if f not in _bd_cache:
            if len(_bd_cache) > 40: _bd_cache.clear()
            im = Image.open(os.path.join(ROOT, "bd_frames", f)).convert("RGB")
            im = im.resize((OUT_W, OUT_H), Image.LANCZOS)
            im = im.filter(ImageFilter.GaussianBlur(2.5))
            _bd_cache[f] = np.asarray(im, dtype=np.float32) * 0.52
        return _bd_cache[f].copy()
else:
    _bd = Image.open(os.path.join(ROOT, "backdrop.png")).convert("RGB")
    _bd = _bd.resize((OUT_W, OUT_H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(2.5))
    _BD = np.asarray(_bd, dtype=np.float32) * 0.52
    def backdrop(t):
        # slow drift on the still: pan 3% over full duration
        sh = int((t / DUR) * 28)
        return np.roll(_BD, sh, axis=0).copy()

# ---- phone mask / border (precomputed) ----
_mask = Image.new("L", (PH_W, PH_H), 0)
ImageDraw.Draw(_mask).rounded_rectangle([0, 0, PH_W - 1, PH_H - 1], radius=44, fill=255)
PH_MASK = np.asarray(_mask, dtype=np.float32)[..., None] / 255.0
_border = Image.new("L", (PH_W, PH_H), 0)
ImageDraw.Draw(_border).rounded_rectangle([1, 1, PH_W - 2, PH_H - 2], radius=44,
                                          outline=255, width=3)
PH_BORDER = np.asarray(_border, dtype=np.float32)[..., None] / 255.0
GOLD = np.array([201.0, 167.0, 94.0])
IVORY = np.array([248.0, 241.0, 227.0])
ROSE = np.array([227.0, 168.0, 172.0])

_shadow = None
def phone_shadow():
    global _shadow
    if _shadow is None:
        s = Image.new("L", (OUT_W, OUT_H), 0)
        ImageDraw.Draw(s).rounded_rectangle(
            [PH_X - 6, PH_Y + 8, PH_X + PH_W + 6, PH_Y + PH_H + 26], radius=50, fill=140)
        _shadow = np.asarray(s.filter(ImageFilter.GaussianBlur(28)),
                             dtype=np.float32)[..., None] / 255.0
    return _shadow

def phone_view(base, plate, scroll_css, mix=None):
    """Paste the phone screen: plate cropped at scroll (css rows) onto base."""
    y0 = clamp(scroll_css, 0, plate.page_h - VIS_CSS) * DSF
    box = (0, y0, 2160, y0 + VIS_CSS * DSF)
    im = plate.im.resize((PH_W, PH_H), Image.LANCZOS, box=box)
    arr = np.asarray(im, dtype=np.float32)
    if mix is not None:
        plate2, q = mix
        y0b = clamp(scroll_css, 0, plate2.page_h - VIS_CSS) * DSF
        im2 = plate2.im.resize((PH_W, PH_H), Image.LANCZOS,
                               box=(0, y0b, 2160, y0b + VIS_CSS * DSF))
        arr = arr * (1 - q) + np.asarray(im2, dtype=np.float32) * q
    base *= (1 - phone_shadow() * 0.55)
    region = base[PH_Y:PH_Y + PH_H, PH_X:PH_X + PH_W]
    region[:] = region * (1 - PH_MASK) + arr * PH_MASK
    region[:] = region * (1 - PH_BORDER * 0.5) + GOLD * (PH_BORDER * 0.5)
    return y0 / DSF   # actual scroll used (css)

def css_to_canvas(x_css, y_css, scroll_css):
    """Map plate css coords to canvas coords given current scroll."""
    return PH_X + x_css * F_CSS, PH_Y + (y_css - scroll_css) * F_CSS

# ---- annotations ----
def draw_arrow(arr, x0, y0, x1, y1, alpha=1.0):
    """Elegant curved gold arrow from (x0,y0) to (x1,y1)."""
    if alpha <= 0: return
    ov = Image.new("RGBA", (OUT_W, OUT_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    mx = (x0 + x1) / 2 + (y1 - y0) * 0.18
    my = (y0 + y1) / 2 - abs(x1 - x0) * 0.10 - 30
    pts = []
    for i in range(25):
        tt = i / 24
        bx = (1 - tt) ** 2 * x0 + 2 * (1 - tt) * tt * mx + tt ** 2 * x1
        by = (1 - tt) ** 2 * y0 + 2 * (1 - tt) * tt * my + tt ** 2 * y1
        pts.append((bx, by))
    d.line(pts, fill=(20, 12, 34, int(200 * alpha)), width=9, joint="curve")
    d.line(pts, fill=(230, 200, 127, int(255 * alpha)), width=5, joint="curve")
    # arrowhead
    import math
    ang = math.atan2(y1 - my, x1 - mx)
    L = 26
    for off in (2.65, -2.65):
        hx = x1 - L * math.cos(ang + off * 0.35)
        hy = y1 - L * math.sin(ang + off * 0.35)
        d.line([(x1, y1), (hx, hy)], fill=(20, 12, 34, int(200 * alpha)), width=9)
        d.line([(x1, y1), (hx, hy)], fill=(230, 200, 127, int(255 * alpha)), width=5)
    o = np.asarray(ov, dtype=np.float32)
    a = o[..., 3:4] / 255.0
    arr *= (1 - a); arr += o[..., :3] * a

def draw_ripple(arr, cx, cy, t_rel):
    """Expanding tap ripple, 0.55s."""
    if not (0 <= t_rel <= 0.55): return
    p = t_rel / 0.55
    ov = Image.new("RGBA", (OUT_W, OUT_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    r = 14 + 66 * ease_out(p)
    a = int(230 * (1 - p))
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(235, 217, 169, a), width=6)
    d.ellipse([cx - 10, cy - 10, cx + 10, cy + 10], fill=(235, 217, 169, int(a * 0.65)))
    o = np.asarray(ov, dtype=np.float32)
    al = o[..., 3:4] / 255.0
    arr *= (1 - al); arr += o[..., :3] * al

def draw_ring(arr, x0, y0, x1, y1, alpha, color=(230, 200, 127)):
    """Rounded highlight ring around a canvas-space rect + breathing glow."""
    if alpha <= 0: return
    ov = Image.new("RGBA", (OUT_W, OUT_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    d.rounded_rectangle([x0 - 8, y0 - 8, x1 + 8, y1 + 8], radius=20,
                        outline=(20, 12, 34, int(180 * alpha)), width=8)
    d.rounded_rectangle([x0 - 8, y0 - 8, x1 + 8, y1 + 8], radius=20,
                        outline=color + (int(255 * alpha),), width=4)
    o = np.asarray(ov, dtype=np.float32)
    a = o[..., 3:4] / 255.0
    arr *= (1 - a); arr += o[..., :3] * a

class Ov:
    cache = {}
    def __init__(self, folder, name, scale):
        key = (folder, name, scale)
        if key not in Ov.cache:
            src = Image.open(os.path.join(folder, name + ".png")).convert("RGBA")
            w = int(src.width * scale)
            Ov.cache[key] = src.resize((w, int(src.height * scale)), Image.LANCZOS)
        self.im = Ov.cache[key]

def paste_ov(arr, folder, name, y, t, t_in, t_out, scale=0.52, x=None, rise=22):
    if t < t_in or t > t_out: return
    o = Ov(folder, name, scale)
    if t < t_in + 0.30:
        p = ease_out((t - t_in) / 0.30); alpha = p; dy = (1 - p) * rise
    elif t > t_out - 0.24:
        alpha = (t_out - t) / 0.24; dy = 0
    else:
        alpha = 1.0; dy = 0
    im = o.im
    px = (OUT_W - im.width) // 2 if x is None else int(x)
    py = int(y + dy)
    a = np.asarray(im.split()[3], dtype=np.float32)[..., None] / 255 * alpha
    rgb = np.asarray(im.convert("RGB"), dtype=np.float32)
    y0c, y1c = max(0, py), min(OUT_H, py + im.height)
    x0c, x1c = max(0, px), min(OUT_W, px + im.width)
    if y1c <= y0c or x1c <= x0c: return
    sa = a[y0c - py:y1c - py, x0c - px:x1c - px]
    arr[y0c:y1c, x0c:x1c] = arr[y0c:y1c, x0c:x1c] * (1 - sa) + \
        rgb[y0c - py:y1c - py, x0c - px:x1c - px] * sa

# ---- element rects (css) ----
def rc(plate, key): return P[plate].r(key)
q1q = rc("S02_q1_fresh", "questionText")
q2q = rc("S05_q2_fresh", "questionText")
q2_closest = P["S05b_q2_closest"].opt(lambda o: o["closest"])
q2_second = P["S05c_q2_both"].opt(lambda o: o["second"])
startBtn = rc("S01_intro", "startBtn")
prog6 = rc("S06_q3_fresh", "progressMeta") or rc("S06_q3_fresh", "progressLine")
progline6 = rc("S06_q3_fresh", "progressLine")
actBtn = rc("S10_actbreak", "actContinueBtn")
actH2 = rc("S10_actbreak", "actH2")
revK = rc("S19_reveal", "revealKicker")
revN = rc("S19_reveal", "revealName")
mailK = rc("S20_email", "emailKicker")
mailIn = rc("S20_email", "email")
calcC = rc("S18_calc", "calcCard")

def rect_center(r): return r["x"] + r["w"] / 2, r["y"] + r["h"] / 2

# scroll targets (css)
SC_INTRO_A, SC_INTRO_B = 0, startBtn["y"] - 430
SC_Q1 = q1q["y"] - 150
SC_Q2 = q2_closest["y"] - 300
SC_Q2B = q2_second["y"] - 330
SC_Q3TOP = 0
SC_ACT = actH2["y"] - 330
SC_CALC = max(0, (calcC["y"] + calcC["h"] / 2) - VIS_CSS / 2)
SC_REV = revK["y"] - 140
SC_MAIL = mailK["y"] - 130

MONTAGE = [("S11_q7_fresh", 22.00, 22.85), ("S13_q8_fresh", 22.85, 23.70),
           ("S15_q10_fresh", 23.70, 24.55), ("S16_q11_fresh", 24.55, 25.40)]

CAP_Y = 118   # caption band

def frame(t):
    arr = backdrop(t)
    ann = []   # deferred annotations

    def seg_scroll(a, b, s0, s1, tt):
        return lerp(s0, s1, smooth(clamp((tt - a) / (b - a), 0, 1)))

    if t < 3.30:      # INTRO
        sc = seg_scroll(0.9, 2.3, SC_INTRO_A, SC_INTRO_B, t)
        used = phone_view(arr, P["S01_intro"], sc)
        if 2.55 <= t <= 3.10:
            cx, cy = css_to_canvas(*rect_center(startBtn), used)
            draw_ripple(arr, cx, cy, t - 2.55)
        if WITH_TEXT:
            paste_ov(arr, OV2, "t_title", CAP_Y, t, 0.25, 3.05, 0.54)
    elif t < 6.60:    # STEP 1 — read the scene
        q = clamp((t - 3.30) / 0.28, 0, 1)
        if q < 1:
            phone_view(arr, P["S01_intro"], SC_INTRO_B,
                       mix=(P["S02_q1_fresh"], q))
            used = SC_Q1
        else:
            sc = SC_Q1 + 26 * smooth(clamp((t - 3.6) / 3.0, 0, 1))
            used = phone_view(arr, P["S02_q1_fresh"], sc)
        if WITH_TEXT:
            paste_ov(arr, OV2, "s1", CAP_Y, t, 3.55, 6.40, 0.52)
            if 3.95 < t < 6.25 and q >= 1:
                qx, qy = rect_center(q1q)
                tx, ty = css_to_canvas(qx, q1q["y"] - 6, used)
                a = clamp((t - 3.95) / 0.3, 0, 1) * clamp((6.25 - t) / 0.3, 0, 1)
                draw_arrow(arr, OUT_W / 2 + 210, 345, tx + 120, ty, min(a, 1))
    elif t < 11.20:   # STEP 2 — closest pick
        q = clamp((t - 6.60) / 0.28, 0, 1)
        mixq = clamp((t - 8.00) / 0.30, 0, 1)   # product mark curve
        if q < 1:
            phone_view(arr, P["S02_q1_fresh"], SC_Q1 + 26,
                       mix=(P["S05_q2_fresh"], q))
            used = SC_Q2
        else:
            used = phone_view(arr, P["S05_q2_fresh"], SC_Q2,
                              mix=(P["S05b_q2_closest"], mixq) if mixq > 0 else None)
        cx, cy = css_to_canvas(*rect_center(q2_closest), used)
        if 8.00 <= t <= 8.60:
            draw_ripple(arr, cx, cy, t - 8.00)
        if WITH_TEXT:
            paste_ov(arr, OV2, "s2", CAP_Y, t, 6.80, 11.00, 0.52)
            if 7.10 < t < 7.95 and q >= 1:
                a = clamp((t - 7.10) / 0.3, 0, 1) * clamp((7.95 - t) / 0.25, 0, 1)
                draw_arrow(arr, OUT_W / 2 - 260, 350, cx - 60, cy - 46, min(a, 1))
            if 8.55 < t < 10.95:
                a = clamp((t - 8.55) / 0.3, 0, 1)
                x0, y0 = css_to_canvas(q2_closest["x"], q2_closest["y"] - 14, used)
                x1, y1 = css_to_canvas(q2_closest["x"] + q2_closest["w"],
                                       q2_closest["y"] + q2_closest["h"], used)
                draw_ring(arr, x0, y0, x1, y1, min(a, 1) * (0.75 + 0.25 * np.sin(t * 4)))
                paste_ov(arr, OV2, "c2", int(y0 - 92), t, 8.75, 10.90, 0.5)
    elif t < 15.80:   # STEP 3 — optional second answer
        sc = seg_scroll(11.20, 11.75, SC_Q2, SC_Q2B, t)
        mixq = clamp((t - 12.60) / 0.30, 0, 1)
        adv = clamp((t - 14.90) / 0.75, 0, 1)
        if adv > 0:
            used = phone_view(arr, P["S05c_q2_both"], SC_Q2B,
                              mix=(P["S06_q3_fresh"], bez_panel(adv)))
        else:
            used = phone_view(arr, P["S05b_q2_closest"], sc,
                              mix=(P["S05c_q2_both"], mixq) if mixq > 0 else None)
        cx, cy = css_to_canvas(*rect_center(q2_second), used)
        if 12.60 <= t <= 13.20 and adv == 0:
            draw_ripple(arr, cx, cy, t - 12.60)
        if WITH_TEXT:
            paste_ov(arr, OV2, "s3", CAP_Y, t, 11.40, 15.55, 0.52)
            if 11.80 < t < 12.55:
                a = clamp((t - 11.80) / 0.3, 0, 1) * clamp((12.55 - t) / 0.25, 0, 1)
                draw_arrow(arr, OUT_W / 2 - 250, 350, cx - 60, cy - 46, min(a, 1))
            if 13.30 < t < 14.75 and adv == 0:
                x0, y0 = css_to_canvas(q2_second["x"], q2_second["y"] - 14, used)
                paste_ov(arr, OV2, "c3", int(y0 - 92), t, 13.30, 14.75, 0.5)
    elif t < 18.60:   # STEP 4 — golden progress line
        q = clamp((t - 15.80) / 0.28, 0, 1)
        if q < 1:
            phone_view(arr, P["S06_q3_fresh"], SC_Q2B,
                       mix=(P["S06_q3_fresh"], q))
            used = phone_view(arr, P["S06_q3_fresh"],
                              lerp(SC_Q2B, SC_Q3TOP, smooth(q)))
        else:
            used = phone_view(arr, P["S06_q3_fresh"], SC_Q3TOP)
        if WITH_TEXT:
            paste_ov(arr, OV2, "s4", CAP_Y, t, 16.00, 18.45, 0.52)
            if 16.45 < t < 18.35 and progline6:
                a = clamp((t - 16.45) / 0.3, 0, 1)
                x0, y0 = css_to_canvas(progline6["x"], progline6["y"] - 4, used)
                x1, y1 = css_to_canvas(progline6["x"] + progline6["w"],
                                       progline6["y"] + progline6["h"] + 22, used)
                draw_ring(arr, x0, y0, x1, y1, min(a, 1))
    elif t < 22.00:   # STEP 5 — act break
        q = clamp((t - 18.60) / 0.28, 0, 1)
        if q < 1:
            phone_view(arr, P["S06_q3_fresh"], SC_Q3TOP,
                       mix=(P["S10_actbreak"], q))
            used = SC_ACT
        else:
            used = phone_view(arr, P["S10_actbreak"], SC_ACT)
        if 21.15 <= t <= 21.75:
            cx, cy = css_to_canvas(*rect_center(actBtn), used)
            draw_ripple(arr, cx, cy, t - 21.15)
        if WITH_TEXT:
            paste_ov(arr, OV2, "s5", CAP_Y, t, 18.80, 21.85, 0.52)
    elif t < 25.40:   # MONTAGE — 12 scenes of your real day
        for i, (pl, a, b) in enumerate(MONTAGE):
            if a <= t < b or (i == 3 and t >= b):
                qr = P[pl].r("questionText")
                sc = qr["y"] - 170 + 22 * smooth((t - a) / (b - a))
                mix = None
                if i < 3 and t > b - 0.15:
                    nxt = MONTAGE[i + 1][0]
                    mix = (P[nxt], (t - (b - 0.15)) / 0.15)
                phone_view(arr, P[pl], sc, mix=mix)
                break
        if WITH_TEXT:
            paste_ov(arr, OV2, "sm", CAP_Y + 20, t, 22.10, 25.25, 0.54)
    elif t < 28.60:   # STEP 6 — result
        if t < 26.70:
            q = clamp((t - 25.40) / 0.28, 0, 1)
            mixq = clamp((t - 26.42) / 0.28, 0, 1)
            used = phone_view(arr, P["S18_calc"], SC_CALC,
                              mix=(P["S19_reveal"], mixq) if mixq > 0 else None)
        else:
            sc = SC_REV + 14 * smooth(clamp((t - 26.7) / 1.9, 0, 1))
            used = phone_view(arr, P["S19_reveal"], sc)
        if WITH_TEXT:
            paste_ov(arr, OV2, "s6", CAP_Y, t, 25.60, 28.45, 0.52)
            if 27.05 < t < 28.35:
                x0, y0 = css_to_canvas(revN["x"] + 30, revN["y"] - 8, SC_REV + 14)
                paste_ov(arr, OV2, "c6", int(clamp(y0 + revN["h"] * F_CSS + 130, 380, 1560)),
                         t, 27.05, 28.35, 0.5)
    elif t < 31.60:   # STEP 7 — email / free report
        q = clamp((t - 28.60) / 0.28, 0, 1)
        if q < 1:
            phone_view(arr, P["S19_reveal"], SC_REV + 14,
                       mix=(P["S20_email"], q))
            used = SC_MAIL
        else:
            used = phone_view(arr, P["S20_email"], SC_MAIL)
        if WITH_TEXT:
            paste_ov(arr, OV2, "s7", CAP_Y, t, 28.80, 31.45, 0.52)
            if 29.25 < t < 31.05 and q >= 1:
                cx, cy = css_to_canvas(*rect_center(mailIn), used)
                a = clamp((t - 29.25) / 0.3, 0, 1) * clamp((31.05 - t) / 0.3, 0, 1)
                draw_arrow(arr, OUT_W / 2 + 240, 350, cx + 120, cy - 40, min(a, 1))
                x0, y0 = css_to_canvas(mailIn["x"], mailIn["y"], used)
                x1, y1 = css_to_canvas(mailIn["x"] + mailIn["w"],
                                       mailIn["y"] + mailIn["h"], used)
                draw_ring(arr, x0, y0, x1, y1, min(a, 1), color=(227, 168, 172))
    else:             # END CARD
        p = clamp((t - 31.60) / 0.4, 0, 1)
        arr *= (0.9 + 0.1 * (1 - p))
        if WITH_TEXT:
            paste_ov(arr, OV1, "b7a", 430, t, 31.80, DUR, 0.56)
            paste_ov(arr, OV1, "b7cta", 1120, t, 32.20, DUR, 0.56)
            paste_ov(arr, OV1, "b7bio", 1330, t, 32.60, DUR, 0.50)
            if t >= 33.20:
                a = min((t - 33.20) / 0.3, 1) * 0.95
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
    cmd = [FF, "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{OUT_W}x{OUT_H}", "-r", str(FPS), "-i", "-",
           "-c:v", "libx264", "-preset", "medium", "-crf", "17",
           "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for i in range(N):
        t = i / FPS
        arr = frame(t)
        arr = grade(arr)
        if t > DUR - 0.35: arr *= max(0.8, 1 - (t - (DUR - 0.35)) * 0.5)
        proc.stdin.write(np.clip(arr, 0, 255).astype(np.uint8).tobytes())
        if i % 120 == 0: print(f"  frame {i}/{N}", flush=True)
    proc.stdin.close(); proc.wait()
    print("wrote", out)

if __name__ == "__main__":
    main()
