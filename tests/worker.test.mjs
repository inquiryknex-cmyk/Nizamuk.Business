/*
  Tests for the parts of src/worker.mjs that handle money and proof.

  These two things are why this file exists:

    · A signature check that wrongly passes lets anyone post fake revenue to
      the property, which is the failure the webhook was built to prevent.
    · A wrong minor-unit conversion is a silent 100× error in reported
      revenue — the exact bug that started this work (SAR 21,797.78 from two
      sandbox payments).

  Both are pure functions, so they are tested directly. Run: npm test
*/
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  minorToMajor,
  currencyExponent,
  signPayload,
  verifyStandardWebhook,
  secretToKeyBytes,
  isTestPayment,
  extractPurchase,
  buildPurchasePayload
} from '../src/worker.mjs';

const SECRET = 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw';
const NOW = 1785000000;

function sampleEvent(overrides = {}) {
  return {
    business_id: 'bus_0NhEjsrF19N6c8BTCWh85',
    type: 'payment.succeeded',
    timestamp: '2026-07-27T10:00:00Z',
    data: {
      payload_type: 'Payment',
      payment_id: 'pay_test123',
      total_amount: 10900,
      currency: 'SAR',
      metadata: {
        ga_cid: '1234567890.1234567890',
        ga_sid: '1785000000',
        pattern: 'mubdia'
      },
      ...overrides
    }
  };
}

/* ------------------------------------------------------------------ *
 * Money
 * ------------------------------------------------------------------ */

test('minorToMajor undoes the 100x inflation that started all this', () => {
  assert.equal(minorToMajor(10900, 'SAR'), 109);
  assert.equal(minorToMajor(1900, 'SAR'), 19);
  assert.equal(minorToMajor(4900, 'SAR'), 49);
});

test('minorToMajor respects currencies that are not two-decimal', () => {
  assert.equal(currencyExponent('JPY'), 0);
  assert.equal(currencyExponent('KWD'), 3);
  assert.equal(currencyExponent('sar'), 2);      // case-insensitive
  assert.equal(currencyExponent('ZZZ'), 2);      // unknown falls back to 2

  assert.equal(minorToMajor(10900, 'JPY'), 10900);
  assert.equal(minorToMajor(109000, 'KWD'), 109);
});

test('minorToMajor does not leak floating-point noise into revenue', () => {
  // 1089778 / 100 is 10897.779999999999 in raw IEEE-754.
  assert.equal(minorToMajor(1089778, 'SAR'), 10897.78);
  assert.equal(String(minorToMajor(1089778, 'SAR')), '10897.78');
});

test('minorToMajor rejects unusable amounts rather than reporting NaN revenue', () => {
  assert.equal(minorToMajor(undefined, 'SAR'), null);
  assert.equal(minorToMajor(null, 'SAR'), null);
  assert.equal(minorToMajor('', 'SAR'), null);
  assert.equal(minorToMajor('not-a-number', 'SAR'), null);

  // A genuine zero is not the same as a missing one and must survive.
  assert.equal(minorToMajor(0, 'SAR'), 0);
});

/* ------------------------------------------------------------------ *
 * Signature verification
 * ------------------------------------------------------------------ */

test('a signature we generated verifies', async () => {
  const body = JSON.stringify(sampleEvent());
  const signature = await signPayload({ id: 'msg_1', timestamp: NOW, body, secret: SECRET });

  const result = await verifyStandardWebhook({
    id: 'msg_1',
    timestamp: String(NOW),
    signature: `v1,${signature}`,
    body,
    secret: SECRET,
    nowSeconds: NOW
  });

  assert.equal(result.ok, true);
});

