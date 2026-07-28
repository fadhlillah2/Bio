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

})()