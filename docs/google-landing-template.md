# Google Search landing template (`/google/*`)

Paid-search conversion pages for Google Ads. One reusable template
("GoogleSearchLandingPage" in a no-build static stack), instantiated per
search-intent variant. The pages send visitors to the existing quiz at
`/ikhtibar/` and change nothing else in the funnel.

## Live variants

| Route | `landing_variant` | Search intent |
|---|---|---|
| `/google/not-finishing/` | `not_finishing` | لماذا أبدأ ولا أكمل / أبدأ بحماس ثم أتوقف |
| `/google/procrastination/` | `procrastination` | كيف أتخلص من التسويف / لماذا أؤجل كل شيء |

## Architecture

The project is a framework-free static site (no build step), so the
"component" is three shared pieces plus per-variant static HTML — the copy
stays server-rendered and crawlable, per the project's static-rendering rule:

- `site/assets/css/landing.css` — all landing-specific layout. Everything
  else (velvet surface, glass cards, kicker, buttons, topbar, footer, focus
  states, fonts, tokens) is reused from `main.css`.
- `site/assets/js/landing.js` — shared behavior: fires analytics events and
  fills `[data-year]`. Idempotent (guarded against double inclusion).
- `site/google/<variant>/index.html` — the template instance. Roughly 80% of
  the markup is the shared skeleton; only the copy blocks below vary.

## The "props" of a variant

To create a new variant, copy an existing page and change only:

1. `<title>`, meta description, OG/Twitter tags, canonical URL
2. Hero: eyebrow (`.kicker`), `<h1>`, `.lead`, hero CTA label
3. Recognition section: heading + five `<li>` items
4. Bridge section: heading + paragraph
5. `window.NIZAMOK_LANDING = { variant: '<snake_case_variant>' }`

Everything else (pattern preview, what-you-get, how-it-works, boundary,
privacy, final CTA, footer) is shared copy and must stay identical unless a
deliberate product decision changes it for all variants.

## Non-negotiables baked into the template

- `robots: noindex, follow`; self-referencing canonical; not in
  `sitemap.xml`; not blocked in `robots.txt` (Google Ads crawlers need
  access).
- All primary CTAs link to `/ikhtibar/` with `data-cta-position`
  (`hero` | `middle` | `final`). Exactly three CTAs per page.
- No paid products surfaced; no clinical language; the four pattern names
  are fixed.
- `lang="ar" dir="rtl"`, mobile-first, no GSAP/animation libraries loaded.

## Analytics contract

Events go through `window.trackEvent` (`analytics.js`: Zaraz → GA4 →
silent no-op). No email, names, or free text.

- `google_landing_view` — once per pageview:
  `{ landing_variant, page_path, source_context: 'google_ads_landing' }`
- `quiz_cta_click` — per CTA click:
  `{ landing_variant, cta_position, destination, page_path }`
- Down-funnel events already exist in the quiz itself: `quiz_start`,
  `quiz_complete`, and `report_email_submit` (the email-gate event's
  established name — kept for GA4 continuity rather than renaming to
  `email_submitted`).

Attribution note: CTA links deliberately carry **no UTM parameters** so
Google Ads auto-tagging (`gclid`) remains the source of truth in GA4.
