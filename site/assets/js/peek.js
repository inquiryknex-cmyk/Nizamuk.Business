/*
  تكبير صفحات الجولة.

  البلاطة تُعرض في نحو 170 بكسل فتُقرأ تصميمًا لا نصًّا، وكان ذلك قصدًا
  في أول بناء. لكنّ من تدفع 49 ريالًا لها أن ترى ما تشتريه، فصار النقر
  يفتح الصفحة بحجمها.

  والصفحات الأربع مختارةٌ لهذا: بناء الكتاب وعنايته ومصادره، لا متنه.
  فالتكبير يُري ما اختير للعرض، ولا يفتح ما لم يُختَر.

  بلا اعتماديات: عنصرٌ واحد يُبنى عند أول نقرة، ويُغلق بـEsc أو بالنقر
  خارج الصورة، ويعيد التركيز إلى البلاطة التي فُتحت منها.
*/
(function () {
  'use strict';
  var box = null, lastFocus = null;

  function build() {
    box = document.createElement('div');
    box.className = 'peek-zoom';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.hidden = true;
    box.innerHTML =
      '<button type="button" class="peek-zoom-close" aria-label="إغلاق">×</button>' +
      '<figure><img alt=""><figcaption></figcaption></figure>';
    document.body.appendChild(box);
    box.addEventListener('click', function (e) {
      if (e.target === box || e.target.closest('.peek-zoom-close')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !box.hidden) close();
    });
  }

  function open(src, alt, cap, from) {
    if (!box) build();
    lastFocus = from || null;
    var img = box.querySelector('img');
    img.src = src; img.alt = alt || '';
    box.querySelector('figcaption').textContent = cap || '';
    box.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    box.querySelector('.peek-zoom-close').focus();
    if (window.trackEvent) window.trackEvent('peek_zoom', { page_path: location.pathname });
  }

  function close() {
    if (!box) return;
    box.hidden = true;
    document.documentElement.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-peek-full]') : null;
    if (!btn) return;
    e.preventDefault();
    var cap = btn.parentElement.querySelector('.peek-cap');
    var img = btn.querySelector('img');
    open(btn.getAttribute('data-peek-full'), img ? img.alt : '', cap ? cap.textContent.trim() : '', btn);
  });
})();
