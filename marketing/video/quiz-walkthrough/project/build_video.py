#!/usr/bin/env python3
"""
NizamOk — «داخل الاختبار» 9:16 master compositor.

Seven-beat directed edit over the REAL quiz interface (pixel-true dsf5 twin of
the uploaded recorded session). Interaction motion is reproduced from real
before/after interface states using the product's own animation curves
(mark: 0.3s ease fade+rise; panel entrance: 0.75s rise+fade cubic-bezier).
Camera: virtual dolly/push/whip/portal with cinema easing. 1080x1920@30fps.

Usage: build_video.py [--no-text] [--out NAME]
"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageFilter
import imageio_ffmpeg

ROOT = "/tmp/claude-0/-home-user-Nizamuk-Business/b89d25c9-67ab-5837-94d1-4b605df46037/scratchpad"
ST = os.path.join(ROOT, "capture/stills")
OV = os.path.join(ROOT, "overlays/png")
OUT_W, OUT_H, FPS = 1080, 1920, 30
DUR = 22.0
N = int(round(DUR * FPS))
DSF = 5.0

WITH_TEXT = "--no-text" not in sys.argv
OUTNAME = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else "master_silent.mp4"

# beat boundaries (locked storyboard v2 — audio-led)
B_HOOK, B_SCENES, B_CHOICE, B_PORTAL, B_PATTERN, B_COMPLETE, B_CONVERT, B_END = \
    0.00, 1.30, 4.20, 6.90, 10.60, 13.70, 17.20, 22.00

def ease_out_expo(t):  return 1 - 2 ** (-10 * t) if t < 1 else 1.0
def ease_in_out(t):    return t * t * (3 - 2 * t)
def ease_out_cubic(t): return 1 - (1 - t) ** 3
def bez_panel(t):      # approx cubic-bezier(0.22,1,0.36,1) — the product's panelIn
    return 1 - (1 - t) ** 2.8
def lerp(a, b, t):     return a + (b - a) * t

class Plate:
    cache = {}
    def __init__(self, name):
        if name not in Plate.cache:
            Plate.cache[name] = Image.open(os.path.join(ST, name + ".png")).convert("RGB")
        self.im = Plate.cache[name]
        jp = os.path.join(ST, name + ".json")
        self.meta = json.load(open(jp)) if os.path.exists(jp) else None
    def rect(self, key):
        r = self.meta["byId"].get(key)
        return None if r is None else {k: v * DSF for k, v in r.items()}
    def opt(self, pred):
        for o in self.meta["options"]:
            if pred(o): return {k: v * DSF for k, v in o["rect"].items()}
        return None

def center(r): return r["x"] + r["w"] / 2, r["y"] + r["h"] / 2

def render_crop(im, cx, cy, zoom):
    W, H = im.size
    w = W / zoom
    h = w * OUT_H / OUT_W
    x0 = min(max(cx - w / 2, 0), max(W - w, 0)) if w <= W else (W - w) / 2
    y0 = min(max(cy - h / 2, 0), max(H - h, 0)) if h <= H else (H - h) / 2
    box = (x0, y0, x0 + w, y0 + h)
    return im.resize((OUT_W, OUT_H), Image.LANCZOS, box=box)

def to_np(im): return np.asarray(im, dtype=np.float32)

def hblur(arr, k):
    k = int(k) | 1
    if k <= 1: return arr
    pad = np.pad(arr, ((0, 0), (k // 2, k // 2), (0, 0)), mode="edge")
    c = np.cumsum(pad, axis=1, dtype=np.float64)
    z = np.zeros((c.shape[0], 1, c.shape[2]))
    out = (c[:, k - 1:, :] - np.concatenate([z, c[:, :-k, :]], axis=1)) / k
    return out.astype(np.float32)

# ------------------------------------------------------------- plates
P_q1   = Plate("S02_q1_fresh")
P_q2   = Plate("S05_q2_fresh")
P_q2c  = Plate("S05b_q2_closest")
P_q2b  = Plate("S05c_q2_both")
P_q3   = Plate("S06_q3_fresh")
P_act  = Plate("S10_actbreak")
P_q7   = Plate("S11_q7_fresh")
P_q8   = Plate("S13_q8_fresh")
P_q10  = Plate("S15_q10_fresh")
P_q11  = Plate("S16_q11_fresh")
P_calc = Plate("S18_calc")
P_rev  = Plate("S19_reveal")
P_mail = Plate("S20_email")

q1_question = P_q1.rect("questionText")
q1_options  = P_q1.rect("options")
q2_question = P_q2.rect("questionText")
q2_closest  = P_q2c.opt(lambda o: o["closest"])
q2_second   = P_q2b.opt(lambda o: o["second"])
act_h2      = P_act.rect("actH2")
q7_question = P_q7.rect("questionText")
rev_kick    = P_rev.rect("revealKicker")
rev_name    = P_rev.rect("revealName")
rev_teaser  = P_rev.rect("mixTeaser")
mail_h2     = P_mail.rect("emailH2")

# ------------------------------------------------------------- shots
def shot_hook(t):
    qx, qy = center(q1_question)
    p = ease_out_expo(min(t / 1.05, 1))
    zoom = lerp(3.1, 2.05, p)
    cy = lerp(qy - 40, qy + 55, p)
    return to_np(render_crop(P_q1.im, qx, cy, zoom))

def shot_scenes(t):
    p = ease_in_out(min(max((t - B_SCENES) / (B_CHOICE - B_SCENES - 0.1), 0), 1))
    qx, qy = center(q1_question)
    ox, oy = center(q1_options)
    zoom = lerp(2.05, 1.5, p)
    cx = lerp(qx, ox + 25, p)
    cy = lerp(qy + 55, oy - 100, p)
    im = render_crop(P_q1.im, cx, cy, zoom)
    mid = abs(p - 0.5)
    if mid < 0.30:
        im = im.filter(ImageFilter.GaussianBlur(2.3 * (1 - mid / 0.30)))
    return to_np(im)

# choice micro-timeline (real states, product curves)
C_TAP1, C_TAP2, C_ADV = 4.75, 5.75, 6.15   # taps and auto-advance moments
def shot_choice(t):
    ox, oy = center(q2_closest)
    # camera: settle from question toward the options block, then magnify pick
    p_in = ease_out_cubic(min(max((t - B_CHOICE) / 0.55, 0), 1))
    mag = 0.0
    if t > C_TAP1:
        rise = ease_in_out(min((t - C_TAP1) / 0.5, 1))
        fall = 1.0 if t < C_ADV else max(0.0, 1 - (t - C_ADV) / 0.35)
        mag = rise * fall
    zoom = lerp(1.42, 1.52, p_in) + 0.16 * mag          # ~11% extra on the pick
    qx, qy = center(q2_question)
    cx = lerp(qx, ox, ease_in_out(min(max((t - B_CHOICE) / 1.0, 0), 1)) * 0.9 + 0.1 * mag)
    cy = lerp(qy + 260, oy, ease_in_out(min(max((t - B_CHOICE) / 1.0, 0), 1))) - 40 * mag
    # real-state mix per product animation spec
    if t < C_TAP1:
        base = P_q2.im
        return to_np(render_crop(base, cx, cy, zoom))
    if t < C_TAP2:
        q = min((t - C_TAP1) / 0.30, 1)                  # CSS mark transition 0.3s
        A = to_np(render_crop(P_q2.im, cx, cy, zoom))
        B = to_np(render_crop(P_q2c.im, cx, cy, zoom))
        return A * (1 - q) + B * q
    if t < C_ADV:
        q = min((t - C_TAP2) / 0.30, 1)
        A = to_np(render_crop(P_q2c.im, cx, cy, zoom))
        B = to_np(render_crop(P_q2b.im, cx, cy, zoom))
        return A * (1 - q) + B * q
    # auto-advance -> Q3 panelIn (0.75s rise+fade, product curve)
    q = bez_panel(min((t - C_ADV) / 0.75, 1))
    A = to_np(render_crop(P_q2b.im, cx, cy, zoom))
    q3q = P_q3.rect("questionText"); gx, gy = center(q3q)
    rise_px = 20 * DSF * (1 - q)
    B = to_np(render_crop(P_q3.im, gx, gy + 130 + rise_px, 1.55))
    return A * (1 - q) + B * q

_rad = None
def radial_mask(p, soft=0.18):
    global _rad
    if _rad is None:
        yy, xx = np.mgrid[0:OUT_H, 0:OUT_W]
        _rad = np.sqrt(((xx / OUT_W) - 0.5) ** 2 + ((yy / OUT_H) - 0.46) ** 2)
    return np.clip((p * 1.35 - _rad) / soft, 0, 1)[..., None]

def shot_portal(t):
    ax, ay = center(act_h2)
    if t < 7.95:
        p = ease_out_cubic((t - B_PORTAL) / 1.05)
        zoom = lerp(1.08, 1.36, p)
        cy = lerp(ay + 280, ay + 30, p)
        return to_np(render_crop(P_act.im, ax, cy, zoom))
    if t < 9.35:
        p = (t - 7.95) / 1.40
        zoom = lerp(1.36, 1.56, p)
        return to_np(render_crop(P_act.im, ax, ay + 30 - 40 * p, zoom))
    p = ease_in_out((t - 9.35) / (B_PATTERN - 9.35))
    A = to_np(render_crop(P_act.im, ax, ay, lerp(1.56, 2.35, p)))
    qx, qy = center(q7_question)
    B = to_np(render_crop(P_q7.im, qx, qy + 60, lerp(1.95, 1.6, p)))
    m = radial_mask(p)
    return A * (1 - m) + B * m

SEG = None
def shot_pattern(t):
    global SEG
    if SEG is None:
        SEG = [(10.60, 11.75, P_q8), (11.75, 12.80, P_q10), (12.80, 13.70, P_q11)]
    for i, (a, b, P) in enumerate(SEG):
        if a <= t < b or (i == 2 and t >= b):
            p = ease_in_out(min((t - a) / (b - a), 1))
            qr = P.rect("questionText"); qx, qy = center(qr)
            zoom = lerp(1.78, 1.6, p)
            cy = lerp(qy - 230, qy + 200, p)
            arr = to_np(render_crop(P.im, qx, cy, zoom))
            for edge in (a, b):
                d = abs(t - edge)
                if 0 < d < 0.12 and not (i == 0 and edge == a) and not (i == 2 and edge == b):
                    arr = hblur(arr, 41)
            return arr
    return to_np(render_crop(P_q11.im, *center(P_q11.rect("questionText")), 1.6))

def _reveal_frame(t):
    # dolly-in that settles on kicker+name+truth; the teaser paragraph reduces
    # to a vignetted bottom sliver by the end of the push
    p = ease_in_out(min(max((t - 14.75) / 2.2, 0), 1))
    zoom = lerp(1.50, 1.84, p)
    cx, ny = center(rev_name)
    cy = lerp(ny + 240, ny - 105, p)
    return to_np(render_crop(P_rev.im, cx, cy, zoom))

def shot_completion(t):
    if t < 14.75:
        p = ease_in_out((t - B_COMPLETE) / 1.05)
        cx = P_calc.im.size[0] / 2
        cy = P_calc.im.size[1] * lerp(0.47, 0.50, p)
        A = to_np(render_crop(P_calc.im, cx, cy, lerp(1.16, 1.28, p)))
        if t > 14.50:
            q = (t - 14.50) / 0.25
            A = A * (1 - q) + _reveal_frame(14.75) * q
        return A
    return _reveal_frame(t)

def shot_convert(t):
    p = (t - B_CONVERT) / (B_END - B_CONVERT)
    mx, my = center(mail_h2)
    zoom = lerp(1.28, 1.40, ease_in_out(p))
    im = render_crop(P_mail.im, mx, my + 270 - 50 * p, zoom)
    im = im.filter(ImageFilter.GaussianBlur(2.2))
    return to_np(im) * 0.62

def transition(a, b, q, style="mix"):
    q = np.clip(q, 0, 1)
    out = a * (1 - q) + b * q
    if style == "whip":
        out = hblur(out, 45)
    return out

def base_frame(t):
    if t < B_SCENES:      return shot_hook(t)
    if t < B_CHOICE - 0.12: return shot_scenes(t)
    if t < B_CHOICE:      return transition(shot_scenes(t), shot_choice(B_CHOICE), (t - (B_CHOICE - 0.12)) / 0.12, "whip")
    if t < B_PORTAL - 0.08: return shot_choice(t)
    if t < B_PORTAL:      return transition(shot_choice(t), shot_portal(B_PORTAL), (t - (B_PORTAL - 0.08)) / 0.08)
    if t < B_PATTERN:     return shot_portal(t)
    if t < B_COMPLETE:    return shot_pattern(t)
    if t < B_CONVERT:     return shot_completion(t)
    if t < B_CONVERT + 0.24: return transition(shot_completion(B_CONVERT - 0.01), shot_convert(t), (t - B_CONVERT) / 0.24)
    return shot_convert(t)

# ------------------------------------------------------------- overlays
class Ov:
    cache = {}
    def __init__(self, name, y, scale):
        key = (name, scale)
        if key not in Ov.cache:
            src = Image.open(os.path.join(OV, name + ".png")).convert("RGBA")
            w = int(src.width * scale)
            Ov.cache[key] = src.resize((w, int(src.height * scale)), Image.LANCZOS)
        self.im = Ov.cache[key]
        self.x = (OUT_W - self.im.width) // 2
        self.y = y

SCRIM = {}
def scrim_mask(key, cy, ry):
    if key not in SCRIM:
        yy, xx = np.mgrid[0:OUT_H, 0:OUT_W]
        d = (((xx - OUT_W / 2) / (OUT_W * 0.80)) ** 2 + ((yy - cy) / ry) ** 2)
        SCRIM[key] = np.clip(1 - d, 0, 1)[..., None] ** 1.5
    return SCRIM[key]

def paste(base, ov, alpha, wipe, rise):
    im = ov.im
    a = np.asarray(im.split()[3], dtype=np.float32) / 255 * alpha
    if wipe < 1:
        w = im.width
        edge = (1 - wipe) * (w * 1.15)
        ramp = np.clip((np.arange(w)[None, :] - (edge - w * 0.15)) / (w * 0.15), 0, 1)
        a *= ramp
    rgb = np.asarray(im.convert("RGB"), dtype=np.float32)
    x, y = ov.x, ov.y + int(rise)
    h_, w_ = a.shape
    y0, y1 = max(0, y), min(OUT_H, y + h_)
    x0, x1 = max(0, x), min(OUT_W, x + w_)
    if y1 <= y0 or x1 <= x0: return
    sa = a[y0 - y:y1 - y, x0 - x:x1 - x][..., None]
    base[y0:y1, x0:x1] = base[y0:y1, x0:x1] * (1 - sa) + rgb[y0 - y:y1 - y, x0 - x:x1 - x] * sa

def ov_anim(t, t_in, t_out, in_d=0.30, out_d=0.24, rise=26):
    if t < t_in or t > t_out: return 0, 0, 0
    if t < t_in + in_d:
        p = ease_out_cubic((t - t_in) / in_d)
        return p, p, (1 - p) * rise
    if t > t_out - out_d:
        return (t_out - t) / out_d, 1, 0
    return 1, 1, 0

PLAN = [
    ("b1a", 235, 0.55, 0.10, 2.50, 0.35),
    ("b1b", 465, 0.50, 0.55, 2.50, 0.22),
    ("b2", 1290, 0.52, 1.72, 4.02, 0.32),
    ("b3a", 245, 0.52, 4.45, 6.76, 0.35),
    ("b3b", 462, 0.50, 5.05, 6.76, 0.24),
    ("b4a", 245, 0.50, 7.25, 10.30, 0.32),
    ("b4b", 448, 0.54, 8.60, 10.50, 0.28),
    ("b5a", 230, 0.52, 10.80, 12.42, 0.34),
    ("b5b", 230, 0.50, 12.48, 13.62, 0.34),
    ("b6", 215, 0.52, 14.15, 16.95, 0.30),
    ("b7a", 455, 0.55, 17.55, 22.00, 0.0),
    ("b7cta", 1195, 0.55, 18.70, 22.00, 0.0),
    ("b7bio", 1398, 0.50, 19.50, 22.00, 0.0),
]

WORD = Image.open("/home/user/Nizamuk.Business/site/assets/img/wordmark.png").convert("RGBA")
WORDMARK = WORD.resize((360, int(WORD.height * 360 / WORD.width)), Image.LANCZOS)

def apply_overlays(arr, t):
    if not WITH_TEXT: return arr
    for name, y, scale, t_in, t_out, s in PLAN:
        alpha, wipe, rise = ov_anim(t, t_in, t_out)
        if alpha > 0:
            o = Ov(name, y, scale)
            if s > 0:
                cy = y + o.im.height / 2
                arr = arr * (1 - scrim_mask((name, y), cy, o.im.height * 1.9) * (s * alpha))
            paste(arr, o, alpha, wipe, rise)
    if t >= 21.25:
        a = min((t - 21.25) / 0.30, 1) * 0.92
        wm = WORDMARK
        x, y = (OUT_W - wm.width) // 2, 1562
        aa = np.asarray(wm.split()[3], dtype=np.float32)[..., None] / 255 * a
        rgb = np.asarray(wm.convert("RGB"), dtype=np.float32)
        arr[y:y + wm.height, x:x + wm.width] = \
            arr[y:y + wm.height, x:x + wm.width] * (1 - aa) + rgb * aa
    return arr

_vig = None
def grade(arr):
    global _vig
    if _vig is None:
        yy, xx = np.mgrid[0:OUT_H, 0:OUT_W]
        d = np.sqrt(((xx - OUT_W / 2) / (OUT_W * 0.72)) ** 2 +
                    ((yy - OUT_H / 2) / (OUT_H * 0.62)) ** 2)
        _vig = (1 - 0.30 * np.clip(d - 0.55, 0, 1) ** 1.6)[..., None]
    a = arr / 255.0
    a = np.clip(a * 1.045 - 0.012, 0, 1)
    a = a ** np.array([1.0, 1.005, 0.985])
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
        arr = base_frame(t)
        arr = apply_overlays(arr, t)
        arr = grade(arr)
        if t > 21.65: arr *= max(0.78, 1 - (t - 21.65) * 0.45)
        proc.stdin.write(np.clip(arr, 0, 255).astype(np.uint8).tobytes())
        if i % 90 == 0: print(f"  frame {i}/{N}", flush=True)
    proc.stdin.close(); proc.wait()
    print("wrote", out)

if __name__ == "__main__":
    main()
