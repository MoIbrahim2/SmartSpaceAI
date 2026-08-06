import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTranslation } from "react-i18next";
import Icon from "./Icon";

const StudioHeader = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cartCount, toggleDrawer } = useCart();
  const activeApartments =
    location.pathname === "/projects" ||
    location.pathname === "/apartments" ||
    location.pathname === "/rooms";

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

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const userInitials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"
    : "U";

  return (
    <header className="sticky top-0 z-50 mb-4 bg-surface-bright px-6 py-4 neo-shadow md:px-20">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/home")}>
          <div className="flex items-center justify-center rounded-lg bg-primary p-2 text-white neo-shadow">
            <svg className="size-6 text-white" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M42.1739 20.1739L27.8261 5.82609C29.1366 7.13663 28.3989 10.1876 26.2002 13.7654C24.8538 15.9564 22.9595 18.3449 20.6522 20.6522C18.3449 22.9595 15.9564 24.8538 13.7654 26.2002C10.1876 28.3989 7.13663 29.1366 5.82609 27.8261L20.1739 42.1739C21.4845 43.4845 24.5355 42.7467 28.1133 40.548C30.3042 39.2016 32.6927 37.3073 35 35C37.3073 32.6927 39.2016 30.3042 40.548 28.1133C42.7467 24.5355 43.4845 21.4845 42.1739 20.1739Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-on-surface">SmartSpace</h1>
        </div>
        <div className="flex items-center gap-6 md:gap-8">
          <nav className="hidden md:flex items-center space-x-6 rtl:space-x-reverse">
            <Link
              className={`pb-1 font-semibold transition-colors ${
                activeApartments
                  ? "border-b-2 border-primary text-primary"
                  : "text-on-surface-variant hover:text-primary"
              }`}
              to="/projects"
            >
              Apartments
            </Link>
            <Link
              className={`pb-1 font-semibold transition-colors ${
                location.pathname === "/orders"
                  ? "border-b-2 border-primary text-primary"
                  : "text-on-surface-variant hover:text-primary"
              }`}
              to="/orders"
            >
              My Orders
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <button
              className="px-3 h-10 rounded-xl bg-surface-bright text-on-surface-variant font-bold text-sm transition-all hover:text-primary neo-shadow neo-button flex items-center justify-center"
              onClick={() => i18n.changeLanguage(i18n.language.startsWith("ar") ? "en" : "ar")}
              aria-label="Toggle Language"
            >
              {i18n.language.startsWith("ar") ? "EN" : "العربية"}
            </button>
            <button
              className="size-10 rounded-xl bg-surface-bright text-on-surface-variant transition-all hover:text-primary neo-shadow neo-button"
              onClick={toggleTheme}
              aria-label="Toggle Theme"
            >
              <Icon name={theme === "dark" ? "light_mode" : "dark_mode"} />
            </button>
            <button
              onClick={toggleDrawer}
              className="relative size-10 rounded-xl bg-surface-bright text-on-surface-variant transition-all hover:text-primary neo-shadow neo-button flex items-center justify-center"
              aria-label="Shopping Cart"
            >
              <Icon name="shopping_cart" size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-black text-white shadow-md animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="size-10 overflow-hidden rounded-full border-2 border-primary neo-shadow ring-primary ring-offset-2 transition-all focus:ring-2"
                aria-label="User menu"
                aria-haspopup="true"
                aria-expanded={menuOpen}
              >
                {user?.profileImage ? (
                  <img
                    className="h-full w-full object-cover"
                    alt="Your profile"
                    src={user.profileImage}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary font-bold text-white text-sm">
                    {userInitials}
                  </div>
                )}
              </button>
              {menuOpen && (
                <div
                  className={`absolute z-50 mt-4 w-56 rounded-2xl bg-background p-3 neomorph-raised ${
                    i18n.language.startsWith("ar") ? "left-0" : "right-0"
                  }`}
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <div className="mb-2 px-4 py-2 text-sm font-medium text-on-surface border-b border-outline/20">
                    {user?.firstName} {user?.lastName}
                    <br />
                    <span className="text-xs text-on-surface-variant">{user?.email}</span>
                  </div>
                  <Link
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-on-surface transition-all hover:text-primary hover:neomorph-inset"
                    to="/orders"
                  >
                    <Icon name="local_shipping" size={20} />
                    My Orders
                  </Link>
                  <Link
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-on-surface transition-all hover:text-primary hover:neomorph-inset"
                    to="/seller/dashboard"
                  >
                    <Icon name="domain" size={20} />
                    Seller Dashboard
                  </Link>
                  <Link
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-on-surface transition-all hover:text-primary hover:neomorph-inset"
                    to="/profile"
                  >
                    <Icon name="settings" size={20} />
                    {t("common.settings")}
                  </Link>
                  <Link
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-on-surface transition-all hover:text-primary hover:neomorph-inset"
                    to="/change-password"
                  >
                    <Icon name="lock" size={20} />
                    {t("auth.changePassword", "Change Password")}
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setMenuOpen(false); }}
                    className="mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-error transition-all hover:neomorph-inset"
                  >
                    <Icon name="logout" size={20} />
                    {t("common.logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default StudioHeader;
