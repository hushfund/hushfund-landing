/* Hushfund scroll controller: frosted header after scrolling + one-shot blur-to-clear reveals.
   Progressive enhancement: without JS (or IntersectionObserver) nothing is hidden. */
(function (root) {
  'use strict';

  function init(opts) {
    opts = opts || {};
    var win = opts.window || root;
    var doc = win.document;
    var html = doc.documentElement;
    var threshold = opts.threshold == null ? 12 : opts.threshold;
    var scrolledClass = opts.scrolledClass || 'hf-scrolled';
    var jsClass = opts.jsClass || 'hf-js';
    var inClass = opts.inClass || 'is-in';
    var selector = opts.selector || '[data-reveal]';

    var reduced = !!(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var ticking = false;

    function update() {
      ticking = false;
      var y = win.scrollY || win.pageYOffset || 0;
      if (y > threshold) html.classList.add(scrolledClass);
      else html.classList.remove(scrolledClass);
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      (win.requestAnimationFrame || function (f) { return win.setTimeout(f, 16); })(update);
    }
    update();
    win.addEventListener('scroll', onScroll, { passive: true });

    var targets = Array.prototype.slice.call(doc.querySelectorAll(selector));
    var io = null;
    if (!reduced && 'IntersectionObserver' in win && targets.length) {
      html.classList.add(jsClass);
      var pending = targets.length;
      io = new win.IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add(inClass);
          io.unobserve(e.target);
          pending -= 1;
        });
        if (pending <= 0) { io.disconnect(); io = null; }
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      targets.forEach(function (el) { io.observe(el); });
    } else {
      // reduced motion / no observer: everything is visible, header state still works
      targets.forEach(function (el) { el.classList.add(inClass); });
      if (!reduced) html.classList.add(jsClass);
    }

    return {
      update: update,
      destroy: function () {
        win.removeEventListener('scroll', onScroll);
        if (io) { io.disconnect(); io = null; }
      }
    };
  }

  root.HushScroll = { init: init };

  if (root.document && !root.HUSH_SCROLL_MANUAL) {
    var start = function () {
      var d = root.document;
      if (d.querySelector('.hf')) {
        d.querySelectorAll('.hf .rv, .hf section .h2').forEach(function (el) { el.setAttribute('data-reveal', ''); });
      }
      init();
    };
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start);
    else start();
  }
})(typeof window !== 'undefined' ? window : this);
