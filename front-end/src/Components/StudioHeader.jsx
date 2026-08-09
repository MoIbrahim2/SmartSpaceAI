import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import Icon from "./Icon";

const StudioHeader = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const activeApartments =
    location.pathname.startsWith("/home") ||
    location.pathname.startsWith("/apartments") ||
    location.pathname.startsWith("/projects");

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

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const userInitials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"
    : "U";

  return (
    <header className="sticky top-0 z-50 border-b border-outline/15 dark:border-white/10 bg-surface/90 dark:bg-[#0a0908]/90 px-6 py-4 backdrop-blur-md md:px-12 shadow-sm transition-colors text-on-surface dark:text-white font-body">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
        {/* Brand Logo - Navigates to /home */}
        <div className="cursor-pointer flex items-center" onClick={() => navigate("/home")}>
          <img src="/img/logo-smart.png" alt="SmartSpace Logo" className="h-12 md:h-14 w-auto object-contain rounded-xl drop-shadow" />
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-6 md:gap-8">
          <nav className="hidden md:flex items-center space-x-7 rtl:space-x-reverse">
            <Link
              className={`pb-1 text-base font-bold transition-colors ${
                activeApartments
                  ? "border-b-2 border-[#a67443] dark:border-amber-400 text-[#a67443] dark:text-amber-400"
                  : "text-on-surface-variant dark:text-white/80 hover:text-[#a67443] dark:hover:text-amber-400"
              }`}
              to="/projects"
            >
              {t("common.apartments") || "Apartments"}
            </Link>
            <Link
              className={`pb-1 text-base font-bold transition-colors ${
                location.pathname === "/orders"
                  ? "border-b-2 border-[#a67443] dark:border-amber-400 text-[#a67443] dark:text-amber-400"
                  : "text-on-surface-variant dark:text-white/80 hover:text-[#a67443] dark:hover:text-amber-400"
              }`}
              to="/orders"
            >
              {t("common.myOrders") || "My Orders"}
            </Link>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-3.5">
            {/* Language Switcher Pill */}
            <button
              className="flex h-10 items-center gap-2 rounded-full border border-outline/20 dark:border-white/20 bg-background dark:bg-white/10 px-4.5 text-sm font-bold text-on-surface dark:text-white transition-all hover:bg-surface-variant dark:hover:bg-white/20 shadow-sm"
              onClick={handleLanguageChange}
              aria-label="Toggle Language"
            >
              <Icon name="language" size={17} className="text-on-surface-variant dark:text-white/80" />
              <span>{i18n.language?.startsWith("ar") ? "EN" : "العربية"}</span>
            </button>

            {/* Dark Mode / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-outline/20 dark:border-white/20 bg-background dark:bg-white/10 text-on-surface dark:text-white transition-all hover:bg-surface-variant dark:hover:bg-white/20 shadow-sm"
              aria-label="Toggle Theme"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              <Icon name={theme === "dark" ? "light_mode" : "dark_mode"} size={20} />
            </button>

            {/* Cart Button */}
            <button
              onClick={() => navigate("/cart")}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-outline/20 dark:border-white/20 bg-background dark:bg-white/10 text-on-surface dark:text-white transition-all hover:bg-surface-variant dark:hover:bg-white/20 shadow-sm"
              aria-label="Shopping Cart"
              title="Cart"
            >
              <Icon name="shopping_cart" size={20} />
            </button>

            {/* User Profile Menu */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#a67443] hover:bg-[#946334] text-white font-extrabold text-sm shadow-md transition-all active:scale-[0.98]"
                  aria-label="User Profile Menu"
                >
                  {userInitials}
                </button>

                {menuOpen && (
                  <div 
                    className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-56 rounded-2xl bg-surface dark:bg-[#181614] border border-outline/15 dark:border-white/15 p-2 shadow-xl z-50 text-on-surface dark:text-white animate-in fade-in zoom-in-95 duration-150"
                    onClick={() => setMenuOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-outline/10 dark:border-white/10 mb-1">
                      <p className="text-sm font-bold truncate">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-on-surface-variant dark:text-white/60 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium hover:bg-surface-variant dark:hover:bg-white/10 transition-colors"
                    >
                      <Icon name="person" size={18} />
                      <span>{t("common.myProfile") || "My Profile"}</span>
                    </Link>
                    <Link
                      to="/orders"
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium hover:bg-surface-variant dark:hover:bg-white/10 transition-colors md:hidden"
                    >
                      <Icon name="receipt" size={18} />
                      <span>{t("common.myOrders") || "My Orders"}</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Icon name="logout" size={18} />
                      <span>{t("common.logout") || "Logout"}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default StudioHeader;
