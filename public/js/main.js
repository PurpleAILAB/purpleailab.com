(function () {
  'use strict';

  // ── Nav scroll ──
  var nav = document.getElementById('nav');
  window.addEventListener('scroll', function () {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });

  // ── Smooth scroll ──
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var t = document.querySelector(this.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // ── Install tabs ──
  var cmds = {
    docker: 'curl -fsSL https://decepticon.red/install | bash',
    pip: 'pip install decepticon'
  };

  document.querySelectorAll('.install-tabs').forEach(function (tabs) {
    var box = tabs.nextElementSibling;
    if (!box) return;
    var code = box.querySelector('code');
    tabs.querySelectorAll('.install-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.querySelectorAll('.install-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        if (code) code.textContent = cmds[tab.getAttribute('data-target')] || cmds.docker;
      });
    });
  });

  // ── Copy button ──
  document.querySelectorAll('.install-copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var box = btn.closest('.install-box');
      var code = box && box.querySelector('code');
      if (!code) return;
      navigator.clipboard.writeText(code.textContent).then(function () {
        var orig = btn.textContent;
        btn.textContent = 'COPIED';
        setTimeout(function () { btn.textContent = orig; }, 1500);
      });
    });
  });

  // ── Terminal animation on scroll ──
  var terminals = document.querySelectorAll('.terminal[data-animate]');
  var terminalObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('playing');
        terminalObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  terminals.forEach(function (t) { terminalObs.observe(t); });

  // ── Section reveal ──
  var reveals = document.querySelectorAll('.feature, .agent-group, .comp-card, .team-card, .pricing-card, .split, .stat-bar, .section-label, .display');
  var revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  reveals.forEach(function (el) {
    el.classList.add('reveal');
    revealObs.observe(el);
  });

  // ── Stagger siblings ──
  document.querySelectorAll('.agents-ref, .comp-grid, .team-grid, .pricing-grid, .stat-row')
    .forEach(function (grid) {
      grid.querySelectorAll('.reveal').forEach(function (child, i) {
        child.style.transitionDelay = (i * 0.06) + 's';
      });
    });

  /* ═══ WAITLIST FORM HANDLER ═══ */
  function handleWaitlistForm(formId, statusId) {
    var form = document.getElementById(formId);
    var status = document.getElementById(statusId);
    if (!form) return;
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var email = form.querySelector('input[name="email"]').value;
      var btn = form.querySelector('button');
      btn.disabled = true;
      btn.textContent = 'Submitting...';
      status.textContent = '';
      status.className = 'form-status';
      fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.ok) {
          status.textContent = data.message || 'You\'re on the list!';
          status.className = 'form-status form-success';
          form.querySelector('input').value = '';
        } else {
          status.textContent = data.error || 'Something went wrong.';
          status.className = 'form-status form-error';
        }
        btn.disabled = false;
        btn.textContent = 'Join Waitlist';
      })
      .catch(function() {
        status.textContent = 'Network error. Please try again.';
        status.className = 'form-status form-error';
        btn.disabled = false;
        btn.textContent = 'Join Waitlist';
      });
    });
  }
  handleWaitlistForm('waitlist-form', 'waitlist-status');
  handleWaitlistForm('hero-waitlist-form', 'hero-waitlist-status');

  /* ═══ PAGE VIEW TRACKING ═══ */
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: location.pathname, referrer: document.referrer || '' })
  }).catch(function() {});
})();
