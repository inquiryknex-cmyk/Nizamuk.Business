/*
  NizamOk — Cloudflare Worker.

  This project was an assets-only Worker until the purchase conversion moved
  server-side. It now serves the same static site plus ONE endpoint:

      POST hooks.nizamok.com/dodo     → Dodo `payment.succeeded` webhook

  Everything else is handed straight to the static assets binding, so the site
  behaves exactly as it did before.

  WHY THIS EXISTS
  ---------------
  The purchase conversion used to fire from the browser on /shukran/. That was
  honest but forgeable — a hand-crafted URL could fake a sale. It has been
  retired in favour of this endpoint, which only trusts a payload Dodo signed.
  There must never be two sources for `purchase`: see docs §5.

  THE TEST-MODE GUARD
  -------------------
  Dodo's own GA4 integration cannot tell test payments from live ones, which is
  how two sandbox payments were once reported as SAR 21,797.78 of revenue. Here
  the guard is structural rather than a flag we remember to set: this Worker
  holds only the LIVE webhook secret, so a test-mode webhook fails signature
  verification and is rejected before it can reach Analytics. isTestPayment()
  below is a second line of defence, not the primary one.
*/

const WEBHOOK_PATHS = new Set(['/dodo', '/api/dodo/webhook']);
const GA4_ENDPOINT = 'https://www.google-analytics.com/mp/collect';

/* Standard Webhooks: reject anything older than this to blunt replays. */
const TIMESTAMP_TOLERANCE_SECONDS = 300;

/* Dedupe keys outlive any plausible Dodo retry window without growing forever. */
const DEDUPE_TTL_SECONDS = 60 * 60 * 24 * 30;

/* ------------------------------------------------------------------ *
 * Money
 * ------------------------------------------------------------------ */

/*
  Dodo reports amounts in the currency's MINOR unit. We know this the hard way:
  its GA4 integration sent 10900 for a 109 SAR product, and GA4 read it as
  SAR 10,900 — the 100× inflation that started this whole investigation.

  Most currencies have two decimal places, but not all, so the exponent is
  looked up rather than assumed. Getting this wrong is a silent 100× error in
  reported revenue, which is exactly the bug we are fixing.
*/
const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA',
  'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'
]);

const THREE_DECIMAL_CURRENCIES = new Set([
  'BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND'
]);

export function currencyExponent(currency) {
  const code = String(currency || '').toUpperCase();
  if (ZERO_DECIMAL_CURRENCIES.has(code)) return 0;
  if (THREE_DECIMAL_CURRENCIES.has(code)) return 3;
  return 2;
}

/* 10900 SAR-minor → 109. Rounded to the currency's precision so floating-point
   division can never emit 108.99999999999999 into a revenue report. */
export function minorToMajor(amountMinor, currency) {
  /* Number(null) and Number('') are both 0, so an absent amount would sail
     through a bare isFinite check and report a sale worth nothing. Reject the
     empty cases explicitly and let the caller treat it as an incomplete
     payload. */
  if (amountMinor === null || amountMinor === undefined || amountMinor === '') return null;

  const n = Number(amountMinor);
  if (!Number.isFinite(n)) return null;
  const exponent = currencyExponent(currency);
  return Number((n / Math.pow(10, exponent)).toFixed(exponent));
}

/* ------------------------------------------------------------------ *
 * Standard Webhooks signature verification
 * ------------------------------------------------------------------ */

