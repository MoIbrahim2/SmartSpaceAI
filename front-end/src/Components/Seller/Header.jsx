import { useState, useEffect } from "react";
import { Search, Bell, Sun, Moon, Menu, LogOut, Home, Globe } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";

export default function Header({ onMenuToggle }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

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

  const toggleLanguage = () => {
    const currentLang = i18n.language || "en";
    const nextLang = currentLang.startsWith("ar") ? "en" : "ar";
    i18n.changeLanguage(nextLang);
  };

  const handleLogout = async () => {
    if (logout) await logout();
    navigate("/login");
  };

  const userInitials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || user.email?.[0]?.toUpperCase() || "S"
    : "S";

  const isArabic = i18n.language?.startsWith("ar");

  return (
    <header className="sticky top-0 z-30 mb-6 bg-surface-bright px-6 py-4 neo-shadow">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Search */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl text-on-surface-variant hover:text-primary transition-all neo-shadow neo-button"
            aria-label="Toggle Navigation"
          >
            <Menu className="size-5" />
          </button>

          <div className="relative flex-1">
            <Search className="absolute left-3.5 rtl:right-3.5 rtl:left-auto top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
            <input
              type="text"
              placeholder={t("seller.header.searchPlaceholder")}
              className="w-full rounded-xl bg-surface pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:ring-2 focus:ring-primary/40 transition-all border border-outline/20"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-bright text-on-surface-variant hover:text-primary font-medium text-xs transition-all neo-shadow neo-button"
            aria-label="Toggle Language"
          >
            <Globe className="size-4" />
            <span>{isArabic ? "English" : "العربية"}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-surface-bright text-on-surface-variant hover:text-primary transition-all neo-shadow neo-button"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>

          {/* Notifications */}
          <button
            className="relative p-2.5 rounded-xl bg-surface-bright text-on-surface-variant hover:text-primary transition-all neo-shadow neo-button"
            aria-label="Notifications"
          >
            <Bell className="size-5" />
            <span className="absolute top-1.5 right-1.5 rtl:left-1.5 rtl:right-auto size-2 rounded-full bg-primary ring-2 ring-surface-bright" />
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full p-1 border-2 border-primary neo-shadow focus:ring-2 focus:ring-primary/40 transition-all"
            >
              <div className="size-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                {userInitials}
              </div>
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 rtl:left-0 rtl:right-auto mt-3 w-56 rounded-2xl bg-surface-bright p-3 neo-shadow border border-outline/20 z-50"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <div className="px-3 py-2 border-b border-outline/10 mb-2">
                  <p className="font-semibold text-sm text-on-surface">
                    {user?.firstName ? `${user.firstName} ${user.lastName}` : t("seller.header.sellerNameFallback")}
                  </p>
                  <p className="text-xs text-on-surface-variant">{t("seller.header.accountType")}</p>
                </div>
                <Link
                  to="/home"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-on-surface hover:text-primary hover:bg-surface rounded-xl transition-all"
                >
                  <Home className="size-4" />
                  {t("seller.header.customerPortal")}
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-error hover:bg-error/10 rounded-xl transition-all mt-1"
                >
                  <LogOut className="size-4" />
                  {t("seller.header.signOut")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
