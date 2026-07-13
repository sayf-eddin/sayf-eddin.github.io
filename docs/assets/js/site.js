var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Mobile nav: toggle the menu panel and mirror state to aria-expanded.
var navToggle = document.getElementById('nav-toggle');
var navMenu = document.getElementById('nav-menu');
if (navToggle && navMenu) {
  navToggle.addEventListener('click', function () {
    var isOpen = navMenu.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  var navLinksInMenu = navMenu.querySelectorAll('.nav-link');
  for (var n = 0, nLen = navLinksInMenu.length; n < nLen; n++) {
    navLinksInMenu[n].addEventListener('click', function () {
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  }
}

// Nav switches from transparent (over the hero) to a solid bar once scrolled.
var siteNav = document.getElementById('site-nav');
if (siteNav) {
  var updateNavScrolled = function () {
    siteNav.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  updateNavScrolled();
  window.addEventListener('scroll', updateNavScrolled, { passive: true });
}

// Flag links that open in a new tab (and PDFs) for assistive tech, since the
// browser gives no indication otherwise.
var externalLinks = document.querySelectorAll('a[target="_blank"]');
for (var j = 0, jLen = externalLinks.length; j < jLen; j++) {
  var link = externalLinks[j];
  var isPdf = /\.pdf$/i.test(link.getAttribute('href') || '');
  var note = document.createElement('span');
  note.className = 'visually-hidden';
  note.textContent = isPdf ? ' (opens in new tab, PDF)' : ' (opens in new tab)';
  link.appendChild(note);
}

// Highlight the nav link for whichever section is currently in view.
var navLinks = document.querySelectorAll('.nav-link[href^="#"]');
var sections = [];
navLinks.forEach(function (link) {
  var section = document.querySelector(link.getAttribute('href'));
  if (section) {
    sections.push({ link: link, section: section });
  }
});

if (sections.length && 'IntersectionObserver' in window) {
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var match = sections.find(function (s) { return s.section === entry.target; });
      if (!match) {
        return;
      }
      if (entry.isIntersecting) {
        sections.forEach(function (s) { s.link.removeAttribute('aria-current'); });
        match.link.setAttribute('aria-current', 'location');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(function (s) { observer.observe(s.section); });
}

// Fade/slide sections and cards into place as they enter the viewport.
// Reduced-motion users (and browsers without IntersectionObserver) just see
// everything visible immediately, no animation.
var revealTargets = document.querySelectorAll('.reveal');
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
} else {
  var revealObserver = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

  revealTargets.forEach(function (el) { revealObserver.observe(el); });
}