function base64ToBytes(b64) {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/*
  Dodo issues secrets in the Standard Webhooks form `whsec_<base64>`, where the
  base64 payload is the raw key. Some deployments paste the key without the
  prefix, and a few providers treat the whole string as UTF-8 bytes — so we
  decode when it looks like base64 and fall back to raw bytes when it does not.
*/
export function secretToKeyBytes(secret) {
  const raw = String(secret || '').replace(/^whsec_/, '');
  try {
    return base64ToBytes(raw);
  } catch (e) {
    return new TextEncoder().encode(raw);
  }
}

/* Length-independent comparison — bail out on length, then XOR the rest so a
   matching prefix reveals nothing through timing. */
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function signPayload({ id, timestamp, body, secret }) {
  const key = await crypto.subtle.importKey(
    'raw',
    secretToKeyBytes(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signed = `${id}.${timestamp}.${body}`;
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signed));
  return bytesToBase64(new Uint8Array(mac));
}

/*
  Returns { ok: true } or { ok: false, reason } — never throws, so a malformed
  request is a 400 rather than a 500 that Dodo would keep retrying.

  The signature header carries a space-separated list of `v1,<base64>` pairs so
  a secret can be rotated without downtime; any one match is enough.
*/
export async function verifyStandardWebhook({ id, timestamp, signature, body, secret, nowSeconds }) {
  if (!id || !timestamp || !signature) return { ok: false, reason: 'missing_headers' };
  if (!secret) return { ok: false, reason: 'no_secret_configured' };

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return { ok: false, reason: 'bad_timestamp' };

  const now = Number.isFinite(nowSeconds) ? nowSeconds : Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > TIMESTAMP_TOLERANCE_SECONDS) return { ok: false, reason: 'stale_timestamp' };

  const expected = await signPayload({ id, timestamp, body, secret });
  const expectedBytes = base64ToBytes(expected);

  const candidates = String(signature)
    .split(' ')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => (part.includes(',') ? part.slice(part.indexOf(',') + 1) : part));

  for (const candidate of candidates) {
    let bytes;
    try {
      bytes = base64ToBytes(candidate);
    } catch (e) {
      continue;  /* a malformed entry must not abort a valid one after it */
    }
    if (timingSafeEqual(bytes, expectedBytes)) return { ok: true };
  }

  return { ok: false, reason: 'signature_mismatch' };
}

/* ------------------------------------------------------------------ *
 * Payload reading
 * ------------------------------------------------------------------ */

/*
  Dodo's docs do not commit to a test/live field in the payload, so rather than
  invent one we look for the shapes other processors use and treat "absent" as
  live. That is deliberately the permissive answer: the signature check above is
  what actually keeps sandbox traffic out, and defaulting to "test" here would
  silently discard real revenue.
*/
export function isTestPayment(event) {
  const data = (event && event.data) || {};
  for (const candidate of [event.livemode, data.livemode, event.live_mode, data.live_mode]) {
    if (typeof candidate === 'boolean') return candidate === false;
  }
  for (const candidate of [event.mode, data.mode, event.environment, data.environment]) {
    if (typeof candidate === 'string') return /test|sandbox/i.test(candidate);
  }
  return false;
}

/* Metadata keys arrive from `metadata_*` query params on the checkout link.
   Dodo nests them under data.metadata; we accept a couple of shapes because a
   missing client id costs attribution, not correctness. */
export function readMetadata(event) {
  const data = (event && event.data) || {};
  return data.metadata || data.custom_metadata || (event && event.metadata) || {};
}

export function extractPurchase(event) {
  const data = (event && event.data) || {};
  const metadata = readMetadata(event);

  const currency = data.currency || data.settlement_currency || 'SAR';
  const amountMinor = data.total_amount != null ? data.total_amount : data.amount;

  return {
    transactionId: data.payment_id || data.id || null,
    value: minorToMajor(amountMinor, currency),
    currency,
    clientId: metadata.ga_cid || null,
    sessionId: metadata.ga_sid || null,
    pattern: metadata.pattern || null
  };
}

/* ------------------------------------------------------------------ *
 * GA4 Measurement Protocol
 * ------------------------------------------------------------------ */

/*
  client_id is what stitches this server-side event to the browsing session
  that produced it. Without it GA4 invents a brand-new user and the sale is
  attributed to nobody — the very "journey breaks across the checkout domain"
  problem that once justified wiring Dodo directly into the property.

  rebuild.js reads it from the _ga cookie and forwards it through Dodo as
  metadata. When it is missing anyway (cookie blocked, JS off, direct link) we
  still record the revenue against a deterministic id derived from the
  transaction, and tag the event so those cases are countable in GA4 rather
  than invisible.
*/
export function buildPurchasePayload(purchase, { timestampSeconds } = {}) {
  const hasClientId = Boolean(purchase.clientId);
  const clientId = hasClientId ? purchase.clientId : syntheticClientId(purchase.transactionId);

  const params = {
    transaction_id: purchase.transactionId,
    value: purchase.value,
    currency: purchase.currency,
    engagement_time_msec: 1,
    attribution_source: hasClientId ? 'linked' : 'synthetic'
  };

  if (purchase.sessionId) params.session_id = purchase.sessionId;

  if (purchase.pattern) {
    params.pattern_slug = purchase.pattern;
    params.items = [{
      item_id: `rebuild-${purchase.pattern}`,
      item_name: `rebuild-${purchase.pattern}`,
      price: purchase.value,
      quantity: 1
    }];
  }

  const payload = {
    client_id: clientId,
    non_personalized_ads: true,   /* matches the site's no-remarketing stance */
    events: [{ name: 'purchase', params }]
  };

  /* Stamp the event at payment time so a retried webhook does not land hours
     late. GA4 drops anything older than 72 hours regardless. */
  if (Number.isFinite(timestampSeconds)) {
    payload.timestamp_micros = Math.round(timestampSeconds * 1e6);
  }

  return payload;
}

