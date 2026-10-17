var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Mobile nav: toggle the menu panel and mirror state to aria-expanded. It also
// closes on Escape (returning focus to the toggle) and on a click outside it.
var navToggle = document.getElementById('nav-toggle');
var navMenu = document.getElementById('nav-menu');
if (navToggle && navMenu) {
  var setMenuOpen = function (isOpen) {
    navMenu.classList.toggle('is-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
  };

  navToggle.addEventListener('click', function () {
    setMenuOpen(!navMenu.classList.contains('is-open'));
  });

  var navLinksInMenu = navMenu.querySelectorAll('.nav-link');
  for (var n = 0, nLen = navLinksInMenu.length; n < nLen; n++) {
    navLinksInMenu[n].addEventListener('click', function () {
      setMenuOpen(false);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
      setMenuOpen(false);
      navToggle.focus();
    }
  });

  document.addEventListener('click', function (e) {
    if (navMenu.classList.contains('is-open') &&
        !navMenu.contains(e.target) && !navToggle.contains(e.target)) {
      setMenuOpen(false);
    }
  });
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

// Screenshot lightbox: project images open in a modal on the page instead of
// sending visitors to the bare image file. Without JS (or <dialog> support)
// the links still open the image in a new tab. Runs before the new-tab
// labelling below, since these links no longer open one.
var galleryLinks = document.querySelectorAll('.project-cover, .project-thumb');
if (galleryLinks.length && typeof HTMLDialogElement === 'function') {
  var lightbox = document.createElement('dialog');
  lightbox.className = 'lightbox';
  lightbox.setAttribute('aria-label', 'Screenshot viewer');
  lightbox.innerHTML =
    '<button class="lightbox-btn lightbox-close" type="button" aria-label="Close">&times;</button>' +
    '<button class="lightbox-btn lightbox-prev" type="button" aria-label="Previous screenshot">&lsaquo;</button>' +
    '<img class="lightbox-img" alt="">' +
    '<button class="lightbox-btn lightbox-next" type="button" aria-label="Next screenshot">&rsaquo;</button>' +
    '<p class="lightbox-count" aria-live="polite"></p>';
  document.body.appendChild(lightbox);

  var lightboxImg = lightbox.querySelector('.lightbox-img');
  var lightboxPrev = lightbox.querySelector('.lightbox-prev');
  var lightboxNext = lightbox.querySelector('.lightbox-next');
  var lightboxCount = lightbox.querySelector('.lightbox-count');
  var lightboxImages = [];
  var lightboxIndex = 0;
  var lightboxOpener = null;

  var showLightboxImage = function (index) {
    lightboxIndex = (index + lightboxImages.length) % lightboxImages.length;
    var image = lightboxImages[lightboxIndex];
    lightboxImg.src = image.src;
    lightboxImg.alt = image.alt;
    lightboxCount.textContent = (lightboxIndex + 1) + ' / ' + lightboxImages.length;
  };

  galleryLinks.forEach(function (link) {
    link.removeAttribute('target');
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var card = link.closest('.project-card');
      var cardLinks = Array.prototype.slice.call(card.querySelectorAll('.project-cover, .project-thumb'));
      lightboxImages = cardLinks.map(function (l) {
        var img = l.querySelector('img');
        return { src: l.getAttribute('href'), alt: img ? img.alt : '' };
      });
      var single = lightboxImages.length < 2;
      lightboxPrev.hidden = single;
      lightboxNext.hidden = single;
      lightboxCount.hidden = single;
      lightboxOpener = link;
      showLightboxImage(cardLinks.indexOf(link));
      lightbox.showModal();
      document.documentElement.classList.add('has-lightbox');
    });
  });

  lightboxPrev.addEventListener('click', function () { showLightboxImage(lightboxIndex - 1); });
  lightboxNext.addEventListener('click', function () { showLightboxImage(lightboxIndex + 1); });
  lightbox.querySelector('.lightbox-close').addEventListener('click', function () { lightbox.close(); });

  // The dialog fills the viewport, so a click that lands on the dialog itself
  // (rather than the image or a button) is a click on the dimmed backdrop.
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) {
      lightbox.close();
    }
  });

  lightbox.addEventListener('keydown', function (e) {
    if (lightboxImages.length < 2) {
      return;
    }
    if (e.key === 'ArrowLeft') {
      showLightboxImage(lightboxIndex - 1);
    } else if (e.key === 'ArrowRight') {
      showLightboxImage(lightboxIndex + 1);
    }
  });

  lightbox.addEventListener('close', function () {
    document.documentElement.classList.remove('has-lightbox');
    if (lightboxOpener) {
      lightboxOpener.focus();
    }
  });
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

// Highlight the nav link for whichever section is currently in view: the last
// one whose top has passed 40% of the way down the viewport. The footer is too
// short to ever get that far, so once the page is scrolled to the bottom the
// last section wins instead, and above the first section (the hero) nothing is
// highlighted. A clicked nav link stays highlighted until the visitor scrolls
// themselves — otherwise clicking "Education" on a tall screen, which can only
// scroll as far as the bottom of the page, would highlight "Links".
var navLinks = document.querySelectorAll('.nav-link[href^="#"]');
var sections = [];
navLinks.forEach(function (link) {
  var section = document.querySelector(link.getAttribute('href'));
  if (section) {
    sections.push({ link: link, section: section });
  }
});

if (sections.length) {
  var currentNavLink = null;
  var navLinkPinned = false;

  var setCurrentNavLink = function (link) {
    if (link === currentNavLink) {
      return;
    }
    if (currentNavLink) {
      currentNavLink.removeAttribute('aria-current');
    }
    if (link) {
      link.setAttribute('aria-current', 'location');
    }
    currentNavLink = link;
  };

  var updateCurrentSection = function () {
    if (navLinkPinned) {
      return;
    }
    var doc = document.documentElement;
    var atBottom = window.innerHeight + window.scrollY >= doc.scrollHeight - 2;
    var current = null;
    if (atBottom) {
      current = sections[sections.length - 1];
    } else {
      var line = window.innerHeight * 0.4;
      sections.forEach(function (s) {
        if (s.section.getBoundingClientRect().top <= line) {
          current = s;
        }
      });
    }
    setCurrentNavLink(current ? current.link : null);
  };

  sections.forEach(function (s) {
    s.link.addEventListener('click', function () {
      setCurrentNavLink(s.link);
      navLinkPinned = true;
    });
  });

  var unpinNavLink = function () {
    navLinkPinned = false;
  };
  window.addEventListener('wheel', unpinNavLink, { passive: true });
  window.addEventListener('touchstart', unpinNavLink, { passive: true });
  window.addEventListener('keydown', unpinNavLink);
  // Capture phase runs before the nav link's own click handler re-pins, so
  // any other click (the brand link, a hero button) releases the pin.
  document.addEventListener('click', unpinNavLink, true);

  var navTicking = false;
  window.addEventListener('scroll', function () {
    if (!navTicking) {
      navTicking = true;
      window.requestAnimationFrame(function () {
        navTicking = false;
        updateCurrentSection();
      });
    }
  }, { passive: true });
  window.addEventListener('resize', updateCurrentSection);
  updateCurrentSection();
}

// Fade/slide sections and cards into place as they enter the viewport.
// Reduced-motion users (and browsers without IntersectionObserver) just see
// everything visible immediately, no animation. The threshold is 0 rather than
// a fraction of the element: at high zoom a tall block (a long job entry) can
// be many viewports tall, so it could never be, say, 15% on screen at once
// and would stay invisible.
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
  }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });

  revealTargets.forEach(function (el) { revealObserver.observe(el); });
}
