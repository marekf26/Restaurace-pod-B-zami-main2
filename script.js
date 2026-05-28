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
  const guestsInput = document.getElementById('hotel-guests');

  const roomPrices = {
    '1 lůžkový': '1 200 CZK',
    '2 lůžkový': '1 800 CZK',
    '3 lůžkový': '2 600 CZK'
  };

  const updateGuests = () => {
    if (!roomSelect || !guestsInput) return;
    const value = roomSelect.value;
    if (value.includes('1')) guestsInput.value = 1;
    else if (value.includes('2')) guestsInput.value = 2;
    else if (value.includes('3')) guestsInput.value = 3;
  };

  if (roomSelect) {
    roomSelect.addEventListener('change', () => {
      if (priceInput) priceInput.value = roomPrices[roomSelect.value] || '';
      updateGuests();
    });
    // Inicializace po načtení
    updateGuests();
  }

  /* ── Sticky nav shadow on scroll ─────────────── */
  const nav = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
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

  /* ── Mobile Menu Toggle ───────────────────────── */
  const burgerBtn = document.getElementById('burger-btn');
  const navLinks = document.getElementById('nav-links');

  if (burgerBtn && navLinks) {
    burgerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navLinks.classList.toggle('is-open');
      burgerBtn.innerHTML = isOpen ? '&times;' : '&#9776;';
    });

    // Zavření menu kliknutím mimo
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !burgerBtn.contains(e.target)) {
        navLinks.classList.remove('is-open');
        burgerBtn.innerHTML = '&#9776;';
      }
    });

    // Zavření menu po kliknutí na odkaz
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
        burgerBtn.innerHTML = '&#9776;';
      });
    });
  }

  /* ── Large Group Hint ────────────────────────── */
  const guestsSelect = document.getElementById('stul-guests');
  const guestsHint = document.getElementById('guests-hint');

  if (guestsSelect && guestsHint) {
    guestsSelect.addEventListener('change', () => {
      guestsHint.style.display = guestsSelect.value === '6+' ? 'block' : 'none';
    });
  }

  /* ── Reservation Validation ───────────────────── */
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split('T')[0];
  
  const setupValidation = (formId, dateId, timeId) => {
    const form = document.getElementById(formId);
    const dateInput = document.getElementById(dateId);
    const timeInput = document.getElementById(timeId);

    if (dateInput) dateInput.min = minDateStr;

    if (form && dateInput) {
      form.addEventListener('submit', (e) => {
        const timeVal = timeInput ? timeInput.value : "12:00";
        if (!dateInput.value) return;

        const selectedDateTime = new Date(`${dateInput.value}T${timeVal}`);
        const now = new Date();

        if (selectedDateTime - now < 24 * 60 * 60 * 1000) {
          e.preventDefault();
          alert("Omlouváme se, rezervace přijímáme minimálně 24 hodin předem. Prosím, vyberte si pozdější termín.");
        }
      });
    }
  };

  setupValidation('form-stul', 'stul-date', 'stul-time');
  setupValidation('form-hotel', 'hotel-prijezd');

  /* ── Speciální validace pro příjezd/odjezd u hotelu ── */
  const hotelPrijezd = document.getElementById('hotel-prijezd');
  const hotelOdjezd = document.getElementById('hotel-odjezd');
  const hotelForm = document.getElementById('form-hotel');

  if (hotelPrijezd && hotelOdjezd) {
    hotelPrijezd.addEventListener('change', () => {
      if (hotelPrijezd.value) {
        const minOdjezdDate = new Date(hotelPrijezd.value);
        minOdjezdDate.setDate(minOdjezdDate.getDate() + 1);
        hotelOdjezd.min = minOdjezdDate.toISOString().split('T')[0];
        
        if (hotelOdjezd.value && hotelOdjezd.value <= hotelPrijezd.value) {
          hotelOdjezd.value = '';
        }
      }
    });

    hotelForm?.addEventListener('submit', (e) => {
      if (hotelOdjezd.value && hotelPrijezd.value && hotelOdjezd.value <= hotelPrijezd.value) {
        e.preventDefault();
        alert("Datum odjezdu musí být minimálně jeden den po datumu příjezdu.");
      }
    });
  }

});
