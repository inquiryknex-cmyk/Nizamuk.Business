/*
  ARCHIVE — deployed source of the Cloudflare Worker `nizamok-purchase-webhook`
  (hooks.nizamok.com), copied verbatim from the Cloudflare dashboard editor on
  2026-07-30 by the owner. This worker is NOT deployed from this repository
  (root wrangler.toml is the assets-only site worker). Kept here so the code
  is auditable and version-controlled. See README.md in this directory for the
  audit findings and the conditions under which SEND_TO_GA4 may be true.
*/
const GA4_MEASUREMENT_ID = "G-MVH7ZVH1KJ";

// Keep FALSE for the first Dodo dashboard test.
// After the test succeeds, change only false -> true and deploy again.
const SEND_TO_GA4 = true;

const WEBHOOK_TOLERANCE_SECONDS = 300;
const GA4_ENDPOINT = "https://www.google-analytics.com/mp/collect";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // --------------------------------------------------
    // HEALTH CHECK
    // --------------------------------------------------
    if (request.method === "GET" && url.pathname === "/health") {
      return jsonResponse({
        ok: true,
        service: "nizamok-purchase-webhook",
        ga4_enabled: SEND_TO_GA4,
      });
    }

    // --------------------------------------------------
    // ONLY ACCEPT DODO WEBHOOK POSTS AT /dodo
    // --------------------------------------------------
    if (request.method !== "POST" || url.pathname !== "/dodo") {
      return new Response("Not found", { status: 404 });
    }

    // --------------------------------------------------
    // CHECK REQUIRED DODO SECRET
    // --------------------------------------------------
    if (!env.DODO_PAYMENTS_WEBHOOK_KEY) {
      console.error("Dodo webhook key is not configured");

      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    // GA4 secret is only required after live sending is enabled.
    if (SEND_TO_GA4 && !env.GA4_MEASUREMENT_PROTOCOL_SECRET) {
      console.error("GA4 Measurement Protocol secret is not configured");

      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    // --------------------------------------------------
    // READ EXACT RAW BODY FOR SIGNATURE VERIFICATION
    // --------------------------------------------------
    const rawBody = await request.text();

    const webhookId = request.headers.get("webhook-id");

    const webhookTimestamp = request.headers.get("webhook-timestamp");

    const webhookSignature = request.headers.get("webhook-signature");

    if (!webhookId || !webhookTimestamp || !webhookSignature) {
      return jsonResponse({ error: "Missing webhook signature headers" }, 400);
    }

    // --------------------------------------------------
    // VERIFY DODO SIGNATURE
    // --------------------------------------------------
    const signatureValid = await verifyDodoSignature({
      rawBody,
      webhookId,
      webhookTimestamp,
      webhookSignature,
      secret: env.DODO_PAYMENTS_WEBHOOK_KEY,
    });

    if (!signatureValid) {
      console.warn("Invalid Dodo webhook signature", {
        webhook_id: webhookId,
      });

      return jsonResponse({ error: "Invalid webhook signature" }, 401);
    }

    // --------------------------------------------------
    // PARSE VERIFIED PAYLOAD
    // --------------------------------------------------
    let payload;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return jsonResponse({ error: "Invalid JSON payload" }, 400);
    }

    const eventType = String(payload.type || "");

    // --------------------------------------------------
    // IGNORE NON-PAYMENT EVENTS SAFELY
    // --------------------------------------------------
    if (eventType !== "payment.succeeded") {
      console.log("Dodo webhook ignored", {
        webhook_id: webhookId,
        event_type: eventType,
      });

      return jsonResponse({
        received: true,
        verified: true,
        ignored: true,
        event_type: eventType || null,
      });
    }

    const payment = isPlainObject(payload.data) ? payload.data : {};

    const paymentId = normalizeRequiredString(payment.payment_id);

    if (!paymentId) {
      return jsonResponse({ error: "Missing payment_id in Dodo payload" }, 422);
    }

    // --------------------------------------------------
    // SAFE TEST MODE
    // --------------------------------------------------
    // The Dodo webhook is verified, but no fake purchase
    // is sent to Google Analytics.
    if (!SEND_TO_GA4) {
      console.log("Dodo payment verified in test mode", {
        webhook_id: webhookId,
        payment_id: paymentId,
      });

      return jsonResponse({
        received: true,
        verified: true,
        payment_id: paymentId,
        ga4_sent: false,
      });
    }

    // --------------------------------------------------
    // PREPARE PURCHASE VALUES
    // --------------------------------------------------
    const currency = normalizeCurrency(payment.currency);

    const totalAmountMinor = toFiniteInteger(payment.total_amount);

    const taxAmountMinor =
      payment.tax === null || payment.tax === undefined
        ? 0
        : toFiniteInteger(payment.tax);

    if (!currency || totalAmountMinor === null || totalAmountMinor < 0) {
      return jsonResponse(
        { error: "Missing or invalid payment amount/currency" },
        422
      );
    }

    if (taxAmountMinor === null || taxAmountMinor < 0) {
      return jsonResponse({ error: "Invalid tax amount" }, 422);
    }

    const divisor = getCurrencyDivisor(currency);

    const valueMinor = Math.max(totalAmountMinor - taxAmountMinor, 0);

    const value = roundMoney(valueMinor / divisor);

    const tax = roundMoney(taxAmountMinor / divisor);

    // --------------------------------------------------
    // BUILD GA4 PURCHASE PAYLOAD
    // --------------------------------------------------
    const gaPayload = {
      /*
        This is a stable temporary server-side client ID.

        It records the confirmed purchase, but it does
        not yet connect the purchase to the original
        website visitor/session.

        Full acquisition attribution can be added later
        by passing the real GA4 client_id into Dodo.
      */
      client_id: buildClientId(payment),

      events: [
        {
          name: "purchase",

          params: {
            transaction_id: paymentId,

            currency,

            value,

            tax,

            items: buildGa4Items(payment.product_cart),

            engagement_time_msec: 100,
          },
        },
      ],
    };

    // Preserve the original event time when it is safe
    // and within GA4's accepted backdating window.
    const timestampMicros = getSafeTimestampMicros(payload.timestamp);

    if (timestampMicros !== null) {
      gaPayload.timestamp_micros = timestampMicros;
    }

    // --------------------------------------------------
    // BUILD GA4 ENDPOINT SAFELY
    // --------------------------------------------------
    const gaUrl = new URL(GA4_ENDPOINT);

    gaUrl.searchParams.set("measurement_id", GA4_MEASUREMENT_ID);

    gaUrl.searchParams.set("api_secret", env.GA4_MEASUREMENT_PROTOCOL_SECRET);

    // --------------------------------------------------
    // SEND PURCHASE TO GA4
    // --------------------------------------------------
    let gaResponse;

    try {
      gaResponse = await fetch(gaUrl.toString(), {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(gaPayload),
      });
    } catch (error) {
      console.error("GA4 Measurement Protocol request failed", {
        payment_id: paymentId,

        message: error instanceof Error ? error.message : String(error),
      });

      return jsonResponse({ error: "GA4 purchase tracking failed" }, 502);
    }

    if (!gaResponse.ok) {
      console.error("GA4 Measurement Protocol returned non-2xx", {
        payment_id: paymentId,

        status: gaResponse.status,
      });

      return jsonResponse({ error: "GA4 purchase tracking failed" }, 502);
    }

    console.log("GA4 purchase sent", {
      payment_id: paymentId,
    });

    return jsonResponse({
      received: true,
      verified: true,
      ga4_sent: true,
      transaction_id: paymentId,
    });
  },
};

