(function () {
  'use strict';

  /* ============ STATE ============ */
  const state = {
    data: null,
    theme: localStorage.getItem('theme') || 'light',
    modalOpen: false,
    currentSlide: 0,
  };

  /* ============ DOM REFS ============ */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const dom = {
    html: document.documentElement,
    themeToggle: $('.theme-toggle'),
    navToggle: $('.nav-toggle'),
    navLinks: $('.nav-links'),
    allNavLinks: () => $$('.nav-link'),
    aboutContent: $('#about-content'),
    portfolioGrid: $('#portfolio-grid'),
    contactContent: $('#contact-content'),
    modal: $('#portfolio-modal'),
    modalTitle: $('#modal-title'),
    modalCarousel: $('#modal-carousel'),
    modalInfo: $('#modal-info'),
    modalClose: $('.modal-close'),
    footerYear: $('#footer-year'),
  };

  /* ============ THEME ============ */
  function setTheme(theme) {
    state.theme = theme;
    dom.html.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    const meta = $('meta[name="theme-color"]');
    if (meta) {
      meta.content = theme === 'dark' ? '#0f172a' : '#0f172a';
    }
  }

  function toggleTheme() {
    setTheme(state.theme === 'light' ? 'dark' : 'light');
  }

  /* ============ NAVIGATION ============ */
  function closeMobileNav() {
    dom.navLinks.classList.remove('open');
    dom.navToggle.setAttribute('aria-expanded', 'false');
  }

  function updateActiveNav() {
    const scrollY = window.scrollY + 100;
    const sections = $$('.section');

    let currentId = 'home';
    for (const section of sections) {
      const top = section.offsetTop - dom.html.scrollTop;
      const bottom = top + section.offsetHeight;
      if (dom.html.scrollTop >= top && dom.html.scrollTop < bottom) {
        currentId = section.id;
      }
    }

    dom.allNavLinks().forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + currentId);
    });
  }

  /* ============ DATA ============ */
  async function fetchData() {
    const res = await fetch('/data/site.json');
    if (!res.ok) throw new Error('Failed to load data');
    return res.json();
  }

  function loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
  }

  /* ============ RENDER: ABOUT ============ */
  function renderAbout(page) {
    const html = `
      <div class="about-grid">
        <div class="about-image-wrapper">
          <img src="${page.image}" alt="Defri Indra Mahardika" class="about-image" loading="lazy">
        </div>
        <div class="about-text">
          <h3>${page.intro}</h3>
          <p>${page.description}</p>
          <div class="about-quote">
            <blockquote>${page.quotes}</blockquote>
          </div>
          <img src="${page.image2}" alt="Defri" loading="lazy" style="max-width:300px;border-radius:8px;margin-top:1rem;">
        </div>
      </div>
      <h3 class="timeline-section-title">Experience</h3>
      <div class="timeline">
        ${page.experiences.map(renderTimelineItem).join('')}
      </div>
      <h3 class="timeline-section-title">Awards</h3>
      <div class="timeline">
        ${page.awards.map((a) => renderTimelineItem(a, true)).join('')}
      </div>
    `;
    dom.aboutContent.innerHTML = html;
  }

  function renderTimelineItem(item, isAward) {
    const startDate = parseDate(item.starttime);
    const endDate = parseDate(item.endtime);
    const dateStr = formatDateRange(startDate, endDate);

    return `
      <div class="timeline-item ${isAward ? 'highlight-item' : ''}">
        <div class="timeline-date">${dateStr}</div>
        <div class="timeline-title">${item.title}</div>
        ${item.subtitle ? `<div class="timeline-subtitle">${item.subtitle}</div>` : ''}
        ${item.description ? `<div class="timeline-description">${item.description}</div>` : ''}
      </div>
    `;
  }

  function parseDate(dateStr) {
    if (!dateStr) return null;
    const dotNetMatch = dateStr.match(/\/Date\((.+)\)\//);
    if (dotNetMatch) return new Date(dotNetMatch[1]);
    const tsMatch = dateStr.match(/\/Date\((\d+)\)\//);
    if (tsMatch) return new Date(parseInt(tsMatch[1]));
    return new Date(dateStr);
  }

  function formatDateRange(start, end) {
    if (!start) return 'Present';
    const opts = { month: 'short', year: 'numeric' };
    const startStr = start.toLocaleDateString('en-US', opts);
    if (!end) return startStr + ' - Present';
    const endStr = end.toLocaleDateString('en-US', opts);
    return startStr + ' - ' + endStr;
  }

  /* ============ RENDER: PORTFOLIO ============ */
  function renderPortfolio(items) {
    const html = items.map((item, index) => `
      <div class="portfolio-card" role="button" tabindex="0" data-index="${index}" aria-label="View details for ${item.name}">
        <img src="${item.carausel[0]}" alt="${item.name}" class="portfolio-card-image" loading="lazy">
        <div class="portfolio-card-body">
          <h3 class="portfolio-card-name">${item.name}</h3>
          <div class="portfolio-card-meta">
            <span class="portfolio-card-role">${item.role}</span>
            <span class="portfolio-card-year">${item.year}</span>
          </div>
          <p class="portfolio-card-description">${item.description || 'No description available.'}</p>
        </div>
      </div>
    `).join('');

    dom.portfolioGrid.innerHTML = html;

    $$('.portfolio-card', dom.portfolioGrid).forEach((card) => {
      const index = parseInt(card.dataset.index);
      card.addEventListener('click', () => openModal(index));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(index);
        }
      });
    });
  }

  /* ============ RENDER: CONTACT ============ */
  function renderContact(page) {
    const socialHtml = page.social_account.map((acc) => `
      <a href="${acc.url}" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="${acc.name}">
        <i class="${acc.icon}"></i>
      </a>
    `).join('');

    const emailHtml = page.email_bussiness.map((email) => `
      <a href="${email.url}" class="contact-email-link">
        <i class="${email.icon}"></i>
        ${email.name}
      </a>
    `).join('');

    const html = `
      <div class="contact-hero">
        <div class="contact-hero-image">
          <img src="${page.image}" alt="Contact" loading="lazy">
        </div>
        <div class="contact-hero-content">
          <p class="contact-intro">${page.intro}</p>
          <div class="contact-social-block">
            <h3>${page.social_title}</h3>
            <p>${page.social_description}</p>
            <div class="social-links">${socialHtml}</div>
          </div>
          <div class="contact-email-block">
            <h3>${page.email_title}</h3>
            <p>${page.email_description}</p>
            ${emailHtml}
          </div>
        </div>
      </div>
    `;
    dom.contactContent.innerHTML = html;
  }

  /* ============ MODAL ============ */
  function openModal(index) {
    const portfolio = state.data.webInfo.portfoliopage.portfolio;
    const item = portfolio[index];
    if (!item) return;

    state.currentSlide = 0;
    state.modalOpen = true;

    dom.modalTitle.textContent = item.name;
    renderModalSlide(item, 0);
    dom.modal.removeAttribute('hidden');
    dom.modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    dom.modalClose.focus();
  }

  function closeModal() {
    state.modalOpen = false;
    dom.modal.classList.remove('open');
    dom.modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  function renderModalSlide(item, slideIndex) {
    const images = item.carausel;
    const totalSlides = images.length;

    let carouselHtml = `
      <div class="modal-carousel-inner">
        <img src="${images[slideIndex]}" alt="${item.name} screenshot ${slideIndex + 1}" loading="lazy">
      </div>
    `;

    if (totalSlides > 1) {
      carouselHtml += `
        <div class="carousel-controls">
          <button class="carousel-btn" id="carousel-prev" aria-label="Previous slide">
            <i class="fas fa-chevron-left"></i>
          </button>
          <div class="carousel-dots">
            ${images.map((_, i) => `
              <button class="carousel-dot ${i === slideIndex ? 'active' : ''}" data-slide="${i}" aria-label="Go to slide ${i + 1}"></button>
            `).join('')}
          </div>
          <button class="carousel-btn" id="carousel-next" aria-label="Next slide">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      `;
    }

    dom.modalCarousel.innerHTML = carouselHtml;

    const infoHtml = `
      <div class="modal-info-grid">
        <div>
          <div class="modal-info-label">Role</div>
          <div class="modal-info-value">${item.role}</div>
        </div>
        <div>
          <div class="modal-info-label">Year</div>
          <div class="modal-info-value">${item.year}</div>
        </div>
      </div>
      <p class="modal-description">${item.description || 'No description available.'}</p>
      <div class="modal-links">
        ${item.urlWebsite ? `<a href="${item.urlWebsite}" target="_blank" rel="noopener noreferrer" class="modal-link"><i class="fas fa-globe"></i> Website</a>` : ''}
        ${item.urlPlaystore ? `<a href="${item.urlPlaystore}" target="_blank" rel="noopener noreferrer" class="modal-link"><i class="fab fa-google-play"></i> Play Store</a>` : ''}
      </div>
    `;

    dom.modalInfo.innerHTML = infoHtml;

    /* Attach carousel events */
    const prevBtn = $('#carousel-prev');
    const nextBtn = $('#carousel-next');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        state.currentSlide = (state.currentSlide - 1 + totalSlides) % totalSlides;
        renderModalSlide(item, state.currentSlide);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        state.currentSlide = (state.currentSlide + 1) % totalSlides;
        renderModalSlide(item, state.currentSlide);
      });
    }

    $$('.carousel-dot').forEach((dot) => {
      dot.addEventListener('click', () => {
        const slide = parseInt(dot.dataset.slide);
        state.currentSlide = slide;
        renderModalSlide(item, slide);
      });
    });
  }

  /* ============ WELCOME POPUP ============ */
  function showWelcome() {
    const hasSeen = localStorage.getItem('welcomeSeen');
    if (hasSeen) return;

    const popup = $('#welcome-popup');
    const close = $('#welcome-close');
    const cta = $('#welcome-cta');

    function dismiss() {
      popup.classList.remove('open');
      localStorage.setItem('welcomeSeen', 'true');
      document.body.style.overflow = '';
    }

    setTimeout(() => {
      popup.classList.add('open');
      document.body.style.overflow = 'hidden';
      cta.focus();
    }, 600);

    close.addEventListener('click', dismiss);
    cta.addEventListener('click', dismiss);
    popup.addEventListener('click', (e) => {
      if (e.target === popup) dismiss();
    });
  }

  /* ============ SCROLL REVEAL ============ */
  function initScrollReveal() {
    if (!('IntersectionObserver' in window)) {
      $$('.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-stagger').forEach((el) => {
        el.classList.add('visible');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    $$('.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-stagger').forEach((el) => {
      observer.observe(el);
    });
  }

  function addRevealClasses() {
    $$('.section-header').forEach((el) => el.classList.add('reveal'));
    $$('.about-grid').forEach((el) => el.classList.add('reveal'));
    $$('.timeline-section-title').forEach((el) => el.classList.add('reveal'));
    $$('.timeline').forEach((el) => el.classList.add('reveal'));
    $$('.contact-hero').forEach((el) => el.classList.add('reveal'));
    $$('.portfolio-grid').forEach((el) => {
      el.classList.add('reveal-stagger');
      $$('.portfolio-card', el).forEach((card) => {
        card.classList.add('reveal-card');
      });
    });
    $$('.hero-image-wrapper').forEach((el) => el.classList.add('reveal-scale'));
  }

  /* ============ KEYBOARD NAV ============ */
  function handleKeydown(e) {
    if (state.modalOpen && e.key === 'Escape') {
      closeModal();
    }
  }

  /* ============ INIT ============ */
  async function init() {
    /* Theme */
    setTheme(state.theme);

    /* Footer year */
    dom.footerYear.textContent = new Date().getFullYear();

    /* Events */
    dom.themeToggle.addEventListener('click', toggleTheme);

    dom.navToggle.addEventListener('click', () => {
      const expanded = dom.navToggle.getAttribute('aria-expanded') === 'true';
      dom.navToggle.setAttribute('aria-expanded', !expanded);
      dom.navLinks.classList.toggle('open');
    });

    dom.allNavLinks().forEach((link) => {
      link.addEventListener('click', closeMobileNav);
    });

    dom.modalClose.addEventListener('click', closeModal);
    dom.modal.addEventListener('click', (e) => {
      if (e.target === dom.modal) closeModal();
    });

    document.addEventListener('keydown', handleKeydown);
    window.addEventListener('scroll', updateActiveNav, { passive: true });

    /* Load data */
    try {
      const data = await fetchData();
      state.data = data;
      const web = data.webInfo;

      renderAbout(web.aboutpage);
      renderPortfolio(web.portfoliopage.portfolio);
      renderContact(web.contactpage);
      updateActiveNav();

      addRevealClasses();
      initScrollReveal();
      showWelcome();

      /* Preload hero image */
      loadImage(web.homepage.link_image);
    } catch (err) {
      dom.aboutContent.innerHTML =
        '<p style="text-align:center;color:var(--color-danger);padding:var(--space-8)">Failed to load data. Please try refreshing the page.</p>';
      dom.portfolioGrid.innerHTML =
        '<p style="text-align:center;color:var(--color-danger);padding:var(--space-8)">Failed to load data.</p>';
      dom.contactContent.innerHTML =
        '<p style="text-align:center;color:var(--color-danger);padding:var(--space-8)">Failed to load data.</p>';
    }
  }

  /* Start on DOM ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
