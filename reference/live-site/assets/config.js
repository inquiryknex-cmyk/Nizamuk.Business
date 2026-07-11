/*
  NizamOK site configuration.
  IMPORTANT:
  - Do not put private MailerLite API keys in this file.
  - For fastest launch: paste your MailerLite embedded form action URL below.
  - For safer/pro setup: deploy the Cloudflare Worker in docs/cloudflare-mailerlite-worker.js and set endpoint to /api/subscribe.
*/
window.NIZAMOK_CONFIG = {
  brand: {
    domain: 'https://nizamok.com',
    supportEmail: 'support@nizamok.com'
  },
  mailerLite: {
    enabled: false,
    // Use 'pattern-forms' for the simplest setup:
    // each quiz result posts to its matching MailerLite form endpoint.
    mode: 'pattern-forms',

    // Paste each MailerLite embedded form action URL here.
    // Get it from: Forms > Edit form > Embed form > HTML code > form action="..."
    formEndpoints: {
      // المبدعة المشتتة
      mubdia: '',
      // أسيرة الكمال
      asira: '',
      // المتفادية الذكية
      mutafadiya: '',
      // الكفؤة المنهكة
      kafua: ''
    },

    // Fallback single endpoint if you ever use one generic form instead.
    endpoint: '',

    // Optional FormSubmit backup endpoint. Example: https://formsubmit.co/you@example.com
    backupEndpoint: ''
  },
  reports: {
    mubdia: '/reports/free-mubdia-mushtatta.pdf',
    asira: '/reports/free-asirat-alkamal.pdf',
    mutafadiya: '/reports/free-mutafadiya-thakiya.pdf',
    kafua: '/reports/free-kafua-munhaka.pdf'
  },
  // Replace each # with your Dodo checkout/payment links when ready.
  products: {
    mubdia: {
      lamhat: '#DODO_LAMHAT_MUBDIA_29SAR',
      juthur: '#DODO_JUTHUR_MUBDIA_39SAR',
      rebuild: '#DODO_REBUILD_MUBDIA_109SAR',
      bundle: '#DODO_BUNDLE_MUBDIA_131SAR'
    },
    asira: {
      lamhat: '#DODO_LAMHAT_ASIRA_29SAR',
      juthur: '#DODO_JUTHUR_ASIRA_39SAR',
      rebuild: '#DODO_REBUILD_ASIRA_109SAR',
      bundle: '#DODO_BUNDLE_ASIRA_131SAR'
    },
    mutafadiya: {
      lamhat: '#DODO_LAMHAT_MUTAFADIYA_29SAR',
      juthur: '#DODO_JUTHUR_MUTAFADIYA_39SAR',
      rebuild: '#DODO_REBUILD_MUTAFADIYA_109SAR',
      bundle: '#DODO_BUNDLE_MUTAFADIYA_131SAR'
    },
    kafua: {
      lamhat: '#DODO_LAMHAT_KAFUA_29SAR',
      juthur: '#DODO_JUTHUR_KAFUA_39SAR',
      rebuild: '#DODO_REBUILD_KAFUA_109SAR',
      bundle: '#DODO_BUNDLE_KAFUA_131SAR'
    }
  }
};