// ====================================================
// DODO WEBHOOK SIGNATURE VERIFICATION
// ====================================================

async function verifyDodoSignature({
  rawBody,
  webhookId,
  webhookTimestamp,
  webhookSignature,
  secret,
}) {
  const timestamp = Number(webhookTimestamp);

  if (!Number.isFinite(timestamp)) {
    return false;
  }

  // Reject requests outside the five-minute replay window.
  const now = Math.floor(Date.now() / 1000);

  if (Math.abs(now - timestamp) > WEBHOOK_TOLERANCE_SECONDS) {
    return false;
  }

  let secretBytes;

  try {
    secretBytes = decodeWebhookSecret(secret);
  } catch {
    return false;
  }

  /*
    Standard Webhooks signed-content format:

    webhook-id.webhook-timestamp.raw-body
  */
  const signedMessage = `${webhookId}.${webhookTimestamp}.${rawBody}`;

  const key = await crypto.subtle.importKey(
    "raw",

    secretBytes,

    {
      name: "HMAC",
      hash: "SHA-256",
    },

    false,

    ["sign"]
  );

  const expectedSignature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedMessage))
  );

  /*
    The signature header may contain multiple
    space-separated candidate signatures.
  */
  const candidates = String(webhookSignature).trim().split(/\s+/);

  for (const candidate of candidates) {
    const separatorIndex = candidate.indexOf(",");

    if (separatorIndex === -1) {
      continue;
    }

    const version = candidate.slice(0, separatorIndex);

    const encodedSignature = candidate.slice(separatorIndex + 1);

    if (version !== "v1" || !encodedSignature) {
      continue;
    }

    try {
      const actualSignature = base64ToBytes(encodedSignature);

      if (timingSafeEqual(expectedSignature, actualSignature)) {
        return true;
      }
    } catch {
      // Ignore malformed signature candidates.
    }
  }

  return false;
}

// ====================================================
// WEBHOOK SECRET DECODING
// ====================================================

