var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Carousels: disable autoplay entirely for reduced-motion users, otherwise
// wire up a pause/play toggle so autoplay can be stopped (WCAG 2.2.2).
var carousels = document.querySelectorAll('.carousel');
for (var i = 0, len = carousels.length; i < len; i++) {
  var elem = carousels[i];
  var flkty = new Flickity(elem, {
    cellAlign: 'left',
    contain: true,
    wrapAround: true,
    autoPlay: reduceMotion ? false : 7000,
    dragThreshold: 10,
    arrowShape: {
      x0: 10,
      x1: 60, y1: 50,
      x2: 60, y2: 50,
      x3: 60
    }
  });

  var pauseButton = elem.parentElement.querySelector('.carousel-pause');
  if (!pauseButton) {
    continue;
  }

  if (reduceMotion) {
    pauseButton.hidden = true;
    continue;
  }

  var icon = pauseButton.querySelector('.carousel-pause-icon');
  var baseLabel = pauseButton.getAttribute('aria-label');
  var playLabel = baseLabel.replace('Pause', 'Play');
  var isPaused = false;

  pauseButton.addEventListener('click', function (flkty, icon, pauseButtonEl) {
    return function () {
      isPaused = !isPaused;
      if (isPaused) {
        flkty.pausePlayer();
        icon.textContent = '▶';
        pauseButtonEl.setAttribute('aria-pressed', 'true');
        pauseButtonEl.setAttribute('aria-label', playLabel);
      } else {
        flkty.unpausePlayer();
        icon.textContent = '❚❚';
        pauseButtonEl.setAttribute('aria-pressed', 'false');
        pauseButtonEl.setAttribute('aria-label', baseLabel);
      }
    };
  }(flkty, icon, pauseButton));
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
