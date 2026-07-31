/*
  القالب الوحيد لصفحات «نظام إعادة البناء».

  صفحة واحدة قابلة لإعادة الاستخدام تبني الأنماط الأربعة كلها؛ ما يختلف بينها
  هو ملف المحتوى في ./content/<slug>.mjs فقط. البنية معرَّفة هنا مرة واحدة،
  فلا تتفرّق القوالب عند تعديل قسم.

  المخرَج HTML ثابت يُلتزم به في المستودع، الموقع نفسه بلا خطوة بناء.
  للتوليد: npm run build:rebuild
*/

const li = (a) => a.map(t => `          <li>${t}</li>`).join('\n');
const fitLi = (a) => a.map(t => `            <li>${t}</li>`).join('\n');

const doors = (a) => a.map(d => `        <div class="rb-door">
          <h3>${d.t}</h3>
          <p>${d.p}</p>
        </div>`).join('\n');

const tools = (a) => a.map(d => `        <article class="rb-tool">
          <h3>${d.t}</h3>
          <p>${d.p}</p>
        </article>`).join('\n');

/* data-src is the 3:4 tile; data-full is the whole page for the lightbox.
   Product-page captures get a -thumb variant; the cover jpg is already 3:4. */
const shots = (a) => a.map(s => {
  const thumb = s.src.replace(/\.webp$/, '-thumb.webp');
  return `        <figure class="rb-shot" hidden>
          <button type="button" data-full="${s.src}"><img alt="${s.alt}" data-src="${thumb}" loading="lazy" width="620" height="827"></button>
          <figcaption>${s.cap}</figcaption>
        </figure>`;
}).join('\n');

/* Source-aware quiz destinations, keyed by page slug.
   NOTE the deliberate slug ≠ source mismatch on two of them: the /rebuild/
   directories are `mutafadia` and `kafua`, while the agreed campaign sources
   are `mutafadiya` and `kafuaa`. This map is the ONLY place the two spellings
   are reconciled، never derive the quiz URL from p.slug. */
const QUIZ_URL = {
  mubdia:     'https://nizamok.com/ikhtibar/?source=mubdia&origin=book_page',
  asirat:     'https://nizamok.com/ikhtibar/?source=asirat&origin=book_page',
  mutafadia:  'https://nizamok.com/ikhtibar/?source=mutafadiya&origin=book_page',
  kafua:      'https://nizamok.com/ikhtibar/?source=kafuaa&origin=book_page'
};

/* The uncertainty escape hatch. Book-first means this is never a peer of the
   purchase button: it sits BELOW it, stacked (never side by side), outlined
   rather than filled, smaller, and narrower. */
const uncertain = (slug, pos) => `<div class="rb-uncertain">
          <p class="rb-uncertain-q">لستِ متأكدة أن هذا نمطكِ؟</p>
          <a class="btn btn-ghost rb-quiz-btn" href="${QUIZ_URL[slug]}" data-rb-cta="quiz" data-rb-pos="${pos}">اكتشفي نمطكِ مجانًا خلال 3 دقائق</a>
        </div>`;

/* Any bare /ikhtibar/ href inside authored FAQ copy is upgraded to the
   source-aware URL at build time, so no un-attributed quiz link can survive
   in the content files. */
const faqs = (a, slug) => a.map(f => `        <details>
          <summary>${f.q}</summary>
          <p>${f.a.replace(/href="\/ikhtibar\/"/g, `href="${QUIZ_URL[slug]}"`)}</p>
        </details>`).join('\n');

