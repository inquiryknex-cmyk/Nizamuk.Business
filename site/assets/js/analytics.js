/*
  NizamOk — privacy-conscious funnel analytics.

  Provider order (first available wins), then silent no-op:
    1. Cloudflare Zaraz   → window.zaraz.track(name, params)
    2. GA4 (only if real) → window.gtag('event', name, params)   [needs window.NIZAMOK_GA_READY === true]
    3. none configured    → fail silently (never throws, never logs)

  PRIVACY: never pass email, name, full quiz answers, free-text, report content,
  or payment data. Only the whitelisted params below are ever sent.

  Page-level analytics (pageviews) are enabled with ZERO code by turning on
  Cloudflare Web Analytics / Zaraz in the Cloudflare dashboard for this zone —
  do not paste an invented beacon token here.
*/
(function () {
  'use strict';

  function track(name, params) {
    try {
      if (!name) return;
      var p = params || {};
      if (window.zaraz && typeof window.zaraz.track === 'function') {
        window.zaraz.track(name, p);
        return;
      }
      if (typeof window.gtag === 'function' && window.NIZAMOK_GA_READY === true) {
        window.gtag('event', name, p);
        return;
      }
      /* no provider yet → silent */
    } catch (e) { /* never break the user experience */ }
  }

  window.trackEvent = track;

  /* Delegated click tracking for product CTAs carrying data-ev
     (lamhat_click / juthur_click / rebuild_click). Capture phase so it still
     fires on links that open a new tab. */
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-ev]') : null;
    if (!el) return;
    var d = el.dataset || {};
    var params = { page_path: location.pathname };
    if (d.pattern) params.pattern_slug = d.pattern;
    if (d.level)   params.product_level = d.level;
    if (d.section) params.source_section = d.section;
    track(d.ev, params);
  }, true);
})();
