/* RoboRide home page: FSD counter, hero video, scroll story, route visualizer, waitlist. */
// ===== FSD miles counter config (edit these lines to re-baseline) =====
// BASE_MILES / BASE_DATE: last official cumulative unsupervised-miles figure Tesla stated, and when.
// WEEKLY_GROWTH: assumed week-over-week growth (0.10 = 10%). MAX_WEEKS: stop projecting after this many
// weeks past BASE_DATE (the number compounds fast); the counter then freezes and asks for a new baseline.
var FSD_COUNTER = {
  BASE_MILES: 1000000,                      // Ashok Elluswamy, Tesla Cybercab event, Austin
  BASE_DATE: '2026-09-03T19:00:00-05:00',   // Sept 3, 2026 (evening event; exact time approximate)
  WEEKLY_GROWTH: 0.175,                     // derived: 380k (Jul 22) -> 1M (Sep 3, 2026) = (1e6/380e3)^(1/6) - 1 ≈ 17.5%/wk; not an official Tesla rate
  MAX_WEEKS: 12                             // freezes ~Nov 26, 2026; re-baseline when Tesla states a new total
};
function fsdProjection(now) {
  var c = FSD_COUNTER, WEEK = 7 * 24 * 3600 * 1000;
  var raw = Math.max(0, (now - Date.parse(c.BASE_DATE)) / WEEK);
  var weeks = Math.min(raw, c.MAX_WEEKS);
  return { miles: c.BASE_MILES * Math.pow(1 + c.WEEKLY_GROWTH, weeks), capped: raw > c.MAX_WEEKS };
}
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

  // ---- FSD counter: counts up from the base when scrolled into view, then ticks live
  var milesEl = $('[data-fsd-miles]');
  if (milesEl) {
    var pr = fsdProjection(Date.now());
    $('[data-fsd-base]').textContent = nf.format(FSD_COUNTER.BASE_MILES);
    $('[data-fsd-basedate]').textContent = new Date(FSD_COUNTER.BASE_DATE).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Chicago' });
    $('[data-fsd-growth]').textContent = (Math.round(FSD_COUNTER.WEEKLY_GROWTH * 1000) / 10) + '%';
    $('[data-fsd-maxweeks]').textContent = FSD_COUNTER.MAX_WEEKS;
    $('[data-fsd-sr]').textContent = 'Projected total: about ' + nf.format(Math.round(pr.miles / 1000) * 1000) + ' unsupervised miles.';
    if (pr.capped) $('[data-fsd-capped]').hidden = false;
    var live = function () { milesEl.textContent = nf.format(Math.floor(fsdProjection(Date.now()).miles)); };
    var startLive = function () { live(); setInterval(live, reduce ? 5000 : 100); };
    if (reduce || !('IntersectionObserver' in window)) startLive();
    else {
      milesEl.textContent = nf.format(FSD_COUNTER.BASE_MILES);
      var io = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return; io.disconnect();
        var from = FSD_COUNTER.BASE_MILES, t0 = performance.now(), D = 1600;
        (function step(t) { var k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3), target = fsdProjection(Date.now()).miles;
          milesEl.textContent = nf.format(Math.floor(from + (target - from) * e));
          if (k < 1) requestAnimationFrame(step); else startLive(); })(t0);
      }, { threshold: .4 });
      io.observe(milesEl);
    }
  }

  // ---- Hero video (autoplay muted unless reduced motion) + play/pause button
  var v = $('[data-hero-video]'), vb = $('[data-vid-btn]');
  var PLAY = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>';
  var PAUSE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';
  if (v && vb) {
    var sync = function () { var p = !v.paused; vb.innerHTML = p ? PAUSE : PLAY; vb.setAttribute('aria-label', p ? 'Pause video' : 'Play video'); };
    v.addEventListener('play', sync); v.addEventListener('pause', sync);
    vb.addEventListener('click', function () { if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); });
    if (!reduce) { v.muted = true; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  }

  // ---- 3D tilt on the hero portal (pointer devices only)
  var stage = $('[data-tilt]'), portal = stage && $('.portal', stage);
  if (portal && !reduce && matchMedia('(hover: hover)').matches) {
    stage.addEventListener('pointermove', function (e) { var r = stage.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      portal.style.transform = 'rotateY(' + (-14 + x * 22) + 'deg) rotateX(' + (6 - y * 16) + 'deg)'; });
    stage.addEventListener('pointerleave', function () { portal.style.transform = ''; });
  }

  // ---- Scroll-linked: pod glides across, story scenes switch
  var pod = $('[data-pod]'), steps = $$('.sstep'), scenes = $$('[data-scene]');
  function setScene(i) { steps.forEach(function (s, k) { s.classList.toggle('active', k === i); }); scenes.forEach(function (s, k) { s.setAttribute('opacity', k === i ? 1 : 0); }); }
  if (!reduce) {
    var tick = false;
    window.addEventListener('scroll', function () { if (tick) return; tick = true; requestAnimationFrame(function () { tick = false;
      if (pod) { var r = pod.parentNode.getBoundingClientRect(), k = (innerHeight - r.top) / (innerHeight + r.height); k = Math.max(0, Math.min(1, k)); pod.style.setProperty('--x', ((k - .5) * -60) + '%'); }
      var mid = innerHeight * .55, best = 0; steps.forEach(function (s, k) { if (s.getBoundingClientRect().top < mid) best = k; }); setScene(best);
    }); }, { passive: true });
  } else { scenes.forEach(function (s) { s.setAttribute('opacity', 0); }); if (scenes[0]) scenes[0].setAttribute('opacity', 1); }

  // ---- Route visualizer
  var C = window.RR_CITIES || [], from = $('#sim-from'), to = $('#sim-to');
  if (from && to && C.length) {
    C.forEach(function (c, i) { from.add(new Option(c.name, i)); to.add(new Option(c.name, i)); });
    from.value = 0; to.value = 3; // Bentonville -> Fayetteville
    var mode = 'ride', route = $('[data-route]'), car = $('[data-car]'), anim = 0;
    function miles(a, b) { var R = 3958.8, rad = Math.PI / 180, dLa = (b.lat - a.lat) * rad, dLo = (b.lon - a.lon) * rad;
      var h = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLo / 2) * Math.sin(dLo / 2); return 2 * R * Math.asin(Math.sqrt(h)); }
    function corridor(a, b) { var s = [a.name, b.name], has = function (n) { return s.indexOf(n) > -1; };
      if (has('Siloam Springs') && has('Eureka Springs')) return 'US-412 · US-62';
      if (has('Siloam Springs')) return 'US-412 · I-49';
      if (has('Eureka Springs')) return 'US-62 · I-49';
      if (has('Farmington')) return 'US-62 · I-49';
      return 'I-49'; }
    function run() {
      var a = C[+from.value], b = C[+to.value]; cancelAnimationFrame(anim);
      $$('.map .pin').forEach(function (p) { var on = p.getAttribute('data-city') === a.name || p.getAttribute('data-city') === b.name; p.querySelector('.ring').setAttribute('opacity', on ? 1 : .5); p.querySelector('.ring').setAttribute('stroke', on ? '#fff' : '#e8b74e'); });
      if (a === b) { $('[data-sim-dist]').textContent = '0'; $('[data-sim-road]').textContent = 'Same city'; route.setAttribute('d', ''); car.setAttribute('opacity', 0); return; }
      $('[data-sim-dist]').textContent = '≈ ' + Math.round(miles(a, b)) + ' mi';
      $('[data-sim-road]').textContent = corridor(a, b);
      var mx = (a.x + b.x) / 2 + (b.y - a.y) * .15, my = (a.y + b.y) / 2 - (b.x - a.x) * .15;
      route.setAttribute('d', 'M' + a.x + ' ' + a.y + ' Q' + mx + ' ' + my + ' ' + b.x + ' ' + b.y);
      route.setAttribute('stroke', mode === 'ride' ? '#f6d58c' : '#7fd6ff');
      car.setAttribute('opacity', 1);
      var L = route.getTotalLength(), t0 = performance.now(), D = 2200;
      if (reduce) { var e = route.getPointAtLength(L); car.setAttribute('transform', 'translate(' + e.x + ' ' + e.y + ')'); return; }
      (function step(t) { var k = ((t - t0) % (D + 600)) / D; k = Math.min(1, k); var e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        var pt = route.getPointAtLength(L * e); car.setAttribute('transform', 'translate(' + pt.x + ' ' + pt.y + ')'); anim = requestAnimationFrame(step); })(t0);
    }
    from.addEventListener('change', run); to.addEventListener('change', run);
    $('[data-swap]').addEventListener('click', function () { var f = from.value; from.value = to.value; to.value = f; run(); });
    $$('[data-mode]').forEach(function (b) { b.addEventListener('click', function () { mode = b.getAttribute('data-mode'); $$('[data-mode]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); run(); }); });
    run();
  }

  // ---- Waitlist (Formspree)
  var form = $('[data-waitlist-form]');
  if (form) {
    var err = $('[data-wl-err]'), ok = $('[data-wl-ok]'), btn = form.querySelector('button[type=submit]');
    form.addEventListener('submit', function (e) {
      e.preventDefault(); err.hidden = true;
      var email = (form.email.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = 'Please enter a valid email address.'; err.hidden = false; form.email.focus(); return; }
      var done = function () { form.hidden = true; $('[data-wl-email]').textContent = email; ok.hidden = false; };
      if (form._gotcha.value) { done(); return; } // honeypot
      var interest = form.interest.value || 'Rides';
      btn.disabled = true; btn.setAttribute('aria-busy', 'true'); btn.textContent = 'Joining…';
      fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: email, interest: interest, _subject: 'RoboRide waitlist: ' + interest, page: location.href }) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) {
          if (!r.ok) throw new Error(d && Array.isArray(d.errors) && d.errors.length ? d.errors.map(function (x) { return x.message; }).join(' ') : ''); done(); }); })
        .catch(function (x) { err.textContent = (x && x.message ? x.message + ' ' : '') + "We couldn't add you to the waitlist just now. Please check your connection and try again."; err.hidden = false; })
        .finally(function () { btn.disabled = false; btn.removeAttribute('aria-busy'); btn.textContent = 'Join Waitlist'; });
    });
    $('[data-wl-reset]').addEventListener('click', function (e) { e.preventDefault(); form.reset(); ok.hidden = true; form.hidden = false; form.email.focus(); });
  }
})();
