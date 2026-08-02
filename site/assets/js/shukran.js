/*
  NizamOk — post-payment page.

  Fires the ONE conversion that matters: `purchase`, value 109, currency SAR,
  with Dodo's real transaction id.

  What makes this safe to fire client-side:

    - It requires Dodo's own return parameters. Dodo redirects here with
      ?payment_id=pay_…&status=succeeded. No payment_id, or any status other
      than succeeded, and nothing is sent.
    - It is deduplicated on payment_id in localStorage, so refreshing, going
      back, or re-opening the link never counts a second sale.
    - The item detail comes from the checkout the visitor actually started
      (stashed by rebuild.js), not from a URL parameter.

  What this still is NOT: cryptographic proof of payment. A determined person
  could hand-craft a URL. For an unarguable server-verified conversion, use
  Dodo's webhook or its native GA4/GTM integration and treat this as the
  fallback. That trade-off is deliberate and documented in
  docs/rebuild-landing-pages.md §القياس.

  The page's human-facing copy also adapts: a failed or cancelled payment must
  not be greeted with "thank you".
*/
(function () {
  'use strict';

  var SEEN_KEY = 'nz_seen_payments';
  var PENDING_KEY = 'nz_pending_checkout';

  var q = new URLSearchParams(location.search);
  var paymentId = q.get('payment_id') || q.get('paymentId') || '';
  var status = (q.get('status') || '').toLowerCase();

  /* ---------- 1. Adapt the page when the payment did not succeed ---------- */
  if (paymentId && status && status !== 'succeeded') {
    var head = document.querySelector('[data-shukran-head]');
    var body = document.querySelector('[data-shukran-body]');
    if (head) head.textContent = 'لم تكتمل العملية';
    if (body) {
      body.textContent = 'لم يتم خصم أي مبلغ. يمكنكِ المحاولة مرة أخرى، أو مراسلتنا على '
        + 'support@nizamok.com وسنساعدكِ في إتمام الطلب.';
    }
    /* There is no file and no account to open, so anything that presumes a
       completed purchase — the billing-portal line, the "first step" card —
       is removed rather than left to contradict the heading. */
    document.querySelectorAll('[data-shukran-onsuccess]').forEach(function (el) {
      el.hidden = true;
    });
    return;
  }

  /* ---------- 2. Fire purchase once, on a real confirmation ---------- */
  if (!paymentId || status !== 'succeeded') return;
  if (typeof window.trackEvent !== 'function') return;

  var seen = [];
  try { seen = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'); } catch (e) { seen = []; }
  if (seen.indexOf(paymentId) !== -1) return;          // already counted

  var pending = null;
  try { pending = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null'); } catch (e) { /* ignore */ }

  var value = (pending && pending.value) || 109;
  var currency = (pending && pending.currency) || 'SAR';

  var params = {
    transaction_id: paymentId,
    value: value,
    currency: currency,
    page_path: location.pathname
  };
  if (pending && pending.pattern) {
    /* The rung, not a hard-coded 'rebuild-'. The ladder sells three products
       per pattern, and `value` above already carries the right price — filing a
       19 SAR «لمحات» sale under the 109 item would disagree with its own value
       and corrupt revenue-by-item. This matches the item_id begin_checkout
       sends from rebuild.js, so intent and purchase join on one key. */
    var level = pending.level || 'rebuild';
    params.pattern_slug = pending.pattern;
    params.level = level;
    params.items = [{
      item_id: level + '-' + pending.pattern,
      item_name: pending.name || pending.pattern,
      price: value,
      quantity: 1
    }];
  }

  window.trackEvent('purchase', params);

  try {
    seen.push(paymentId);
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen.slice(-50)));
    localStorage.removeItem(PENDING_KEY);
  } catch (e) { /* dedupe is best-effort in private mode */ }
})();