const ASSURE = 'دفعة واحدة، وصول رقمي بعد إتمام الدفع، السعر شامل الضرائب';
const CLOSING = 'إن تعرفتِ على أكثر من ثلاثة مشاهد، فالمشكلة ليست أنكِ لا تعرفين ماذا تفعلين. المشكلة أن هناك نمطًا يعيد ترتيب قراركِ في اللحظة الحاسمة.';
const SAFETY = 'هذه نتائج تطبيقية محتملة وليست ضمانًا. مقدار الفائدة يعتمد على ملاءمة النمط واستمرار التطبيق والسياق الشخصي.';
const LIMITS = 'نظامك منصة عربية للتفكير الذاتي والإدارة السلوكية العملية للنساء. يساعدكِ هذا المنتج على تسمية نمط متكرر وتجربة استجابات أكثر وعيًا وتنظيمًا. لا يقدم تشخيصًا نفسيًا أو طبيًا، ولا يعد بنتيجة مضمونة، ولا يستبدل العلاج أو الرعاية المتخصصة عند الحاجة. النتائج تختلف باختلاف التطبيق والسياق.';
const DISCLAIMER = 'نظامك منصة عربية للتفكير الذاتي والإدارة السلوكية العملية للنساء. المحتوى تعليمي/تطبيقي غير تشخيصي ولا يستبدل الرعاية المتخصصة. الدعم:';
const GALLERY_LEAD = 'لا تشترين غلافًا ولا وعدًا عامًا. هذه صفحات من الملف نفسه الذي يصلكِ بعد الدفع.';
const WHY_PRICE = 'لأنكِ لا تشترين معلومة عامة أو كتابًا يشرح المشكلة ثم يترككِ معها. أنتِ تحصلين على نظام كامل مرتبط بنمط واحد: نموذج يفسر ما يتكرر، أدوات للحظة الفعل، تجربة تكشف الفرق بين الخوف والواقع، وصفحات تطبيق، ونظام متابعة لثلاثة أشهر. السعر دفعة واحدة، ولا يوجد اشتراك مرتبط بهذا المنتج.';
const FINAL_LEAD = 'ابدئي بخطوة واحدة لا تحتاج إلى شعور كامل بالاستعداد: افهمي النمط، اختاري أداتكِ الأولى، واجمعي دليلًا صغيرًا من واقعكِ.';

const receiveList = (pages) => [
  'نظام عربي رقمي مصمم للقراءة والتطبيق، وليس ملف تحفيز عام.',
  'خمس مراحل تبدأ بفك شيفرة النمط وتنتهي بخطة عودة بعد التعثر.',
  'نموذج تشغيل خاص بالنمط وخريطة واحدة تلخص الإشارات والأدوات والانتكاسة.',
  'خمس أدوات عملية مع: متى تستخدم، علامة نجاحها، خطأ شائع، مثال، وتطبيق اليوم.',
  'أداة توقيعية وتجربة مكتوبة تنقل الفكرة من الفهم إلى دليل من الواقع.',
  'نصوص جاهزة للاستخدام في لحظة التردد أو الانسحاب أو وضع الحد.',
  'خطة بدء سريعة، خطة 30 يومًا، مسار 90 يومًا، وطقس مراجعة أسبوعي.',
  'بطاقات ذاكرة، خطة انتكاس وعودة، وقائمة بالمراجع والأرضية الفكرية.'
];

const journeyDay7 = 'تختارين أداة واحدة فقط وتطبقينها في موقف صغير. لا تحاولين إصلاح حياتكِ كلها ولا استخدام الأدوات الخمس دفعة واحدة.';
const journeyDay90 = 'تكررين الاستجابة الجديدة في سياقات أوسع، وتبنين خطة عودة واضحة عندما يظهر شكل الانتكاسة القديم. التسعون يومًا مسار ترسيخ داخل النظام وليست وعدًا بنتيجة مضمونة.';

