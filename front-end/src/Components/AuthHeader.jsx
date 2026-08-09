import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "./Icon";

const AuthHeader = () => {
  const { t, i18n } = useTranslation();

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

  const handleLanguageChange = () => {
    const nextLang = i18n.language?.startsWith("ar") ? "en" : "ar";
    i18n.changeLanguage(nextLang);
    document.documentElement.dir = nextLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = nextLang;
  };

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-white/10 bg-black/40 px-6 py-3.5 backdrop-blur-md md:px-12 transition-colors">
      {/* Brand Logo - Navigates to Home (/) */}
      <Link to="/" className="flex items-center gap-2.5">
        <img
          src="/img/logo-smart.png"
          alt="SmartSpace Logo"
          className="h-12 md:h-14 w-auto object-contain rounded-xl drop-shadow"
        />
      </Link>

      {/* Center Nav Links */}
      <div className="hidden items-center gap-8 md:flex">
        <Link
          className="font-body text-sm font-medium text-white/90 transition-colors hover:text-amber-300"
          to="/credits"
        >
          {t("common.pricing")}
        </Link>
        <Link
          className="font-body text-sm font-medium text-white/90 transition-colors hover:text-amber-300"
          to="/contact"
        >
          {t("common.technicalSupport")}
        </Link>
        <Link
          className="font-body text-sm font-medium text-white/90 transition-colors hover:text-amber-300"
          to="/projects"
        >
          {t("common.gallery")}
        </Link>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Dark Mode / Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20"
          aria-label="Toggle Theme"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <Icon name={theme === "dark" ? "light_mode" : "dark_mode"} size={18} />
        </button>

        {/* Language Switcher Pill (Arabic / English) */}
        <button
          className="flex h-9 items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 text-xs font-semibold text-white transition-all hover:bg-white/20"
          onClick={handleLanguageChange}
          aria-label="Toggle Language"
        >
          <Icon name="language" size={15} className="text-white/80" />
          <span>{i18n.language?.startsWith("ar") ? "English" : "العربية"}</span>
        </button>
        
        {/* Log In Pill */}
        <Link
          className="hidden sm:flex h-9 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-5 text-sm font-medium text-white transition-all hover:bg-white/20"
          to="/login"
        >
          {t("common.logIn")}
        </Link>

        {/* Register Pill */}
        <Link
          className="flex h-9 items-center justify-center rounded-full bg-[#b88653] hover:bg-[#a67443] px-5 text-sm font-semibold text-white shadow-md transition-all"
          to="/register"
        >
          {t("common.register")}
        </Link>
      </div>
    </nav>
  );
};

export default AuthHeader;
