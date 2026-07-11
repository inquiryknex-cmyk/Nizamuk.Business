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

  pricing: {
    lamhat: 19,
    juthur: 49,
    rebuild: 109
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
    // Flip to true ONLY after the owner confirms which form belongs to
    // which pattern below — a wrong mapping sends the wrong free report.
    enabled: false,
    mode: 'pattern-forms',
    accountId: '2429254',

    // Quiz email-gate: one MailerLite form per dominant pattern.
    // Only the form matching the calculated result is ever submitted.
    // TODO(owner): CONFIRM this pattern ↔ form mapping. The four form
    // action URLs below were provided 2026-07-11; embed ids in comments.
    formEndpoints: {
      // المبدعة المشتتة — embed mlb2-42544303
      mubdia:     'https://assets.mailerlite.com/jsonp/2429254/forms/190097714494571916/subscribe',
      // أسيرة الكمال — embed mlb2-42544259
      asira:      'https://assets.mailerlite.com/jsonp/2429254/forms/190097591447324569/subscribe',
      // المتفادية الذكية — embed mlb2-42544139
      mutafadiya: 'https://assets.mailerlite.com/jsonp/2429254/forms/190097355657184971/subscribe',
      // الكفؤة المنهكة — embed mlb2-42543723
      kafua:      'https://assets.mailerlite.com/jsonp/2429254/forms/190096444701541996/subscribe'
    },

    // Interdash waiting-list form (owner to provide its action URL).
    waitlistEndpoint: '',

    // Generic fallbacks.
    endpoint: '',
    backupEndpoint: ''
  }
};
