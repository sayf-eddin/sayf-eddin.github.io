function navScroll(section) {
  var elem = document.getElementById(section);
  window.scroll(0, elem.offsetTop - 40);
}

var elems = document.querySelectorAll('.carousel');
for (var i=0, len = elems.length; i < len; i++) {
  var elem = elems[i];
  var flkty = new Flickity( elem, {
    cellAlign: 'left',
    contain: true,
    wrapAround: true,
    autoPlay: 7000,
    dragThreshold: 10,
    arrowShape: { 
      x0: 10,
      x1: 60, y1: 50,
      x2: 60, y2: 50,
      x3: 60
    }
  });
}
