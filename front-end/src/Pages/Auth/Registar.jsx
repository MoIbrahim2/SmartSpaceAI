import { useState, useEffect } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import AuthFooter from "../../Components/AuthFooter";
import AuthHeader from "../../Components/AuthHeader";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import Icon from "../../Components/Icon";

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signup, user, loading: authLoading } = useAuth();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const wasDark = document.documentElement.classList.contains("dark");
    localStorage.setItem("theme", "light");
    document.documentElement.classList.remove("dark");
    return () => {
      if (savedTheme) {
        localStorage.setItem("theme", savedTheme);
      } else {
        localStorage.removeItem("theme");
      }
      if (wasDark) document.documentElement.classList.add("dark");
    };
  }, []);

  if (!authLoading && user) {
    return <Navigate to="/home" replace />;
  }

  const [agree, setAgree] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!agree) {
      setError(t("auth.termsError"));
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(t("auth.passwordsMatchError"));
      return;
    }
    setLoading(true);
    try {
      await signup(form);
      navigate("/home", { replace: true });
    } catch (err) {
      const errors = err.response?.data?.errors;
      const message = err.response?.data?.message;
      if (Array.isArray(errors) && errors.length) {
        const first = errors[0];
        if (typeof first === "string") {
          setError(first);
        } else if (first?.message) {
          // setError(message);
          setError(first.message);
        } else if (message) {
          setError(message);
        } else {
          setError(t("auth.regFailed"));
        }
      } else if (message) {
        setError(message);
      } else {
        setError(err.message || t("auth.regFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden selection:bg-primary selection:text-white">
      <AuthHeader />
      <main className="flex min-h-screen w-full flex-col pt-20 md:flex-row">
        <section className="relative flex min-h-[300px] w-full items-center justify-center overflow-hidden md:w-1/2 md:min-h-[calc(100vh-5rem)] md:h-auto">
          <div
            className="absolute inset-0 z-0 scale-105 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAECV86QIDbLqCj-StzHK5q__v117f5ZgBsJ4uhI4u6On-yr5QvLPhY52-wbXn4gveHo4K-UY6Gi8gh4yUjPDJYKAHabrGeU1OVW0dX6PFBwCxCLlqDy7ciP_OO5iDLnZsQ24V3Nk7p4o59o799Swytsdd8pGXnimbumr9HGMpDyqo5ENaJG0piSHp0dSGQfNyILR6cnSryRDJmcsOkh3rJNjj3insrpjFaycxbVK0quAl2VqA7d8Jt')",
            }}
          >
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
          </div>
          <div className="relative z-10 px-6 text-center py-20">
            <h1 className="text-4xl font-headline font-extrabold tracking-tight text-white drop-shadow-2xl md:text-6xl">
              {t("common.logoMain")}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-lg font-medium text-white/90 drop-shadow-lg">
              {t("landing.heroLead")}
            </p>
          </div>
        </section>

        <section className="flex w-full flex-col items-center justify-center bg-surface p-8 md:w-1/2 md:p-16 lg:p-24">
          <div className="w-full max-w-md">
            <header className="mb-10 pb-2 text-center md:text-left rtl:md:text-right">
              <h2 className="text-3xl font-headline font-semibold text-on-surface">{t("auth.createAccount")}</h2>
              <p className="mt-2 font-medium text-on-surface-variant">
                {t("auth.joinVisionaries")}
              </p>
            </header>

            {error && (
              <div className="mb-6 rounded-xl bg-error/10 px-5 py-3 text-sm font-medium text-error">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="px-2 text-sm font-semibold text-on-surface-variant" htmlFor="reg-firstname">{t("auth.firstName")}</label>
                  <input
                    className="h-12 w-full rounded-full border-none bg-surface px-5 text-on-surface outline-none transition-all placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 neo-inset"
                    placeholder="John"
                    type="text"
                    autoComplete="given-name"
                    name="firstName"
                    id="reg-firstname"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="px-2 text-sm font-semibold text-on-surface-variant" htmlFor="reg-lastname">{t("auth.lastName")}</label>
                  <input
                    className="h-12 w-full rounded-full border-none bg-surface px-5 text-on-surface outline-none transition-all placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 neo-inset"
                    placeholder="Doe"
                    type="text"
                    autoComplete="family-name"
                    name="lastName"
                    id="reg-lastname"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="px-2 text-sm font-semibold text-on-surface-variant" htmlFor="reg-email">{t("auth.emailAddress")}</label>
                <div className="relative flex items-center">
                  <Icon name="mail" className="absolute left-5 rtl:left-auto rtl:right-5 text-outline" />
                  <input
                    className="h-12 w-full rounded-full border-none bg-surface pl-14 pr-5 rtl:pl-5 rtl:pr-14 text-on-surface outline-none transition-all placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 neo-inset"
                    placeholder="john.doe@example.com"
                    type="email"
                    autoComplete="email"
                    name="email"
                    id="reg-email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="px-2 text-sm font-semibold text-on-surface-variant" htmlFor="reg-dob">{t("auth.dateOfBirth")}</label>
                <div className="relative flex items-center">
                  <Icon name="calendar_today" className="absolute left-5 rtl:left-auto rtl:right-5 text-outline" />
                  <input
                    className="h-12 w-full rounded-full border-none bg-surface pl-14 pr-5 rtl:pl-5 rtl:pr-14 text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary/20 neo-inset"
                    type="date"
                    autoComplete="bday"
                    name="dateOfBirth"
                    id="reg-dob"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="px-2 text-sm font-semibold text-on-surface-variant" htmlFor="reg-password">{t("auth.password")}</label>
                <div className="relative flex items-center">
                  <Icon name="lock" className="absolute left-5 rtl:left-auto rtl:right-5 text-outline" />
                  <input
                    className="h-12 w-full rounded-full border-none bg-surface pl-14 pr-5 rtl:pl-5 rtl:pr-14 text-on-surface outline-none transition-all placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 neo-inset"
                    placeholder="••••••••"
                    type="password"
                    autoComplete="new-password"
                    name="password"
                    id="reg-password"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <p className="px-2 text-xs text-on-surface-variant/70">
                  {t("auth.passwordHint", { defaultValue: "Must be at least 8 characters, include an uppercase, a lowercase, a number, and a special character." })}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="px-2 text-sm font-semibold text-on-surface-variant" htmlFor="reg-confirm">{t("auth.confirmPassword")}</label>
                <div className="relative flex items-center">
                  <Icon name="shield" className="absolute left-5 rtl:left-auto rtl:right-5 text-outline" />
                  <input
                    className="h-12 w-full rounded-full border-none bg-surface pl-14 pr-5 rtl:pl-5 rtl:pr-14 text-on-surface outline-none transition-all placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 neo-inset"
                    placeholder="••••••••"
                    type="password"
                    autoComplete="new-password"
                    name="confirmPassword"
                    id="reg-confirm"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 px-2">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={agree}
                  onChange={() => setAgree((value) => !value)}
                />
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-surface neo-inset peer-checked:bg-primary/10">
                  {agree && <Icon name="check" className="font-bold text-primary" />}
                </div>
                <span className="text-sm font-medium text-on-surface-variant">
                  {t("auth.agreeToTerms")}
                </span>
              </label>

              <button
                className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-surface text-lg font-bold text-primary transition-all neo-raised neo-button-active disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? t("auth.creatingAccount") : t("auth.createAccount")}
                {!loading && <Icon name="arrow_forward" className="rtl:rotate-180" />}
              </button>
            </form>

            <footer className="mt-10 text-center">
              <p className="text-sm font-medium text-on-surface-variant">
                {t("auth.alreadyHaveAccount")}
                <Link className="ml-1 rtl:mr-1 font-bold text-primary transition-all hover:underline" to="/login">
                  {t("common.logIn")}
                </Link>
              </p>
            </footer>
          </div>

          <div className="mt-12 flex w-full max-w-md items-center gap-4">
            <div className="h-[2px] flex-1 bg-surface-container neo-inset" />
            <span className="px-2 text-xs font-semibold uppercase tracking-wider text-outline">
              {t("auth.orContinueWith")}
            </span>
            <div className="h-[2px] flex-1 bg-surface-container neo-inset" />
          </div>

          <div className="mt-8 grid w-full max-w-md grid-cols-2 gap-6">
            <button className="flex h-12 items-center justify-center gap-3 rounded-full bg-surface transition-all neo-raised neo-button-active" type="button">
              <img
                alt="Google"
                className="h-5 w-5"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0iZ08QqXPT_57FQNabTR52r9m5yVAETYLB0RtwDtn6V6O1HcmkLmfwO33RTfR-ww1icUtLBpIUp6o-E1JHGGxVKtEmLgIwq18Zj27ymfSVyR9O85cCyGEwARHECx0x75vRCW59e0Pw3JpQwxKgLJ9ti5Vi2Rg6bIZbtQBLg6Atifa25EcViRpkabbM-6dFmhapwDhA1it1g_4Lyjz0hjZkniz8xj1cE-PWyenL_vWOzZPZirWRy9y"
              />
              <span className="text-sm font-semibold text-on-surface">{t("auth.google")}</span>
            </button>
            <button className="flex h-12 items-center justify-center gap-3 rounded-full bg-surface transition-all neo-raised neo-button-active" type="button">
              <Icon name="apps" className="text-on-surface" />
              <span className="text-sm font-semibold text-on-surface">{t("auth.apple")}</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Register;
