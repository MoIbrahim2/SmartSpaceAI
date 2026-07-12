import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const StudioHeader = () => {
  const location = useLocation();
  const activeApartments =
    location.pathname === "/projects" ||
    location.pathname === "/apartments" ||
    location.pathname === "/rooms";

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

  return (
    <header className="sticky top-0 z-50 mb-4 bg-surface-bright px-6 py-4 neo-shadow md:px-20">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-lg bg-primary p-2 text-white neo-shadow">
            <svg className="size-6 text-white" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M42.1739 20.1739L27.8261 5.82609C29.1366 7.13663 28.3989 10.1876 26.2002 13.7654C24.8538 15.9564 22.9595 18.3449 20.6522 20.6522C18.3449 22.9595 15.9564 24.8538 13.7654 26.2002C10.1876 28.3989 7.13663 29.1366 5.82609 27.8261L20.1739 42.1739C21.4845 43.4845 24.5355 42.7467 28.1133 40.548C30.3042 39.2016 32.6927 37.3073 35 35C37.3073 32.6927 39.2016 30.3042 40.548 28.1133C42.7467 24.5355 43.4845 21.4845 42.1739 20.1739Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-on-surface">SmartSpace AI</h1>
        </div>
        <div className="flex items-center gap-6 md:gap-8">
          <nav className="hidden md:block space-x-6">
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
          </nav>
          <div className="flex items-center gap-4">
            <button
              className="size-10 rounded-xl bg-surface-bright text-on-surface-variant transition-all hover:text-primary neo-shadow neo-button"
              onClick={toggleTheme}
              aria-label="Toggle Theme"
            >
              <span className="material-symbols-outlined">
                {theme === "dark" ? "light_mode" : "dark_mode"}
              </span>
            </button>
            <button className="size-10 rounded-xl bg-surface-bright text-on-surface-variant transition-all hover:text-primary neo-shadow neo-button" aria-label="Notifications">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="group relative">
              <button className="size-10 overflow-hidden rounded-full border-2 border-primary neo-shadow ring-primary ring-offset-2 transition-all focus:ring-2" aria-label="User menu" aria-haspopup="true">
                <img
                  className="h-full w-full object-cover"
                  alt="Your profile"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWWSNhPQ34wQABjCdspvcZnNmcvFYYZFLVCui4pyawXxoMH43OagI3hAIFU94KgIeYetgPa9WxV6QgTem1Sgj3cygJxV70o7W45__n3pZkT36Ihkk8NwShurbP0yhlf6hfP_YqmNQ5xx0rSolIiHhSwb8oVY_aX6EijEfwteZI6A25hRYTFK7214gbyVmcDFbgUHIatb62UM4cvVJfS6q8GUA9IYUJqlYJdndJ8HWUi38CajvOgUSG"
                />
              </button>
                         <div className="absolute right-0 z-50 mt-4 hidden w-56 rounded-2xl bg-background p-3 group-hover:block neomorph-raised">
              <Link
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-on-surface transition-all hover:text-primary hover:neomorph-inset"
                to="/profile"
              >
                <span className="material-symbols-outlined text-[20px]">settings</span>
                Settings
              </Link>
              <Link
                className="mt-2 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-error transition-all hover:neomorph-inset"
                to="/login"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                Logout
              </Link>
            </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default StudioHeader;
