/*
  NizamOk — «نظام إعادة البناء» sale pages, shared behavior.

  Each page declares itself before this script loads:

      window.NIZAMOK_REBUILD = {
        pattern: 'mubdia',                 // mubdia | asirat | kafua | mutafadia
        patternName: 'المبدعة المشتّتة',
        price: 109,
        currency: 'SAR'
      };

  Events go through the shared trackEvent pipeline in analytics.js
  (Zaraz → GA4 → silent no-op). Never email, names, or free text.

    · view_landing_page     once per view, with pattern + campaign UTMs
    · view_product_preview  first time the visitor opens a product page image
    · begin_checkout        click on any CTA heading to Dodo
    · quiz_fallback_click   click on the secondary «ابدئي الاختبار المجاني» link
    · scroll_50 / scroll_90 diagnostic only — NOT commercial conversions

  `purchase` is NOT fired here — a click on Dodo is not a sale. It is fired
  server-side by src/worker.js when Dodo's signed `payment.succeeded` webhook
  arrives. What this file must do is hand the visitor's GA4 identity to Dodo on
  the way out, as `metadata_*` query params: without them the webhook has no
  way to say WHICH session bought, GA4 invents a new user, and the sale is
  attributed to nobody.

  CTA hrefs are real links in the markup, so checkout works with JS disabled;
  this file only measures and reveals.
*/
(function () {
  'use strict';

  var cfg = window.NIZAMOK_REBUILD || {};
  var pattern = cfg.pattern || 'unknown';

  function track(name, params) {
    if (typeof window.trackEvent === 'function') window.trackEvent(name, params || {});
  }

  /* Base params carried by every event on this page. */
  function base() {
    return { pattern_slug: pattern, page_path: location.pathname };
  }

  /* ---------- GA4 identity, read straight from the tag's own cookies ----------
     There is no supported synchronous API for these, and gtag's callback form
     is not reliable during a navigating click, so we parse the cookies gtag
     writes. Both are best-effort: a blocked cookie or a consent tool that has
     not run yet simply means the webhook falls back to a synthetic id, which
     records the revenue but loses the attribution. */

  function cookie(name) {
    /* not `pattern` — that name already means the visitor's slug in this file */
    var re = new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)');
    var match = document.cookie.match(re);
    return match ? decodeURIComponent(match[1]) : '';
  }

  /* _ga = GA1.1.1234567890.1234567890 — the client id is the last two fields,
     not the whole value. Sending the whole value silently breaks the join. */
  function ga4ClientId() {
    var parts = cookie('_ga').split('.');
    return parts.length >= 4 ? parts.slice(-2).join('.') : '';
  }

  /* _ga_<MEASUREMENT_ID minus the G- prefix> = GS1.1.<session_id>.<count>.… */
  function ga4SessionId() {
    var cfgAnalytics = (window.NIZAMOK && window.NIZAMOK.analytics) || {};
    var suffix = String(cfgAnalytics.ga4Id || '').replace(/^G-/, '');
    if (!suffix) return '';
    var parts = cookie('_ga_' + suffix).split('.');
    return parts.length >= 3 ? parts[2] : '';
  }

  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  if (window.__nzRebuildBound) return;
  window.__nzRebuildBound = true;

  /* ---------- 1. Landing view, with campaign context ---------- */
  (function landingView() {
    var p = base();
    var q = new URLSearchParams(location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function (k) {
      var v = q.get(k);
      if (v) p[k] = v;
    });
    if (q.get('gclid')) p.has_gclid = true;
    track('view_landing_page', p);
  })();

  /* ---------- 2. Checkout intent + quiz fallback ---------- */
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-rb-cta]') : null;
    if (!el) return;

    var kind = el.getAttribute('data-rb-cta');           // 'buy' | 'quiz'
    var p = base();
    p.cta_position = el.getAttribute('data-rb-pos') || 'unknown';

    if (kind === 'quiz') {
      p.destination = el.getAttribute('href') || '/ikhtibar/';
      track('quiz_fallback_click', p);
      return;
    }

    /* begin_checkout — intent only. Value is the listed price, not revenue. */
    p.value = cfg.price || 109;
    p.currency = cfg.currency || 'SAR';
    p.items = [{ item_id: 'rebuild-' + pattern, item_name: cfg.patternName || pattern, price: cfg.price || 109, quantity: 1 }];
    track('begin_checkout', p);

    /* Hand our GA4 identity to Dodo. Its checkout collects every query
       parameter into the session it creates and returns the `metadata_*` ones
       on the webhook, which is how src/worker.js learns who bought and what.

       The href in the markup is already a complete, working checkout link —
       we only decorate it. Rewriting it here (capture phase, before the
       browser acts on the click) keeps checkout functional with JS disabled,
       and `set` rather than `append` keeps a second click idempotent.

       No personal data crosses: an opaque analytics id and a pattern slug. */
    try {
      var checkout = new URL(el.href, location.href);
      var cid = ga4ClientId();
      var sid = ga4SessionId();
      if (cid) checkout.searchParams.set('metadata_ga_cid', cid);
      if (sid) checkout.searchParams.set('metadata_ga_sid', sid);
      checkout.searchParams.set('metadata_pattern', pattern);
      el.href = checkout.toString();
    } catch (e) { /* decoration is optional — never block the sale over it */ }
  }, true);

  /* ---------- 3. Mobile sticky bar — appears once the hero is passed ---------- */
  (function stickyBar() {
    var bar = document.querySelector('[data-rb-sticky]');
    var hero = document.querySelector('[data-rb-hero]');
    if (!bar || !hero || !('IntersectionObserver' in window)) return;

    /* Default root and threshold: the bar arrives only once the hero chamber
       is entirely above the viewport — «بعد أن تتجاوز الزائرة القسم الأول». */
    new IntersectionObserver(function (entries) {
      bar.classList.toggle('is-on', !entries[0].isIntersecting);
    }).observe(hero);
  })();

  /* ---------- 4. Product gallery — only show shots that actually exist ----------
     Every figure starts hidden. We probe its image; a figure appears only once
     its file loads. The section itself stays hidden until at least one does, so
     a page with no screenshots yet never shows an empty or broken gallery. */
  (function gallery() {
    var section = document.querySelector('[data-rb-gallery]');
    if (!section) return;

    var shots = section.querySelectorAll('.rb-shot');
    var shown = 0;

    shots.forEach(function (fig) {
      var img = fig.querySelector('img');
      if (!img) return;
      var src = img.getAttribute('data-src');
      if (!src) return;

      var probe = new Image();
      probe.onload = function () {
        img.src = src;
        fig.hidden = false;
        if (++shown === 1) section.hidden = false;
      };
      probe.src = src;
    });
  })();

  /* ---------- 5. Lightbox for the gallery ---------- */
  (function lightbox() {
    var box = document.querySelector('[data-rb-lightbox]');
    if (!box) return;

    var img = box.querySelector('img');
    var previewTracked = false;
    var lastTrigger = null;

    function open(src, alt, caption) {
      img.src = src;
      img.alt = alt || '';
      box.hidden = false;
      document.body.style.overflow = 'hidden';
      box.querySelector('.rb-lightbox-close').focus();

      if (!previewTracked) {
        previewTracked = true;
        var p = base();
        if (caption) p.preview_item = caption;
        track('view_product_preview', p);
      }
    }

    function close() {
      box.hidden = true;
      img.removeAttribute('src');
      document.body.style.overflow = '';
      if (lastTrigger) lastTrigger.focus();
    }

    document.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('.rb-shot button') : null;
      if (btn) {
        var shot = btn.querySelector('img');
        var cap = btn.closest('figure').querySelector('figcaption');
        lastTrigger = btn;
        /* The tile is a 3:4 crop; the lightbox shows the whole page. */
        open(btn.getAttribute('data-full') || shot.currentSrc || shot.src, shot.alt, cap ? cap.textContent.trim() : '');
        return;
      }
      if (!box.hidden && (e.target === box || e.target.closest('.rb-lightbox-close'))) close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !box.hidden) close();
    });
  })();

  /* ---------- 6. Scroll depth — diagnostic only ---------- */
  (function scrollDepth() {
    var marks = [
      { at: 0.5, name: 'scroll_50', done: false },
      { at: 0.9, name: 'scroll_90', done: false }
    ];

    function check() {
      var doc = document.documentElement;
      var scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      var ratio = (window.scrollY || doc.scrollTop) / scrollable;

      marks.forEach(function (m) {
        if (!m.done && ratio >= m.at) {
          m.done = true;
          track(m.name, base());
        }
      });

      if (marks.every(function (m) { return m.done; })) {
        window.removeEventListener('scroll', onScroll);
      }
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; check(); });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
  })();
})();
