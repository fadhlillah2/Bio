/**
 * Fadhlillah — portfolio behaviour. No dependencies.
 * Everything here is an enhancement: without JS the page stays fully readable
 * (the .js class is never stamped, so no [data-reveal] element is ever hidden).
 */
(function () {
  "use strict";

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Scroll reveal ---------- */
  var revealables = document.querySelectorAll('[data-reveal]');
  if (!window.IntersectionObserver || reduced) {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
    Array.prototype.forEach.call(revealables, function (el) { io.observe(el); });
  }

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  var setNav = function (open) {
    document.body.classList.toggle('nav-open', open);
    if (toggle) toggle.setAttribute('aria-expanded', String(open));
  };
  if (toggle) {
    toggle.addEventListener('click', function () {
      setNav(!document.body.classList.contains('nav-open'));
    });
  }
  if (nav) {
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
      setNav(false);
      if (toggle) toggle.focus();
    }
  });

  /* ---------- Scroll state: sticky bar, back-to-top, section spy ---------- */
  var topbar = document.getElementById('topbar');
  var fabs = Array.prototype.slice.call(document.querySelectorAll('.fab'));
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
  var targets = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  var queued = false;

  var onScroll = function () {
    var y = window.scrollY;
    if (topbar) topbar.classList.toggle('is-stuck', y > 8);
    fabs.forEach(function (f) { f.classList.toggle('is-on', y > 420); });

    // last section whose top has passed just below the sticky bar wins
    var active = -1;
    targets.forEach(function (section, i) {
      if (section && section.getBoundingClientRect().top <= 140) active = i;
    });
    links.forEach(function (a, i) {
      if (i === active) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
    queued = false;
  };

  document.addEventListener('scroll', function () {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(onScroll);
  }, { passive: true });
  onScroll();

  /* ---------- Hero terminal: type the command, then stagger the response ---------- */
  var term = document.getElementById('hero-term');
  var cmd = document.getElementById('hero-cmd');
  if (term && cmd && !reduced) {
    var text = cmd.textContent;
    var lines = term.querySelectorAll('.tl:not(.tl-cmd)');
    term.classList.add('is-boot');
    cmd.textContent = '';
    var i = 0;
    var tick = function () {
      cmd.textContent = text.slice(0, ++i);
      if (i < text.length) return setTimeout(tick, 26);
      Array.prototype.forEach.call(lines, function (line, idx) {
        setTimeout(function () { line.classList.add('tl-on'); }, 220 + idx * 70);
      });
    };
    setTimeout(tick, 500);
  }

  /* ---------- Contact form ----------
   * AJAX submit with graceful failure (FormSubmit can be down — a plain POST
   * would strand the visitor on a raw Cloudflare error page). No-JS browsers
   * fall back to the form's plain action + ?sent=1 redirect. Messages are
   * injected into always-rendered live regions (revealing from display:none
   * makes role=status/alert announcements unreliable) and the fetch aborts
   * after 15s so the Send button never stays stuck disabled.
   */
  var sent = document.getElementById('contact-sent');
  var err = document.getElementById('contact-error');
  var SENT_MSG = 'Your message has been sent. Thank you!';
  var ERR_MSG = 'Sending failed — the form service is unreachable right now. Please email <a href="mailto:fadhlillah949699@gmail.com">fadhlillah949699@gmail.com</a> or use the WhatsApp link instead.';

  if (window.location.search.indexOf('sent=1') !== -1 && sent) {
    sent.textContent = SENT_MSG;
  }

  var form = document.querySelector('.contact-form');
  if (form && window.fetch) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      sent.textContent = '';
      err.textContent = '';
      btn.disabled = true;
      var ctrl = window.AbortController ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 15000) : null;
      fetch('https://formsubmit.co/ajax/fadhlillah949699@gmail.com', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form),
        signal: ctrl ? ctrl.signal : undefined
      }).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        sent.textContent = SENT_MSG;
        form.reset();
      }).catch(function () {
        err.innerHTML = ERR_MSG;
      }).finally(function () {
        if (timer) clearTimeout(timer);
        btn.disabled = false;
      });
    });
  }

})();
