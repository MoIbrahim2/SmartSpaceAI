import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "./Icon";

const AuthHeader = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const isRegisterPage = location.pathname === "/register";

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
    <header className="fixed left-0 right-0 top-0 z-50 flex h-14 sm:h-16 items-center justify-between border-b border-white/10 bg-black/50 px-3 sm:px-6 md:px-12 backdrop-blur-md transition-all">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-2 shrink-0 group">
        <img
          src="/img/logo-smart.png"
          alt="SmartSpace Logo"
          className="h-9 sm:h-11 md:h-12 w-auto object-contain rounded-xl drop-shadow transition-transform group-hover:scale-105"
        />
      </Link>

      {/* Center Nav Links - hidden on < lg to prevent collisions on tablets */}
      <nav className="hidden items-center gap-6 xl:gap-8 lg:flex">
        <Link
          className="font-body text-sm font-medium text-white/85 transition-colors hover:text-amber-300"
          to="/credits"
        >
          {t("common.pricing")}
        </Link>
        <Link
          className="font-body text-sm font-medium text-white/85 transition-colors hover:text-amber-300"
          to="/contact"
        >
          {t("common.technicalSupport")}
        </Link>
        <Link
          className="font-body text-sm font-medium text-white/85 transition-colors hover:text-amber-300"
          to="/projects"
        >
          {t("common.gallery")}
        </Link>
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Dark Mode / Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
          aria-label="Toggle Theme"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <Icon name={theme === "dark" ? "light_mode" : "dark_mode"} size={15} />
        </button>

        {/* Language Switcher Pill (Arabic / English) */}
        <button
          className="flex h-8 sm:h-9 shrink-0 items-center gap-1 sm:gap-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-2 sm:px-3.5 text-xs font-bold text-white transition-all hover:bg-white/20 active:scale-95"
          onClick={handleLanguageChange}
          aria-label="Toggle Language"
        >
          <Icon name="language" size={13} className="text-white/80 shrink-0" />
          <span className="sm:hidden">{i18n.language?.startsWith("ar") ? "EN" : "ع"}</span>
          <span className="hidden sm:inline whitespace-nowrap">{i18n.language?.startsWith("ar") ? "English" : "العربية"}</span>
        </button>

        {/* Contextual Action Link */}
        {isLoginPage ? (
          <Link
            className="flex h-8 sm:h-9 shrink-0 items-center justify-center rounded-full bg-[#a67443] hover:bg-[#946334] px-2.5 sm:px-4 text-[11px] sm:text-xs md:text-sm font-bold text-white shadow-md transition-all whitespace-nowrap active:scale-95"
            to="/register"
          >
            {t("common.register") || "Register"}
          </Link>
        ) : isRegisterPage ? (
          <Link
            className="flex h-8 sm:h-9 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/15 hover:bg-white/25 px-2.5 sm:px-4 text-[11px] sm:text-xs md:text-sm font-bold text-white shadow-md backdrop-blur-md transition-all whitespace-nowrap active:scale-95"
            to="/login"
          >
            {t("common.logIn") || "Log In"}
          </Link>
        ) : (
          <>
            <Link
              className="hidden sm:flex h-8 sm:h-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-3.5 text-xs sm:text-sm font-medium text-white transition-all hover:bg-white/20 whitespace-nowrap"
              to="/login"
            >
              {t("common.logIn") || "Log In"}
            </Link>
            <Link
              className="flex h-8 sm:h-9 shrink-0 items-center justify-center rounded-full bg-[#a67443] hover:bg-[#946334] px-2.5 sm:px-4 text-[11px] sm:text-xs md:text-sm font-bold text-white shadow-md transition-all whitespace-nowrap active:scale-95"
              to="/register"
            >
              {t("common.register") || "Register"}
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default AuthHeader;
