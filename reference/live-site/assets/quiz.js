const CONFIG = window.NIZAMOK_CONFIG || {};

const patterns = {
  mubdia: {
    name: 'المبدعة المشتتة',
    short: 'تشتعلين بفكرة جديدة قبل أن تحمي الفكرة التي كانت قريبة من الوصول.',
    truth: 'أنتِ لا تنقصكِ الأفكار؛ تنقصكِ فكرة واحدة تصل.'
  },
  asira: {
    name: 'أسيرة الكمال',
    short: 'تؤجلين الظهور لأن العمل لم يصل بعد إلى الصورة التي لا تُنتقد.',
    truth: 'نقص العمل لا يعني نقصًا فيكِ.'
  },
  mutafadiya: {
    name: 'المتفادية الذكية',
    short: 'تعرفين الباب الذي يجب فتحه، لكن الشعور خلفه يبدو أثقل من المهمة نفسها.',
    truth: 'أنتِ لا تتجنبين المهمة، بل الشعور الذي خلفها.'
  },
  kafua: {
    name: 'الكفؤة المنهكة',
    short: 'يحملكِ الجميع لأنكِ قادرة، فتغيبين أنتِ عن نهاية يومكِ.',
    truth: 'أن تكوني قادرة لا يعني أن تكوني متاحة دائمًا.'
  }
};

