/* ============================================================
   اختبار نظامك — cinematic two-act quiz engine, v3.
   Mechanic per scene: choose الأقرب (required), then optionally
   ONE more answer that is also close — قريبة منكِ أيضًا. A woman
   can genuinely live in two patterns; she should never be forced
   to brand one answer as completely false. Scoring: closest +2,
   second +1, nothing subtracted (the old forced «الأبعد» −1 is
   gone). Max two selections keeps diagnostic power. Options are
   shuffled per session to kill position bias. Results include tie
   handling, a clarity marker, and computed precision mirrors.
   ============================================================ */
(function () {
  'use strict';

  const CONFIG = window.NIZAMOK || {};
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => document.getElementById(id);

  /* ---------- The four patterns ---------- */
  const patterns = {
    mubdia: {
      name: 'المبدعة المشتّتة',
      truth: 'أنتِ لا تنقصكِ الأفكار؛ تنقصكِ فكرة واحدة تصل.',
      headline: 'أنتِ لا تهربين من الإنجاز — أنتِ تهربين من منتصف الطريق. البداية تعطيكِ نسخة جديدة منكِ، لكنها تسحبكِ من الشيء الذي كان على وشك الوصول.',
      wound: 'الذي يتكرر ليس نقص قدرة، بل صعوبة البقاء مع الفكرة عندما يبهت بريقها وتطلب صبرًا بدل حماس.',
      step: 'اختاري مشروعًا واحدًا تركتِه وهو يستاهل، واحميه من أي فكرة جديدة سبعة أيام فقط. لا تلغي الأفكار — أوقفيها في الموقف.'
    },
    asira: {
      name: 'أسيرة الكمال',
      truth: 'نقص العمل لا يعني نقصًا فيكِ.',
      headline: 'أنتِ لا تخافين من العمل — تخافين من لحظة ظهوره أمام عين أخرى. لذلك صار التعديل بيتًا آمنًا تسكنين فيه بدل التسليم.',
      wound: 'الذي يتكرر أن جودة الشغل التصقت بقيمتكِ أنتِ؛ فصارت كل ملاحظة محتملة على العمل تهديدًا لكِ شخصيًا.',
      step: 'أرسلي نسخة «جيدة» من شغلكِ لشخص واحد تثقين به — قبل أن تصير مثالية. راقبي: العالم لن ينهار.'
    },
    mutafadiya: {
      name: 'المتفادية الذكية',
      truth: 'أنتِ لا تتجنبين المهمة، بل الشعور الذي خلفها.',
      headline: 'أنتِ لستِ كسولة — يومكِ مليء بالإنجاز الصغير. لكن الباب الواحد المهم يكبر في الخيال كل يوم تأجيل، حتى صار أكبر من حجمه.',
      wound: 'الذي يتكرر أن الشعور خلف المهمة — توتر، حكم، مواجهة — يصل قبلها، فتشترين هدنة يومية بثمن أسبوع.',
      step: 'افتحي الباب عشر دقائق فقط: الرسالة، الملف، المكالمة. المطلوب ليس الإنهاء — المطلوب أن يعود الواقع إلى حجمه.'
    },
    kafua: {
      name: 'الكفؤة المنهَكة',
      truth: 'أن تكوني قادرة لا يعني أن تكوني متاحة دائمًا.',
      headline: 'الجميع يظن أنكِ بخير لأنكِ دائمًا تتصرفين. لكن قدرتكِ صارت تصريح دخول مفتوحًا للجميع — إلا أنتِ.',
      wound: 'الذي يتكرر أن كل «نعم» سريعة تشتري راحة العلاقة لحظة، وتدفع ثمنها من طاقتكِ ومشروعكِ وما يخصكِ.',
      step: 'قبل الموافقة القادمة، اسألي بصمت: ما ثمن هذه النعم؟ واحجزي ساعة أسبوعية لكِ وحدكِ — موعدًا لا يُلغى.'
    }
  };

  /* ---------- Twelve scenes, two acts ---------- */
  const questions = [
    // ---- الفصل الأول: مشاهد من يومكِ ----
    {
      act: 1, scene: 'بعد ما يهدأ البيت',
      text: 'هدأ البيت أخيرًا، وصارت عندكِ ساعة كاملة لكِ وحدكِ. بصراحة… كيف تنتهي هذه الساعة غالبًا؟',
      options: [
        { p: 'mubdia',     t: 'أفتحها بحماس على مشروعي، ثم أخرج منها بفكرة جديدة أحلى من المشروع نفسه — وأنام وأنا أخطط لها.' },
        { p: 'asira',      t: 'أشتغل فعلًا… لكن أقضيها كلها في تحسين شيء شبه جاهز؛ أرتّب وأجمّل ولا «أنهي».' },
        { p: 'mutafadiya', t: 'أقول أبدأ بالشيء المهم، وأنتهي بإنجاز أشياء صغيرة كثيرة — والمهم ما فتحته.' },
        { p: 'kafua',      t: 'تذوب على رسالة «محتاجينك شوي» أو طلب طارئ؛ تصير ساعة الآخرين، مو ساعتي.' }
      ]
    },
    {
      act: 1, scene: 'مجموعة العائلة',
      text: 'في مجموعة الواتساب، طُلب منكِ ترتيب مناسبة قريبة — والكل واثق أنكِ «ما تقصّرين». ماذا يحدث داخلكِ؟',
      options: [
        { p: 'kafua',      t: 'أكتب «أبشروا» في نفس الدقيقة… وأحس بثقلها بعد ما أرسلها.' },
        { p: 'asira',      t: 'أقبل، وأُتعب نفسي في التفاصيل حتى تطلع مثالية — وأي ملاحظة صغيرة تجرحني أكثر مما تستحق.' },
        { p: 'mutafadiya', t: 'أتأخر في الرد وأنا أعرف أني سأقبل؛ صار التأجيل طريقتي في تأخير الحسم.' },
        { p: 'mubdia',     t: 'أتحمس وأقترح أفكارًا تجعلها مناسبة مختلفة… ثم يخف حماسي قبل التنفيذ ويبقى الحمل عليّ.' }
      ]
    },
    {
      act: 1, scene: 'الدورة المدفوعة',
      text: 'دفعتِ من مالكِ الخاص لدورة أو برنامج، وقلتِ: «هذه المرة جد». أين انتهى بكِ الحال معها؟',
      options: [
        { p: 'mubdia',     t: 'وصلتُ الدرس الثالث… ثم لمعَت دورة أو فكرة ثانية، وانتقل الحماس لها.' },
        { p: 'asira',      t: 'أعدتُ الدرس الواحد أكثر من مرة، وما سمحت لنفسي أتقدم قبل أن «أتقن» الذي فات.' },
        { p: 'mutafadiya', t: 'أجّلت أول واجب فيها؛ وكل ما كبر التأجيل، صار فتح المنصة نفسها أثقل.' },
        { p: 'kafua',      t: 'كل ما جئتُ أفتحها سبقني طلبُ أحدٍ اعتاد أني «ما أقصّر»؛ وقتي يُصرف على الجميع أولًا — ودورتي تنتظر دوري أنا.' }
      ]
    },
    {
      act: 1, scene: 'الساعة 11 ليلًا',
      text: 'قبل النوم، تفتحين إنستغرام فتجدين امرأة بعمركِ أطلقت مشروعًا يشبه الذي في رأسكِ. ما الجملة الأصدق التي تمر داخلكِ؟',
      options: [
        { p: 'asira',      t: '«شغلي أجمل من هذا… بس مو جاهز، وما راح أنزل شيئًا ناقصًا يتكلمون عليه.»' },
        { p: 'mubdia',     t: '«أنا عندي أفكار أقوى بكثير؛ المشكلة مو الأفكار…» — وأفتح ملاحظاتي المليئة، إثباتًا.' },
        { p: 'mutafadiya', t: 'أطفئ الجوال بسرعة؛ منظرها قرّب مني شعورًا ما أبغى أواجهه الليلة.' },
        { p: 'kafua',      t: '«هي فاضية لنفسها… أنا وقتي موزَّع على الكل إلا نفسي.» — وأكمل التصفح وأنا متعبة.' }
      ]
    },
    {
      act: 1, scene: 'الموسم',
      text: 'يقترب موسم مزدحم — رمضان، أعراس، اختبارات، ضغط دوام. ماذا يحدث لمشروعكِ أنتِ؟',
      options: [
        { p: 'kafua',      t: 'لا يسألني أحد إن كنتُ متفرغة؛ لازم أستلم الموسم كله، ومشروعي أول ما يُهمَّش.' },
        { p: 'mutafadiya', t: 'أقول «بعد الموسم أبدأ بقوة»؛ صارت المواسم مواعيد مؤجلة تلد بعضها.' },
        { p: 'mubdia',     t: 'أدخل الموسم بمشروع… وأخرج منه متحمسة لمشروع ثاني مختلف تمامًا.' },
        { p: 'asira',      t: 'أكمل فيه بصمت لكن لا أُري أحدًا؛ «مو وقته، وما هو جاهز».' }
      ]
    },
    {
      act: 1, scene: 'دفتر بداية السنة',
      text: 'عندكِ دفتر أنيق — أو ملاحظات في الجوال — فيه خطط بدايات السنوات. لو فتحتيه الآن، ماذا سيحكي عنكِ؟',
      options: [
        { p: 'mubdia',     t: 'خمس خطط لخمسة مشاريع مختلفة، كل واحدة بحماس البداية… وأول صفحة فقط.' },
        { p: 'asira',      t: 'خطة واحدة مُعادة بصياغة «أدق» كل مرة؛ صار التخطيط نفسه هو مشروعي.' },
        { p: 'mutafadiya', t: 'خطة واضحة وممتازة… والخطوة الأولى فيها بالذات هي التي ما بدأت.' },
        { p: 'kafua',      t: 'أهدافي مكتوبة في آخر الصفحة — بعد قائمة أهداف البيت والأهل والدوام.' }
      ]
    },
    // ---- الفصل الثاني: الصوت الذي لا يسمعه أحد ----
    {
      act: 2, scene: 'الجملة التي تحكمكِ',
      text: 'لو أنصتِّ للصوت العميق الذي يوقفكِ كل مرة، أي جملة تشبه ما يقوله؟',
      options: [
        { p: 'asira',      t: '«إذا طلع شغلي ناقصًا… أنا التي ستطلع ناقصة في عيونهم.»' },
        { p: 'mutafadiya', t: '«إذا فتحتُ هذا الباب الآن، سيجيئني شعور أثقل مني.»' },
        { p: 'mubdia',     t: '«إذا التزمتُ بشيء واحد، دفنتُ كل النسخ الممكنة مني.»' },
        { p: 'kafua',      t: '«إذا قلتُ لا… تهتز المكانة التي تعبتُ عليها عندهم.»' }
      ]
    },
    {
      act: 2, scene: 'منتصف الطريق',
      text: 'في منتصف أي مشروع تأتي لحظة يبهت فيها البريق. ماذا تفعل هذه اللحظة بكِ؟',
      options: [
        { p: 'mubdia',     t: 'أفسّرها إشارة أن الفكرة «مو هي» — وأصدّق فجأة أن فكرتي القادمة هي الصح.' },
        { p: 'asira',      t: 'أفسّرها دليلًا أني يجب أن أرفع المستوى أكثر… قبل أن يراه أحد.' },
        { p: 'mutafadiya', t: 'أحوّلها إلى انشغال منطقي بأشياء أخف، وأؤجل قلب المشروع نفسه.' },
        { p: 'kafua',      t: 'ألوم نفسي على «الترف»: الحماس رفاهية، والواجبات أولى.' }
      ]
    },
    {
      act: 2, scene: 'الراحة المُرّة',
      text: 'تجلسين أخيرًا لتستريحي بلا هدف — شاي، هدوء، لا أحد يطلب شيئًا. من الداخل… متى تنقطع الراحة؟',
      options: [
        { p: 'kafua',      t: 'بإحساس أن أحدًا قد يحتاجني الآن؛ أرتاح «بأذنٍ واحدة صاحية».' },
        { p: 'asira',      t: 'بتذكُّر الشيء غير المكتمل؛ ما أعرف أرتاح وفي البال شيء «مو تمام».' },
        { p: 'mutafadiya', t: 'براحة يشوبها ذنب خفيف: أعرف أني أستريح من شيء أتهرّب منه أصلًا.' },
        { p: 'mubdia',     t: 'بفكرة جديدة تقفز وسط الهدوء وتشعل رأسي؛ تتحول الراحة إلى جلسة عصف.' }
      ]
    },
    {
      act: 2, scene: 'كلامهم عنكِ',
      text: 'أي عبارة قيلت عنكِ وظلمتكِ — لأن قائلها لم يرَ القصة كاملة؟',
      options: [
        { p: 'mubdia',     t: '«ما تكمّلين شي» — وما شافوا كم أحمل من بدايات صادقة تتجاذبني.' },
        { p: 'asira',      t: '«معقّدة وتدققين» — وما حسّوا أن الذي يهزني هو حكمهم لو ظهر فيه خطأ.' },
        { p: 'mutafadiya', t: '«كسل وتسويف» — وما دروا كم مرة اقتربتُ… وانسحبتُ من ثقل ما خلف الباب.' },
        { p: 'kafua',      t: '«قوية وما ينكسر لها خاطر» — وما انتبهوا أني أنكسر بصمت من كثرة ما أُحمَّل.' }
      ]
    },
    {
      act: 2, scene: 'المكسب الخفي',
      text: 'لكل عادة مكسبٌ خفي يبقيها حية. لو صدقتِ تمامًا: ما الذي تشترينه سرًّا بهذه العادة؟',
      options: [
        { p: 'mubdia',     t: 'لحظة البداية تعطيني نسخة جديدة مني؛ أبقى «واعدة»… بلا امتحان النهاية.' },
        { p: 'asira',      t: 'ما دام العمل في يدي، لم يُقيِّمه أحد؛ التعديل يحميني من ساعة الحكم.' },
        { p: 'mutafadiya', t: 'كل يوم تأجيل يشتري لي هدنة قصيرة من شعورٍ واحدٍ ثقيل.' },
        { p: 'kafua',      t: 'كل «نعم» أقولها تثبّت مكاني عندهم؛ صار التعب نفسه عملة حب.' }
      ]
    },
    {
      act: 2, scene: 'لو صدقتِ مع نفسكِ',
      text: 'بعيدًا عن الخطط الكبيرة: أي خطوة صغيرة، لو فعلتِها هذا الأسبوع، ستشعرين أنكِ كنتِ صادقة مع نفسكِ؟',
      options: [
        { p: 'mubdia',     t: 'أرجع لمشروع واحد تركته وهو يستاهل — وأحميه من أي فكرة جديدة، سبعة أيام فقط.' },
        { p: 'asira',      t: 'أرسل نسخة «جيدة» من شغلي لشخص واحد… قبل أن تصير مثالية.' },
        { p: 'mutafadiya', t: 'أفتح الملف — أو الرسالة — التي أدور حولها من أسابيع. عشر دقائق فقط.' },
        { p: 'kafua',      t: 'أحجز ساعة لي وحدي في الأسبوع، وأُعلمهم أنها موعد «ما ينلغي».' }
      ]
    }
  ];

  /* ---------- Locale layer ----------
     Arabic is the primary experience and the built-in default. On /en/ pages
     (html lang="en") the i18n-en.js bundle supplies an English rendition of
     the same content model. Slugs, scoring, mapping, and the MailerLite
     payload (always Arabic pattern names, for the Arabic automations) are
     locale-independent. */
  const I18N = (document.documentElement.lang === 'en' && window.NIZAMOK_I18N_EN) || null;
  const AR_PATTERN_NAMES = {
    mubdia: 'المبدعة المشتّتة', asira: 'أسيرة الكمال',
    mutafadiya: 'المتفادية الذكية', kafua: 'الكفؤة المنهَكة'
  };
  if (I18N) {
    Object.keys(patterns).forEach(k => Object.assign(patterns[k], I18N.patterns[k] || {}));
    questions.forEach((q, i) => {
      const tq = I18N.questions[i];
      if (!tq) return;
      q.scene = tq.scene; q.text = tq.text;
      q.options.forEach((o, j) => { if (tq.options[j]) o.t = tq.options[j]; });
    });
  }
  const T = I18N ? I18N.t : {
    act1: 'الفصل الأول — مشاهد من يومكِ',
    act2: 'الفصل الثاني — الصوت الذي لا يسمعه أحد',
    scene: (n, name) => 'المشهد ' + n + ' · ' + name,
    markClosest: 'الأقرب إليّ',
    markSecond: 'قريبة مني أيضًا',
    promptClosest: 'اختاري الأقرب إليكِ — ما يتكرر معكِ غالبًا',
    promptSecond: 'هل هناك إجابة ثانية تشبهكِ أيضًا؟ اختيارها اختياري',
    emailInvalid: 'يرجى إدخال بريدٍ إلكتروني صحيح.',
    emailPreparing: 'نفتح القراءة ونجهّز تقريركِ الأول...',
    pctSign: '٪',
    teaserColead: (a, b) => 'نتيجتكِ نادرة: نمطان يتقاسمان قيادتكِ هذه الفترة — <b>' + a + '</b> و<b>' + b + '</b> يعملان معًا. قراءتكِ الكاملة تفكك هذا التحالف.',
    teaserHigh: (pct) => 'نمطكِ واضح بدرجة عالية — ظهر بنسبة <b>' + pct + '٪</b>، وهذا وضوح لا يظهر عند الكثيرات. ومعه نمط خفي يعمل في الظل… قراءتكِ الكاملة تكشفه.',
    teaserNormal: (pct) => 'ظهر نمطكِ الغالب بنسبة <b>' + pct + '٪</b> — ومعه نمط خفي يعمل في الخلفية. قراءتكِ الكاملة تكشفه، مع خريطة مزيجكِ ومرايا دقيقة من إجاباتكِ أنتِ.',
    hiddenColead: (name, pct) => '✦ نتيجة نادرة: <b>' + name + '</b> تقاسمكِ القيادة بنسبة ' + pct + '٪ — النمطان يعملان معًا هذه الفترة.',
    hiddenNormal: (name, pct) => '✦ نمطكِ الخفي: <b>' + name + '</b> بنسبة ' + pct + '٪ — يعمل في الظل عندما يتعب نمطكِ الغالب.',
    mirrorsHeading: 'مرايا دقيقة — من إجاباتكِ أنتِ',
    mirrorEcho: (name) => 'نمط «' + name + '» ظهر مرارًا في اختياركِ الثاني دون أن يتصدر مرة — هذا صدى يرافق نمطكِ الغالب: لا يقود قراراتكِ، لكنه يلوّنها من الخلف.',
    mirrorInner: 'يومكِ من الخارج لا يفضحكِ — لكن في «الصوت الداخلي» كانت إجاباتكِ محسومة. نمطكِ يسكن قراراتكِ الصامتة أكثر من سلوككِ الظاهر، ولهذا لا يلاحظه مَن حولكِ.',
    mirrorOuter: 'اللافت أن نمطكِ ظاهر في تفاصيل يومكِ أكثر مما تعترف به قناعاتكِ الداخلية — جسدكِ ويومكِ يعرفان قبل أن يقتنع رأسكِ.',
    mirrorSilent: (name) => 'طوال اثني عشر مشهدًا لم تلمسي نمط «' + name + '» ولا مرة — هذا الباب ليس معركتكِ أصلًا. لا تصرفي طاقتكِ على نصائح كُتبت لامرأة أخرى.',
    pathHeading: 'مساركِ حسب نمطكِ',
    pathIntro: 'ثلاث مراحل بعمقٍ متدرج — طُوّرت السلسلة عبر منهج يجمع بين علم النفس السلوكي، والتحليل التحريري، وتمارين التطبيق العملي.',
    cardLamhat: { label: 'الخطوة 1 · متاحة الآن', title: 'لمحات نظامكِ', desc: 'قراءة مركّزة لما يحدث الآن في يومكِ: أين تتعطلين، وما السلوك الذي يخدعكِ.', cta: 'افتحي لمحاتكِ' },
    cardJuthur: { label: 'الخطوة 2 · القراءة الأعمق', title: 'جذور نمطكِ', desc: 'كتاب في أصل النمط: لماذا بدأ، وما الشعور الذي يحميه، ولماذا يعود.', cta: 'اقرئي الجذور' },
    cardRebuild: { label: 'الخطوة 3 · التحول العملي', title: 'نظام إعادة البناء', desc: 'نظام عملي كامل يحوّل الفهم إلى حركة: مراحل، أدوات، وخطوات تناسب نمطكِ.', cta: 'ابدئي إعادة البناء' },
    price: (v) => v + ' ريال',
    soon: 'قريبًا',
    waitlistBanner: (price) => '<b>لوحة نمطكِ التفاعلية — قريبًا.</b> مساحة يومية تنظّم مهامكِ وطاقتكِ حسب نمطكِ، باشتراك شهري ' + price + ' ريالًا عند الإطلاق.',
    waitlistCta: 'انضمي إلى قائمة الانتظار',
    interdashUrl: null   // fall back to CONFIG.urls.interdash
  };

  /* ---------- Session-stable option shuffle (kills primacy bias) ---------- */
  questions.forEach(q => {
    const order = [0, 1, 2, 3];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    q.order = order; // display position -> original option index
  });

  /* ---------- State ---------- */
  const state = {
    index: 0,
    phase: 'closest',          // 'closest' → required pick; 'second' → optional extra pick
    answers: [],               // per question: {closest, second|null} — ORIGINAL indices
    actBreakShown: false,
    lastResult: null
  };

  const panels = ['introPanel', 'quizPanel', 'actbreakPanel', 'calcPanel',
                  'revealPanel', 'emailPanel', 'resultPanel'];

  function showPanel(id) {
    panels.forEach(p => { const el = $(p); if (el) el.classList.toggle('active', p === id); });
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  }

  /* ---------- Golden pattern-line progress ---------- */
  function updateProgress() {
    const path = $('progressPath');
    if (path) {
      const total = path.getTotalLength();
      const answered = state.answers.filter(a => a && a.closest != null).length;
      const frac = Math.min(answered / questions.length, 1);
      const target = total * (1 - frac);
      path.style.strokeDasharray = total;
      if (!reduced && typeof gsap !== 'undefined') {
        gsap.to(path, { strokeDashoffset: target, duration: 0.9, ease: 'power2.out' });
      } else {
        path.style.strokeDashoffset = target;
      }
    }
    const q = questions[state.index];
    if ($('currentQuestion')) $('currentQuestion').textContent = state.index + 1;
    if ($('actLabel')) $('actLabel').textContent = q.act === 1 ? T.act1 : T.act2;
  }

  /* ---------- Question rendering ---------- */
  function renderQuestion() {
    const q = questions[state.index];
    const saved = state.answers[state.index] || { closest: null, second: null };
    state.phase = saved.closest != null ? 'second' : 'closest';

    $('sceneKicker').textContent = T.scene(state.index + 1, q.scene);
    $('questionText').textContent = q.text;
    setPrompt();

    const wrap = $('options');
    wrap.innerHTML = '';
    q.order.forEach(origIdx => {
      const opt = q.options[origIdx];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option';
      if (saved.closest === origIdx) btn.classList.add('closest');
      if (saved.second === origIdx) btn.classList.add('second');
      btn.setAttribute('aria-pressed', (saved.closest === origIdx || saved.second === origIdx) ? 'true' : 'false');
      btn.innerHTML = '<span class="mark">' +
        (saved.closest === origIdx ? T.markClosest : saved.second === origIdx ? T.markSecond : '') +
        '</span>' + opt.t;
      btn.addEventListener('click', () => choose(origIdx));
      wrap.appendChild(btn);
    });

    $('prevBtn').style.visibility = state.index === 0 ? 'hidden' : 'visible';
    $('quizMsg').textContent = '';
    updateProgress();
    showPanel('quizPanel');
    // Move focus to the new scene heading so keyboard/screen-reader users
    // don't lose their place after each auto-advance.
    try {
      const qt = $('questionText');
      if (qt) { qt.setAttribute('tabindex', '-1'); qt.focus({ preventScroll: true }); }
    } catch (e) {}
  }

  function setPrompt() {
    const el = $('choosePrompt');
    const nextBtn = $('nextBtn');
    if (state.phase === 'second') {
      el.textContent = T.promptSecond;
      el.classList.add('far');
      if (nextBtn) nextBtn.style.visibility = 'visible';
    } else {
      el.textContent = T.promptClosest;
      el.classList.remove('far');
      if (nextBtn) nextBtn.style.visibility = 'hidden';
    }
  }

  /* Selection rules — never more than two answers:
     · no closest yet → this pick becomes الأقرب
     · tap الأقرب again → clears the scene (change of heart)
     · tap the current second → unselects it
     · tap another option → becomes/replaces قريبة أيضًا, then auto-advance */
  function choose(i) {
    const saved = state.answers[state.index] || { closest: null, second: null };

    if (state.phase === 'closest') {
      saved.closest = i; saved.second = null;
      state.answers[state.index] = saved;
      state.phase = 'second';
      refreshMarks(); setPrompt(); updateProgress();
      return;
    }
    if (saved.closest === i) {
      clearTimeout(state.advanceTimer); state.advanceTimer = null;
      state.answers[state.index] = { closest: null, second: null };
      state.phase = 'closest';
      refreshMarks(); setPrompt(); updateProgress();
      return;
    }
    if (saved.second === i) {
      clearTimeout(state.advanceTimer); state.advanceTimer = null;
      saved.second = null;
      state.answers[state.index] = saved;
      refreshMarks();
      return;
    }
    saved.second = i;
    state.answers[state.index] = saved;
    refreshMarks();
    clearTimeout(state.advanceTimer);
    state.advanceTimer = setTimeout(advance, reduced ? 120 : 480);
  }

  function refreshMarks() {
    const q = questions[state.index];
    const saved = state.answers[state.index] || {};
    Array.from($('options').children).forEach((el, pos) => {
      const origIdx = q.order[pos];
      el.classList.toggle('closest', saved.closest === origIdx);
      el.classList.toggle('second', saved.second === origIdx);
      el.setAttribute('aria-pressed', (saved.closest === origIdx || saved.second === origIdx) ? 'true' : 'false');
      el.querySelector('.mark').textContent =
        saved.closest === origIdx ? T.markClosest : saved.second === origIdx ? T.markSecond : '';
    });
    $('quizMsg').textContent = '';
  }

  function advance() {
    // Guard: never advance without a closest pick; kill any pending auto-advance
    // so the timer and the «تابعي» button can never both fire for one scene.
    clearTimeout(state.advanceTimer);
    state.advanceTimer = null;
    const cur = state.answers[state.index];
    if (!cur || cur.closest == null) return;

    const lastActOne = questions.map(q => q.act).lastIndexOf(1);
    if (state.index === lastActOne && !state.actBreakShown) {
      state.actBreakShown = true;
      showPanel('actbreakPanel');
      return;
    }
    if (state.index < questions.length - 1) {
      state.index++;
      renderQuestion();
      return;
    }
    beginCalculation();
  }

  function prev() {
    if (state.index === 0) return;
    state.index--;
    renderQuestion();
  }

  /* ---------- Scoring & signature analysis ----------
     closest = the repeating response → +2
     second  = a genuinely near echo  → +1
     Nothing is subtracted: recognizing yourself in a pattern is signal;
     not choosing one is simply silence, not rejection. */
  function calculateResult() {
    const scores = { mubdia: 0, asira: 0, mutafadiya: 0, kafua: 0 };
    const closeCount = { mubdia: 0, asira: 0, mutafadiya: 0, kafua: 0 };
    const secCount = { mubdia: 0, asira: 0, mutafadiya: 0, kafua: 0 };
    const closeByAct = { 1: {}, 2: {} };

    state.answers.forEach((ans, qi) => {
      const q = questions[qi];
      if (!ans) return;
      if (ans.closest != null) {
        const p = q.options[ans.closest].p;
        scores[p] += 2;
        closeCount[p]++;
        closeByAct[q.act][p] = (closeByAct[q.act][p] || 0) + 1;
      }
      if (ans.second != null) {
        const p = q.options[ans.second].p;
        scores[p] += 1;
        secCount[p]++;
      }
    });

    const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
    const pcts = {};
    Object.keys(scores).forEach(k => (pcts[k] = Math.round((scores[k] / total) * 100)));
    const order = Object.keys(pcts).sort((a, b) =>
      pcts[b] - pcts[a] || closeCount[b] - closeCount[a] || secCount[b] - secCount[a]);
    pcts[order[0]] += 100 - Object.values(pcts).reduce((a, b) => a + b, 0);

    const dominant = order[0];
    const gap = pcts[order[0]] - pcts[order[1]];
    return {
      scores, pcts, order,
      closeCount, secCount, closeByAct,
      coLead: gap <= 4,                     // two patterns share the lead
      highClarity: pcts[dominant] >= 45,    // unusually decisive profile
      gap
    };
  }

  /* ---------- Precision mirrors — computed, never invented ---------- */
  function buildMirrors(r) {
    const dom = r.order[0];
    const mirrors = [];

    // 1) The echo pattern: often «قريبة أيضًا», rarely the lead — a companion
    //    mechanism that follows her dominant pattern without steering.
    const echo = Object.keys(patterns).find(p =>
      p !== dom && r.secCount[p] >= 3 && r.closeCount[p] <= 1);
    if (echo) {
      mirrors.push(T.mirrorEcho(patterns[echo].name));
    }

    // 2) Inner/outer split for the dominant pattern.
    const inner = (r.closeByAct[2][dom] || 0);
    const outer = (r.closeByAct[1][dom] || 0);
    if (inner - outer >= 2) {
      mirrors.push(T.mirrorInner);
    } else if (outer - inner >= 2) {
      mirrors.push(T.mirrorOuter);
    }

    // 3) The silent door: a pattern she never touched in 12 scenes — not as
    //    closest, not even as a near echo. That silence is information.
    const silent = Object.keys(patterns)
      .filter(p => p !== dom && p !== echo && r.closeCount[p] === 0 && r.secCount[p] === 0)
      .sort((a, b) => (r.scores[a] || 0) - (r.scores[b] || 0))[0];
    if (silent) {
      mirrors.push(T.mirrorSilent(patterns[silent].name));
    }

    return mirrors.slice(0, 3);
  }

  /* ---------- Calculation → staged reveal ---------- */
  function beginCalculation() {
    showPanel('calcPanel');
    state.lastResult = calculateResult();
    setTimeout(renderReveal, reduced ? 200 : 2300);
  }

  function renderReveal() {
    const r = state.lastResult;
    const dom = r.order[0];
    const sec = r.order[1];

    $('revealName').textContent = patterns[dom].name;
    $('revealTruth').textContent = patterns[dom].truth;

    let teaser;
    if (r.coLead) {
      teaser = T.teaserColead(patterns[dom].name, patterns[sec].name);
    } else if (r.highClarity) {
      teaser = T.teaserHigh(r.pcts[dom]);
    } else {
      teaser = T.teaserNormal(r.pcts[dom]);
    }
    $('mixTeaser').innerHTML = teaser;
    showPanel('revealPanel');

    // Funnel: quiz completed & result shown (once). No answers/email sent.
    if (!state.completeTracked && window.trackEvent) {
      state.completeTracked = true;
      window.trackEvent('quiz_complete', { pattern_slug: dom, page_path: location.pathname });
    }

    if (!reduced && typeof gsap !== 'undefined') {
      gsap.fromTo('#revealName', { opacity: 0, y: 18, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 1.4, ease: 'power3.out' });
      gsap.fromTo('#revealTruth', { opacity: 0 }, { opacity: 1, duration: 1.2, delay: 0.7 });
      gsap.fromTo('#mixTeaser, #toEmailBtn', { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 1, delay: 1.2, stagger: 0.15 });
    }
  }

  /* ---------- Email gate → MailerLite (per-pattern form) ---------- */
  async function submitEmail(e) {
    e.preventDefault();
    const email = $('email').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      $('emailMsg').textContent = T.emailInvalid;
      return;
    }
    if (!state.lastResult) state.lastResult = calculateResult();
    $('emailMsg').textContent = T.emailPreparing;
    await sendPayload(email, state.lastResult);
    renderResult(email);
  }

  async function sendPayload(email, result) {
    const dominant = result.order[0];
    const fields = {
      dominant_pattern: dominant,
      dominant_pattern_name: AR_PATTERN_NAMES[dominant],
      secondary_pattern: result.order[1],
      secondary_pattern_name: AR_PATTERN_NAMES[result.order[1]],
      mubdia_percent: String(result.pcts.mubdia),
      asira_percent: String(result.pcts.asira),
      mutafadiya_percent: String(result.pcts.mutafadiya),
      kafua_percent: String(result.pcts.kafua),
      dominant_percent: String(result.pcts[dominant]),
      result_clarity: result.coLead ? 'colead' : result.highClarity ? 'high' : 'normal',
      result_url: location.origin + location.pathname + '?result=' + dominant
    };

    const ml = CONFIG.mailerLite || {};
    // Only the form matching HER pattern is ever used — never all four.
    const endpoint = (ml.formEndpoints || {})[dominant] || ml.endpoint || '';
    try {
      if (ml.enabled && endpoint) {
        const fd = new FormData();
        fd.append('fields[email]', email);
        Object.entries(fields).forEach(([k, v]) => fd.append('fields[' + k + ']', v));
        fd.append('ml-submit', '1');
        fd.append('anticsrf', 'true');
        await fetch(endpoint, { method: 'POST', body: fd, mode: 'no-cors' });
        // Funnel event — pattern + status only, never the email address.
        if (window.trackEvent) window.trackEvent('report_email_submit', { pattern_slug: dominant, submission_status: 'success', page_path: location.pathname });
      }
    } catch (err) {
      if (window.trackEvent) window.trackEvent('report_email_submit', { pattern_slug: dominant, submission_status: 'error', page_path: location.pathname });
      /* keep the visitor moving; result still renders */
    }

    try {
      localStorage.setItem('nizamok_last_result', JSON.stringify({
        payload: { email: email, fields: fields },
        pcts: result.pcts, order: result.order, scores: result.scores,
        closeCount: result.closeCount, secCount: result.secCount,
        closeByAct: result.closeByAct, coLead: result.coLead,
        highClarity: result.highClarity,
        at: new Date().toISOString()
      }));
    } catch (e) { /* private mode */ }
  }

  /* ---------- Full result ---------- */
  function renderResult(email) {
    const r = state.lastResult;
    const dom = r.order[0];
    const sec = r.order[1];
    const P = patterns[dom];

    $('resultName').textContent = P.name;
    $('resultTruth').textContent = P.truth;

    if (r.coLead) {
      $('hiddenPattern').innerHTML = T.hiddenColead(patterns[sec].name, r.pcts[sec]);
    } else {
      $('hiddenPattern').innerHTML = T.hiddenNormal(patterns[sec].name, r.pcts[sec]);
    }

    const bars = $('bars');
    bars.innerHTML = '';
    r.order.forEach(k => {
      const row = document.createElement('div');
      row.className = 'bar-row' + (k === dom || (r.coLead && k === sec) ? ' dominant' : '');
      row.innerHTML =
        '<span>' + patterns[k].name + '</span>' +
        '<span class="bar-bg"><span class="bar-fill" data-w="' + r.pcts[k] + '"></span></span>' +
        '<b>' + r.pcts[k] + T.pctSign + '</b>';
      bars.appendChild(row);
    });

    $('readingHeadline').textContent = P.headline;
    $('readingWound').textContent = P.wound;
    $('readingStep').textContent = P.step;
    $('sentTo').textContent = email || 'بريدكِ';

    // Precision mirrors — computed from her actual answer signature.
    const mirrors = buildMirrors(r);
    const mWrap = $('resultMirrors');
    if (mWrap) {
      if (mirrors.length) {
        mWrap.innerHTML = '<h3>' + T.mirrorsHeading + '</h3>' +
          mirrors.map(m => '<p>' + m + '</p>').join('');
        mWrap.style.display = '';
      } else {
        mWrap.style.display = 'none';
      }
    }

    // Personalized product path.
    const links = (CONFIG.products || {})[dom] || {};
    const prices = CONFIG.pricing || {};
    $('resultPath').innerHTML =
      '<h3>' + T.pathHeading + '</h3>' +
      '<p>' + T.pathIntro + '</p>' +
      '<div class="path-cards">' +
        pathCard('tier-lamhat', T.cardLamhat.label, T.cardLamhat.title, T.cardLamhat.desc,
          prices.lamhat, links.lamhat, T.cardLamhat.cta, 'lamhat_click', dom, 'lamhat') +
        pathCard('tier-juthur', T.cardJuthur.label, T.cardJuthur.title, T.cardJuthur.desc,
          prices.juthur, links.juthur, T.cardJuthur.cta, 'juthur_click', dom, 'juthur') +
        pathCard('tier-rebuild', T.cardRebuild.label, T.cardRebuild.title, T.cardRebuild.desc,
          prices.rebuild, links.rebuild, T.cardRebuild.cta, 'rebuild_click', dom, 'rebuild') +
      '</div>' +
      '<div class="waitlist-banner">' +
        '<p>' + T.waitlistBanner((((CONFIG.interdash || {}).monthlyPriceSAR) || 29)) + '</p>' +
        '<a class="btn btn-ghost" href="' + (T.interdashUrl || (CONFIG.urls || {}).interdash || '/interdash/') + '">' + T.waitlistCta + '</a>' +
      '</div>';

    showPanel('resultPanel');

    const fills = bars.querySelectorAll('.bar-fill');
    if (!reduced && typeof gsap !== 'undefined') {
      fills.forEach(f => gsap.to(f, { width: f.dataset.w + '%', duration: 1.4, ease: 'power2.out', delay: 0.4 }));
    } else {
      fills.forEach(f => (f.style.width = f.dataset.w + '%'));
    }
  }

  function pathCard(tier, label, title, desc, price, link, cta, ev, pattern, level) {
    const has = !!link;
    const data = ev ? ' data-ev="' + ev + '" data-pattern="' + pattern + '" data-level="' + level + '" data-section="quiz_result"' : '';
    return '<div class="path-card ' + tier + '">' +
      '<span class="step-label">' + label + '</span>' +
      '<h4>' + title + '</h4>' +
      '<p>' + desc + '</p>' +
      '<span class="price-line">' + (price != null ? T.price(price) : '') + '</span>' +
      (has ? '<a class="btn btn-gold" href="' + link + '" target="_blank" rel="noopener"' + data + '>' + cta + '</a>'
           : '<button class="btn btn-gold" disabled>' + T.soon + '</button>') +
      '</div>';
  }

  /* ---------- Returning visitor via ?result= ---------- */
  function tryRestoreFromUrl() {
    const m = location.search.match(/[?&]result=(\w+)/);
    if (!m || !patterns[m[1]]) return false;
    try {
      const saved = JSON.parse(localStorage.getItem('nizamok_last_result') || 'null');
      if (saved && saved.order && saved.order[0] === m[1]) {
        state.lastResult = {
          pcts: saved.pcts, order: saved.order, scores: saved.scores || {},
          closeCount: saved.closeCount || {}, secCount: saved.secCount || {},
          closeByAct: saved.closeByAct || { 1: {}, 2: {} },
          coLead: !!saved.coLead, highClarity: !!saved.highClarity
        };
        renderResult(saved.payload && saved.payload.email);
        return true;
      }
    } catch (e) { /* fall through */ }
    return false;
  }

  /* ---------- Wire up ---------- */
  function init() {
    if (!$('quizPanel')) return;
    if ($('totalQuestions')) $('totalQuestions').textContent = questions.length;

    $('startBtn').addEventListener('click', () => {
      if (!state.startTracked && window.trackEvent) {
        state.startTracked = true;
        window.trackEvent('quiz_start', { page_path: location.pathname, source_section: 'quiz_intro' });
      }
      state.index = 0; renderQuestion();
    });
    $('actContinueBtn').addEventListener('click', () => { state.index++; renderQuestion(); });
    $('prevBtn').addEventListener('click', prev);
    // «تابعي» — continue with only the closest answer (the second is optional).
    const nextBtn = $('nextBtn');
    if (nextBtn) nextBtn.addEventListener('click', advance);
    $('toEmailBtn').addEventListener('click', () => showPanel('emailPanel'));
    $('emailForm').addEventListener('submit', submitEmail);

    if (!tryRestoreFromUrl()) showPanel('introPanel');
    updateProgress();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
