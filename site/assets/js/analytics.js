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

  /* ----------------------------------------------------------------
     Tag loader. Reads ids from config.js (loaded before this file on
     every page). With no id configured nothing is injected at all —
     no requests, no cookies, no console noise — and track() falls
     through to Zaraz or to a silent no-op exactly as before.
     ---------------------------------------------------------------- */
  (function loadTags() {
    var cfg = (window.NIZAMOK && window.NIZAMOK.analytics) || {};
    var gtmId = (cfg.gtmId || '').trim();
    var ga4Id = (cfg.ga4Id || '').trim();

    function inject(src) {
      var el = document.createElement('script');
      el.async = true;
      el.src = src;
      document.head.appendChild(el);
    }

    if (gtmId) {
      /* GTM owns the tags from here; GA4 is configured inside the container. */
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      inject('https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(gtmId));
      window.NIZAMOK_GTM_READY = true;
      return;
    }

    if (ga4Id) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());

      /* GA4 DebugView only shows devices in debug mode. Add ?debug_mode=1 to
         any page to switch it on, and it sticks for the rest of the tab —
         which matters because the purchase test crosses pages: landing →
         Dodo → /shukran/. Add ?debug_mode=0 to turn it back off. */
      var debugOn = false;
      try {
        var qd = new URLSearchParams(location.search).get('debug_mode');
        if (qd === '1' || qd === 'true') sessionStorage.setItem('nz_ga_debug', '1');
        if (qd === '0' || qd === 'false') sessionStorage.removeItem('nz_ga_debug');
        debugOn = sessionStorage.getItem('nz_ga_debug') === '1';
      } catch (e) { /* private mode — debug simply stays off */ }

      var conf = { allow_ad_personalization_signals: false };  /* no pain-signal remarketing */
      if (debugOn) conf.debug_mode = true;
      window.gtag('config', ga4Id, conf);

      inject('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ga4Id));
      window.NIZAMOK_GA_READY = true;
      window.NIZAMOK_GA_DEBUG = debugOn;
    }
  })();

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
      if (window.NIZAMOK_GTM_READY === true && window.dataLayer) {
        window.dataLayer.push(Object.assign({ event: name }, p));
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