const questions = [
  {
    text: 'تبدئين شيئًا جديدًا بحماس. بعد الأيام الأولى، ما الذي يحدث غالبًا؟',
    options: [
      {p:'mubdia', t:'تظهر فكرة ثانية، وأشعر أنها أقرب لما أريد فعله فعلًا.'},
      {p:'asira', t:'أبقى أعدّل لأن النسخة لا تطمئنني بعد.'},
      {p:'mutafadiya', t:'أترك الجزء الأثقل، وأشغل نفسي بشيء أسهل.'},
      {p:'kafua', t:'ينسحب وقتي على طلبات الناس، ويختفي مشروعي بهدوء.'}
    ]
  },
  {
    text: 'تصلكِ رسالة تحتاج ردًا واضحًا. ما الذي يحصل عادة؟',
    options: [
      {p:'mutafadiya', t:'أؤجل الرد حتى أهدأ أو أعرف ماذا أقول بالضبط.'},
      {p:'asira', t:'أكتب الرد ثم أعدله أكثر من مرة، حتى لا أبدو ناقصة أو قاسية.'},
      {p:'kafua', t:'أرد بسرعة حتى لا ينتظرني أحد أو يزعل مني.'},
      {p:'mubdia', t:'أفتح شيئًا آخر فجأة، وكأن الرد قطع عليّ مزاجي.'}
    ]
  },
  {
    text: 'عندما يقولون لكِ: “ما شاء الله عليكِ، دائمًا تتصرفين”، ماذا تشعرين؟',
    options: [
      {p:'kafua', t:'أفرح قليلًا، ثم أشعر أنني صرت مسؤولة أكثر.'},
      {p:'asira', t:'أخاف أن أخيب الصورة التي أخذوها عني، فأرفع المعيار أكثر.'},
      {p:'mutafadiya', t:'أستخدم الانشغال كسبب مقبول لتأجيل ما يخصني.'},
      {p:'mubdia', t:'أفكر في شيء جديد يثبت أنني لست محصورة في هذا الدور.'}
    ]
  },
  {
    text: 'أمام مهمة تعرفين أنها مهمة فعلًا، أين يذهب تركيزكِ؟',
    options: [
      {p:'mutafadiya', t:'إلى الترتيب والتحضير والبحث، بدل فتح الجزء الأصعب.'},
      {p:'mubdia', t:'إلى فكرة جديدة تبدو أذكى وأخف من المهمة الحالية.'},
      {p:'asira', t:'إلى التعديل؛ أحتاج أن أطمئن أكثر قبل أن أُخرجها.'},
      {p:'kafua', t:'إلى طلب آخر من أحد، ثم أقول لنفسي إن اليوم انتهى.'}
    ]
  },
  {
    text: 'أي جملة تشبه العقد غير المعلن بينكِ وبين نفسك؟',
    options: [
      {p:'asira', t:'إذا ظهر النقص في عملي، سيحسبونه نقصًا فيّ.'},
      {p:'mutafadiya', t:'إذا اقتربت الآن، سأضطر لمواجهة شعور لا أريده.'},
      {p:'mubdia', t:'إذا اخترت طريقًا واحدًا، سأخسر باقي الاحتمالات.'},
      {p:'kafua', t:'إذا لم أتحمل، سأخذلهم أو يتغير مكانتي عندهم.'}
    ]
  },
  {
    text: 'عندما يخف الحماس، كيف تفسرين الأمر؟',
    options: [
      {p:'mubdia', t:'أقول ربما هذه ليست الفكرة الصحيحة، وهناك شيء أوسع ينتظرني.'},
      {p:'asira', t:'أشعر أن العمل ليس بالمستوى الذي يليق بي بعد.'},
      {p:'mutafadiya', t:'أقول الوقت غير مناسب، وسأعود عندما تتضح الصورة.'},
      {p:'kafua', t:'أقول لا وقت للحماس الآن؛ هناك أشياء يجب أن أتحملها أولًا.'}
    ]
  },
  {
    text: 'في اليوم المزدحم، ما أول شيء يسقط من حسابكِ؟',
    options: [
      {p:'kafua', t:'راحتي وما يخصني، لأن طلبات الآخرين تدخل قبلهما.'},
      {p:'mutafadiya', t:'المهمة التي فيها توتر أو مواجهة، حتى لو كانت الأهم.'},
      {p:'asira', t:'التسليم النهائي؛ يظل العمل قريبًا من النهاية ولا يخرج.'},
      {p:'mubdia', t:'الاستمرار في الشيء القديم، لأن الجديد يعيد لي الطاقة.'}
    ]
  },
  {
    text: 'أي مشهد من هذه المشاهد يشبهكِ أكثر؟',
    options: [
      {p:'mubdia', t:'مجلدات وأسماء وأفكار كثيرة، ولا شيء وصل للناس بوضوح.'},
      {p:'asira', t:'ملف مفتوح لأيام لأن النسخة الأخيرة لم تطمئنني.'},
      {p:'mutafadiya', t:'رسالة أو قرار أؤجله، وكل يوم يصبح أثقل.'},
      {p:'kafua', t:'أقول “عادي” وأنا أعرف أنني سأدفع الثمن من طاقتي لاحقًا.'}
    ]
  },
  {
    text: 'عندما ترين من سبقكِ أو ظهر قبلكِ، ما ردّكِ الداخلي؟',
    options: [
      {p:'asira', t:'أصمت أكثر؛ لأن نسختي لا تبدو جاهزة أمام صورتهم المكتملة.'},
      {p:'mubdia', t:'أبحث عن فكرة مختلفة تجعلني أتجاوز الطريق العادي.'},
      {p:'mutafadiya', t:'أؤجل الخطوة حتى لا أواجه شعور التأخر.'},
      {p:'kafua', t:'أقول لنفسي إن وقتي ليس لي أصلًا، فلا داعي للمقارنة الآن.'}
    ]
  },
  {
    text: 'أي نصيحة يكررونها عليكِ وتشعرين أنها لا ترى ما يحدث فعلًا؟',
    options: [
      {p:'mutafadiya', t:'“نظمي وقتكِ”؛ بينما المشكلة في الشعور الذي يسبق المهمة.'},
      {p:'asira', t:'“سلّمي وخلاص”؛ كأن الخوف من الحكم عليكِ أمر بسيط.'},
      {p:'mubdia', t:'“ركزي على شيء واحد”؛ كأن الفكرة الجديدة لا تسحبكِ فعلًا.'},
      {p:'kafua', t:'“ضعي حدودًا”؛ كأن الذنب بعد الحد لا يأخذ منكِ شيئًا.'}
    ]
  },
  {
    text: 'ما الراحة القصيرة التي تعيدكِ إلى نفس الحلقة؟',
    options: [
      {p:'asira', t:'راحة صغيرة بعد تعديل جديد يجعل القلق يهدأ قليلًا.'},
      {p:'mutafadiya', t:'هدوء مؤقت عندما أبتعد عن الشيء الثقيل.'},
      {p:'mubdia', t:'نشوة البداية الجديدة قبل أن يأتي ثقل المنتصف.'},
      {p:'kafua', t:'هدوء العلاقة عندما أقول نعم بسرعة.'}
    ]
  },
  {
    text: 'لو احتجتِ خطوة واحدة اليوم، أي خطوة تبدو أصدق؟',
    options: [
      {p:'mubdia', t:'أحمي فكرة واحدة من بريق الأفكار الأخرى حتى تصل.'},
      {p:'asira', t:'أُخرج نسخة يمكن تحسينها بدل أن أبقيها مخفية.'},
      {p:'mutafadiya', t:'أقترب دقيقة واحدة من الباب الذي أؤجله.'},
      {p:'kafua', t:'أرى ثمن “نعم” قبل أن أقولها.'}
    ]
  }
];

