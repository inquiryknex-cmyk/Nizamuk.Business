# NizamOk pattern report emails

Four premium Arabic (RTL) report-delivery emails — one per dominant pattern —
sent by the MailerLite automation attached to each quiz form. Each email is the
**cover** that delivers the free first report and opens the product ladder.

## Files

| Pattern | النمط | File |
|---|---|---|
| Kafua | الكفؤة المُنهكة | `report-kafua.html` |
| Mubdia | المبدعة المشتّتة | `report-mubdia.html` |
| Mutafadiya | المتفادية الذكية | `report-mutafadiya.html` |
| Asira | أسيرة الكمال | `report-asira.html` |

Also shipped as self-contained ZIPs (HTML + bundled `images/`) for preview and
for uploading the two logo assets to MailerLite's file manager.

## Structure (shared template, per-pattern copy)

Header → pattern reveal + self-quote → precise diagnosis → *what's in your
report* (deep-green box) → **download report** (primary CTA) → Lamhat card
(19 SAR, secondary CTA) → dashboard waitlist (tertiary, outline CTA) → journey
ladder → footer. Exactly three primary actions, in descending visual weight.

## Subject lines (set these in MailerLite)

- **Kafua** — `تقريركِ جاهز: حين تصبح الكفاءة استنزافًا صامتًا`
- **Mubdia** — `تقريركِ جاهز: ليست المشكلة أنكِ لا تبدأين`
- **Mutafadiya** — `تقريركِ جاهز: حين يتخفّى التأجيل في صورة استعداد`
- **Asira** — `تقريركِ جاهز: عندما تتحوّل الجودة إلى شرطٍ للبدء`

The matching preview/preheader text is already baked into each file (hidden
`<div>` at the top of `<body>`) and also appears in `<!-- SUBJECT: … -->`.

## Wiring before sending

1. **Images** — bundled with each email as relative `images/nizamok-logo.png`
   (mandala seal) / `images/nizamok-wordmark.png` (NizamOk wordmark), in every
   ZIP and under `docs/emails/images/`. Each ZIP holds `index.html` and
   `images/` **at its root** (no wrapper folder) so MailerLite's Custom-HTML ZIP
   import resolves the relative paths and re-hosts the two files to its CDN.
   Nothing depends on an untested public host.
2. **Download button** — wired to the hosted MailerLite report PDFs, verified
   per pattern by MD5 + PDF cover + live HTTP 200 (owner-confirmed 2026-07-13):

   | Pattern | Report PDF |
   |---|---|
   | Kafua | `…/mailerlite-uploads-prod/t2429254/DvhyDTlW…8uB8.pdf` |
   | Mubdia | `…/mailerlite-uploads-prod/O2429254/U7iYbjTV…3GnH.pdf` |
   | Mutafadiya | `…/mailerlite-uploads-prod/V2429254/23gYnHKd…PAAq.pdf` |
   | Asira | `…/mailerlite-uploads-prod/b2429254/AlJn2cFi…B4GT.pdf` |

   Button label (fixed, all four): **«حمّلي تقريركِ المجاني»**. No PDF is
   attached — every report is a hosted download link.
3. Lamhat shows **١٩ ريالًا** and links to the pattern's Dodo checkout. The
   لوحة نمطكِ التفاعلية waitlist is the lighter, tertiary CTA.
4. **Waitlist button URL** is currently the live testing target
   `https://nizamok.nizamuk.workers.dev/interdash/` (verified HTTP 200). **Before
   public activation, swap it for the final intended URL
   `https://nizamok.com/interdash/`** (set `DASH_URL` in `gen_reports.py`).
5. The interactive-board **video is not live yet**, so the old
   «شاهدي كيف تعمل» link is replaced by plain text «فيديو اللوحة التفاعلية قريبًا»
   (no hyperlink). Wire it to the real video URL once available.
6. `{$unsubscribe}` is a MailerLite merge tag — leave as-is.

Regenerate from `scratchpad/gen_reports.py` (writes the repo copies here and the
identical relative-path ZIP packages, and drops `images/` into both).