export function renderPage(p) {
  /* U+00A0 keeps «109 ر.س» from splitting across two lines inside a button. */
  const nb = (s) => s.replace(/109 ر\.س/g, '109\u00A0ر.س');
  /* Checkout URL. The dodo.pe shortener DROPS query params, so we link the
     product page directly and carry them ourselves:
       country=SA               billing country starts on Saudi Arabia
       paymentCurrency=SAR      she is charged in riyals
       showCurrencySelector=false the 109 ر.س promised on this page is the
                                    number she sees at checkout, always
       redirect_url             back to /shukran/ after payment
     Country stays editable so GCC buyers outside KSA are not blocked. */
  const checkout = `https://checkout.dodopayments.com/buy/${p.productId}`
    + '?quantity=1&showDiscounts=false&country=SA&paymentCurrency=SAR'
    + '&showCurrencySelector=false&redirect_url=' + encodeURIComponent('https://nizamok.com/shukran/');
  const buy = (pos, label) => `<a class="btn btn-gold rb-cta" href="${checkout}" data-rb-cta="buy" data-rb-pos="${pos}">${nb(label)}</a>`;
  const cover = `https://nizamok.com/assets/product/${p.slug}/cover-og.jpg?v=4`;   // social card
  const coverThumb = `/assets/product/${p.slug}/cover-thumb.webp?v=4`;              // hero + gallery tile
  const coverFull = `/assets/product/${p.slug}/cover.webp?v=4`;                     // lightbox

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${p.seoTitle}</title>
  <meta name="description" content="${p.seoDesc}">
  <link rel="canonical" href="https://nizamok.com/rebuild/${p.slug}/">

  <meta property="og:type" content="product">
  <meta property="og:locale" content="ar_SA">
  <meta property="og:title" content="${p.seoTitle}">
  <meta property="og:description" content="${p.ogDesc}">
  <meta property="og:url" content="https://nizamok.com/rebuild/${p.slug}/">
  <meta property="og:image" content="${cover}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${p.seoTitle}">
  <meta name="twitter:description" content="${p.ogDesc}">
  <meta name="twitter:image" content="${cover}">

  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" href="/assets/img/seal.png">
  <link rel="apple-touch-icon" href="/assets/img/seal.png">

  <link rel="preload" href="/assets/fonts/almarai-400-arabic.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/el-messiri-700-arabic.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/fonts/fonts.css">
  <link rel="stylesheet" href="/assets/css/main.css?v=20260719h">
  <link rel="stylesheet" href="/assets/css/rebuild.css?v=20260731b">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "نظام إعادة البناء، ${p.name}",
    "description": "ملف PDF عربي تطبيقي من ${p.pages} صفحة لنمط ${p.name}: خمس مراحل، خمس أدوات، تجربة توقيعية مكتوبة، صفحات تطبيق، وخطط 7 و30 و90 يومًا.",
    "url": "https://nizamok.com/rebuild/${p.slug}/",
    "image": "${cover}",
    "brand": { "@type": "Brand", "name": "نظامك" },
    "additionalProperty": [
      { "@type": "PropertyValue", "name": "الصيغة", "value": "ملف PDF رقمي" },
      { "@type": "PropertyValue", "name": "عدد الصفحات", "value": "${p.pages}" },
      { "@type": "PropertyValue", "name": "اللغة", "value": "العربية" }
    ],
    "offers": {
      "@type": "Offer",
      "price": "109",
      "priceCurrency": "SAR",
      "url": "https://nizamok.com/rebuild/${p.slug}/",
      "availability": "https://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition"
    }
  }
  </script>
</head>
<body class="rb-body" data-ambient>

<!-- ============================================================
     HERO, velvet chamber
     ============================================================ -->
<div class="velvet rb-hero" data-rb-hero>  <img class="flower fl-r" src="/assets/img/flower-r.png" alt="" width="240" height="240" style="top:2%;opacity:0.42">
  <img class="flower fl-l" src="/assets/img/flower-l.png" alt="" width="220" height="220" style="bottom:4%;opacity:0.32" loading="lazy">

  <div class="container">
    <header class="rb-topbar">
      <a class="brand" href="/" aria-label="نظامك، الصفحة الرئيسية">
        <img class="seal-img" src="/assets/img/seal.png" alt="ختم نظامك" width="40" height="40">
        <img class="wordmark-img" src="/assets/img/wordmark.png" alt="NizamOk" width="112" height="28">
      </a>
      <a class="rb-support" href="mailto:support@nizamok.com">الدعم</a>
    </header>

    <div class="rb-stage rb-hero-grid">
      <div class="rb-hero-head">
        <span class="kicker">${p.kicker}</span>
        <h1>${p.h1}</h1>

        <p class="rb-price">
          <span class="amount">109</span>
          <span class="unit">ر.س</span>
          <span class="once">دفعة واحدة</span>
        </p>
      </div>

      <div class="rb-hero-media">
        <div class="rb-cover-frame">
          <img src="${coverThumb}" alt="غلاف نظام إعادة البناء، ${p.name}" width="700" height="1050" fetchpriority="high">
        </div>
        <span class="rb-cover-cap">ملف PDF من ${p.pages} صفحة صممها، حرّرها ودقّقها فريق نظامك</span>
      </div>

      <div class="rb-hero-body">
        <p class="rb-lead">${p.lead}</p>

        <ul class="rb-promises" role="list">
