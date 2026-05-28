document.addEventListener('DOMContentLoaded', () => {

  /* ── Gallery Slider ───────────────────────────── */
  const track      = document.querySelector('.slider-track');
  const slides     = Array.from(track.children);
  const nextButton = document.querySelector('.next-btn');
  const prevButton = document.querySelector('.prev-btn');
  let currentIndex = 0;

  const getVisibleCount  = () => window.innerWidth <= 768 ? 1 : 3;
  const getSlideWidthPx  = () => track.parentElement.offsetWidth / getVisibleCount();

  const clampIndex = () => {
    const max = slides.length - getVisibleCount();
    if (currentIndex > max) currentIndex = max;
    if (currentIndex < 0)   currentIndex = 0;
  };

  const updateSliderPosition = () => {
    track.style.transform = `translateX(-${currentIndex * getSlideWidthPx()}px)`;
  };

  window.addEventListener('resize', () => { clampIndex(); updateSliderPosition(); });

  nextButton.addEventListener('click', () => {
    const max = slides.length - getVisibleCount();
    currentIndex = currentIndex < max ? currentIndex + 1 : 0;
    updateSliderPosition();
  });

  prevButton.addEventListener('click', () => {
    const max = slides.length - getVisibleCount();
    currentIndex = currentIndex > 0 ? currentIndex - 1 : max;
    updateSliderPosition();
  });

  document.addEventListener('keydown', (e) => {
    const rect = document.getElementById('galerie').getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      if (e.key === 'ArrowRight') nextButton.click();
      if (e.key === 'ArrowLeft')  prevButton.click();
    }
  });

  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
  track.addEventListener('touchend',   e => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) { diff > 0 ? nextButton.click() : prevButton.click(); }
  }, { passive: true });

  /* ── Reservation tabs ────────────────────────── */
  const tabs   = document.querySelectorAll('.rez-tab');
  const panels = document.querySelectorAll('[role="tabpanel"]');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      panels.forEach(p => p.classList.add('hidden'));
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      document.getElementById(tab.getAttribute('aria-controls')).classList.remove('hidden');
    });
  });

  /* ── Room price updater ─────────────────────── */
  const roomSelect = document.getElementById('hotel-room');
  const priceInput = document.getElementById('hotel-price');

  const roomPrices = {
    standard: '1 200 CZK',
    double:   '1 800 CZK',
    suite:    '2 600 CZK'
  };

  if (roomSelect && priceInput) {
    roomSelect.addEventListener('change', () => {
      priceInput.value = roomPrices[roomSelect.value] || '';
    });
  }

  /* ── Sticky nav shadow on scroll ─────────────── */
  const nav = document.getElementById('main-nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  /* ── Scroll-reveal with IntersectionObserver ── */
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealEls.forEach(el => io.observe(el));

});
