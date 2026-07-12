document.addEventListener('DOMContentLoaded', () => {

  // 1. STICKY HEADER SCROLL EFFECT
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // 2. DYNAMIC COUNTDOWN TIMER (7 days loop/persistence)
  const countdownEl = document.getElementById('promo-countdown');
  
  // Set end time (7 days from first load, persisted in localStorage)
  let targetTime = localStorage.getItem('smartspace_countdown_target');
  if (!targetTime) {
    targetTime = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('smartspace_countdown_target', targetTime);
  } else {
    targetTime = parseInt(targetTime, 10);
    // If the timer expired, reset it to another 7 days to keep page lively
    if (targetTime < Date.now()) {
      targetTime = Date.now() + 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem('smartspace_countdown_target', targetTime);
    }
  }

  function updateCountdown() {
    const now = Date.now();
    const diff = targetTime - now;

    if (diff <= 0) {
      countdownEl.textContent = "00d 00h 00m 00s";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (num) => String(num).padStart(2, '0');
    countdownEl.textContent = `${pad(days)}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  }

  setInterval(updateCountdown, 1000);
  updateCountdown();

  // 3. BEFORE-AFTER DRAGGABLE COMPARISON SLIDER
  const slider = document.getElementById('before-after-slider');
  const afterImg = document.getElementById('img-after');
  const handle = document.getElementById('slider-handle');
  
  let isDragging = false;

  function setSliderPosition(x) {
    const rect = slider.getBoundingClientRect();
    let percentage = ((x - rect.left) / rect.width) * 100;
    
    // Boundary check
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;

    // Apply styles
    afterImg.style.clipPath = `inset(0 0 0 ${percentage}%)`;
    handle.style.left = `${percentage}%`;
  }

  // Mouse events
  slider.addEventListener('mousedown', (e) => {
    isDragging = true;
    setSliderPosition(e.clientX);
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    setSliderPosition(e.clientX);
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Touch events for mobile responsiveness
  slider.addEventListener('touchstart', (e) => {
    isDragging = true;
    setSliderPosition(e.touches[0].clientX);
  });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    setSliderPosition(e.touches[0].clientX);
  });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });

  // 3b. COMPARISON TAB SELECTION
  const tabButtons = document.querySelectorAll('.tab-btn');
  const beforeImg = document.getElementById('img-before');
  const labelBefore = document.querySelector('.label-before');
  const labelAfter = document.querySelector('.label-after');

  const toolsData = {
    staging: {
      before: 'img/img2.jpeg',
      after: 'img/img3.jpeg',
      beforeLabel: 'Original',
      afterLabel: 'Staged'
    },
    twilight: {
      before: 'img/img4.jpeg',
      after: 'img/img5.jpeg',
      beforeLabel: 'Daytime',
      afterLabel: 'Twilight'
    },
    lawn: {
      before: 'img/img6.jpeg',
      after: 'img/8_1.webp',
      beforeLabel: 'Patchy Lawn',
      afterLabel: 'Green Lawn'
    },
    weather: {
      before: 'img/15.webp',
      after: 'img/image.png',
      beforeLabel: 'Gloom / Clouds',
      afterLabel: 'Sunny Sky'
    }
  };

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle active classes
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const toolKey = btn.getAttribute('data-tool');
      const data = toolsData[toolKey];
      if (data) {
        // Change image background URLs
        beforeImg.style.backgroundImage = `url('${data.before}')`;
        afterImg.style.backgroundImage = `url('${data.after}')`;
        
        // Reset label texts
        labelBefore.textContent = data.beforeLabel;
        labelAfter.textContent = data.afterLabel;

        // Reset split slider to 50%
        afterImg.style.clipPath = 'inset(0 0 0 50%)';
        handle.style.left = '50%';
      }
    });
  });

  // 4. TESTIMONIALS SLIDER CAROUSEL
  const sliderTrack = document.getElementById('testimonial-slider');
  const dots = document.querySelectorAll('.dot');
  let currentSlide = 0;
  const slideCount = dots.length;

  function showSlide(index) {
    if (index < 0) index = slideCount - 1;
    if (index >= slideCount) index = 0;
    
    currentSlide = index;
    sliderTrack.style.transform = `translateX(-${index * 100}%)`;
    
    // Update active dot
    dots.forEach(dot => dot.classList.remove('active'));
    dots[index].classList.add('active');
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.getAttribute('data-index'), 10);
      showSlide(idx);
    });
  });

  // Auto sliding testimonials every 6 seconds
  let autoSlideInterval = setInterval(() => {
    showSlide(currentSlide + 1);
  }, 6000);

  // Clear interval when interacting with dots
  document.getElementById('carousel-dots').addEventListener('click', () => {
    clearInterval(autoSlideInterval);
  });

  // 5. SCROLL INTERSECTION OBSERVER FOR FADE-IN ANIMATIONS
  const fadeElements = document.querySelectorAll('.fade-in-up');
  
  const observerOptions = {
    root: null, // viewport
    rootMargin: '0px',
    threshold: 0.1 // trigger when 10% visible
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // once animated, no need to track again
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  fadeElements.forEach(el => observer.observe(el));

  // 6. MOBILE HEADER NAVIGATION TOGGLER
  const mobileToggle = document.getElementById('mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navActions = document.querySelector('.nav-actions');

  mobileToggle.addEventListener('click', () => {
    const isMenuVisible = navMenu.style.display === 'flex';
    if (isMenuVisible) {
      navMenu.style.display = 'none';
      navActions.style.display = 'none';
      mobileToggle.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      `;
    } else {
      navMenu.style.display = 'flex';
      navMenu.style.flexDirection = 'column';
      navMenu.style.position = 'absolute';
      navMenu.style.top = '72px';
      navMenu.style.left = '0';
      navMenu.style.right = '0';
      navMenu.style.backgroundColor = 'var(--bg-secondary)';
      navMenu.style.padding = '20px';
      navMenu.style.borderBottom = '1px solid var(--border-color)';
      
      navActions.style.display = 'flex';
      navActions.style.flexDirection = 'column';
      navActions.style.position = 'absolute';
      navActions.style.top = '280px';
      navActions.style.left = '0';
      navActions.style.right = '0';
      navActions.style.backgroundColor = 'var(--bg-secondary)';
      navActions.style.padding = '20px';
      navActions.style.borderBottom = '1px solid var(--border-color)';
      navActions.style.gap = '16px';
      
      mobileToggle.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      `;
    }
  });

  // 7. PRICING BILLING CYCLE TOGGLE
  const billingMonthlyBtn = document.getElementById('billing-monthly');
  const billingAnnuallyBtn = document.getElementById('billing-annually');
  const priceStarter = document.getElementById('price-starter');
  const priceProfessional = document.getElementById('price-professional');
  const priceEnterprise = document.getElementById('price-enterprise');
  
  if (billingMonthlyBtn && billingAnnuallyBtn) {
    billingMonthlyBtn.addEventListener('click', () => {
      billingMonthlyBtn.classList.add('active');
      billingAnnuallyBtn.classList.remove('active');
      priceStarter.textContent = "$29";
      priceProfessional.textContent = "$79";
      priceEnterprise.textContent = "$199";
    });

    billingAnnuallyBtn.addEventListener('click', () => {
      billingAnnuallyBtn.classList.add('active');
      billingMonthlyBtn.classList.remove('active');
      priceStarter.textContent = "$23";
      priceProfessional.textContent = "$63";
      priceEnterprise.textContent = "$159";
    });
  }

  // 8. ASKED QUESTIONS (FAQ) ACCORDION
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    if (trigger) {
      trigger.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        // Close all items
        faqItems.forEach(i => i.classList.remove('active'));
        
        // Open this one if it wasn't active
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });
  // 9. VIDEO MODAL LIGHTBOX EVENT HANDLERS
  const videoPlayBtn = document.getElementById('video-play-btn');
  const videoModal = document.getElementById('video-modal');
  const videoModalClose = document.getElementById('video-modal-close');
  const videoIframe = document.getElementById('video-iframe');

  if (videoPlayBtn && videoModal && videoModalClose && videoIframe) {
    videoPlayBtn.addEventListener('click', () => {
      videoModal.classList.add('open');
      videoIframe.src = "https://www.youtube.com/embed/T48zE9UfUhs?autoplay=1";
    });

    const closeVideo = () => {
      videoModal.classList.remove('open');
      videoIframe.src = "";
    };

    videoModalClose.addEventListener('click', closeVideo);
    
    // Close modal if user clicks outside content box
    videoModal.addEventListener('click', (e) => {
      if (e.target === videoModal) {
        closeVideo();
      }
    });
  }

  // 10. SPOTLIGHT HOVER COORDINATES TRACKER
  const spotlightCards = document.querySelectorAll('.spotlight-card');
  spotlightCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // 11. MAGNETIC CTA BUTTONS EFFECT
  const magneticBtns = document.querySelectorAll('.magnetic-btn');
  
  // Only register magnetic listeners if user doesn't prefer reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (!prefersReducedMotion) {
    magneticBtns.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        // Calculate distance from button center
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        // Translate the button slightly (20% intensity)
        btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        // Reset translate on mouse exit
        btn.style.transform = 'translate(0, 0)';
      });
    });
  }

});
