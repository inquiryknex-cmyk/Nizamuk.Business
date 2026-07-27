/*
  NizamOk site configuration — single source of truth for links & wiring.

  IMPORTANT:
  - Never put private MailerLite API keys here (this file ships to browsers).
  - To go live with email capture: paste MailerLite embedded-form action URLs
    below (Forms → Embed form → HTML code → form action="...").
  - Until endpoints are set, forms degrade gracefully: results are kept in
    localStorage and the visitor still gets her reading.
*/
window.NIZAMOK = {
  brand: {
    domain: 'https://nizamok.com',
    supportEmail: 'support@nizamok.com'
  },

  social: {
    tiktok: 'https://www.tiktok.com/@nizamuk_ar',
    // TODO(owner): confirm the exact YouTube channel URL.
    youtube: 'https://www.youtube.com/@nizamuk_ar',
    email: 'support@nizamok.com'
    // instagram: added later by owner
  },

  urls: {
    quiz: '/ikhtibar/',
    interdash: '/interdash/'
  },

  // Interdash showcase video.
  // type: 'mp4'  → self-hosted file (put it at src, e.g. '/assets/video/interdash.mp4')
  // type: 'youtube' → src is the YouTube video ID (not the full URL)
  // Leave src empty to show the premium "coming soon" poster instead.
  interdash: {
    video: {
      type: 'mp4',
      src: '/assets/video/interdash.mp4',
      poster: '/assets/video/interdash-poster.jpg',
      aspect: '4:5'
    },
    monthlyPriceSAR: 29
  },

  // Analytics. Both start EMPTY and everything stays inert until a real id is
  // pasted here — nothing is invented, and no tag fires without one.
  //   gtmId  — Google Tag Manager container, e.g. 'GTM-XXXXXXX'
  //   ga4Id  — GA4 measurement id, e.g. 'G-XXXXXXXXXX'
  // Set gtmId if you want to manage tags in GTM (recommended: Google Ads
  // conversion import lives there too). Set ga4Id alone for plain GA4.
  // If both are set, GTM wins and GA4 should be configured inside GTM.
  //
  // DO NOT put this id into Dodo's own GA4 integration. An earlier note here
  // said to, and it cost us: Dodo's hosted checkout then reported into this
  // property and, on 2026-07-26, two sandbox test payments landed in live
  // reporting as SAR 21,797.78 of revenue from a "purchaser" who never existed.
  // Two failures compounded —
  //   1. Dodo fires `purchase` on any successful payment and its docs draw no
  //      distinction between test mode and live, so a sandbox payment lands in
  //      the production property as real revenue, and
  //   2. it sends `value` in minor units (10900 halalas read as SAR 10,900),
  //      inflating every amount by 100×.
  // Even once those are fixed it would double-count, because shukran.js already
  // fires `purchase` on Dodo's succeeded redirect, deduplicated on payment_id.
  // One conversion, one source: this site. See docs/rebuild-landing-pages.md §5.
  analytics: {
    gtmId: '',
    ga4Id: 'G-MVH7ZVH1KJ'   // NizamOK · property 545877279 · SAR · Riyadh
  },

  pricing: {
    lamhat: 19,
    juthur: 49,
    rebuild: 109
  },

  // Arabic sales page per pattern, for the quiz result to route into.
  // NOTE the deliberate key/slug mismatch: the pattern keys below are the ones
  // used throughout the quiz (asira, mutafadiya) while the public URLs use
  // asirat and mutafadia. Keep this map as the only place that reconciles them.
  // English visitors are NOT sent here — these pages are Arabic-only.
  rebuildPages: {
    mubdia:     '/rebuild/mubdia/',
    asira:      '/rebuild/asirat/',
    mutafadiya: '/rebuild/mutafadia/',
    kafua:      '/rebuild/kafua/'
  },

  // Dodo checkout links per pattern (Saudi pricing configured in Dodo).
  products: {
    mubdia: {
      lamhat:  'https://dodo.pe/lamhat-mubdia-inter',
      juthur:  'https://dodo.pe/juthur-mubdia-inter',
      rebuild: 'https://dodo.pe/rebuild-mubdia-inter'
    },
    asira: {
      lamhat:  'https://dodo.pe/lamhat-asirat-inter',
      juthur:  'https://dodo.pe/juthur-asirat-inter',
      rebuild: 'https://dodo.pe/rebuild-asirat-inter'
    },
    mutafadiya: {
      lamhat:  'https://dodo.pe/lamhat-mutafadia-inter',
      juthur:  'https://dodo.pe/juthur-mutafadia-inter',
      rebuild: 'https://dodo.pe/rebuild-mutafadia-inter'
    },
    kafua: {
      lamhat:  'https://dodo.pe/lamhat-kafua-inter',
      juthur:  'https://dodo.pe/juthur-kafua-inter',
      rebuild: 'https://dodo.pe/rebuild-munhaka-inter'
    }
  },

  // Free first reports are delivered by MailerLite automations (attached
  // to the quiz form below, branched on the dominant_pattern field) —
  // nothing is hosted on the site.

  mailerLite: {
    enabled: true,
    mode: 'pattern-forms',
    accountId: '2429254',

    // Quiz email-gate: one MailerLite form per dominant pattern.
    // Only the form matching the calculated result is ever submitted.
    // Mapping confirmed 2026-07-11 from the owner's dashboard (forms were
    // pasted top-down in dashboard order):
    formEndpoints: {
      // quiz-kufua-munhaka — الكفؤة المنهكة (embed mlb2-42544303)
      kafua:      'https://assets.mailerlite.com/jsonp/2429254/forms/190097714494571916/subscribe',
      // quiz-mutafadia-thakia — المتفادية الذكية (embed mlb2-42544259)
      mutafadiya: 'https://assets.mailerlite.com/jsonp/2429254/forms/190097591447324569/subscribe',
      // quiz-asirat-al-kamal — أسيرة الكمال (embed mlb2-42544139)
      asira:      'https://assets.mailerlite.com/jsonp/2429254/forms/190097355657184971/subscribe',
      // quiz-mubdia-mushattata — المبدعة المشتتة (embed mlb2-42543723)
      mubdia:     'https://assets.mailerlite.com/jsonp/2429254/forms/190096444701541996/subscribe'
    },

    // Interdash waiting-list form — «كوني من أوائل من يختبرن لوحة نمطكِ
    // التفاعلية» (embed mlb2-43641817, provided 2026-07-12).
    waitlistEndpoint: 'https://assets.mailerlite.com/jsonp/2429254/forms/192726401763247801/subscribe',

    // Generic fallbacks.
    endpoint: '',
    backupEndpoint: ''
  }
};
