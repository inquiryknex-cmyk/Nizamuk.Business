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
  (Zaraz -> GA4 -> silent no-op). Never email, names, or free text.

    - view_book_page        once per view, with book_pattern + campaign UTMs
    - view_product_preview  first time the visitor opens a product page image
    - begin_checkout        click on a CTA whose href IS the Dodo checkout
    - quiz_click_from_book  click on the secondary «اكتشفي نمطكِ» quiz button
    - scroll_50 / scroll_90 diagnostic only — NOT commercial conversions

  view_book_page replaces the former view_landing_page, and
  quiz_click_from_book replaces quiz_fallback_click. They are renames, not
  additions: firing both names for one page view or one click would be the
  same action counted twice.

  `purchase` is NOT fired here — a click on Dodo is not a sale. It fires on
  /shukran/ (see shukran.js), only on Dodo's own succeeded redirect, and
  deduplicated on payment_id. This file stashes the pending checkout so that
  page can attribute the sale to the right system.

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
    return { book_pattern: pattern, pattern_slug: pattern, page_path: location.pathname };
  }

  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  if (window.__nzRebuildBound) return;
  window.__nzRebuildBound = true;

  /* ---------- 1. Book page view, with campaign context ----------
     Guarded by the same __nzRebuildBound flag as everything below, so a
     double-included script can never double-count the view. */
  (function bookPageView() {
    var p = base();
    p.page_location = location.href;
    var q = new URLSearchParams(location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function (k) {
      var v = q.get(k);
      if (v) p[k] = v;
    });
    if (q.get('gclid')) p.has_gclid = true;
    track('view_book_page', p);
  })();

  /* ---------- 2. Checkout intent + quiz fallback ---------- */
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-rb-cta]') : null;
    if (!el) return;

    var kind = el.getAttribute('data-rb-cta');           // 'buy' | 'quiz'
    var href = el.getAttribute('href') || '';
    var p = base();
    p.cta_position = el.getAttribute('data-rb-pos') || 'unknown';

    if (kind === 'quiz') {
      p.page_origin = 'book_page';
      p.quiz_destination = href;
      track('quiz_click_from_book', p);
      return;
    }

    /* begin_checkout is a commercial signal, so it is spent only on a link
       that genuinely leaves for Dodo. A mislabelled or relative href — an
       ordinary in-page navigation — must never be counted as checkout intent. */
    if (href.indexOf('checkout.dodopayments.com') === -1) return;

    /* begin_checkout — intent only. Value is the listed price, not revenue. */
    p.value = cfg.price || 109;
    p.currency = cfg.currency || 'SAR';
    p.items = [{ item_id: 'rebuild-' + pattern, item_name: cfg.patternName || pattern, price: cfg.price || 109, quantity: 1 }];
    track('begin_checkout', p);

    /* Remember which system she is buying so /shukran/ can attribute the sale.
       Dodo's return URL carries payment_id and status but not the product, and
       stashing it here beats threading it through a query string Dodo also
       appends to. No personal data — pattern, price, currency only. */
    try {
      localStorage.setItem('nz_pending_checkout', JSON.stringify({
        pattern: pattern,
        name: cfg.patternName || pattern,
        value: cfg.price || 109,
        currency: cfg.currency || 'SAR'
      }));
    } catch (e) { /* private mode — purchase still fires, just without item detail */ }
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
