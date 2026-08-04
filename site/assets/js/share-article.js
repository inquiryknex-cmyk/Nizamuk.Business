/*
  NizamOk — مشاركة المقالات.

  المقالات ستّة وكُتبت يدويًا، فلو نُسخت أزرار المشاركة في كلٍّ منها لصارت
  ستّ نسخٍ تتباعد مع أول تعديل. هذا الملف يبنيها من بيانات الصفحة نفسها:
  العنوان من og:title، والرابط من الوسم القانوني. فلا يحتاج المقال إلا
  عنصرًا فارغًا واحدًا: <div data-article-share></div>

  الأصناف .share-row و.share-btn معرّفة في main.css منذ مشاركة نتيجة
  الاختبار، فلا CSS جديد هنا.

  إنستغرام وتيك توك وسناب لا تنشر أي «web share intent»، فلا زرّ لها —
  ولذلك زرّ نسخ الرابط: هو طريقها الوحيد.
*/
(function () {
  'use strict';

  var mount = document.querySelector('[data-article-share]');
  if (!mount) return;

  function meta(sel, attr) {
    var el = document.querySelector(sel);
    return el ? (el.getAttribute(attr || 'content') || '') : '';
  }

  var title = meta('meta[property="og:title"]') || document.title;
  /* الرابط القانوني لا العنوان الحالي: فلو وصلت الصفحة بمعاملات حملة، لا
     تُشارَك تلك المعاملات فتُنسب زيارة الصديقة إلى حملةٍ لم تمرّ بها. */
  var url = meta('link[rel="canonical"]', 'href') || location.origin + location.pathname;
  var text = title;

  var eUrl = encodeURIComponent(url);
  var eText = encodeURIComponent(text);

  var ICON = {
    whatsapp: '<path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 20.5l1.8-5.2A8.5 8.5 0 1 1 21 11.5Z"/>',
    x: '<path d="M4 4l7.6 9.9L4.4 20h2l6.1-6.4 4.9 6.4H21l-8-10.4L19.6 4h-2l-5.6 5.9L7.4 4H4Z"/>',
    telegram: '<path d="M21 4 3 11l5 1.8L19 7l-8.5 8.2L10 21l3-3.4 4.2 3L21 4Z"/>',
    facebook: '<path d="M14 8.5V7c0-.7.3-1 1-1h1.5V3.5H14c-2 0-3.5 1.3-3.5 3.4v1.6H8V11h2.5v9.5H14V11h2.2l.4-2.5H14Z"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/>'
  };
  var svg = function (k) {
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" ' +
      'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[k] + '</svg>';
  };

  function track(name, params) {
    if (typeof window.trackEvent === 'function') window.trackEvent(name, params || {});
  }

  var base = { page_path: location.pathname, share_context: 'article' };

  var links = [
    ['whatsapp', 'https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), 'WhatsApp'],
    ['x',        'https://twitter.com/intent/tweet?text=' + eText + '&url=' + eUrl, 'X'],
    ['telegram', 'https://t.me/share/url?url=' + eUrl + '&text=' + eText, 'Telegram'],
    ['facebook', 'https://www.facebook.com/sharer/sharer.php?u=' + eUrl, 'Facebook']
  ];

  var html =
    '<div class="share-block">' +
      '<span class="share-h">أفادتكِ هذه القراءة؟</span>' +
      '<p class="share-sub">أرسليها لمن تعرفين أنها تعيش الشيء نفسه.</p>' +
      '<div class="share-row">';

  /* المشاركة الأصلية للهاتف أولًا: تفتح ورقة النظام فتصل إلى إنستغرام
     وسناب وغيرهما مما لا رابط مشاركة له. */
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    html += '<button type="button" class="share-btn share-native" data-share="native">' +
      svg('copy') + '<span>مشاركة</span></button>';
  }
  links.forEach(function (l) {
    html += '<a class="share-btn share-' + l[0] + '" href="' + l[1] + '" target="_blank" ' +
      'rel="noopener" data-share="' + l[0] + '" aria-label="' + l[2] + '">' + svg(l[0]) +
      '<span>' + l[2] + '</span></a>';
  });
  html += '<button type="button" class="share-btn share-copy" data-share="copy">' +
    svg('copy') + '<span>نسخ الرابط</span></button>';
  html += '</div></div>';

  mount.innerHTML = html;

  mount.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-share]') : null;
    if (!el) return;
    var kind = el.getAttribute('data-share');
    var p = { method: kind, page_path: base.page_path, share_context: base.share_context };

    if (kind === 'native') {
      e.preventDefault();
      navigator.share({ title: title, text: text, url: url })
        .then(function () { track('share', p); })
        .catch(function () { /* ألغت المشاركة — ليست خطأً ولا حدثًا */ });
      return;
    }

    if (kind === 'copy') {
      e.preventDefault();
      var done = function () {
        track('share', p);
        var s = el.querySelector('span');
        if (!s) return;
        var old = s.textContent;
        s.textContent = 'نُسخ ✓';
        setTimeout(function () { s.textContent = old; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done).catch(function () {});
      } else {
        /* متصفحات بلا clipboard API، أو صفحة غير آمنة */
        var t = document.createElement('textarea');
        t.value = url; t.setAttribute('readonly', '');
        t.style.position = 'absolute'; t.style.left = '-9999px';
        document.body.appendChild(t); t.select();
        try { document.execCommand('copy'); done(); } catch (err) { /* ignore */ }
        document.body.removeChild(t);
      }
      return;
    }

    track('share', p);   /* الرابط يكمل عمله، فلا preventDefault */
  });
})();