${li(p.promises)}
        </ul>

        ${buy('hero', p.buyLabel)}
        <span class="rb-assure">${ASSURE}</span>
        ${uncertain(p.slug, 'hero')}

        <p class="rb-trust">
          <span>ملف PDF تطبيقي</span>
          <span>تحميل فوري بعد الدفع</span>
          <span>دعم عبر البريد</span>
          <span>دفع آمن</span>
        </p>
      </div>
    </div>
  </div>
</div>

<main>

  <!-- ====== 2, مرآة التعرف ====== -->
  <section class="rb-section" aria-labelledby="mirrorH">
    <div class="container rb-narrow">
      <div class="rb-card">
        <h2 id="mirrorH">${p.mirrorH}</h2>
        <ul class="rb-list" role="list">
${li(p.mirror)}
        </ul>
        <p class="rb-close">${CLOSING}</p>
      </div>
    </div>
  </section>

  <!-- ====== 3, إعادة التأطير ====== -->
  <section class="rb-section" aria-labelledby="reframeH">
    <div class="container rb-narrow">
      <h2 id="reframeH">${p.reframeH}</h2>
      <p>${p.reframe}</p>

      <div class="rb-cta-row">
        ${buy('reframe', 'أريد أن أفهم هذا النمط وأعيد بناء طريقتي، 109 ر.س')}
        <span class="rb-assure">${ASSURE}</span>
      </div>
    </div>
  </section>

  <!-- ====== 4, الآلية الخاصة بالنمط (velvet) ====== -->
  <section class="velvet rb-mech" aria-labelledby="mechH">    <img class="flower fl-l" src="/assets/img/flower-l.png" alt="" width="220" height="220" style="top:6%;opacity:0.3" loading="lazy">
    <div class="container rb-narrow rb-section">
      <span class="kicker">الآلية الخاصة بالنمط</span>
      <h2 id="mechH" class="rb-mech-name">${p.mechanism}</h2>
      <p>لا يبدأ النظام بقائمة مهام جديدة. يبدأ بخريطة تسمّين من خلالها ما يحدث في اللحظة التي يتغير فيها سلوككِ. وبعدها تستخدمين <b>${p.bridgeMap}</b> لتربطي الإشارة بالأداة والاستجابة الجديدة.</p>

      <div class="rb-doors">
${doors(p.doors)}
      </div>
    </div>
  </section>

  <!-- ====== 5, ماذا تستلمين؟ ====== -->
  <section class="rb-section" aria-labelledby="getH">
    <div class="container rb-narrow">
      <div class="rb-card">
        <h2 id="getH">نظام تطبيقي كامل من ${p.pages} صفحة</h2>
        <ul class="rb-list" role="list">
${li(receiveList(p.pages))}
        </ul>
        <p class="rb-value">${p.pages} صفحة مصممة، 5 مراحل، 5 أدوات، تجربة توقيعية، صفحات تطبيق، خطة 30 يومًا، مسار 90 يومًا</p>
      </div>
    </div>
  </section>

  <!-- ====== 6, الأدوات الخمس ====== -->
  <section class="rb-section" aria-labelledby="toolsH">
    <div class="container rb-narrow">
      <h2 id="toolsH">الأدوات الخمس</h2>
      <div class="rb-tools">
${tools(p.tools)}
      </div>
    </div>
  </section>

  <!-- ====== 7, قلب النظام ====== -->
  <section class="rb-section" aria-labelledby="heartH">
    <div class="container rb-narrow">
      <div class="rb-card">
        <span class="kicker">قلب النظام</span>
        <h2 id="heartH">${p.signature}</h2>
        <div class="rb-signature">
          <p>${p.signatureBody}</p>
        </div>
        <p class="rb-relapse"><b>شكل العودة الذي يعلّمكِ النظام كشفه</b> ${p.relapse}</p>

        <div class="rb-cta-row">
          ${buy('mechanism', 'ابدئي بالنظام الكامل، 109 ر.س')}
          <span class="rb-assure">${ASSURE}</span>
        </div>
      </div>
    </div>
  </section>

  <!-- ====== 8, معرض المنتج الحقيقي ======
       Every figure is hidden until rebuild.js confirms its file loads, so the
       section only ever shows real pages from the file the buyer receives.
       Drop the shots at the data-src paths below to light them up. -->
  <section class="rb-section" aria-labelledby="galleryH" data-rb-gallery hidden>
    <div class="container rb-narrow">
      <h2 id="galleryH">شاهدي كيف بُني النظام من الداخل</h2>
      <p>${GALLERY_LEAD}</p>

      <div class="rb-gallery-grid">
