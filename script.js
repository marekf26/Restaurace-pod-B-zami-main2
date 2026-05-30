document.addEventListener('DOMContentLoaded', () => {

  /* ── Gallery Slider ───────────────────────────── */
  const track      = document.querySelector('.slider-track');
  const slides     = Array.from(track.children);
  const nextButton = document.querySelector('.next-btn');
  const prevButton = document.querySelector('.prev-btn');
  let currentIndex = 0;

  if (track && nextButton && prevButton) {
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
      const rect = document.getElementById('galerie')?.getBoundingClientRect();
      if (rect && rect.top < window.innerHeight && rect.bottom > 0) {
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
  }

  /* ── Reservation tabs ────────────────────────── */
  const tabs   = document.querySelectorAll('.rez-tab');
  const panels = document.querySelectorAll('[role="tabpanel"]');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      panels.forEach(p => p.classList.add('hidden'));
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const targetPanel = document.getElementById(tab.getAttribute('aria-controls'));
      if (targetPanel) targetPanel.classList.remove('hidden');
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

    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !burgerBtn.contains(e.target)) {
        navLinks.classList.remove('is-open');
        burgerBtn.innerHTML = '&#9776;';
      }
    });

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

  /* ── Dynamic Menu Loading (Google Sheets CSV) ──
     Tabulka má sloupce: A=Typ | B=Název | C=Gramáž | D=Cena | E=Alergeny
     Hodnoty ve sloupci Typ (klient vybírá z předvyplněných):
       datum      → B = datum v záhlaví (např. "Pátek 29. 5. 2026")
       menu-cena  → D = cena dnešního menu (např. "140,--")
       menu       → B = řádek dnešního menu (libovolný počet)
       polevka    → B = název, D = cena, E = alergeny
       jidlo      → B = název (Alt+Enter = druhý řádek), C = gramáž, D = cena, E = alergeny
     Prázdné řádky i řádek hlavičky se ignorují.                              */
  const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT0LjWCVSV-F00GDC4xR-d_0_jQ9E1FkLFl6LdwFWV3BZ3UCvWZDC7FrQo9Un--3zyrb6q6Ro8BtISr/pub?output=csv";
  const dateDisplay = document.getElementById('menu-date');
  const errorBox    = document.getElementById('menu-error');
  const dnesniBlock = document.getElementById('menu-dnesni');
  const dnesniCena  = document.getElementById('menu-dnesni-cena');
  const dnesniList  = document.getElementById('menu-dnesni-list');
  const nabidkaBlock= document.getElementById('menu-nabidka');
  const nabidkaList = document.getElementById('menu-nabidka-list');

  // Plnohodnotný CSV parser: zvládá čárky i konce řádků uvnitř uvozovek
  // a zdvojené uvozovky ("") jako jeden znak ". Vrací pole řádků (pole buněk).
  const parseCsv = (text) => {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (inQuotes) {
        if (char === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else {
          field += char;
        }
      } else if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(field); field = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && text[i + 1] === '\n') i++;
        row.push(field); field = '';
        rows.push(row); row = [];
      } else {
        field += char;
      }
    }
    if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
    return rows;
  };

  // Bezpečné vložení textu z tabulky do HTML (ochrana proti rozbití/XSS)
  const escapeHtml = (str) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const cell = (cols, i) => (cols[i] || '').trim();
  // Alergeny jako malá horní čísla za názvem
  const allergenHtml = (a) => a ? `<sup class="item-allergens">${escapeHtml(a)}</sup>` : '';
  // Název může mít víc řádků (Alt+Enter v buňce) → zalomení na webu
  const nameHtml = (name) => escapeHtml(name).replace(/\r?\n/g, '<br>');

  async function fetchMenu() {
      if (!dnesniList || !nabidkaList) return;
      try {
          const response = await fetch(CSV_URL);
          if (!response.ok) throw new Error("Nelze navázat spojení se serverem.");

          const rows = parseCsv(await response.text());

          let dateStr = '';
          let dnesniPrice = '';
          const dnesniItems = [];
          const nabidkaItems = [];

          rows.forEach(cols => {
              const typ = cell(cols, 0).toLowerCase();
              switch (typ) {
                  case 'datum':
                      dateStr = cell(cols, 1);
                      break;
                  case 'menu-cena':
                      dnesniPrice = cell(cols, 3);
                      break;
                  case 'menu': {
                      const n = cell(cols, 1);
                      if (n) dnesniItems.push(n);
                      break;
                  }
                  case 'polevka':
                  case 'jidlo': {
                      const name = cell(cols, 1);
                      if (name) nabidkaItems.push({
                          name,
                          gramaz:   cell(cols, 2),
                          cena:     cell(cols, 3),
                          alergeny: cell(cols, 4)
                      });
                      break;
                  }
              }
          });

          // Záhlaví – datum
          if (dateDisplay) dateDisplay.textContent = dateStr || 'Dnešní nabídka';

          // Blok: Dnešní menu
          if (dnesniItems.length) {
              dnesniList.innerHTML = dnesniItems
                  .map(n => `<li>${nameHtml(n)}</li>`).join('');
              if (dnesniCena) dnesniCena.textContent = dnesniPrice;
              dnesniBlock.hidden = false;
          } else {
              dnesniBlock.hidden = true;
          }

          // Blok: Nabídka dne
          if (nabidkaItems.length) {
              nabidkaList.innerHTML = nabidkaItems.map(item => `
                  <div class="menu-item">
                      <div class="item-left">
                          ${item.gramaz ? `<span class="item-weight">${escapeHtml(item.gramaz)}</span>` : ''}
                          <span class="item-name">${nameHtml(item.name)}${allergenHtml(item.alergeny)}</span>
                      </div>
                      <div class="item-price">${escapeHtml(item.cena)}</div>
                  </div>`).join('');
              nabidkaBlock.hidden = false;
          } else {
              nabidkaBlock.hidden = true;
          }

          if (errorBox) errorBox.hidden = true;

          if (!dnesniItems.length && !nabidkaItems.length) {
              nabidkaList.innerHTML = '<p style="text-align:center;">Dnešní menu zatím nebylo zadáno.</p>';
              nabidkaBlock.hidden = false;
          }

      } catch (error) {
          console.error("Chyba menu:", error);
          if (errorBox) errorBox.hidden = false;
          if (dnesniBlock) dnesniBlock.hidden = true;
          if (nabidkaBlock) nabidkaBlock.hidden = true;
          if (dateDisplay) dateDisplay.textContent = "Chyba dat";
      }
  }

  fetchMenu();

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
