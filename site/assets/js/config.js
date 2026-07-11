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

  // Free first-report PDFs (already hosted on the live site).
  reports: {
    mubdia:     '/reports/free-mubdia-mushtatta.pdf',
    asira:      '/reports/free-asirat-alkamal.pdf',
    mutafadiya: '/reports/free-mutafadiya-thakiya.pdf',
    kafua:      '/reports/free-kafua-munhaka.pdf'
  },

  mailerLite: {
    enabled: false,          // flip to true once endpoints are pasted
    mode: 'pattern-forms',   // or 'worker-proxy' for a Cloudflare Worker at /api/subscribe

    // Quiz email-gate: one MailerLite form per dominant pattern.
    formEndpoints: {
      mubdia: '',            // المبدعة المشتتة
      asira: '',             // أسيرة الكمال
      mutafadiya: '',        // المتفادية الذكية
      kafua: ''              // الكفؤة المنهكة
    },

    // Interdash waiting-list form.
    waitlistEndpoint: '',

    // Generic fallbacks.
    endpoint: '',
    backupEndpoint: ''
  }
};
