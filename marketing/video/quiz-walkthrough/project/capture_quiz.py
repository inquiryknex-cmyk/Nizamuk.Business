#!/usr/bin/env python3
"""
NizamOk quiz — high-fidelity twin capture of the REAL recorded session.

The uploaded WhatsApp recording is the source of truth. This rig replays that
exact session against the same deployed quiz code (repo site/ == live site):
  - identical per-question option order (patched engine take-control, content
    byte-identical),
  - identical selections (closest / optional second / «تابعي»),
  - identical ending (email gate; no submission, as in the recording).
PASS A (dsf=5):   full-page PNG plates of every state + element boxes.
PASS B (dsf=2.5): CDP screencast (1080x1920) of the real interaction motion.
All non-localhost traffic is blocked.
"""
import json, os, base64
from playwright.sync_api import sync_playwright

ROOT = "/tmp/claude-0/-home-user-Nizamuk-Business/b89d25c9-67ab-5837-94d1-4b605df46037/scratchpad"
STILLS = os.path.join(ROOT, "capture/stills")
TAKES = os.path.join(ROOT, "capture/takes")
GSAP = os.path.join(ROOT, "vendor/gsap.min.js")
QUIZ_TAKE = os.path.join(ROOT, "vendor/quiz.take.js")
BASE = "http://127.0.0.1:8807"

# Her take, exactly as in the recording (closest substr, second substr or None).
TAKE = [
    ("أفتحها بحماس",          None),                # Q1  -> تابعي
    ("أتأخر في الرد",          "أبشروا"),            # Q2
    ("أعدتُ الدرس",            None),                # Q3
    ("شغلي أجمل",             "هي فاضية"),          # Q4
    ("أدخل الموسم بمشروع",     None),                # Q5
    ("خمس خطط",               "خطة واحدة مُعادة"),   # Q6
    ("تهتز المكانة",           None),                # Q7
    ("ألوم نفسي",              None),                # Q8
    ("غير المكتمل",            "بفكرة جديدة تقفز"),   # Q9
    ("كسل وتسويف",            None),                # Q10
    ("أقولها تثبّت مكاني",      None),                # Q11
    ("أحجز ساعة لي وحدي",      None),                # Q12 -> calc
]

def block_routes(context):
    def route_all(route):
        url = route.request.url
        if "quiz.js" in url and url.startswith(BASE):
            route.fulfill(path=QUIZ_TAKE, content_type="application/javascript"); return
        if url.startswith(BASE) or url.startswith("data:"):
            route.continue_(); return
        if "gsap" in url and url.endswith(".js"):
            route.fulfill(path=GSAP, content_type="application/javascript"); return
        route.abort()
    context.route("**/*", route_all)

