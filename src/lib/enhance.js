/**
 * Fadhlillah — portfolio behaviour. No dependencies.
 * Everything here is an enhancement: without JS the page stays fully readable
 * (the .js class is never stamped, so no [data-reveal] element is ever hidden).
 *
 * Called from onMount; returns a cleanup function because SvelteKit keeps the
 * page alive across client-side navigation — observers, document listeners and
 * pending timers would otherwise leak between routes.
 */
export function enhance() {
  "use strict";

  // ponytail: only document-level listeners, observers and timers need cleanup —
  // element-scoped listeners die with the nodes Svelte removes on navigation.
  var timers = [];
  var later = function (fn, ms) { timers.push(setTimeout(fn, ms)); };

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
  var onKeydown = function (e) {
    if (!document.body.classList.contains('nav-open')) return;

    if (e.key === 'Escape') {
      setNav(false);
      if (toggle) toggle.focus();
      return;
    }

    // the open drawer covers the page — keep Tab inside it instead of letting
    // focus wander onto content the user cannot see
    if (e.key === 'Tab' && nav) {
      var stops = [toggle].concat(Array.prototype.slice.call(nav.querySelectorAll('a')));
      var first = stops[0];
      var last = stops[stops.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };
  document.addEventListener('keydown', onKeydown);

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

  var onScrollQueue = function () {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(onScroll);
  };
  document.addEventListener('scroll', onScrollQueue, { passive: true });
  onScroll();

  /* ---------- Contact shortcut hides once you're already in Contact ---------- */
  var contactSection = document.getElementById('contact');
  var fabContact = document.querySelector('.fab-contact');
  var fabIo = null;
  if (contactSection && fabContact && window.IntersectionObserver) {
    fabIo = new IntersectionObserver(function (entries) {
      fabContact.classList.toggle('is-off', entries[0].isIntersecting);
    }, { threshold: 0.12 });
    fabIo.observe(contactSection);
  }

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
      if (i < text.length) return later(tick, 26);
      Array.prototype.forEach.call(lines, function (line, idx) {
        later(function () { line.classList.add('tl-on'); }, 220 + idx * 70);
      });
    };
    later(tick, 500);
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
      var btnLabel = btn.textContent;
      sent.textContent = '';
      err.textContent = '';
      // the request can sit for up to 15s — a disabled button alone reads as a hang
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      btn.textContent = 'Sending…';
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
        btn.removeAttribute('aria-busy');
        btn.textContent = btnLabel;
      });
    });
  }

  return function cleanup() {
    if (io) io.disconnect();
    if (fabIo) fabIo.disconnect();
    document.removeEventListener('scroll', onScrollQueue);
    document.removeEventListener('keydown', onKeydown);
    timers.forEach(function (t) { clearTimeout(t); });
    timers.length = 0;
  };
}