test('a tampered body is rejected', async () => {
  const body = JSON.stringify(sampleEvent());
  const signature = await signPayload({ id: 'msg_1', timestamp: NOW, body, secret: SECRET });

  // The attack this defends against: inflate the amount, keep the signature.
  const tampered = JSON.stringify(sampleEvent({ total_amount: 99900000 }));

  const result = await verifyStandardWebhook({
    id: 'msg_1',
    timestamp: String(NOW),
    signature: `v1,${signature}`,
    body: tampered,
    secret: SECRET,
    nowSeconds: NOW
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'signature_mismatch');
});

test('a signature made with a different secret is rejected', async () => {
  const body = JSON.stringify(sampleEvent());
  const signature = await signPayload({ id: 'msg_1', timestamp: NOW, body, secret: 'whsec_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' });

  const result = await verifyStandardWebhook({
    id: 'msg_1', timestamp: String(NOW), signature: `v1,${signature}`, body, secret: SECRET, nowSeconds: NOW
  });

  // This is the test-mode guard: a sandbox webhook is signed with the sandbox
  // secret, so it cannot authenticate against the live one.
  assert.equal(result.ok, false);
});

test('a replayed old signature is rejected on timestamp', async () => {
  const body = JSON.stringify(sampleEvent());
  const oldTs = NOW - 3600;
  const signature = await signPayload({ id: 'msg_1', timestamp: oldTs, body, secret: SECRET });

  const result = await verifyStandardWebhook({
    id: 'msg_1', timestamp: String(oldTs), signature: `v1,${signature}`, body, secret: SECRET, nowSeconds: NOW
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'stale_timestamp');
});

test('rotation works — one valid signature among several is enough', async () => {
  const body = JSON.stringify(sampleEvent());
  const good = await signPayload({ id: 'msg_1', timestamp: NOW, body, secret: SECRET });

  const result = await verifyStandardWebhook({
    id: 'msg_1',
    timestamp: String(NOW),
    signature: `v1,not-valid-base64!! v1,${good}`,
    body,
    secret: SECRET,
    nowSeconds: NOW
  });

  assert.equal(result.ok, true);
});

test('missing headers and missing secret are distinguishable failures', async () => {
  const body = '{}';

  const noHeaders = await verifyStandardWebhook({ body, secret: SECRET, nowSeconds: NOW });
  assert.equal(noHeaders.reason, 'missing_headers');

  const noSecret = await verifyStandardWebhook({
    id: 'msg_1', timestamp: String(NOW), signature: 'v1,x', body, secret: '', nowSeconds: NOW
  });
  assert.equal(noSecret.reason, 'no_secret_configured');
});

test('secretToKeyBytes handles the whsec_ prefix and raw strings alike', () => {
  const withPrefix = secretToKeyBytes('whsec_aGVsbG8=');
  const without = secretToKeyBytes('aGVsbG8=');
  assert.deepEqual([...withPrefix], [...without]);
  assert.equal(new TextDecoder().decode(withPrefix), 'hello');

  // Not valid base64 — falls back to UTF-8 bytes instead of throwing.
  assert.ok(secretToKeyBytes('!!!not-base64!!!').length > 0);
});

/* ------------------------------------------------------------------ *
 * Payload handling
 * ------------------------------------------------------------------ */

test('extractPurchase pulls the real amount and the forwarded identity', () => {
  const purchase = extractPurchase(sampleEvent());

  assert.equal(purchase.transactionId, 'pay_test123');
  assert.equal(purchase.value, 109);            // not 10900
  assert.equal(purchase.currency, 'SAR');
  assert.equal(purchase.clientId, '1234567890.1234567890');
  assert.equal(purchase.sessionId, '1785000000');
  assert.equal(purchase.pattern, 'mubdia');
});

test('the ladder rung survives into the item, so 19 is not booked as 109', () => {
  /* The regression this guards: item_id was once hard-coded `rebuild-${pattern}`,
     written before لمحات 19 and جذور 49 existed. Every cheap sale would have
     been reported as the full system, corrupting revenue-by-product. */
  const lamhat = sampleEvent({
    total_amount: 1900,
    metadata: { ga_cid: '1.1', ga_sid: '2', pattern: 'mubdia', level: 'lamhat' }
  });
  const purchase = extractPurchase(lamhat);
  assert.equal(purchase.value, 19);
  assert.equal(purchase.level, 'lamhat');

  const payload = buildPurchasePayload(purchase);
  const params = payload.events[0].params;
  assert.equal(params.level, 'lamhat');
  assert.equal(params.items[0].item_id, 'lamhat-mubdia');
  assert.equal(params.items[0].price, 19);
  assert.notEqual(params.items[0].item_id, 'rebuild-mubdia');
});

test('a checkout link predating the ladder still books as the full system', () => {
  /* No metadata_level means the link was minted before the rungs existed, and
     those links only ever sold إعادة البناء. Defaulting beats a null item. */
  const purchase = extractPurchase(sampleEvent());
  assert.equal(purchase.level, 'rebuild');
  const params = buildPurchasePayload(purchase).events[0].params;
  assert.equal(params.items[0].item_id, 'rebuild-mubdia');
});

test('a payment with no metadata still yields a usable amount', () => {
  const purchase = extractPurchase(sampleEvent({ metadata: undefined }));
  assert.equal(purchase.value, 109);
  assert.equal(purchase.clientId, null);
});

test('isTestPayment defaults to live but catches explicit markers', () => {
  assert.equal(isTestPayment(sampleEvent()), false);
  assert.equal(isTestPayment({ livemode: false, data: {} }), true);
  assert.equal(isTestPayment({ livemode: true, data: {} }), false);
  assert.equal(isTestPayment({ data: { mode: 'test' } }), true);
  assert.equal(isTestPayment({ data: { environment: 'sandbox' } }), true);
  assert.equal(isTestPayment({ data: { mode: 'live' } }), false);
});

test('buildPurchasePayload keeps the session join when a client id came through', () => {
  const payload = buildPurchasePayload(extractPurchase(sampleEvent()), { timestampSeconds: NOW });
  const event = payload.events[0];

  assert.equal(payload.client_id, '1234567890.1234567890');
  assert.equal(payload.non_personalized_ads, true);
  assert.equal(payload.timestamp_micros, NOW * 1e6);
  assert.equal(event.name, 'purchase');
  assert.equal(event.params.value, 109);
  assert.equal(event.params.currency, 'SAR');
  assert.equal(event.params.transaction_id, 'pay_test123');
  assert.equal(event.params.session_id, '1785000000');
  assert.equal(event.params.attribution_source, 'linked');
  assert.equal(event.params.items[0].item_id, 'rebuild-mubdia');
});

test('a purchase with no client id is still recorded, and is labelled as such', () => {
  const purchase = extractPurchase(sampleEvent({ metadata: {} }));
  const first = buildPurchasePayload(purchase);
  const second = buildPurchasePayload(purchase);

  assert.ok(first.client_id, 'revenue must still be recorded');
  assert.equal(first.events[0].params.attribution_source, 'synthetic');
  assert.equal(first.events[0].params.session_id, undefined);

  // Stable across calls, so a Dodo retry cannot invent a second user.
  assert.equal(first.client_id, second.client_id);
  assert.match(first.client_id, /^\d+\.\d+$/);
});

test('engagement_time_msec is always present so session metrics are not skewed', () => {
  const payload = buildPurchasePayload(extractPurchase(sampleEvent()));
  assert.equal(payload.events[0].params.engagement_time_msec, 1);
});