def rects(page, still_name):
    data = page.evaluate("""() => {
      const sy = window.scrollY, sx = window.scrollX;
      const grab = (el) => { if (!el) return null;
        const r = el.getBoundingClientRect();
        return {x: r.x + sx, y: r.y + sy, w: r.width, h: r.height}; };
      const byId = {};
      ['introPanel','quizPanel','actbreakPanel','calcPanel','revealPanel',
       'emailPanel','sceneKicker','questionText','choosePrompt','options',
       'nextBtn','prevBtn','startBtn','actContinueBtn','toEmailBtn',
       'revealName','revealTruth','mixTeaser','emailForm','email',
       'currentQuestion','actLabel']
        .forEach(id => { byId[id] = grab(document.getElementById(id)); });
      byId.progressLine = grab(document.querySelector('.progress-line'));
      byId.progressMeta = grab(document.querySelector('.progress-meta'));
      byId.quizTopbar  = grab(document.querySelector('.quiz-topbar'));
      byId.revealKicker = grab(document.querySelector('#revealPanel .rk'));
      byId.emailKicker = grab(document.querySelector('#emailPanel .kicker'));
      byId.emailH2 = grab(document.querySelector('#emailPanel h2'));
      byId.emailBtn = grab(document.querySelector('#emailForm button'));
      byId.actH2 = grab(document.querySelector('#actbreakPanel h2'));
      byId.actKicker = grab(document.querySelector('.act-kicker'));
      byId.calcCard = grab(document.querySelector('#calcPanel .quiz-card'));
      byId.calcText = grab(document.querySelector('#calcPanel p'));
      const opts = [];
      document.querySelectorAll('#options .option').forEach(o => {
        opts.push({rect: grab(o), text: o.textContent.trim().slice(0, 60),
                   closest: o.classList.contains('closest'),
                   second: o.classList.contains('second')});
      });
      const active = document.querySelector('.panel.active');
      return {byId, options: opts,
              page: {w: document.documentElement.scrollWidth,
                     h: document.documentElement.scrollHeight},
              viewport: {w: innerWidth, h: innerHeight},
              activePanel: active ? active.id : null};
    }""")
    with open(os.path.join(STILLS, still_name + ".json"), "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)

def still(page, name, full=True):
    page.screenshot(path=os.path.join(STILLS, name + ".png"), full_page=full)
    rects(page, name)
    print("  still:", name)

def click_option(page, substr):
    page.locator("#options .option", has_text=substr).first.click()

def answer_scene(page, closest, second, settle=0.55):
    click_option(page, closest)
    page.wait_for_timeout(int(settle * 1000))
    if second:
        click_option(page, second)
        page.wait_for_timeout(700)
    else:
        page.locator("#nextBtn").click()
    page.wait_for_timeout(950)

class Screencast:
    def __init__(self, page, take_name):
        self.dir = os.path.join(TAKES, take_name)
        os.makedirs(self.dir, exist_ok=True)
        self.meta = []; self.n = 0
        self.cdp = page.context.new_cdp_session(page)
        self.cdp.on("Page.screencastFrame", self._frame)
    def _frame(self, p):
        try:
            fn = f"f{self.n:05d}.jpg"
            with open(os.path.join(self.dir, fn), "wb") as f:
                f.write(base64.b64decode(p["data"]))
            self.meta.append({"f": fn, "t": p["metadata"]["timestamp"]})
            self.n += 1
            self.cdp.send("Page.screencastFrameAck", {"sessionId": p["sessionId"]})
        except Exception as e:
            print("frame err", e)
    def start(self):
        self.cdp.send("Page.startScreencast", {
            "format": "jpeg", "quality": 95,
            "maxWidth": 1080, "maxHeight": 1920, "everyNthFrame": 1})
    def stop(self):
        try: self.cdp.send("Page.stopScreencast")
        except Exception: pass
        with open(os.path.join(self.dir, "times.json"), "w") as f:
            json.dump(self.meta, f)
        try: self.cdp.detach()
        except Exception: pass
        print(f"  take {os.path.basename(self.dir)}: {self.n} frames")

def open_quiz(pw, dsf):
    browser = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                                 headless=True)
    ctx = browser.new_context(
        viewport={"width": 432, "height": 768},
        device_scale_factor=dsf,
        reduced_motion="no-preference",
        locale="ar-SA",
        user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
                   "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1")
    block_routes(ctx)
    page = ctx.new_page()
    # Hide only the floating ambient-audio invite (screen furniture, not quiz).
    page.add_init_script("""
      const st = document.createElement('style');
      st.textContent = '.ambient-control{display:none!important}';
      document.addEventListener('DOMContentLoaded',
        () => document.head.appendChild(st));
    """)
    page.goto(BASE + "/ikhtibar/", wait_until="networkidle")
    page.wait_for_timeout(1200)
    print("  gsap loaded:", page.evaluate("typeof gsap !== 'undefined'"))
    return browser, page

