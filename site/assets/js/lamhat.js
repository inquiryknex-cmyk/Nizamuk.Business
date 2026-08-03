/*
  NizamOk — «لمحات نظامك» sale pages, shared behavior.

  The pattern is read from `<body data-lm-pattern>`, so the page needs no
  inline config block the way /rebuild/ does.

  Events go through the shared trackEvent pipeline in analytics.js
  (Zaraz -> GA4 -> silent no-op). Never email, names, or free text.

    - view_book_page        once per view, with book_pattern + campaign UTMs
    - begin_checkout        click on a CTA whose href IS the Dodo checkout
    - quiz_click_from_book  click on the «اكتشفي نمطكِ» button

  Event NAMES are deliberately the same as the /rebuild/ pages'. The rung is
  carried in `level`, not in the event name, so revenue-by-rung stays a single
  dimension and the funnel can be read across the ladder in one report. Adding
  a `view_lamhat_page` would split the same funnel into two incomparable ones.

  `purchase` is NOT fired here — a click on Dodo is not a sale. It is fired
  server-side by src/worker.mjs when Dodo's signed `payment.succeeded` webhook
  arrives. What this file must do is hand the visitor's GA4 identity to Dodo on
  the way out as `metadata_*` query params. Without them the webhook cannot say
  which session bought, GA4 invents a new user, and the sale is attributed to
  nobody — the exact failure that made the old hand-deployed worker useless for
  campaigns. `metadata_level` matters just as much: absent it, the worker
  defaults to `rebuild` and a 19 SAR sale is filed under the 109 product.

  CTA hrefs are real links in the markup, so checkout works with JS disabled;
  this file only measures and decorates.
*/
(function () {
  'use strict';

  var pattern = (document.body && document.body.getAttribute('data-lm-pattern')) || 'unknown';

  function track(name, params) {
    if (typeof window.trackEvent === 'function') window.trackEvent(name, params || {});
  }

  function base() {
    return { book_pattern: pattern, pattern_slug: pattern, page_path: location.pathname };
  }

  /* ---------- GA4 identity, read from the tag's own cookies ----------
     Same approach as rebuild.js, and the same caveat: best-effort. A blocked
     cookie or a consent tool that has not run yet means the webhook falls back
     to a synthetic id, which still records revenue but loses attribution. */

  function readCookie(name) {
    var re = new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)');
    var match = document.cookie.match(re);
    return match ? decodeURIComponent(match[1]) : '';
  }

  /* _ga = GA1.1.1234567890.1234567890 — the client id is the last two fields,
     not the whole value. Sending the whole value silently breaks the join. */
  function ga4ClientId() {
    var parts = readCookie('_ga').split('.');
    return parts.length >= 4 ? parts.slice(-2).join('.') : '';
  }

  /* _ga_<MEASUREMENT_ID minus the G- prefix> = GS1.1.<session_id>.<count>.… */
  function ga4SessionId() {
    var cfgAnalytics = (window.NIZAMOK && window.NIZAMOK.analytics) || {};
    var suffix = String(cfgAnalytics.ga4Id || '').replace(/^G-/, '');
    if (!suffix) return '';
    var parts = readCookie('_ga_' + suffix).split('.');
    return parts.length >= 3 ? parts[2] : '';
  }

  if (window.__nzLamhatBound) return;
  window.__nzLamhatBound = true;

  /* ---------- 1. Page view, with campaign context ---------- */
  (function pageView() {
    var p = base();
    p.page_location = location.href;
    var q = new URLSearchParams(location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
      if (q.get(k)) p[k] = q.get(k);
    });
    if (q.get('gclid')) p.has_gclid = true;
    p.level = 'lamhat';
    track('view_book_page', p);
  })();

  /* ---------- 2. Checkout intent, and the identity handoff ---------- */
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-lm-cta]') : null;
    if (!el) return;

    var kind = el.getAttribute('data-lm-cta');       // 'buy' | 'quiz'
    var href = el.getAttribute('href') || '';
    var p = base();
    p.cta_position = el.getAttribute('data-lm-pos') || 'unknown';

    if (kind === 'quiz') {
      p.page_origin = 'lamhat_page';
      p.quiz_destination = href;
      track('quiz_click_from_book', p);
      return;
    }

    /* begin_checkout is a commercial signal, so it is spent only on a link
       that genuinely leaves for Dodo. A relative href — an ordinary in-page
       navigation — must never be counted as checkout intent. */
    if (href.indexOf('checkout.dodopayments.com') === -1 && href.indexOf('dodo.pe/') === -1) return;

    var level = el.getAttribute('data-level') || 'lamhat';
    var price = parseInt(el.getAttribute('data-price'), 10) || 19;

    p.value = price;
    p.currency = 'SAR';
    p.level = level;
    p.items = [{ item_id: level + '-' + pattern, item_name: level + '-' + pattern, price: price, quantity: 1 }];
    track('begin_checkout', p);

    /* Decorate the outgoing checkout URL. Capture phase, before the browser
       acts on the click, and `set` rather than `append` so a second click is
       idempotent. Failure here must never block the sale. */
    try {
      var checkout = new URL(el.href, location.href);
      var cid = ga4ClientId();
      var sid = ga4SessionId();
      if (cid) checkout.searchParams.set('metadata_ga_cid', cid);
      if (sid) checkout.searchParams.set('metadata_ga_sid', sid);
      checkout.searchParams.set('metadata_pattern', pattern);
      checkout.searchParams.set('metadata_level', level);
      el.href = checkout.toString();
    } catch (err) { /* decoration is optional — never block the sale over it */ }
  }, true);
})();