function decodeWebhookSecret(secret) {
  const value = String(secret).trim();

  /*
    Standard Webhooks secrets normally use:

    whsec_<base64-secret>
  */
  if (value.startsWith("whsec_")) {
    return base64ToBytes(value.slice("whsec_".length));
  }

  // Fallback for a raw secret value.
  return new TextEncoder().encode(value);
}

// ====================================================
// BASE64 DECODING
// ====================================================

function base64ToBytes(value) {
  let normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");

  while (normalized.length % 4 !== 0) {
    normalized += "=";
  }

  const binary = atob(normalized);

  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

// ====================================================
// TIMING-SAFE SIGNATURE COMPARISON
// ====================================================

function timingSafeEqual(first, second) {
  const maxLength = Math.max(first.length, second.length);

  let difference = first.length ^ second.length;

  for (let index = 0; index < maxLength; index += 1) {
    difference |= (first[index] || 0) ^ (second[index] || 0);
  }

  return difference === 0;
}

// ====================================================
// BUILD GA4 ITEMS
// ====================================================

function buildGa4Items(productCart) {
  if (!Array.isArray(productCart) || productCart.length === 0) {
    return [
      {
        item_name: "NizamOk Purchase",

        item_brand: "NizamOk",

        item_category: "Digital Product",

        quantity: 1,
      },
    ];
  }

  const items = [];

  for (let index = 0; index < productCart.length; index += 1) {
    const product = isPlainObject(productCart[index]) ? productCart[index] : {};

    const productId = normalizeOptionalString(product.product_id);

    const quantity = Math.max(Math.trunc(Number(product.quantity) || 1), 1);

    const item = {
      item_brand: "NizamOk",

      item_category: "Digital Product",

      quantity,
    };

    if (productId) {
      item.item_id = productId;
    } else {
      item.item_name = `NizamOk Product ${index + 1}`;
    }

    items.push(item);
  }

  return items.length > 0
    ? items
    : [
        {
          item_name: "NizamOk Purchase",

          item_brand: "NizamOk",

          item_category: "Digital Product",

          quantity: 1,
        },
      ];
}

// ====================================================
// BUILD TEMPORARY GA4 CLIENT ID
// ====================================================

function buildClientId(payment) {
  const customerId = normalizeOptionalString(payment.customer?.customer_id);

  const paymentId = normalizeRequiredString(payment.payment_id);

  const source = customerId || paymentId || "unknown";

  return `dodo.${sanitizeIdentifier(source)}`;
}

function sanitizeIdentifier(value) {
  const sanitized = String(value)
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "_");

  return sanitized || "unknown";
}

// ====================================================
// SAFE GA4 TIMESTAMP
// ====================================================

function getSafeTimestampMicros(timestamp) {
  const parsed = Date.parse(timestamp);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  const now = Date.now();

  const maxPastAgeMs = 72 * 60 * 60 * 1000;

  const maxFutureSkewMs = WEBHOOK_TOLERANCE_SECONDS * 1000;

  if (parsed < now - maxPastAgeMs || parsed > now + maxFutureSkewMs) {
    return null;
  }

  return parsed * 1000;
}

// ====================================================
// CURRENCY DECIMAL CONVERSION
// ====================================================

function getCurrencyDivisor(currency) {
  const fallbackFractionDigits = {
    BIF: 0,
    CLP: 0,
    DJF: 0,
    GNF: 0,
    JPY: 0,
    KMF: 0,
    KRW: 0,
    PYG: 0,
    RWF: 0,
    UGX: 0,
    VND: 0,
    VUV: 0,
    XAF: 0,
    XOF: 0,
    XPF: 0,

    BHD: 3,
    IQD: 3,
    JOD: 3,
    KWD: 3,
    LYD: 3,
    OMR: 3,
    TND: 3,

    CLF: 4,
    UYW: 4,
  };

  try {
    const fractionDigits = new Intl.NumberFormat("en", {
      style: "currency",

      currency,
    })
      .resolvedOptions()
      .maximumFractionDigits;

    return 10 ** fractionDigits;
  } catch {
    const fallback = fallbackFractionDigits[currency] ?? 2;

    return 10 ** fallback;
  }
}

// ====================================================
// DATA NORMALIZATION HELPERS
// ====================================================

function normalizeCurrency(value) {
  const currency = normalizeRequiredString(value).toUpperCase();

  if (!/^[A-Z]{3}$/.test(currency)) {
    return "";
  }

  return currency;
}

function normalizeRequiredString(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function normalizeOptionalString(value) {
  return normalizeRequiredString(value);
}

function toFiniteNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function toFiniteInteger(value) {
  const number = toFiniteNumber(value);

  return number !== null && Number.isInteger(number) ? number : null;
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 1000000) / 1000000;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// ====================================================
// JSON RESPONSE HELPER
// ====================================================

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,

    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
