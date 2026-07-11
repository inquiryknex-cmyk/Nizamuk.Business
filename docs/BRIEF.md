# NizamOk — Master Build Brief

Working document for the NizamOk funnel rebuild: landing page, quiz (اختبار), and
Interdash waiting-list page. Compiled from the owner's design doc
(`reference/landing-quiz-design-doc.txt`), the live site snapshot
(`reference/live-site/`), uploaded brand assets, and conversation decisions.

Owner: inquiry.knex@gmail.com · Domain: https://nizamok.com

---

## 1. Brand

- Arabic: **نظامك** · English: **NizamOk** · Tagline on seal: علم النفس والتطوير الذاتي
- Audience: Arabic-speaking women, especially GCC/KSA.
- Language: Modern Standard Arabic, **feminine address throughout**
  (أنتِ، طاقتكِ، نمطكِ، ابدئي، شاهدي، انضمي).
- Tone: premium, calm, intelligent, feminine, emotionally precise, **non-shaming**.
  Psychological rather than motivational. "This understands me" — not another
  productivity app.
- Positioning: an Arabic self-understanding ecosystem — name the pattern,
  understand it, then work with it (reports → books → interactive dashboard).

### Visual identity (decided)
- Public pages: light **warm ivory/sand** backgrounds. NOT dark or heavy.
- Accents: **deep plum + champagne gold** (decided over the doc's "deep green").
  Gold is jewelry, not decoration. Rich charcoal for text, soft taupe support.
- Product covers are dark (burgundy for Juthur, plum for Rebuild) — they pop
  against the ivory page.
- Typography: elegant modern Arabic (editorial, premium-magazine hierarchy);
  clean geometric sans for Latin.
- Motifs: gold mandala seal (sparingly — separators, progress rings, empty
  states); flowing golden "pattern line" as the unique brand element;
  NizamOK logo where "OK" resolves into a golden check/swoosh (SVG animation,
  must not imitate Nike).
- Motion: GSAP (free since 2025). Slow, precise, quiet, intentional. No bounce,
  no flash. Floating glass cards, soft reveals, gold line-draw.
- No emojis in UI. No fake testimonials. No invented statistics. No guaranteed
  psychological outcomes. Disclaimer required (see §7).
- Stack: custom HTML/CSS/JS + GSAP → Cloudflare Pages. Payments: Dodo.
  Email: MailerLite (per-pattern forms; currently disabled placeholder).

## 2. The four patterns (الأنماط الأربعة)

Slugs are the canonical keys used in live config + Dodo links.

| slug | Arabic name | essence |
|------|-------------|---------|
| `mubdia` | المبدعة المشتّتة | starts with fire, new ideas pull her away before arrival |
| `asira` (Dodo: `asirat`) | أسيرة الكمال | edits forever so the work stays safe from judging eyes |
| `mutafadiya` (Dodo: `mutafadia`) | المتفادية الذكية | does every small thing, defers the one heavy door |
| `kafua` (Dodo rebuild: `munhaka`) | الكفؤة المنهَكة | capable for everyone, quietly depleted for herself |

Full result copy (name/short/truth/headline/wound/step) lives in
`reference/live-site/assets/quiz.js` — the strongest existing copy asset.

## 3. Products & Dodo links

Tiers: **لمحات (Lamhat)** available now → **جذور نمطك (Juthur)** book →
**نظام إعادة البناء (Rebuild)** workbook → **لوحة نظامك التفاعلية (Interdash)**
coming soon (waiting list) → برنامج ٧ أيام (future).

Dodo checkout links (provided by owner, 2026-07-11):

| pattern | Lamhat | Juthur | Rebuild |
|---------|--------|--------|---------|
| mubdia | https://dodo.pe/lamhat-mubdia-inter | https://dodo.pe/juthur-mubdia-inter | https://dodo.pe/rebuild-mubdia-inter |
| mutafadiya | https://dodo.pe/lamhat-mutafadia-inter | https://dodo.pe/juthur-mutafadia-inter | https://dodo.pe/rebuild-mutafadia-inter |
| kafua | https://dodo.pe/lamhat-kafua-inter | https://dodo.pe/juthur-kafua-inter | https://dodo.pe/rebuild-munhaka-inter |
| asira | https://dodo.pe/lamhat-asirat-inter | https://dodo.pe/juthur-asirat-inter | https://dodo.pe/rebuild-asirat-inter |

Note: rebuild uses `munhaka` for الكفؤة المنهكة; all other tiers use `kafua`.

**Pricing — UNRESOLVED.** Design doc: Lamhat 19 / Juthur 49. Live site:
Lamhat 29 / Juthur 39 / Rebuild 109 (+ bundle 131 in config). Awaiting owner.

### Juthur cover copy (extracted from uploaded covers)
Series kicker: «كتابٌ في أصلِ النمط» · series title: «جذورُ نمطكِ»

- **المبدعة المشتّتة** — لماذا تبدئين كل شيء بشغف، ولا يصل أيٌّ منه إلى نهايته؟
  كتابٌ في الجذر الخفيّ بين الوميض، والملل، والخوف من النهاية التي تحسم.
- **المتفادية الذكيّة** — لماذا تنجزين كل شيءٍ صغير، وتؤجّلين الشيء الوحيد الذي
  يغيّر حياتكِ؟ كتابٌ في الجذر الخفيّ بين الانشغال، والخوف، والمهمّة التي تغيّر كل شيء.
- **الكفؤة المنهَكة** — لماذا تتحمّلين كل شيء، كأن مكانتكِ ستسقط إن توقفتِ؟
  كتابٌ في الجذر الخفيّ بين الكفاءة، والذنب، والخوف من أن لا يعودوا بحاجةٍ إليكِ.
- **أسيرة الكمال** — لماذا تراجعين، وتراجعين، وتراجعين، حتى يبقى العمل آمنًا من
  العيون؟ كتابٌ في الجذر الخفيّ بين الجودة، والخجل، والصورة التي لا تريدين أن تهتزّ.

### Rebuild cover copy (all four received)
Series footer: «نظامك · نظام إعادة البناء»

- **المبدعة المشتّتة** — «احمي فكرة واحدة حتى تصل» — نظام عملي يساعدكِ على حماية
  مشروع واحد من بريق الأفكار الجديدة، حتى يكتمل ويصل إلى العالم بدل أن يبقى
  فكرة في رأسكِ. · Pull-quote: الفكرة اللامعة ليست دائمًا نداء؛ أحيانًا هي باب
  خروج من منتصف فقد بريقه.
- **المتفادية الذكية** — «اقتربي من الباب الذي صار أكبر من حجمه» — نظام عملي
  يساعدكِ على فتح الرسالة المؤجّلة، والمكالمة الثقيلة، والقرار الذي بقي معلّقًا؛
  باقترابٍ صغير يعيد الواقع إلى حجمه قبل أن يكبر في الخيال. · Pull-quote: أنتِ
  لا تتجنّبين المهمة، بل الشعور الذي خلفها.
- **الكفؤة المنهكة** — «أن تكوني قادرة لا يعني أن تكوني متاحة دائمًا» — قدرتكِ
  ليست تصريحًا مفتوحًا للجميع. نظام عملي للمرأة التي يحمّلها الجميع لأنها
  «قادرة»، حتى نسيت أن قدرتها نفسها تحتاج من يحميها. يساعدكِ أن تعطي دون أن
  تختفي، وأن تحمي ما يبقى منكِ في نهاية اليوم. · Pull-quote: أحيانًا لا يكون
  المدح مكافأة؛ يكون طريقةً مهذّبة لترك التحمّل عليكِ.
- **أسيرة الكمال** — «سلّمي قبل أن تقعي في فخّ الكمال» — نظام عملي يساعدكِ على
  الخروج من دوّامة «التعديل الأخير»، وتسليم نسخةٍ تتحسّن لأنها خرجت، لا لأنها
  بقيت محميّةً من كل عين. نقص العمل لا يعني نقصًا فيكِ. · Pull-quote: الكمال هنا
  ليس معيارًا عاليًا؛ إنه خوفٌ مهذّب من أن يراكِ أحدٌ قبل أن تشعري أنكِ كاملة.

### Lamhat cover copy (2 of 4 received)
Kicker: «لمحة» · **deep green + gold covers**

- **الكفؤة المنهَكة** — خريطة النمط الذي يُعطّل يومكِ وطاقتكِ وقراراتكِ
- **المتفادية الذكية** — خريطة النمط الذي يجعلكِ تدورين حول المهم دون أن تدخليه
- المبدعة المشتتة / أسيرة الكمال — not yet received.

### Tier color system (discovered from covers — use in product cards)
- **لمحات = deep emerald green** + gold
- **جذور نمطك = deep burgundy** + gold
- **نظام إعادة البناء = deep plum** + gold
This reconciles the design doc's "deep green" with the identity doc's "deep
plum": each product line owns a jewel tone; the page itself stays ivory.

Cover image files still needed from owner as actual files (all arrived as
pasted chat images): expected at `assets/covers/{lamhat,juthur,rebuild}-{mubdia,mutafadiya,kafua,asira}.jpg`.
Lamhat mubdia + asira covers may not exist yet.

## 4. Quiz (الاختبار) — nizamok.com/ikhtibar/

Blueprint = live quiz (snapshot in `reference/live-site/`): 12 scenario
questions, each with 4 options mapped to patterns; **الأقرب + الأبعد**
(closest +2 / farthest −1) forced-choice scoring; normalized percentages; email
gate before full reading; result = dominant pattern + supporting pattern +
percentage bars + per-pattern product offers.

Owner mandate: elevate far beyond the blueprint — a unique premium experience
where GCC women finish and say **"هذا أنا"**, converting into reports/products/
Interdash waitlist. Redesign depth choice pending (§8).

## 5. Landing page — nizamok.com

Structure per design doc (full copy in `reference/landing-quiz-design-doc.txt`):
1. Hero — افهمي النمط الذي يدير طاقتكِ قبل أن تحاولي تنظيم يومكِ · CTA: ابدئي
   الاختبار المجاني · secondary: شاهدي فكرة لوحة نظامك
2. ليست المشكلة دائمًا في جدولكِ (why)
3. مسار نظامك — 6 elegant step cards (quiz → free report → Lamhat → Interdash →
   Juthur → Rebuild)
4. لمحات نظامك — 4 premium product cards (per-pattern copy in design doc)
5. Interdash: framed YouTube showcase (label: قريبًا: لوحة نظامك التفاعلية) +
   waiting-list card (name, email, optional pattern) — MailerLite placeholder
6. ما القادم في نظامك؟ — Juthur قريبًا / Rebuild لاحقًا
7. Final CTA — ابدئي من النمط، لا من جلد الذات
8. Footer + disclaimer
+ NEW (owner request): a "team / من نحن" section — **content pending honesty
  decision (§8)**. No invented credentials will be published.

## 6. Interdash waiting-list page

Separate page (proposed `/interdash/`) + section on landing. Premium framed
video card (placeholder `INTERDASH_YOUTUBE_LINK` — owner will supply link
later), waiting-list form (الاسم الأول، البريد الإلكتروني، ما نمطكِ؟ اختياري),
button انضمي إلى القائمة, promise: لن نرسل لكِ رسائل مزعجة.

## 7. Guardrails

- Disclaimer (footer, all pages): محتوى نظامك مخصص للفهم الذاتي والتنظيم
  العملي، ولا يُعدّ تشخيصًا نفسيًا أو بديلًا عن مختص.
- No fake testimonials, invented statistics, fabricated team credentials, or
  guaranteed outcomes. Unreleased products must not look purchasable.

## 8. Decision log

Decided:
- Result flow: **reveal archetype on screen + email to unlock full reading/report** (2026-07-11)
- Accent direction: **deep plum + gold on ivory** (2026-07-11)
- Waiting list: **MailerLite, build with clear placeholder** (2026-07-11)
- Quiz base: owner's blueprint = live 12-question quiz; elevate it (2026-07-11)
- Interdash video: placeholder now, owner pastes YouTube link later (2026-07-11)

Pending (asked, awaiting owner):
1. Team section: real team (names/photos) vs. anonymous-but-real vs. honest
   philosophy section instead.
2. Pricing: 19/49/? vs 29/39/109 vs new.
3. Purchasable now: all tiers everywhere vs. Lamhat-on-landing + all-on-result
   vs. Lamhat only.
4. Quiz redesign depth: cinematic two-act (recommended) vs. copy-elevation
   vs. radical day-simulation.
5. Covers: Juthur ×4, Rebuild ×4, Lamhat ×2 received as chat images — need all
   as actual files; do Lamhat mubdia/asira covers exist?
6. Confirm URLs: landing at `/`, quiz at `/ikhtibar/`, waitlist at `/interdash/`.