${shots(p.shots)}
      </div>
      <p class="rb-hint">اضغطي أي صفحة لقراءتها بحجمها الكامل.</p>
    </div>
  </section>

  <!-- ====== 9, رحلة التطبيق ====== -->
  <section class="rb-section" aria-labelledby="journeyH">
    <div class="container rb-narrow">
      <h2 id="journeyH">كيف تسير رحلة التطبيق؟</h2>
      <ol class="rb-journey" role="list">
        <li>
          <span class="when">اليوم الأول</span>
          <p>تقرئين <b>${p.mechanism}</b>، وتحددين ${p.firstStepWord} الأول، وتكتبين موقفًا حقيقيًا حدث خلال الأسبوع الماضي.</p>
        </li>
        <li>
          <span class="when">أول 7 أيام</span>
          <p>${journeyDay7}</p>
        </li>
        <li>
          <span class="when">خلال 30 يومًا</span>
          <p>تربطين الإشارات بالأدوات، تنفذين <b>${p.signature}</b>، وتراجعين البيانات أسبوعيًا بدل تقييم نفسكِ بالمزاج.</p>
        </li>
        <li>
          <span class="when">خلال 90 يومًا</span>
          <p>${journeyDay90}</p>
        </li>
      </ol>
    </div>
  </section>

  <!-- ====== 10, ما الذي قد يتغير عمليًا؟ ====== -->
  <section class="rb-section" aria-labelledby="outcomesH">
    <div class="container rb-narrow">
      <div class="rb-card">
        <h2 id="outcomesH">ما الذي قد يتغير عمليًا؟</h2>
        <p>يهدف النظام إلى مساعدتكِ على:</p>
        <ul class="rb-list" role="list">
${li(p.outcomes)}
        </ul>
        <p class="rb-safety">${SAFETY}</p>
      </div>
    </div>
  </section>

  <!-- ====== 11, هل هذا النظام لكِ؟ ====== -->
  <section class="rb-section" aria-labelledby="fitH">
    <div class="container rb-narrow">
      <h2 id="fitH">هل هذا النظام لكِ؟</h2>
      <div class="rb-fit">
        <div class="rb-fit-col yes">
          <h3>يناسبكِ غالبًا إذا:</h3>
          <ul role="list">
${fitLi(p.fitYes)}
          </ul>
        </div>
        <div class="rb-fit-col no">
          <h3>لا يكون الخيار المناسب الآن إذا:</h3>
          <ul role="list">
${fitLi(p.fitNo)}
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- ====== 12, القيمة والسعر ====== -->
  <section class="rb-section" aria-labelledby="priceH">
    <div class="container rb-narrow">
      <h2 id="priceH">لماذا 109 ر.س؟</h2>
      <p>${WHY_PRICE}</p>

      <div class="rb-buy">
        <span class="rb-buy-name">نظام إعادة البناء، ${p.name}</span>
        <p class="rb-price">
          <span class="amount">109</span>
          <span class="unit">ر.س</span>
          <span class="once">دفعة واحدة</span>
        </p>
        ${buy('price', p.buyLabel)}
        <span class="rb-assure">${ASSURE}</span>

        <p class="rb-pay-trust">
          <span>دفع آمن</span>
          <span>السعر شامل الضرائب</span>
          <span>تحميل فوري</span>
          <span>دعم عبر البريد</span>
        </p>

        <!-- Accepted methods, stated before she commits. Dodo settles on the
             international rails, so mada-only cards can decline at the last
             step; saying so here turns a failed payment into a support email
             instead of a refund request. -->
        <p class="rb-pay-methods">
          <span class="methods">الدفع بفيزا أو ماستركارد أو Apple Pay</span>
          <span class="methods-note">بطاقات مدى المشتركة مع فيزا أو ماستركارد مقبولة. إن لم تتم العملية، راسلينا على <a href="mailto:support@nizamok.com">support@nizamok.com</a> ونساعدكِ.</span>
        </p>
        <p class="rb-policy-links">
          <a href="/refund/">سياسة الاسترداد</a>، <a href="/terms/">الشروط</a>، <a href="/privacy/">الخصوصية</a>
        </p>
      </div>
    </div>
  </section>

  <!-- ====== 13, الثقة والحدود ====== -->
  <section class="rb-section rb-limits" aria-labelledby="limitsH">
    <div class="container rb-narrow">
      <div class="rb-card">
        <h2 id="limitsH">ما الذي يَعِد به نظامك، وما الذي لا يَعِد به؟</h2>
        <p>${LIMITS}</p>
        <p>تنطبق سياسة المنتجات الرقمية المنشورة في موقع نظامك: <a href="/refund/">سياسة الاسترداد</a>، <a href="/terms/">شروط الاستخدام</a>، <a href="/privacy/">الخصوصية</a>.</p>
        <p>للدعم قبل أو بعد الشراء: <a href="mailto:support@nizamok.com">support@nizamok.com</a></p>
      </div>
    </div>
  </section>

  <!-- ====== 14, الأسئلة الشائعة ====== -->
  <section class="rb-section" aria-labelledby="faqH">
    <div class="container rb-narrow">
      <h2 id="faqH">الأسئلة الشائعة</h2>
      <div class="rb-faq">
