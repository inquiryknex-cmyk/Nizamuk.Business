/*
  NizamOk — Google Search landing pages, shared behavior.

  Each landing page declares its variant before this script loads:
      window.NIZAMOK_LANDING = { variant: 'not_finishing' };

  Events (sent through the shared trackEvent pipeline in analytics.js —
  Zaraz → GA4 → silent no-op; never email, names, or free text):
    · google_landing_view  { landing_variant, page_path, source_context }
    · quiz_cta_click       { landing_variant, cta_position, destination, page_path }

  CTA links opt in with data-cta-position="hero" | "middle" | "final".
  The __nzLandingBound guard makes both the view event and the click
  listener idempotent if the script is ever included twice.
*/
(function () {
  'use strict';

  var variant = (window.NIZAMOK_LANDING || {}).variant || 'unknown';

  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  if (window.__nzLandingBound) return;
  window.__nzLandingBound = true;

  if (window.trackEvent) {
    window.trackEvent('google_landing_view', {
      landing_variant: variant,
      page_path: location.pathname,
      source_context: 'google_ads_landing'
    });
  }

  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-cta-position]') : null;
    if (!el || !window.trackEvent) return;
    window.trackEvent('quiz_cta_click', {
      landing_variant: variant,
      cta_position: el.getAttribute('data-cta-position'),
      destination: el.getAttribute('href') || '/ikhtibar/',
      page_path: location.pathname
    });
  }, true);
})();
