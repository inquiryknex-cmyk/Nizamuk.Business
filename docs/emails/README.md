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
2. **Download button** — wired to the hosted **v4** report PDFs, verified per
   pattern by MD5-identity to the delivered v4 files + live HTTP 200
   (owner-confirmed 2026-07-13):

   | Pattern | Report PDF (v4) |
   |---|---|
   | Kafua | `…/mailerlite-uploads-prod/22429254/GmIP92p5…ODILX.pdf` |
   | Mubdia | `…/mailerlite-uploads-prod/b2429254/yrlslIoz…4OqU.pdf` |
   | Mutafadiya | `…/mailerlite-uploads-prod/a2429254/idiNbemJ…DIDCR.pdf` |
   | Asira | `…/mailerlite-uploads-prod/E2429254/KmoGKs5o…PbhBm.pdf` |

   Button label (fixed, all four): **«حمّلي تقريركِ المجاني»**. No PDF is
   attached — every report is a hosted download link.
3. Lamhat shows **١٩ ريالًا** and links to the pattern's Dodo checkout. The
   لوحة نمطكِ التفاعلية waitlist is the lighter, tertiary CTA.
4. **Waitlist button URL** is the production apex page
   `https://nizamok.com/interdash/` (set `DASH_URL` in `gen_reports.py`). It goes
   live once the custom domain is attached.
5. Below the waitlist button, the secondary text link
   «شاهدي فكرة لوحة نظامكِ التفاعلية» points to the same Interdash page
   (`DASH_URL`) — the concept page, live and HTTP 200. It updates together with
   the waitlist button when `DASH_URL` is swapped for the production domain.
6. `{$unsubscribe}` is a MailerLite merge tag — leave as-is.

Regenerate from `scratchpad/gen_reports.py` (writes the repo copies here and the
identical relative-path ZIP packages, and drops `images/` into both).
