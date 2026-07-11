/* NizamOk shared behavior: navigation, GSAP motion, waitlist form. */
(function () {
  'use strict';

  const CONFIG = window.NIZAMOK || {};
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) document.documentElement.classList.add('reduced-motion');

  /* ---------- Mobile nav ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => links.classList.remove('open')));
  }

  /* ---------- GSAP motion (slow, quiet, intentional) ---------- */
  function initMotion() {
    if (reduced || typeof gsap === 'undefined') {
      document.querySelectorAll('.reveal').forEach(el => (el.style.opacity = 1));
      return;
    }
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    document.querySelectorAll('[data-reveal-group]').forEach(group => {
      const items = group.querySelectorAll('.reveal');
      if (!items.length) return;
      gsap.fromTo(items,
        { opacity: 0, y: 26 },
        {
          opacity: 1, y: 0,
          duration: 1.1, ease: 'power2.out', stagger: 0.14,
          scrollTrigger: window.ScrollTrigger
            ? { trigger: group, start: 'top 82%' }
            : undefined
        });
    });

    document.querySelectorAll('.reveal:not([data-reveal-group] .reveal)').forEach(el => {
      gsap.fromTo(el,
        { opacity: 0, y: 26 },
        {
          opacity: 1, y: 0, duration: 1.1, ease: 'power2.out',
          scrollTrigger: window.ScrollTrigger
            ? { trigger: el, start: 'top 85%' }
            : undefined
        });
    });

    // Hero pattern line draws itself once on load.
    const line = document.querySelector('.pattern-line-svg path');
    if (line) {
      const len = line.getTotalLength();
      gsap.fromTo(line,
        { strokeDasharray: len, strokeDashoffset: len },
        { strokeDashoffset: 0, duration: 2.6, ease: 'power2.inOut', delay: 0.3 });
    }

    // The hero phone floats, slowly.
    const phone = document.querySelector('.hero-phone img');
    if (phone) {
      gsap.to(phone, { y: -12, duration: 3.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    }

    // The real signature fades in, then glows once — quiet, expensive.
    const wm = document.querySelector('.hero-wordmark');
    if (wm) {
      const tl = gsap.timeline({ delay: 0.4 });
      tl.from(wm, { opacity: 0, y: 10, duration: 1.4, ease: 'power2.out' })
        .fromTo(wm,
          { filter: 'drop-shadow(0 0 14px rgba(201,167,94,0.25)) brightness(1)' },
          { filter: 'drop-shadow(0 0 22px rgba(201,167,94,0.5)) brightness(1.18)',
            duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: 1 }, '-=0.3');
    }

    // Gold swoosh in the logo draws itself.
    document.querySelectorAll('.logo-swoosh').forEach(sw => {
      const len = sw.getTotalLength ? sw.getTotalLength() : 0;
      if (!len) return;
      gsap.fromTo(sw,
        { strokeDasharray: len, strokeDashoffset: len },
        { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', delay: 0.6 });
    });
  }

  /* ---------- Interdash video ---------- */
  function initVideo() {
    const shell = document.querySelector('[data-video-shell]');
    if (!shell) return;
    const v = (CONFIG.interdash && CONFIG.interdash.video) || {};
    if (v.aspect === '4:5') shell.classList.add('portrait');
    if (v.src && v.type === 'mp4') {
      shell.innerHTML =
        '<video controls playsinline preload="metadata"' +
        (v.poster ? ' poster="' + v.poster + '"' : '') +
        ' src="' + v.src + '"></video>';
    } else if (v.src && v.type === 'youtube') {
      shell.innerHTML =
        '<iframe src="https://www.youtube-nocookie.com/embed/' + v.src +
        '?rel=0&modestbranding=1" title="لوحة نظامك التفاعلية" allowfullscreen ' +
        'allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"></iframe>';
    }
    // else: keep the premium "coming soon" poster already in the markup.
  }

  /* ---------- Waiting list form ---------- */
  async function submitWaitlist(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const msg = form.querySelector('.form-msg');
    const name = (form.querySelector('[name="first_name"]') || {}).value || '';
    const email = (form.querySelector('[name="email"]') || {}).value || '';
    const pattern = (form.querySelector('[name="pattern"]') || {}).value || '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      msg.textContent = 'يرجى إدخال بريدٍ إلكتروني صحيح.';
      msg.classList.remove('ok');
      return;
    }

    const payload = {
      email: email.trim(),
      // MailerLite's default "name" field = first name → usable as {$name} in emails.
      fields: { name: name.trim(), pattern: pattern, source: 'interdash_waitlist' }
    };

    const ml = CONFIG.mailerLite || {};
    const endpoint = ml.waitlistEndpoint || ml.endpoint || '';
    msg.textContent = 'نسجّل انضمامكِ...';
    msg.classList.remove('ok');

    try {
      if (ml.enabled && endpoint) {
        const fd = new FormData();
        fd.append('fields[email]', payload.email);
        Object.entries(payload.fields).forEach(([k, v]) => fd.append('fields[' + k + ']', v));
        await fetch(endpoint, { method: 'POST', body: fd, mode: 'no-cors' });
      } else {
        // MailerLite not wired yet — keep the signup safe locally.
        const stash = JSON.parse(localStorage.getItem('nizamok_waitlist') || '[]');
        stash.push(Object.assign({ at: new Date().toISOString() }, payload));
        localStorage.setItem('nizamok_waitlist', JSON.stringify(stash));
      }
      msg.textContent = 'انضممتِ إلى القائمة. سنراسلكِ عند فتح التجربة المبكرة.';
      msg.classList.add('ok');
      form.reset();
    } catch (err) {
      msg.textContent = 'تعذّر الإرسال الآن. حاولي مرة أخرى بعد قليل.';
      msg.classList.remove('ok');
    }
  }

  document.querySelectorAll('form[data-waitlist]').forEach(f =>
    f.addEventListener('submit', submitWaitlist));

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(el =>
    (el.textContent = String(new Date().getFullYear())));

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initMotion(); initVideo(); });
  } else {
    initMotion(); initVideo();
  }
})();
