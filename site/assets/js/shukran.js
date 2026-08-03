/*
  NizamOk — post-payment page.

  THIS PAGE NO LONGER FIRES `purchase`.

  It used to, on Dodo's `?payment_id=…&status=succeeded` redirect, deduplicated
  in localStorage. That was honest but forgeable — anyone could type the URL —
  and it could only ever report the 109 it was hard-coded with, never what the
  visitor was actually charged.

  The conversion now comes from Dodo's signed `payment.succeeded` webhook, in
  src/worker.mjs, where the amount is the real one and the signature is proof.

  There must never be two sources. If you are tempted to re-add a client-side
  fire here "just in case the webhook misses one", read docs §5 first: every
  real sale would then be counted twice, which is a worse failure than a late
  one, and much harder to notice.

  What remains is copy: a failed or cancelled payment must not be greeted with
  "thank you".
*/
(function () {
  'use strict';

  var q = new URLSearchParams(location.search);
  var paymentId = q.get('payment_id') || q.get('paymentId') || '';
  var status = (q.get('status') || '').toLowerCase();

  /* ---------- Adapt the page when the payment did not succeed ---------- */
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
  }

  /* ---------- Clear the keys the old client-side flow left behind ----------
     Nothing writes these any more. Buyers from before the switch would
     otherwise carry them indefinitely. */
  try {
    localStorage.removeItem('nz_pending_checkout');
    localStorage.removeItem('nz_seen_payments');
  } catch (e) { /* private mode — nothing was stored to begin with */ }
})();