let state = { index: 0, answers: [], closest: null, farthest: null };
let scores = Object.fromEntries(Object.keys(patterns).map(k => [k,0]));



const $ = (id) => document.getElementById(id);

function initQuiz(){
  if(!$('questionText')) return;
  $('totalQuestions').textContent = questions.length;
  $('nextBtn').addEventListener('click', nextQuestion);
  $('prevBtn').addEventListener('click', prevQuestion);
  $('emailForm').addEventListener('submit', submitEmail);
  renderQuestion();
}

function renderQuestion(){
  const q = questions[state.index];
  state.closest = state.answers[state.index]?.closest ?? null;
  state.farthest = state.answers[state.index]?.farthest ?? null;

  $('quizPanel').classList.add('active');
  $('emailPanel').classList.remove('active');
  $('resultPanel').classList.remove('active');

  $('currentQuestion').textContent = state.index + 1;
  $('questionText').textContent = q.text;
  $('progressBar').style.width = `${(state.index / questions.length) * 100}%`;
  $('quizMsg').textContent = '';

  const options = $('options');
  options.innerHTML = '';

  q.options.forEach((opt, i)=>{
    const div = document.createElement('div');
    div.className = 'option';
    div.innerHTML = `
      <span class="option-index">${i+1}</span>
      <span>${opt.t}</span>
      <button type="button" class="choice-btn closest ${state.closest===i?'active':''}" data-kind="closest" data-i="${i}">الأقرب</button>
      <button type="button" class="choice-btn farthest ${state.farthest===i?'active':''}" data-kind="farthest" data-i="${i}">الأبعد</button>
    `;
    options.appendChild(div);
  });

  options.querySelectorAll('.choice-btn').forEach(btn => btn.addEventListener('click', choose));
  $('prevBtn').disabled = state.index === 0;
  $('nextBtn').textContent = state.index === questions.length - 1 ? 'احسبي نتيجتي' : 'الموقف التالي';
}

function choose(e){
  const i = Number(e.currentTarget.dataset.i);
  const kind = e.currentTarget.dataset.kind;

  if(kind === 'closest'){
    if(state.farthest === i) state.farthest = null;
    state.closest = i;
  } else {
    if(state.closest === i) state.closest = null;
    state.farthest = i;
  }

  state.answers[state.index] = { closest: state.closest, farthest: state.farthest };
  renderQuestion();
}

