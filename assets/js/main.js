/**
* Template Name: iPortfolio - v3.0.1
* Template URL: https://bootstrapmade.com/iportfolio-bootstrap-portfolio-websites-template/
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/
(function() {
  "use strict";

  /**
   * Easy selector helper function
   */
  const select = (el, all = false) => {
    el = el.trim()
    try {
      if (all) {
        return [...document.querySelectorAll(el)]
      } else {
        return document.querySelector(el)
      }
    } catch (e) {
      // location.hash is fed here raw; a non-selector hash (#123) must not throw
      return all ? [] : null
    }
  }

  /**
   * Easy event listener function
   */
  const on = (type, el, listener, all = false) => {
    let selectEl = select(el, all)
    if (selectEl) {
      if (all) {
        selectEl.forEach(e => e.addEventListener(type, listener))
      } else {
        selectEl.addEventListener(type, listener)
      }
    }
  }

  /**
   * Navbar links active state on scroll
   */
  let navbarlinks = select('#navbar .scrollto', true)
  const navbarlinksActive = () => {
    let position = window.scrollY + 200
    navbarlinks.forEach(navbarlink => {
      if (!navbarlink.hash) return
      let section = select(navbarlink.hash)
      if (!section) return
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        navbarlink.classList.add('active')
      } else {
        navbarlink.classList.remove('active')
      }
    })
  }
  window.addEventListener('load', navbarlinksActive)
  document.addEventListener('scroll', navbarlinksActive, { passive: true })

  /**
   * Smooth-scrolls to an element (sidebar layout: no top-offset needed)
   */
  const scrollto = (el) => {
    let elementPos = select(el).offsetTop
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({
      top: elementPos,
      behavior: reduced ? 'auto' : 'smooth'
    })
  }

  /**
   * Back to top button
   */
  let backtotop = select('.back-to-top')
  if (backtotop) {
    const toggleBacktotop = () => {
      if (window.scrollY > 100) {
        backtotop.classList.add('active')
      } else {
        backtotop.classList.remove('active')
      }
    }
    window.addEventListener('load', toggleBacktotop)
    document.addEventListener('scroll', toggleBacktotop, { passive: true })
  }

  /**
   * Mobile nav toggle
   */
  on('click', '.mobile-nav-toggle', function() {
    document.body.classList.toggle('mobile-nav-active')
    this.classList.toggle('bi-list')
    this.classList.toggle('bi-x')
    this.setAttribute('aria-expanded', document.body.classList.contains('mobile-nav-active'))
  })

  /**
   * Scroll on links with a class name .scrollto
   */
  on('click', '.scrollto', function(e) {
    if (select(this.hash)) {
      e.preventDefault()

      let body = document.body
      if (body.classList.contains('mobile-nav-active')) {
        body.classList.remove('mobile-nav-active')
        let navbarToggle = select('.mobile-nav-toggle')
        navbarToggle.classList.toggle('bi-list')
        navbarToggle.classList.toggle('bi-x')
        navbarToggle.setAttribute('aria-expanded', 'false')
      }
      scrollto(this.hash)
    }
  }, true)

  /**
   * Scroll on page load with hash links in the url
   */
  window.addEventListener('load', () => {
    if (window.location.hash && select(window.location.hash)) {
      scrollto(window.location.hash)
    }
  });

  /**
   * Animation on scroll
   */
  window.addEventListener('load', () => {
    AOS.init({
      duration: 1000,
      easing: 'ease-in-out',
      once: true,
      disable: function () {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      }
    })

    // Toggling the early-practice <details> shifts the layout below it; tell
    // AOS to recompute offsets so sections beneath still reveal correctly.
    const ep = document.querySelector('details.early-practice');
    if (ep && typeof AOS !== 'undefined') {
      ep.addEventListener('toggle', () => { AOS.refresh(); });
    }
  });

  /**
   * Contact form: AJAX submit with graceful failure (FormSubmit can be down — a
   * plain POST would strand the visitor on a raw Cloudflare error page).
   * No-JS browsers fall back to the form's plain action + ?sent=1 redirect.
   * Messages are injected into always-rendered live regions (revealing from
   * display:none makes role=status/alert announcements unreliable) and the
   * fetch aborts after 15s so the Send button never stays stuck disabled.
   */
  const sent = select('#contact-sent')
  const err = select('#contact-error')
  const SENT_MSG = 'Your message has been sent. Thank you!'
  const ERR_MSG = 'Sending failed — the form service is unreachable right now. Please email <a href="mailto:fadhlillah949699@gmail.com" style="color: #fff; text-decoration: underline;">fadhlillah949699@gmail.com</a> or use the WhatsApp link instead.'
  if (window.location.search.indexOf('sent=1') !== -1 && sent) {
    sent.textContent = SENT_MSG
  }
  const form = select('.php-email-form')
  if (form && window.fetch) {
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      const btn = form.querySelector('button[type="submit"]')
      sent.textContent = ''
      err.textContent = ''
      btn.disabled = true
      const ctrl = window.AbortController ? new AbortController() : null
      const timer = ctrl ? setTimeout(() => ctrl.abort(), 15000) : null
      fetch('https://formsubmit.co/ajax/fadhlillah949699@gmail.com', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form),
        signal: ctrl ? ctrl.signal : undefined
      }).then((r) => {
        if (!r.ok) throw new Error(r.status)
        sent.textContent = SENT_MSG
        form.reset()
      }).catch(() => {
        err.innerHTML = ERR_MSG
      }).finally(() => {
        if (timer) clearTimeout(timer)
        btn.disabled = false
      })
    })
  }

  /**
   * Hero terminal boot sequence: type the command, then reveal the response
   */
  const term = select('#hero-term')
  const cmd = select('#hero-cmd')
  if (term && cmd) {
    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion || typeof Typed === 'undefined') {
      term.classList.add('is-live')
    } else {
      term.classList.add('is-boot')
      cmd.textContent = ''
      new Typed('#hero-cmd', {
        strings: ['curl -s api.fadhlillah.dev/whoami'],
        typeSpeed: 26,
        startDelay: 500,
        showCursor: false,
        loop: false,
        onComplete: () => {
          setTimeout(() => {
            term.classList.add('is-live')
            term.querySelectorAll('.tl:not(.tl-cmd)').forEach((el, idx) => {
              setTimeout(() => el.classList.add('tl-on'), idx * 70)
            })
          }, 220)
        }
      })
    }
  }

})()