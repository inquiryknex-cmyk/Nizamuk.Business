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

1. **Images** — the production HTML references
   `https://nizamok.com/assets/email/seal.png` and `…/wordmark.png`
   (committed under `site/assets/email/`). They go live on the next deploy.
   Alternatively, upload the two files from any ZIP's `images/` folder to
   MailerLite's file manager and swap the two `src` URLs.
2. **Download button** — each report links to
   `https://nizamok.com/reports/<slug>.pdf` as a placeholder. Replace with the
   actual hosted PDF URL (or the MailerLite file-download URL) per pattern. If
   the automation attaches the PDF instead, point the button at the re-download
   link or change its label.
3. `{$unsubscribe}` is a MailerLite merge tag — leave as-is.

Regenerate from `scratchpad/gen_reports.py` (writes both the hosted-URL
production copies here and the relative-path ZIP previews).