function nextQuestion(){
  if(state.closest === null || state.farthest === null){
    $('quizMsg').textContent = 'اختاري الأقرب إليكِ والأبعد عنكِ قبل المتابعة.';
    return;
  }

  state.answers[state.index] = { closest: state.closest, farthest: state.farthest };

  if(state.index < questions.length - 1){
    state.index++;
    renderQuestion();
    return;
  }

  const result = calculateResult();
  state.lastResult = result;
  renderEmailGate(result);
}

function prevQuestion(){
  if(state.index > 0){
    state.index--;
    renderQuestion();
  }
}

function calculateResult(){
  const scores = { mubdia: 0, asira: 0, mutafadiya: 0, kafua: 0 };

  state.answers.forEach((ans, qi)=>{
    const q = questions[qi];
    if(ans?.closest !== null && ans?.closest !== undefined){
      scores[q.options[ans.closest].p] += 2;
    }
    if(ans?.farthest !== null && ans?.farthest !== undefined){
      scores[q.options[ans.farthest].p] -= 1;
    }
  });

  const minScore = Math.min(...Object.values(scores));
  const shifted = {};
  Object.keys(scores).forEach(k => shifted[k] = scores[k] - minScore + 1);

  const total = Object.values(shifted).reduce((a,b)=>a+b,0);
  const pcts = {};
  Object.keys(shifted).forEach(k => pcts[k] = Math.round((shifted[k] / total) * 100));

  const diff = 100 - Object.values(pcts).reduce((a,b)=>a+b,0);
  const order = Object.keys(pcts).sort((a,b)=>pcts[b]-pcts[a]);
  pcts[order[0]] += diff;

  return { scores, pcts, order };
}

function renderEmailGate(result){
  $('quizPanel').classList.remove('active');
  $('resultPanel').classList.remove('active');
  $('emailPanel').classList.add('active');
  $('progressBar').style.width = '100%';

  const emailMsg = $('emailMsg');
  if(emailMsg) emailMsg.textContent = '';

  const preview = $('emailPreview');
  if(preview){
    const top = result.pcts[result.order[0]];
    const second = result.pcts[result.order[1]];
    preview.innerHTML = `
      <div class="gate-preview-card">
        <span class="gate-pill">تم الحساب</span>
        <h3>حسبنا مزيجكِ</h3>
        <p>أعلى نمط ظهر بنسبة <strong>${top}٪</strong>، ووالنمط الثاني بنسبة <strong>${second}٪</strong>.</p>
        <p>خطوة أخيرة: ضعي بريدكِ لنفتح لكِ قراءة النمط هنا، ونرسل التقرير الأول لتعودي إليه في أي وقت.</p>
      </div>
    `;
  }
}

