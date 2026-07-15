import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "../../Components/Icon";
import "./LandingPage.css";

const toolsData = {
  staging: {
    before: "/img/image-before2.png",
    after: "/img/image-after2.png",
    beforeLabel: "Original",
    afterLabel: "Staged",
  },
  twilight: {
    before: "/img/image-before.png",
    after: "/img/image-after.png",
    beforeLabel: "Daytime",
    afterLabel: "Twilight",
  },
  lawn: {
    before: "/img/img6.jpeg",
    after: "/img/image11.png",
    beforeLabel: "Patchy Lawn",
    afterLabel: "Green Lawn",
  },
  weather: {
    before: "/img/image12.png",
    after: "/img/image.png",
    beforeLabel: "Gloom / Clouds",
    afterLabel: "Sunny Sky",
  },
};

const LandingPage = () => {
  const { t, i18n } = useTranslation();

  // Theme Toggle
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme;
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const nextTheme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme", nextTheme);
      return nextTheme;
    });
  };

  // 1. Sticky Header
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 2. Countdown Timer
  const [countdownText, setCountdownText] = useState("00d 00h 00m 00s");
  useEffect(() => {
    let targetTime = localStorage.getItem("smartspace_countdown_target");
    if (!targetTime) {
      targetTime = Date.now() + 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem("smartspace_countdown_target", targetTime);
    } else {
      targetTime = parseInt(targetTime, 10);
      if (targetTime < Date.now()) {
        targetTime = Date.now() + 7 * 24 * 60 * 60 * 1000;
        localStorage.setItem("smartspace_countdown_target", targetTime);
      }
    }

    const updateCountdown = () => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setCountdownText("00d 00h 00m 00s");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const pad = (num) => String(num).padStart(2, "0");
      setCountdownText(`${pad(days)}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`);
    };

    const interval = setInterval(updateCountdown, 1000);
    updateCountdown();

    return () => clearInterval(interval);
  }, []);

  // 3. Before-After Slider
  const [activeTab, setActiveTab] = useState("staging");
  const [sliderPosition, setSliderPosition] = useState(50);
  const sliderRef = useRef(null);
  const isDragging = useRef(false);

  const handleSliderMove = (clientX) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    let percentage = ((clientX - rect.left) / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setSliderPosition(percentage);
  };

  const handleMouseDown = (e) => {
    isDragging.current = true;
    handleSliderMove(e.clientX);
  };

  const handleTouchStart = (e) => {
    isDragging.current = true;
    handleSliderMove(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      handleSliderMove(e.clientX);
    };

    const handleTouchMove = (e) => {
      if (!isDragging.current) return;
      handleSliderMove(e.touches[0].clientX);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchend", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, []);

  // 4. Testimonials Slider
  const [currentSlide, setCurrentSlide] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // 5. Scroll Intersection Observer for Animations
  useEffect(() => {
    const fadeElements = document.querySelectorAll(".fade-in-up");
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    fadeElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // 6. Mobile Menu Toggler
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState({});

  const toggleDropdown = (e, menu) => {
    e.preventDefault();
    setOpenDropdowns((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  // 7. Scroll and Tab Handlers
  const scrollToSection = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 90;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      setIsMobileMenuOpen(false);
    }
  };

  const handleTabScroll = (e, tabName, sectionId) => {
    e.preventDefault();
    setActiveTab(tabName);
    setSliderPosition(50);
    scrollToSection(e, sectionId);
  };

  // 8. Accordion FAQ
  const [activeFaq, setActiveFaq] = useState(null);
  const toggleFaq = (index) => {
    setActiveFaq((prev) => (prev === index ? null : index));
  };

  // 9. Video Modal
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // 10. Spotlight Coordinates Tracker
  const handleSpotlightMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  };

  // 11. Magnetic Button Effect
  const handleMagneticMouseMove = (e) => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - btn.offsetHeight / 2; // Keep compatibility

    btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
  };

  const handleMagneticMouseLeave = (e) => {
    const btn = e.currentTarget;
    btn.style.transform = "translate(0, 0)";
  };

  const getBeforeAfterLabels = () => {
    switch (activeTab) {
      case "staging":
        return { before: t("landing.original"), after: t("landing.staged") };
      case "twilight":
        return { before: t("landing.daytime"), after: t("landing.twilight") };
      case "lawn":
        return { before: t("landing.patchyLawn"), after: t("landing.greenLawn") };
      case "weather":
        return { before: t("landing.gloomySky"), after: t("landing.sunnySky") };
      default:
        return { before: "", after: "" };
    }
  };
  const labels = getBeforeAfterLabels();

  const currentToolData = toolsData[activeTab];

  return (
    <div className="landing-page-root">
      {/* GLOW ORBS FOR MESH BACKGROUND */}
      <div className="glow-container">
        <div className="glow-orb glow-orb-1"></div>
        <div className="glow-orb glow-orb-2"></div>
        <div className="glow-orb glow-orb-3"></div>
      </div>
    

      {/* NAVIGATION HEADER */}
      <header className={`main-header ${isScrolled ? "scrolled" : ""}`} id="header">
        <div className="nav-container">
          {/* Logo */}
          <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <span className="logo-main">
              SmartSpace<span>.ai</span>
            </span>
            <span className="logo-sub">{t("common.logoSub")}</span>
          </div>

          {/* Mobile Overlay */}
          <div 
            className={`mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`} 
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Navigation Wrapper (Sidebar on Mobile, Normal on Desktop) */}
          <div className={`nav-wrapper ${isMobileMenuOpen ? "mobile-open" : ""}`}>
            {/* Mobile Header (Hidden on Desktop) */}
            <div className="mobile-drawer-header">
              <div className="logo" onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setIsMobileMenuOpen(false); }}>
                <span className="logo-main">SmartSpace<span>.ai</span></span>
              </div>
              <button className="mobile-drawer-close" onClick={() => setIsMobileMenuOpen(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation Links */}
            <nav>
              <ul className="nav-menu">
                <li className="nav-item">
                <a
                  href="#virtual-staging"
                  className="nav-link"
                  onClick={(e) => {
                    if (window.innerWidth <= 768) {
                      toggleDropdown(e, "staging");
                    } else {
                      scrollToSection(e, "virtual-staging");
                    }
                  }}
                >
                  {t("landing.tabVirtualStaging")}
                  <svg 
                    className={`dropdown-chevron ${openDropdowns["staging"] ? "open" : ""}`}
                    width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 1L5 5L9 1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
                {/* Dropdown */}
                <div className={`dropdown ${openDropdowns["staging"] ? "mobile-expanded" : ""}`}>
                  <a
                    href="#virtual-staging"
                    className="dropdown-link"
                    onClick={(e) => scrollToSection(e, "virtual-staging")}
                  >
                    <span className="dropdown-title">{t("landing.addFurnitureTitle")}</span>
                    <span className="dropdown-desc">{t("landing.dropdownAddFurnitureDesc")}</span>
                  </a>
                  <a
                    href="#virtual-staging"
                    className="dropdown-link"
                    onClick={(e) => scrollToSection(e, "virtual-staging")}
                  >
                    <span className="dropdown-title">{t("landing.dropdownFurnitureEraserTitle")}</span>
                    <span className="dropdown-desc">{t("landing.dropdownFurnitureEraserDesc")}</span>
                  </a>
                  <a
                    href="#virtual-staging"
                    className="dropdown-link"
                    onClick={(e) => scrollToSection(e, "virtual-staging")}
                  >
                    <span className="dropdown-title">{t("landing.dropdownRoomDeclutterTitle")}</span>
                    <span className="dropdown-desc">{t("landing.dropdownRoomDeclutterDesc")}</span>
                  </a>
                </div>
              </li>
              <li className="nav-item">
                <a
                  href="#comparison"
                  className="nav-link"
                  onClick={(e) => {
                    if (window.innerWidth <= 768) {
                      toggleDropdown(e, "tools");
                    } else {
                      scrollToSection(e, "comparison");
                    }
                  }}
                >
                  {t("landing.dropdownAiToolsTitle")}
                  <svg 
                    className={`dropdown-chevron ${openDropdowns["tools"] ? "open" : ""}`}
                    width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 1L5 5L9 1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
                <div className={`dropdown ${openDropdowns["tools"] ? "mobile-expanded" : ""}`}>
                  <a
                    href="#comparison"
                    className="dropdown-link"
                    onClick={(e) => handleTabScroll(e, "twilight", "comparison")}
                  >
                    <span className="dropdown-title">{t("landing.tabTwilightConversion")}</span>
                    <span className="dropdown-desc">{t("landing.dropdownTwilightDesc")}</span>
                  </a>
                  <a
                    href="#comparison"
                    className="dropdown-link"
                    onClick={(e) => handleTabScroll(e, "lawn", "comparison")}
                  >
                    <span className="dropdown-title">{t("landing.tabLawnReplacement")}</span>
                    <span className="dropdown-desc">{t("landing.dropdownLawnDesc")}</span>
                  </a>
                  <a
                    href="#comparison"
                    className="dropdown-link"
                    onClick={(e) => handleTabScroll(e, "weather", "comparison")}
                  >
                    <span className="dropdown-title">{t("landing.tabWeatherControl")}</span>
                    <span className="dropdown-desc">{t("landing.dropdownWeatherDesc")}</span>
                  </a>
                </div>
              </li>
              <li className="nav-item">
                <a
                  href="#gallery"
                  className="nav-link"
                  onClick={(e) => scrollToSection(e, "gallery")}
                >
                  {t("common.gallery")}
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="#pricing"
                  className="nav-link"
                  onClick={(e) => scrollToSection(e, "pricing")}
                >
                  {t("common.pricing")}
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="#faq"
                  className="nav-link"
                  onClick={(e) => scrollToSection(e, "faq")}
                >
                  {t("common.faq")}
                </a>
              </li>
            </ul>
          </nav>

          {/* Nav Actions */}
          <div className="nav-actions">
            <div className="nav-toggles-row">
              <button
                className="btn btn-lang-toggle"
                onClick={() => i18n.changeLanguage(i18n.language.startsWith("ar") ? "en" : "ar")}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  fontWeight: "700",
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "8px",
                }}
                aria-label="Toggle Language"
              >
                {i18n.language.startsWith("ar") ? "EN" : "العربية"}
              </button>
              <button
                className="btn btn-theme-toggle"
                onClick={toggleTheme}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  fontSize: "20px",
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "8px",
                }}
                aria-label="Toggle Theme"
              >
                <Icon name={theme === "dark" ? "light_mode" : "dark_mode"} size={22} />
              </button>
            </div>
            <Link to="/login" className="btn btn-login">
              {t("common.logIn")}
            </Link>
            <Link
              to="/register"
              className="btn btn-accent btn-design magnetic-btn shine-effect"
              onMouseMove={handleMagneticMouseMove}
              onMouseLeave={handleMagneticMouseLeave}
            >
              {t("common.designNow")}
            </Link>
          </div>
        </div>

          {/* Mobile Nav Toggle */}
          <button
            className="mobile-nav-toggle"
            id="mobile-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="hero">
        <div className="container">
          <div className="hero-content fade-in-up">
            <span className="hero-pretitle">{t("landing.heroPretitle")}</span>
            <h1>
              <span className="serif-title">{t("landing.heroTitlePart1")}</span>
              <br />
              <span className="bronze-highlight">{t("landing.heroTitlePart2")}</span>
            </h1>
            <p className="lead">{t("landing.heroLead")}</p>
            <div className="hero-actions">
              <Link
                to="/register"
                className="btn btn-accent btn-try magnetic-btn shine-effect"
                onMouseMove={handleMagneticMouseMove}
                onMouseLeave={handleMagneticMouseLeave}
              >
                {t("landing.tryItFree")}
              </Link>
            </div>
          </div>

          {/* Floating Badge 1 (Left - Add Furniture) */}
          <div className="floating-badge floating-badge-1 glass-card">
            <img src="/img/image1.png" alt={t("landing.addFurnitureTitle")} className="floating-thumb" />
            <div className="floating-info">
              <span className="floating-title">{t("landing.addFurnitureTitle")}</span>
              <span className="floating-desc">{t("landing.addFurnitureDesc")}</span>
            </div>
          </div>

          {/* Floating Badge 2 (Right - Rain to Shine) */}
          <div className="floating-badge floating-badge-2 glass-card">
            <img src="/img/image12.png" alt={t("landing.rainToShineTitle")} className="floating-thumb" />
            <div className="floating-info">
              <span className="floating-title">{t("landing.rainToShineTitle")}</span>
              <span className="floating-desc">{t("landing.rainToShineDesc")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SOCIAL PROOF / TRUST SECTION */}
      <section className="social-proof">
        <p>{t("landing.trustedBy")}</p>
        <div className="marquee-container">
          <div className="marquee-content" id="logo-ticker">
            <img
              src="https://d37vt2dds2nfmk.cloudfront.net/20260319/39dbdbd1-50e9-4dd8-984c-b4c22b952bee.png"
              alt="Partner Logo"
              className="logo-item"
            />
            <img
              src="https://d37vt2dds2nfmk.cloudfront.net/20260319/33a472db-74c8-4c74-8a06-0e3480faa434.png"
              alt="Partner Logo"
              className="logo-item"
            />
            <img
              src="https://d37vt2dds2nfmk.cloudfront.net/20260319/830f7bd7-e8c6-4f2d-beea-ad97a29bece6.png"
              alt="Partner Logo"
              className="logo-item"
            />
            <img
              src="https://d37vt2dds2nfmk.cloudfront.net/20260319/0ca4c425-b5de-4759-90d8-386f6cd79347.png"
              alt="Partner Logo"
              className="logo-item"
            />
            <img
              src="https://d37vt2dds2nfmk.cloudfront.net/20260319/2f84ba43-1c6e-4abf-a33c-f91f81489e6b.png"
              alt="Partner Logo"
              className="logo-item"
            />
            <img
              src="https://d37vt2dds2nfmk.cloudfront.net/20260319/7a85e1ab-194f-4e22-af6a-fe06bdf7357a.png"
              alt="Partner Logo"
              className="logo-item"
            />
            <img
              src="https://d37vt2dds2nfmk.cloudfront.net/20260319/7636610b-20ab-4d6f-9107-5f63ad95f7f9.png"
              alt="Partner Logo"
              className="logo-item"
            />
            <img
              src="https://d37vt2dds2nfmk.cloudfront.net/20260319/0d95507b-3e7c-490a-af75-2ede90f8e288.png"
              alt="Partner Logo"
              className="logo-item"
            />
            <img
              src="https://d37vt2dds2nfmk.cloudfront.net/20260319/0c905888-2353-4b50-a2f1-86c170536a12.png"
              alt="Partner Logo"
              className="logo-item"
            />

            {/* Duplicate for loop */}
            <img
              src="https://d37vt2dds2nfmk.cloudfront.net/20260319/39dbdbd1-50e9-4dd8-984c-b4c22b952bee.png"
              alt="Partner Logo"
              className="logo-item"
            />
            <img
              src="https://d37vt2dds2nfmk.cloudfront.net/20260319/33a472db-74c8-4c74-8a06-0e3480faa434.png"
              alt="Partner Logo"
              className="logo-item"
            />
            <img
              src="https://d37vt2dds2nfmk.cloudfront.net/20260319/830f7bd7-e8c6-4f2d-beea-ad97a29bece6.png"
              alt="Partner Logo"
              className="logo-item"
            />
            <img
              src="https://d37vt2dds2nfmk.cloudfront.net/20260319/0ca4c425-b5de-4759-90d8-386f6cd79347.png"
              alt="Partner Logo"
              className="logo-item"
            />
            <img
              src="https://d37vt2dds2nfmk.cloudfront.net/20260319/2f84ba43-1c6e-4abf-a33c-f91f81489e6b.png"
              alt="Partner Logo"
              className="logo-item"
            />
            <img
              src="https://d37vt2dds2nfmk.cloudfront.net/20260319/7a85e1ab-194f-4e22-af6a-fe06bdf7357a.png"
              alt="Partner Logo"
              className="logo-item"
            />
            <img
              src="https://d37vt2dds2nfmk.cloudfront.net/20260319/7636610b-20ab-4d6f-9107-5f63ad95f7f9.png"
              alt="Partner Logo"
              className="logo-item"
            />
            <img
              src="https://d37vt2dds2nfmk.cloudfront.net/20260319/0d95507b-3e7c-490a-af75-2ede90f8e288.png"
              alt="Partner Logo"
              className="logo-item"
            />
            <img
              src="https://d37vt2dds2nfmk.cloudfront.net/20260319/0c905888-2353-4b50-a2f1-86c170536a12.png"
              alt="Partner Logo"
              className="logo-item"
            />
          </div>
        </div>
      </section>

      {/* 4. PRODUCT & FEATURES SECTION */}
      {/* 4a. HOW IT WORKS */}
      <section className="steps-section">
        <div className="container">
          <div className="section-header fade-in-up">
            <h2>{t("landing.howItWorksTitle")}</h2>
            <p>{t("landing.howItWorksSub")}</p>
          </div>

          <div className="steps-grid fade-in-up">
            {/* Step 1 */}
            <div className="step-card spotlight-card" onMouseMove={handleSpotlightMouseMove}>
              <div className="step-number">1</div>
              <h3>{t("landing.step1Title")}</h3>
              <p>{t("landing.step1Desc")}</p>
            </div>
            {/* Step 2 */}
            <div className="step-card spotlight-card" onMouseMove={handleSpotlightMouseMove}>
              <div className="step-number">2</div>
              <h3>{t("landing.step2Title")}</h3>
              <p>{t("landing.step2Desc")}</p>
            </div>
            {/* Step 3 */}
            <div className="step-card spotlight-card" onMouseMove={handleSpotlightMouseMove}>
              <div className="step-number">3</div>
              <h3>{t("landing.step3Title")}</h3>
              <p>{t("landing.step3Desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4a-2. AI VIRTUAL STAGING DETAIL SECTION */}
      <section className="staging-detail-section" id="virtual-staging">
        <div className="container">
          <div className="staging-detail-wrapper">
            <div className="staging-detail-content fade-in-up">
              <span className="detail-pretitle">{t("landing.coreTech")}</span>
              <h2>{t("landing.b2bScaleTitle")}</h2>
              <p className="detail-lead">{t("landing.b2bScaleLead")}</p>

              <ul className="detail-features-list">
                <li>
                  <div className="detail-feature-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                      <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                  </div>
                  <div className="detail-feature-text">
                    <h4>{t("landing.perspectiveEngineTitle")}</h4>
                    <p>{t("landing.perspectiveEngineDesc")}</p>
                  </div>
                </li>
                <li>
                  <div className="detail-feature-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="5"></circle>
                      <line x1="12" y1="1" x2="12" y2="3"></line>
                      <line x1="12" y1="21" x2="12" y2="23"></line>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                      <line x1="1" y1="12" x2="3" y2="12"></line>
                      <line x1="21" y1="12" x2="23" y2="12"></line>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                  </div>
                  <div className="detail-feature-text">
                    <h4>{t("landing.naturalShadowsTitle")}</h4>
                    <p>{t("landing.naturalShadowsDesc")}</p>
                  </div>
                </li>
                <li>
                  <div className="detail-feature-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                  </div>
                  <div className="detail-feature-text">
                    <h4>{t("landing.curatedCollectionsTitle")}</h4>
                    <p>{t("landing.curatedCollectionsDesc")}</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="staging-detail-visual fade-in-up">
              <div className="visual-card-stack">
                {/* Staged Room Preview */}
                <div className="visual-card main-card">
                  <img src="/img/image-after.png" alt="Staged Living Space Preview" />
                  <div className="visual-badge">{t("landing.staged")}</div>
                </div>
                {/* Original Room Preview */}
                <div className="visual-card secondary-card">
                  <img src="/img/image-before.png" alt="Original Empty Living Space" />
                  <div className="visual-badge">{t("landing.original")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4b. COMPARISON BEFORE-AFTER SLIDER */}
      <section className="comparison-section" id="comparison">
        <div className="container">
          <div className="comparison-wrapper">
            <div className="comparison-info fade-in-up">
              <h2>{t("landing.dragToReveal")}</h2>
              <p>{t("landing.dragDesc")}</p>

              <div className="comparison-tabs">
                <button
                  className={`tab-btn ${activeTab === "staging" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("staging");
                    setSliderPosition(50);
                  }}
                >
                  {t("landing.tabVirtualStaging")}
                </button>
                <button
                  className={`tab-btn ${activeTab === "twilight" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("twilight");
                    setSliderPosition(50);
                  }}
                >
                  {t("landing.tabTwilightConversion")}
                </button>
                <button
                  className={`tab-btn ${activeTab === "lawn" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("lawn");
                    setSliderPosition(50);
                  }}
                >
                  {t("landing.tabLawnReplacement")}
                </button>
                <button
                  className={`tab-btn ${activeTab === "weather" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("weather");
                    setSliderPosition(50);
                  }}
                >
                  {t("landing.tabWeatherControl")}
                </button>
              </div>
            </div>

            <div className="fade-in-up">
              {/* Slider Container */}
              <div
                className="slider-container"
                id="before-after-slider"
                ref={sliderRef}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
              >
                {/* Background (Before) */}
                <div
                  className="slider-img slider-before"
                  id="img-before"
                  style={{ backgroundImage: `url(${currentToolData.before})` }}
                />
                {/* Overlay (After) */}
                <div
                  className="slider-img slider-after"
                  id="img-after"
                  style={{
                    backgroundImage: `url(${currentToolData.after})`,
                    clipPath: `inset(0 0 0 ${sliderPosition}%)`,
                  }}
                />

                {/* Handle */}
                <div
                  className="slider-handle"
                  id="slider-handle"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="slider-button">&#8596;</div>
                </div>

                {/* Labels */}
                <span className="slider-label label-before">{currentToolData.beforeLabel}</span>
                <span className="slider-label label-after">{currentToolData.afterLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4c. FEATURES GRID */}
      <section className="features-section">
        <div className="container">
          <div className="section-header fade-in-up">
            <h2>{t("landing.toolkitTitle")}</h2>
            <p>{t("landing.toolkitSub")}</p>
          </div>

          <div className="features-grid fade-in-up">
            {/* Feature 1 */}
            <div className="feature-card col-span-2 spotlight-card" onMouseMove={handleSpotlightMouseMove}>
              <div className="feature-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 21V9h6v12" />
                </svg>
              </div>
              <h3>{t("landing.toolkitAddRemoveTitle")}</h3>
              <p>{t("landing.toolkitAddRemoveDesc")}</p>
            </div>

            {/* Feature 2 */}
            <div className="feature-card spotlight-card" onMouseMove={handleSpotlightMouseMove}>
              <div className="feature-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2v20M2 12h20" />
                </svg>
              </div>
              <h3>{t("landing.toolkitTwilightTitle")}</h3>
              <p>{t("landing.toolkitTwilightDesc")}</p>
            </div>

            {/* Feature 3 */}
            <div className="feature-card spotlight-card" onMouseMove={handleSpotlightMouseMove}>
              <div className="feature-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L2 22h20L12 2z" />
                </svg>
              </div>
              <h3>{t("landing.toolkitLawnTitle")}</h3>
              <p>{t("landing.toolkitLawnDesc")}</p>
            </div>

            {/* Feature 4 */}
            <div className="feature-card spotlight-card" onMouseMove={handleSpotlightMouseMove}>
              <div className="feature-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
              </div>
              <h3>{t("landing.toolkitStyleSwapTitle")}</h3>
              <p>{t("landing.toolkitStyleSwapDesc")}</p>
            </div>

            {/* Feature 5 */}
            <div className="feature-card spotlight-card" onMouseMove={handleSpotlightMouseMove}>
              <div className="feature-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v2M4.93 4.93l1.41 1.41M2 12h2M6.34 17.66l-1.41 1.41M12 20v2M17.66 17.66l1.41 1.41M20 12h2M17.66 6.34l-1.41-1.41" />
                </svg>
              </div>
              <h3>{t("landing.toolkitWeatherTitle")}</h3>
              <p>{t("landing.toolkitWeatherDesc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4d. STAGED DESIGN SHOWCASE GALLERY */}
      <section className="gallery-section" id="gallery">
        <div className="container">
          <div className="section-header fade-in-up">
            <h2>{t("landing.gallerySectionTitle")}</h2>
            <p>{t("landing.gallerySectionSub")}</p>
          </div>

          <div className="gallery-grid fade-in-up">
            <div className="gallery-item">
              <img src="/img/image.png" alt="Staged Living Room View" />
              <div className="gallery-overlay">
                <span className="gallery-tag">{t("landing.galleryTagLivingRoom")}</span>
                <h4 className="gallery-title">{t("landing.galleryTitleLivingRoom")}</h4>
              </div>
            </div>
            <div className="gallery-item">
              <img src="/img/bedroom.png" alt="Staged Bedroom Design" />
              <div className="gallery-overlay">
                <span className="gallery-tag">{t("landing.galleryTagBedroom")}</span>
                <h4 className="gallery-title">{t("landing.galleryTitleBedroom")}</h4>
              </div>
            </div>
            <div className="gallery-item">
              <img src="/img/Outdoor-Patio.png" alt="Twilight Staged House Patio" />
              <div className="gallery-overlay">
                <span className="gallery-tag">{t("landing.galleryTagPatio")}</span>
                <h4 className="gallery-title">{t("landing.galleryTitlePatio")}</h4>
              </div>
            </div>
            <div className="gallery-item">
              <img src="/img/dining-room.png" alt="Staged Dining Room" />
              <div className="gallery-overlay">
                <span className="gallery-tag">{t("landing.galleryTagDining")}</span>
                <h4 className="gallery-title">{t("landing.galleryTitleDining")}</h4>
              </div>
            </div>
            <div className="gallery-item">
              <img src="/img/image1.png" alt="Staged Living Room Space" />
              <div className="gallery-overlay">
                <span className="gallery-tag">{t("landing.galleryTagLivingSpace")}</span>
                <h4 className="gallery-title">{t("landing.galleryTitleLivingSpace")}</h4>
              </div>
            </div>
            <div className="gallery-item">
              <img src="/img/office.png" alt="Enhanced Photo Quality Study" />
              <div className="gallery-overlay">
                <span className="gallery-tag">{t("landing.galleryTagOffice")}</span>
                <h4 className="gallery-title">{t("landing.galleryTitleOffice")}</h4>
              </div>
            </div>
            <div className="gallery-item">
              <img src="/img/kitchen.png" alt="Kitchen Material Overlay" />
              <div className="gallery-overlay">
                <span className="gallery-tag">{t("landing.galleryTagKitchen")}</span>
                <h4 className="gallery-title">{t("landing.galleryTitleKitchen")}</h4>
              </div>
            </div>
            <div className="gallery-item">
              <img src="/img/img6.jpeg" alt="Staged Lawn Front Yard" />
              <div className="gallery-overlay">
                <span className="gallery-tag">{t("landing.galleryTagFrontYard")}</span>
                <h4 className="gallery-title">{t("landing.galleryTitleFrontYard")}</h4>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4e. VIDEO WALKTHROUGH SECTION */}
      <section className="video-walkthrough-section" id="how-to-use">
        <div className="container">
          <div className="section-header fade-in-up">
            <h2>{t("landing.videoTitle")}</h2>
            <p>{t("landing.videoSub")}</p>
          </div>

          <div className="video-container fade-in-up">
            <div className="video-preview-wrapper" id="video-play-btn" onClick={() => setIsVideoModalOpen(true)}>
              <img src="/img/image.png" alt="SmartSpace AI Video Tutorial Walkthrough" className="video-thumbnail" />
              <div className="video-glow-overlay"></div>

              <button className="play-pulsate-btn" aria-label="Play Walkthrough Video">
                <svg width="24" height="28" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M22.5 11.5359C24.5 12.6906 24.5 15.5772 22.5 16.7319L4.5 27.1242C2.5 28.2789 -1.43385e-06 26.8356 -1.33303e-06 24.5262L-4.23725e-07 3.74158C-3.2374e-07 1.43218 2.5 -0.0111663 4.5 1.14353L22.5 11.5359Z"
                    fill="currentColor"
                  />
                </svg>
              </button>

              <span className="video-duration">{t("landing.videoDurationText")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* VIDEO MODAL LIGHTBOX */}
      {isVideoModalOpen && (
        <div className="video-modal-overlay open" onClick={() => setIsVideoModalOpen(false)}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="video-modal-close" id="video-modal-close" onClick={() => setIsVideoModalOpen(false)} aria-label="Close video player">
              &times;
            </button>
            <div className="video-modal-body">
              <iframe
                id="video-iframe"
                src="https://www.youtube.com/embed/kVDoOivVNQc?si=AYqmEaJ_pU6qfrKt&autoplay=1"
                title="SmartSpace AI Video Guide"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. SOCIAL PROOF / TESTIMONIALS */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header fade-in-up">
            <h2>{t("landing.testimonialsTitle")}</h2>
            <p>{t("landing.testimonialsSub")}</p>
          </div>

          <div className="testimonials-carousel fade-in-up">
            <div
              className="testimonials-slider"
              id="testimonial-slider"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {/* Testimonial 1 */}
              <div className="testimonial-slide">
                <div className="testimonial-content-wrapper">
                  <svg className="quote-icon" width="42" height="42" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14.417 19H17.834L22.958 9V5H14.417V19ZM3.333 19H6.75L11.875 9V5H3.333V19Z" fill="currentColor"/>
                  </svg>
                  <p className="testimonial-quote">
                    {t("landing.testimonial1Quote")}
                  </p>
                  <div className="testimonial-profile">
                    <img
                      src="https://d37vt2dds2nfmk.cloudfront.net/20250825/bdc74339-08e5-4d5c-946a-875f069c7e84.webp"
                      alt={t("landing.testimonial1Author")}
                      className="testimonial-avatar"
                    />
                    <div className="testimonial-meta">
                      <span className="testimonial-name">{t("landing.testimonial1Author")}</span>
                      <span className="testimonial-role">{t("landing.testimonial1Role")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="testimonial-slide">
                <div className="testimonial-content-wrapper">
                  <svg className="quote-icon" width="42" height="42" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14.417 19H17.834L22.958 9V5H14.417V19ZM3.333 19H6.75L11.875 9V5H3.333V19Z" fill="currentColor"/>
                  </svg>
                  <p className="testimonial-quote">
                    {t("landing.testimonial2Quote")}
                  </p>
                  <div className="testimonial-profile">
                    <img
                      src="https://d37vt2dds2nfmk.cloudfront.net/20250825/eb6c55cb-f273-426c-bf60-1ae8c5e28f02.webp"
                      alt={t("landing.testimonial2Author")}
                      className="testimonial-avatar"
                    />
                    <div className="testimonial-meta">
                      <span className="testimonial-name">{t("landing.testimonial2Author")}</span>
                      <span className="testimonial-role">{t("landing.testimonial2Role")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="testimonial-slide">
                <div className="testimonial-content-wrapper">
                  <svg className="quote-icon" width="42" height="42" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14.417 19H17.834L22.958 9V5H14.417V19ZM3.333 19H6.75L11.875 9V5H3.333V19Z" fill="currentColor"/>
                  </svg>
                  <p className="testimonial-quote">
                    {t("landing.testimonial3Quote")}
                  </p>
                  <div className="testimonial-profile">
                    <img
                      src="https://d37vt2dds2nfmk.cloudfront.net/20250825/329fd64a-b004-4d40-9bb2-e98de1b2c324.webp"
                      alt={t("landing.testimonial3Author")}
                      className="testimonial-avatar"
                    />
                    <div className="testimonial-meta">
                      <span className="testimonial-name">{t("landing.testimonial3Author")}</span>
                      <span className="testimonial-role">{t("landing.testimonial3Role")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dot Indicators */}
            <div className="carousel-dots" id="carousel-dots">
              <span className={`dot ${currentSlide === 0 ? "active" : ""}`} onClick={() => setCurrentSlide(0)}></span>
              <span className={`dot ${currentSlide === 1 ? "active" : ""}`} onClick={() => setCurrentSlide(1)}></span>
              <span className={`dot ${currentSlide === 2 ? "active" : ""}`} onClick={() => setCurrentSlide(2)}></span>
            </div>
          </div>
        </div>
      </section>

      {/* 5b. PRICING & PLANS SECTION */}
      <section className="pricing-section" id="pricing">
        <div className="container">
          <div className="section-header fade-in-up">
            <h2>{t("landing.creditsPricingTitle")}</h2>
            <p>{t("landing.creditsPricingSub")}</p>
          </div>

          <div className="pricing-grid fade-in-up">
            {/* Basic Boost */}
            <div className="pricing-card spotlight-card" onMouseMove={handleSpotlightMouseMove}>
              <div className="plan-icon-container" style={{ display: "flex", justifyContent: "center", marginBottom: "16px", color: "var(--accent)" }}>
                <Icon name="token" size={48} />
              </div>
              <span className="plan-name">{t("landing.basicBoostTitle")}</span>
              <p className="plan-desc">{t("landing.basicBoostDesc")}</p>
              <div className="plan-price-container" style={{ margin: "20px 0" }}>
                <span className="plan-price" style={{ fontSize: "40px", fontWeight: "800" }}>500</span>
                <span className="plan-period" style={{ fontSize: "16px", fontWeight: "600", marginLeft: "4px" }}>{t("landing.creditsLabel")}</span>
              </div>
              <div className="plan-bonus" style={{ color: "var(--accent)", fontWeight: "700", marginBottom: "20px", fontSize: "14px" }}>
                {t("landing.basicBoostBonus")}
              </div>

              <Link to="/register" className="btn-pricing magnetic-btn" onMouseMove={handleMagneticMouseMove} onMouseLeave={handleMagneticMouseLeave}>
                {t("landing.buyForPrice", { price: "375.00" })}
              </Link>
            </div>

            {/* Growth Pack */}
            <div className="pricing-card featured spotlight-card" onMouseMove={handleSpotlightMouseMove}>
              <div className="card-glow"></div>
              <span className="plan-badge">{t("landing.bestValueLabel")}</span>
              <div className="plan-icon-container" style={{ display: "flex", justifyContent: "center", marginBottom: "16px", color: "var(--accent)" }}>
                <Icon name="database" size={48} />
              </div>
              <span className="plan-name">{t("landing.growthPackTitle")}</span>
              <p className="plan-desc">{t("landing.growthPackDesc")}</p>
              <div className="plan-price-container" style={{ margin: "20px 0" }}>
                <span className="plan-price" style={{ fontSize: "40px", fontWeight: "800" }}>2,000</span>
                <span className="plan-period" style={{ fontSize: "16px", fontWeight: "600", marginLeft: "4px" }}>{t("landing.creditsLabel")}</span>
              </div>
              <div className="plan-bonus" style={{ color: "var(--accent)", fontWeight: "700", marginBottom: "20px", fontSize: "14px" }}>
                {t("landing.growthPackBonus")}
              </div>

              <Link
                to="/register"
                className="btn-pricing magnetic-btn"
                onMouseMove={handleMagneticMouseMove}
                onMouseLeave={handleMagneticMouseLeave}
              >
                {t("landing.buyForPrice", { price: "1,500.00" })}
              </Link>
            </div>

            {/* Master Volume */}
            <div className="pricing-card spotlight-card" onMouseMove={handleSpotlightMouseMove}>
              <div className="plan-icon-container" style={{ display: "flex", justifyContent: "center", marginBottom: "16px", color: "var(--accent)" }}>
                <Icon name="diamond" size={48} />
              </div>
              <span className="plan-name">{t("landing.masterVolumeTitle")}</span>
              <p className="plan-desc">{t("landing.masterVolumeDesc")}</p>
              <div className="plan-price-container" style={{ margin: "20px 0" }}>
                <span className="plan-price" style={{ fontSize: "40px", fontWeight: "800" }}>5,000</span>
                <span className="plan-period" style={{ fontSize: "16px", fontWeight: "600", marginLeft: "4px" }}>{t("landing.creditsLabel")}</span>
              </div>
              <div className="plan-bonus" style={{ color: "var(--accent)", fontWeight: "700", marginBottom: "20px", fontSize: "14px" }}>
                {t("landing.masterVolumeBonus")}
              </div>
              
              <Link
                to="/register"
                className="btn-pricing magnetic-btn"
                onMouseMove={handleMagneticMouseMove}
                onMouseLeave={handleMagneticMouseLeave}
              >
                {t("landing.buyForPrice", { price: "3,750.00" })}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5c. FREQUENTLY ASKED QUESTIONS (FAQ) SECTION */}
      <section className="faq-section" id="faq">
        <div className="container">
          <h2 className="faq-header fade-in-up">
            {i18n.language.startsWith("ar") ? (
              t("landing.faqTitle")
            ) : (
              <>
                <span className="faq-serif">Frequently</span> Asked Questions
              </>
            )}
          </h2>

          <div className="faq-list fade-in-up">
            {/* FAQ Item 1 */}
            <div className={`faq-item ${activeFaq === 0 ? "active" : ""}`}>
              <div className="faq-trigger" onClick={() => toggleFaq(0)}>
                <span className="faq-question">{t("landing.faqQOffer")}</span>
                <span className="faq-icon">{activeFaq === 0 ? "-" : "+"}</span>
              </div>
              <div className="faq-content">
                <p className="faq-answer">
                  {t("landing.faqAOffer")}
                </p>
              </div>
            </div>

            {/* FAQ Item 2 */}
            <div className={`faq-item ${activeFaq === 1 ? "active" : ""}`}>
              <div className="faq-trigger" onClick={() => toggleFaq(1)}>
                <span className="faq-question">{t("landing.faqQWork")}</span>
                <span className="faq-icon">{activeFaq === 1 ? "-" : "+"}</span>
              </div>
              <div className="faq-content">
                <p className="faq-answer">
                  {t("landing.faqAWork")}
                </p>
              </div>
            </div>

            {/* FAQ Item 3 */}
            <div className={`faq-item ${activeFaq === 2 ? "active" : ""}`}>
              <div className="faq-trigger" onClick={() => toggleFaq(2)}>
                <span className="faq-question">{t("landing.faqQFree")}</span>
                <span className="faq-icon">{activeFaq === 2 ? "-" : "+"}</span>
              </div>
              <div className="faq-content">
                <p className="faq-answer">
                  {t("landing.faqAFree")}
                </p>
              </div>
            </div>

            {/* FAQ Item 4 */}
            <div className={`faq-item ${activeFaq === 3 ? "active" : ""}`}>
              <div className="faq-trigger" onClick={() => toggleFaq(3)}>
                <span className="faq-question">{t("landing.faqQPricing")}</span>
                <span className="faq-icon">{activeFaq === 3 ? "-" : "+"}</span>
              </div>
              <div className="faq-content">
                <p className="faq-answer">
                  {t("landing.faqAPricing")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CONVERSION CTA & FOOTER */}
      <section className="cta-section" id="cta">
        <div className="cta-glow"></div>
        <div className="container fade-in-up">
          <h2>{t("landing.ctaTitle")}</h2>
          <p>
            {t("landing.ctaSub")}
          </p>
          <Link
            to="/register"
            className="btn btn-accent btn-cta magnetic-btn shine-effect"
            onMouseMove={handleMagneticMouseMove}
            onMouseLeave={handleMagneticMouseLeave}
          >
            {t("landing.ctaButton")}
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="container">
          <div className="landing-footer-grid">
            <div className="landing-footer-brand">
              <div className="landing-footer-logo">SmartSpace AI</div>
              <p>
                {t("landing.footerDesc")}
              </p>
            </div>
            <div className="landing-footer-col">
              <h4>{t("landing.footerCompany")}</h4>
              <a href="#">{t("landing.footerAboutUs")}</a>
              <a href="#">{t("landing.footerContactSupport")}</a>
              <a href="#">{t("landing.footerCareers")}</a>
            </div>
            <div className="landing-footer-col">
              <h4>{t("landing.footerLegal")}</h4>
              <a href="#">{t("landing.footerPrivacyPolicy")}</a>
              <a href="#">{t("landing.footerTermsOfService")}</a>
              <a href="#">{t("landing.footerCookiePolicy")}</a>
            </div>
          </div>
          <div className="landing-footer-bottom">
            <span>{t("common.copyright")}</span>
            <div className="landing-footer-icons">
              <span className="landing-footer-icon-btn"><Icon name="public" size={20} /></span>
              <span className="landing-footer-icon-btn"><Icon name="share" size={20} /></span>
              <span className="landing-footer-icon-btn"><Icon name="mail" size={20} /></span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;