/* GA4 expects `<random>.<seconds>`. Deriving both halves from the transaction
   id keeps a retry landing on the same synthetic user instead of inflating the
   user count. */
function syntheticClientId(transactionId) {
  const source = String(transactionId || 'unknown');
  let hash = 0;
  for (let i = 0; i < source.length; i++) {
    hash = ((hash << 5) - hash + source.charCodeAt(i)) | 0;
  }
  return `${Math.abs(hash)}.${Math.abs(hash % 1000000000)}`;
}

async function sendToGa4(payload, env) {
  const url = `${GA4_ENDPOINT}?measurement_id=${encodeURIComponent(env.GA4_MEASUREMENT_ID)}`
            + `&api_secret=${encodeURIComponent(env.GA4_API_SECRET)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });

  /* MP answers 204 on accept and validates nothing — a 2xx means "received",
     not "correct". Use the /debug/mp/collect endpoint when changing this. */
  return response.status >= 200 && response.status < 300;
}

/* ------------------------------------------------------------------ *
 * Request handling
 * ------------------------------------------------------------------ */

async function alreadyProcessed(env, paymentId) {
  if (!env.PURCHASE_DEDUPE || !paymentId) return false;
  return (await env.PURCHASE_DEDUPE.get(paymentId)) !== null;
}

async function markProcessed(env, paymentId) {
  if (!env.PURCHASE_DEDUPE || !paymentId) return;
  await env.PURCHASE_DEDUPE.put(paymentId, '1', { expirationTtl: DEDUPE_TTL_SECONDS });
}

/*
  Status codes are chosen for how Dodo reacts to them:
    200 — handled, or deliberately ignored. Do not retry.
    400 — we could not authenticate it. Retrying will not help.
    500 — we believe it, but could not deliver it. Please retry.
*/
async function handleDodoWebhook(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
  }

  const body = await request.text();

  const verification = await verifyStandardWebhook({
    id: request.headers.get('webhook-id'),
    timestamp: request.headers.get('webhook-timestamp'),
    signature: request.headers.get('webhook-signature'),
    body,
    secret: env.DODO_WEBHOOK_SECRET
  });

  if (!verification.ok) {
    console.warn('dodo-webhook rejected:', verification.reason);
    return new Response(JSON.stringify({ error: verification.reason }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch (e) {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }

  /* Dodo sends the full event catalogue to one endpoint; only one of them is
     a sale. Everything else is acknowledged and dropped. */
  if (event.type !== 'payment.succeeded') {
    return Response.json({ ok: true, ignored: event.type || 'unknown' });
  }

  if (isTestPayment(event)) {
    console.warn('dodo-webhook: test payment reached the live endpoint, ignoring');
    return Response.json({ ok: true, ignored: 'test_mode' });
  }

  const purchase = extractPurchase(event);

  if (!purchase.transactionId || purchase.value == null) {
    console.warn('dodo-webhook: payment.succeeded without an id or amount');
    return Response.json({ ok: true, ignored: 'incomplete_payload' });
  }

  if (await alreadyProcessed(env, purchase.transactionId)) {
    return Response.json({ ok: true, ignored: 'duplicate' });
  }

  const payload = buildPurchasePayload(purchase, {
    timestampSeconds: Number(request.headers.get('webhook-timestamp'))
  });

  const delivered = await sendToGa4(payload, env);

  if (!delivered) {
    /* Do not record the dedupe key — we want Dodo's retry to try again. */
    console.error('dodo-webhook: GA4 rejected the purchase, asking for a retry');
    return new Response(JSON.stringify({ error: 'ga4_delivery_failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }

  await markProcessed(env, purchase.transactionId);

  return Response.json({ ok: true, transaction_id: purchase.transactionId });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (WEBHOOK_PATHS.has(url.pathname.replace(/\/$/, '') || '/')) {
      return handleDodoWebhook(request, env);
    }

    /* Everything else is the static site, exactly as before. */
    return env.ASSETS.fetch(request);
  }
};