function resultCopy(patternKey){
  const data = {
    mubdia: {
      title: 'المبدعة المشتتة',
      headline: 'يبدو أنكِ تتحركين بقوة مع البدايات. الفكرة الجديدة تعطيكِ شعورًا جميلًا بالاتساع، لكنها أحيانًا تسحبكِ من الشيء الذي كان قريبًا من الوصول.',
      wound: 'ما يتكرر هنا ليس نقصًا في القدرة، بل صعوبة في البقاء مع منتصف الطريق عندما يصبح أقل لمعانًا وأكثر طلبًا للصبر.',
      step: 'اختاري فكرة واحدة لهذا الأسبوع. لا تلغي باقي الأفكار؛ فقط اتركيها في مكان آمن حتى تعطين فكرة واحدة حقها في الوصول.'
    },
    asira: {
      title: 'أسيرة الكمال',
      headline: 'يبدو أنكِ لا تخافين من العمل نفسه، بل من ظهوره ناقصًا أمام عين أخرى. لذلك يصبح التعديل طريقة لتهدئة القلق، لا دائمًا لتحسين النتيجة.',
      wound: 'ما يتكرر هنا أن جودة العمل تختلط بقيمتكِ الشخصية. كأن كل ملاحظة على العمل ستصبح ملاحظة عليكِ أنتِ.',
      step: 'قبل أي تعديل جديد، اسألي: هل هذا يخدم العمل فعلًا، أم يخفف قلقي فقط؟ ثم أخرجي نسخة قابلة للتحسين.'
    },
    mutafadiya: {
      title: 'المتفادية الذكية',
      headline: 'يبدو أنكِ تعرفين غالبًا ما يجب فعله، لكن الاقتراب من المهمة يفتح شعورًا غير مريح؛ فتبدين منشغلة، بينما الباب الأساسي يبقى كما هو.',
      wound: 'ما يتكرر هنا أن الشعور يكبر قبل المهمة نفسها: توتر، غموض، احتمال رفض، أو لحظة مواجهة لا تريدينها الآن.',
      step: 'افتحي الباب دقيقة واحدة فقط. رسالة، ملف، مكالمة، أو قرار. المطلوب ليس إنهاء كل شيء؛ المطلوب أن يصغر الشعور قليلًا.'
    },
    kafua: {
      title: 'الكفؤة المنهكة',
      headline: 'يبدو أنكِ تعوّدتِ أن تكوني الشخص الذي يعرف ماذا يفعل. هذا جميل، لكنه يصبح مرهقًا حين تتحول القدرة إلى توفر دائم.',
      wound: 'ما يتكرر هنا أن قول “نعم” يريح العلاقة لحظة، لكنه يأخذ من وقتكِ وطاقتكِ وما يخصكِ أنتِ.',
      step: 'قبل الموافقة التالية، اسألي بهدوء: ما ثمن هذه “النعم”؟ وهل هذا دوري فعلًا؟'
    }
  };
  return data[patternKey];
}

async function submitEmail(e){
  e.preventDefault();

  const email = $('email').value.trim();
  if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    $('emailMsg').textContent = 'يرجى إدخال بريدٍ إلكتروني صحيح.';
    return;
  }

  if(!state.lastResult){
    state.lastResult = calculateResult();
  }

  $('emailMsg').textContent = 'نفتح القراءة ونجهّز التقرير الأول...';
  await sendPayloadForEmail(email, state.lastResult, 'emailMsg');
  renderResult(state.lastResult.pcts, state.lastResult.order, email);
}

async function sendPayloadForEmail(email, result, messageId){
  const dominant = result.order[0];
  const pcts = result.pcts;
  const msg = $(messageId);

  const payload = {
    email,
    fields: {
      dominant_pattern: dominant,
      dominant_pattern_name: patterns[dominant].name,
      secondary_pattern: result.order[1],
      secondary_pattern_name: patterns[result.order[1]].name,
      mubdia_percent: String(pcts.mubdia),
      asira_percent: String(pcts.asira),
      mutafadiya_percent: String(pcts.mutafadiya),
      kafua_percent: String(pcts.kafua),
      result_url: `${location.origin}${location.pathname}?result=${dominant}`,
      free_report_url: CONFIG.reports?.[dominant] || '',
      dominant_percent: String(pcts[dominant])
    }
  };

  await sendToMailerLite(payload);
  localStorage.setItem('nizamok_last_email_payload', JSON.stringify(payload));

  if(msg) msg.textContent = 'فتحت القراءة الآن. سنرسل التقرير الأول إلى بريدكِ خلال دقائق.';
}