${faqs(p.faq, p.slug)}
        <details>
          <summary>ماذا لو لم أكن متأكدة أن هذا هو نمطي؟</summary>
          <p>يمكنكِ البدء باختبار نظامكِ المجاني. خلال نحو 3 دقائق ستتعرفين إلى النمط الأقرب لطريقتكِ في التعامل مع المهام والطاقة والقرارات، ثم نوجّهكِ إلى النظام الأنسب لكِ.</p>
          ${uncertain(p.slug, 'faq')}
        </details>
      </div>
    </div>
  </section>

  <!-- ====== 15, CTA النهائي (velvet) ====== -->
  <section class="velvet rb-final" aria-labelledby="finalH">    <img class="flower fl-r" src="/assets/img/flower-r.png" alt="" width="240" height="240" style="top:6%;opacity:0.4" loading="lazy">
    <div class="container rb-narrow">
      <img class="seal-img" src="/assets/img/seal.png" alt="" width="100" height="100" loading="lazy">
      <h2 id="finalH">${p.h1}</h2>
      <p>${FINAL_LEAD}</p>
      ${buy('final', p.buyLabel)}
      <span class="rb-assure">${ASSURE}</span>
      ${uncertain(p.slug, 'final')}
    </div>
  </section>

</main>

<footer class="site-footer velvet rb-footer">
  <div class="container">
    <p class="disclaimer">${DISCLAIMER} <a href="mailto:support@nizamok.com" style="color:var(--gold-soft)">support@nizamok.com</a></p>
    <nav class="footer-links" aria-label="روابط الموقع">
      <a href="/">الرئيسية</a>
      <a href="${QUIZ_URL[p.slug]}">الاختبار المجاني</a>
      <a href="/privacy/">الخصوصية</a>
      <a href="/terms/">الشروط</a>
      <a href="/refund/">سياسة الاسترداد</a>
      <a href="mailto:support@nizamok.com">البريد</a>
    </nav>
    <p class="copyright">© <span data-year></span> نظامك</p>
  </div>
</footer>

<!-- Mobile sticky CTA, one button, price visible -->
<div class="rb-sticky" data-rb-sticky>
  <div class="rb-sticky-copy">
    <span class="rb-sticky-name">نظام إعادة البناء، ${p.name}</span>
    <span class="rb-sticky-price">109 ر.س</span>
  </div>
  <a class="btn btn-gold" href="${checkout}" data-rb-cta="buy" data-rb-pos="sticky">احصلي عليه الآن</a>
</div>

<!-- Lightbox -->
<div class="rb-lightbox" data-rb-lightbox hidden>
  <button type="button" class="rb-lightbox-close" aria-label="إغلاق الصورة">×</button>
  <img alt="">
</div>

<script>window.NIZAMOK_REBUILD = { pattern: '${p.slug}', patternName: '${p.name}', price: 109, currency: 'SAR' };</script>
<script src="/assets/js/config.js"></script>
<script src="/assets/js/analytics.js?v=20260801a"></script>
<script src="/assets/js/rebuild.js?v=20260731a" defer></script>
<script src="/assets/js/main.js?v=20260719h" defer></script>
</body>
</html>
`;
}