# ---------------- PASS A: high-res plates ----------------
def pass_stills(pw):
    print("PASS A — plates @ dsf5")
    browser, page = open_quiz(pw, 5)
    still(page, "S01_intro")
    page.locator("#startBtn").click(); page.wait_for_timeout(1000)
    still(page, "S02_q1_fresh")
    click_option(page, TAKE[0][0]); page.wait_for_timeout(600)
    still(page, "S03_q1_closest")
    page.locator("#nextBtn").click(); page.wait_for_timeout(1000)
    still(page, "S05_q2_fresh")
    # Q2: closest + second (real second-answer moment in the recording)
    click_option(page, TAKE[1][0]); page.wait_for_timeout(600)
    still(page, "S05b_q2_closest")
    click_option(page, TAKE[1][1]); page.wait_for_timeout(1400)  # auto-advance
    still(page, "S06_q3_fresh")
    page.locator("#prevBtn").click(); page.wait_for_timeout(1000)
    still(page, "S05c_q2_both")          # static both-marks state (real prev)
    page.locator("#nextBtn").click(); page.wait_for_timeout(1000)
    answer_scene(page, *TAKE[2])
    still(page, "S07_q4_fresh")
    answer_scene(page, *TAKE[3])
    still(page, "S08_q5_fresh")
    answer_scene(page, *TAKE[4])
    still(page, "S09_q6_fresh")
    answer_scene(page, *TAKE[5])         # -> act break
    page.wait_for_timeout(400)
    still(page, "S10_actbreak")
    page.locator("#actContinueBtn").click(); page.wait_for_timeout(1000)
    still(page, "S11_q7_fresh")
    click_option(page, TAKE[6][0]); page.wait_for_timeout(600)
    still(page, "S12_q7_closest")
    page.locator("#nextBtn").click(); page.wait_for_timeout(1000)
    still(page, "S13_q8_fresh")
    answer_scene(page, *TAKE[7])
    still(page, "S14_q9_fresh")
    answer_scene(page, *TAKE[8])
    still(page, "S15_q10_fresh")
    answer_scene(page, *TAKE[9])
    still(page, "S16_q11_fresh")
    answer_scene(page, *TAKE[10])
    still(page, "S17_q12_fresh")
    click_option(page, TAKE[11][0]); page.wait_for_timeout(550)
    still(page, "S17b_q12_closest")
    page.locator("#nextBtn").click()
    page.wait_for_timeout(500)
    still(page, "S18_calc", full=False)
    page.wait_for_timeout(2400 + 1700)
    still(page, "S19_reveal")
    page.locator("#toEmailBtn").click(); page.wait_for_timeout(1100)
    still(page, "S20_email")             # recording ends here — so do we
    browser.close()

# ---------------- PASS B: screencast motion ----------------
def pass_takes(pw):
    print("PASS B — screencast @ dsf2.5")
    browser, page = open_quiz(pw, 2.5)

    sc = Screencast(page, "T0_intro_to_q1"); sc.start()
    page.locator("#startBtn").click(); page.wait_for_timeout(1400); sc.stop()

    sc = Screencast(page, "T1_q1_closest"); sc.start()
    click_option(page, TAKE[0][0]); page.wait_for_timeout(1100)
    sc.stop()
    page.locator("#nextBtn").click(); page.wait_for_timeout(1100)

    # Q2 with the real optional-second selection + auto-advance + progress draw
    sc = Screencast(page, "T2_q2_second"); sc.start()
    click_option(page, TAKE[1][0]); page.wait_for_timeout(900)
    click_option(page, TAKE[1][1]); page.wait_for_timeout(1900)
    sc.stop()

    answer_scene(page, *TAKE[2])
    answer_scene(page, *TAKE[3])
    answer_scene(page, *TAKE[4])

    sc = Screencast(page, "T3_actbreak"); sc.start()
    click_option(page, TAKE[5][0]); page.wait_for_timeout(800)
    click_option(page, TAKE[5][1]); page.wait_for_timeout(2100)
    sc.stop()

    sc = Screencast(page, "T4_enter_act2"); sc.start()
    page.locator("#actContinueBtn").click(); page.wait_for_timeout(1700); sc.stop()

    sc = Screencast(page, "T5_q7_selection"); sc.start()
    click_option(page, TAKE[6][0]); page.wait_for_timeout(1000)
    page.locator("#nextBtn").click(); page.wait_for_timeout(1300)
    sc.stop()

    # Q8..Q11 continuous progression
    sc = Screencast(page, "T6_progression"); sc.start()
    for qi in (7, 8, 9, 10):
        c, s = TAKE[qi]
        click_option(page, c); page.wait_for_timeout(480)
        if s:
            click_option(page, s); page.wait_for_timeout(1150)
        else:
            page.locator("#nextBtn").click(); page.wait_for_timeout(1050)
    sc.stop()

    sc = Screencast(page, "T7_calc_reveal"); sc.start()
    click_option(page, TAKE[11][0]); page.wait_for_timeout(550)
    page.locator("#nextBtn").click()
    page.wait_for_timeout(2600 + 3200)
    sc.stop()

    sc = Screencast(page, "T8_email"); sc.start()
    page.locator("#toEmailBtn").click(); page.wait_for_timeout(1800); sc.stop()

    browser.close()

if __name__ == "__main__":
    os.makedirs(STILLS, exist_ok=True); os.makedirs(TAKES, exist_ok=True)
    with sync_playwright() as pw:
        pass_stills(pw)
        pass_takes(pw)
    print("done")