async function sendToMailerLite(payload){
  const pattern = payload?.fields?.dominant_pattern;
  const patternEndpoint = CONFIG.mailerLite?.formEndpoints?.[pattern];
  const endpoint = patternEndpoint || CONFIG.mailerLite?.endpoint || '';

  // If MailerLite is not configured yet, keep the quiz working locally.
  if(!CONFIG.mailerLite?.enabled || !endpoint){
    localStorage.setItem('nizamok_last_result', JSON.stringify(payload));
    return { ok:true, local:true, reason:'mailerlite_not_configured' };
  }

  try{
    if(CONFIG.mailerLite.mode === 'worker-proxy'){
      await fetch(endpoint, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
    } else {
      const form = new FormData();

      // MailerLite embedded forms expect this email field format.
      form.append('fields[email]', payload.email);

      // Send custom fields. They must exist in MailerLite if you want to use them in emails.
      Object.entries(payload.fields || {}).forEach(([k,v])=>{
        form.append(`fields[${k}]`, v);
      });

      await fetch(endpoint, { method:'POST', body:form, mode:'no-cors' });
    }
  }catch(err){
    console.warn('MailerLite submit failed; result preserved locally.', err);
    if(CONFIG.mailerLite?.backupEndpoint){
      try{
        await fetch(CONFIG.mailerLite.backupEndpoint,{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify(payload)
        });
      }catch(e){}
    }
  }

  return {ok:true};
}

function renderResult(pcts, order, email){
  const dominant = order[0];
  const secondary = order[1];
  const productLinks = CONFIG.products?.[dominant] || {};
  const copy = resultCopy(dominant);

  $('quizPanel').classList.remove('active');
  $('emailPanel').classList.remove('active');
  $('resultPanel').classList.add('active');

  $('dominantName').textContent = copy.title;
  $('dominantTruth').textContent = patterns[dominant].truth;
  $('dominantSummary').textContent = patterns[dominant].short;

  const bars = $('bars');
  bars.innerHTML = '';
  order.forEach(k=>{
    const row = document.createElement('div');
    row.className = 'bar-row';
    row.innerHTML = `<span>${patterns[k].name}</span><span class="bar-bg"><span class="bar-fill" style="width:${pcts[k]}%"></span></span><b>${pcts[k]}٪</b>`;
    bars.appendChild(row);
  });

  const sentTo = $('sentTo');
  if(sentTo) sentTo.textContent = email || 'بريدكِ';

  const resultOffers = $('resultOffers');
  resultOffers.innerHTML = `
    <div class="result-story">
      <h3>قراءة نمطكِ</h3>
      <p>${copy.headline}</p>
      <h4>ما الذي يتكرر؟</h4>
      <p>${copy.wound}</p>
      <h4>خطوة صغيرة اليوم</h4>
      <p>${copy.step}</p>
      <p class="result-note">نمطكِ المساند هو <strong>${patterns[secondary].name}</strong> بنسبة ${pcts[secondary]}٪، لذلك قد تشعرين أحيانًا أن النمطين يعملان معًا.</p>
    </div>

    <div class="offer"><strong>لمحات</strong><small>افهمي ما يحدث الآن.</small><b>29 ريال</b><a class="btn btn-gold" href="${productLinks.lamhat || '#'}">افتحي لمحات</a></div>
    <div class="offer"><strong>جذور</strong><small>افهمي لماذا يتكرر.</small><b>39 ريال</b><a class="btn btn-gold" href="${productLinks.juthur || '#'}">افتحي جذور</a></div>
    <div class="offer soon"><strong>برنامج ٧ أيام</strong><small>قريبًا: جسر عملي قصير بين الفهم والتغيير.</small><b>قريبًا</b><button class="btn btn-dark" disabled>قريبًا</button></div>
    <div class="offer"><strong>نظام إعادة البناء</strong><small>ابدئي تغييره عمليًا.</small><b>109 ريال</b><a class="btn btn-gold" href="${productLinks.rebuild || '#'}">افتحي النظام</a></div>
    <div class="offer soon"><strong>الخريطة التفاعلية</strong><small>قريبًا: متابعة يومية لحالتكِ وخطواتكِ وتقدمكِ.</small><b>قريبًا</b><button class="btn btn-dark" disabled>قريبًا</button></div>
  `;

  localStorage.setItem('nizamok_last_result_visible_after_email', JSON.stringify({
    email,
    pattern: dominant,
    percentages: pcts,
    order,
    shown_at: new Date().toISOString()
  }));
}

document.addEventListener('DOMContentLoaded', initQuiz);
