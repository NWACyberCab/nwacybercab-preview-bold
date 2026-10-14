/* Shared behaviour for RoboRide sub-pages. */
(function () {
  document.documentElement.classList.add('js');
  // Mobile menu: drawer under the header + backdrop; closes on link tap, backdrop tap, Esc
  var btn = document.querySelector('.menu-btn'), nav = document.getElementById('site-nav'), header = document.querySelector('.site-header'), backdrop = null;
  var HAMB = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e8e4dc" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
  var CLOSE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e8e4dc" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  function setHH() { if (header) document.documentElement.style.setProperty('--hh', header.offsetHeight + 'px'); }
  function setOpen(open, keepFocus) {
    if (!btn || !nav) return;
    setHH();
    nav.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    btn.innerHTML = open ? CLOSE : HAMB;
    document.documentElement.classList.toggle('menu-open', open);
    if (open) {
      if (!backdrop) { backdrop = document.createElement('div'); backdrop.className = 'nav-backdrop'; backdrop.addEventListener('click', function () { setOpen(false); }); }
      document.body.appendChild(backdrop);
      var a = nav.querySelector('a'); if (a) a.focus();
    } else {
      if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      if (!keepFocus) btn.focus();
    }
  }
  if (btn && nav) {
    btn.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a') && nav.classList.contains('open')) setOpen(false, true); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) setOpen(false); });
    window.addEventListener('resize', function () { setHH(); if (window.innerWidth > 1100 && nav.classList.contains('open')) setOpen(false, true); });
  }

  // Header: shrink on scroll + reading-progress bar
  var prog = header && header.querySelector('.progress'), ticking = false;
  function onScroll() { ticking = false; var y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
    if (header) header.classList.toggle('scrolled', y > 24);
    if (prog) prog.style.setProperty('--p', h > 0 ? Math.min(1, y / h) : 0); }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll(); setHH();
  // Spotlight cards follow the pointer
  document.querySelectorAll('.card.spot').forEach(function (c) { c.addEventListener('pointermove', function (e) { var r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); }); });
  // Reveal on scroll
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else els.forEach(function (el) { el.classList.add('in'); });
  // Formspree forms: <form data-formspree action="https://formspree.io/f/...">
  document.querySelectorAll('form[data-formspree]').forEach(function (form) {
    var status = form.querySelector('.form-status'), submit = form.querySelector('[type=submit]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.querySelector('[name=_gotcha]').value) { status.textContent = 'Thanks!'; return; }
      if (!form.reportValidity()) return;
      var data = {}; new FormData(form).forEach(function (v, k) { if (k !== '_gotcha') data[k] = v; });
      data.page = location.href;
      if (data.use_case) data._subject = 'RoboRide business interest: ' + data.use_case;
      submit.disabled = true; var label = submit.textContent; submit.textContent = 'Sending…';
      status.className = 'form-status'; status.textContent = '';
      fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) {
          if (!r.ok) throw new Error(d && d.errors ? d.errors.map(function (x) { return x.message; }).join(' ') : '');
          form.reset(); status.className = 'form-status ok'; status.textContent = "Thanks! We've received your details and will be in touch.";
        }); })
        .catch(function (err) { status.className = 'form-status err'; status.textContent = (err.message ? err.message + ' ' : '') + "We couldn't send that just now. Please check your connection and try again."; })
        .finally(function () { submit.disabled = false; submit.textContent = label; });
    });
  });
})();
