import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import AuthHeader from "../../Components/AuthHeader";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import Icon from "../../Components/Icon";
import { BASE_URL } from "../../api";

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signup, user, loading: authLoading } = useAuth();

  const handleGoogleLogin = () => {
    window.location.href = `${BASE_URL}/auth/google`;
  };

  if (!authLoading && user) {
    return <Navigate to="/home" replace />;
  }

  const [agree, setAgree] = useState(false);
  const [role, setRole] = useState("USER");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    phone: "",
    address: "",
    taxId: "",
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
      await signup({ ...form, role });
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`, {
        replace: true,
      });
    } catch (err) {
      const errors = err.response?.data?.errors;
      const message = err.response?.data?.message;
      if (Array.isArray(errors) && errors.length) {
        const first = errors[0];
        if (typeof first === "string") {
          setError(first);
        } else if (first?.message) {
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
    <div className="relative flex min-h-screen w-full flex-col justify-between overflow-x-hidden text-[#1c1917] selection:bg-[#a67443] selection:text-white font-body">
      {/* High-Resolution Interior Design Background with Balanced Medium Lighting Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-500"
        style={{ backgroundImage: `url('/img/office.png')` }}
      >
        <div className="absolute inset-0 bg-black/25 bg-gradient-to-r from-black/55 via-black/20 to-black/35 rtl:bg-gradient-to-l backdrop-blur-[0.5px]" />
      </div>

      {/* Navigation Header */}
      <AuthHeader />

      {/* Main Content Layout */}
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 pt-24 pb-8 md:px-12 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
        {/* Left Side: Headline, Description & 3 Feature Badges */}
        <div className="mb-8 max-w-xl text-white lg:mb-0 lg:w-1/2">
          {/* Badge Pill */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/15 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300 backdrop-blur-md">
            <Icon name="auto_awesome" size={14} className="text-amber-300" />
            <span>{t("landing.aiPoweredBadge")}</span>
          </div>

          <h1 className="text-3xl font-headline font-extrabold tracking-tight text-white drop-shadow-md md:text-5xl lg:text-6xl leading-[1.15]">
            {t("landing.welcomeTo")} <br />
            <span className="text-white">Smart</span>
            <span className="text-[#cda37f]">Space AI</span>
          </h1>

          <p className="mt-4 max-w-md text-sm font-medium text-white/85 drop-shadow md:text-base leading-relaxed">
            {t("landing.heroLead")}
          </p>

          {/* 3 Feature Badges */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Feature 1 */}
            <div className="flex flex-col items-start gap-1.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white backdrop-blur-md shadow-sm">
                <Icon name="auto_awesome" size={20} />
              </div>
              <h4 className="text-xs font-bold text-white">
                {t("landing.aiPoweredTitle")}
              </h4>
              <p className="text-xs font-medium text-white/70 leading-normal max-w-[130px]">
                {t("landing.aiPoweredDesc")}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-start gap-1.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white backdrop-blur-md shadow-sm">
                <Icon name="view_in_ar" size={20} />
              </div>
              <h4 className="text-xs font-bold text-white">
                {t("landing.tabVirtualStaging")}
              </h4>
              <p className="text-xs font-medium text-white/70 leading-normal max-w-[130px]">
                {t("landing.virtualStagingDesc")}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-start gap-1.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white backdrop-blur-md shadow-sm">
                <Icon name="bolt" size={20} />
              </div>
              <h4 className="text-xs font-bold text-white">
                {t("landing.oneClickTitle")}
              </h4>
              <p className="text-xs font-medium text-white/70 leading-normal max-w-[130px]">
                {t("landing.oneClickDesc")}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Clean, Modern & Balanced Signup Card */}
        <div className="w-full max-w-[460px] lg:w-1/2 lg:ml-auto rtl:lg:mr-auto rtl:lg:ml-0">
          <div className="w-full rounded-3xl bg-[#f5f0ea] dark:bg-[#181614] p-7 sm:p-8 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.5)] border border-white/40 dark:border-white/10 text-[#1c1917] dark:text-white transition-all">
            <header className="mb-6 text-left rtl:text-right">
              <h2 className="text-2xl font-headline font-bold text-[#1c1917] dark:text-white tracking-tight">
                {t("auth.createAccount")}
              </h2>
              <p className="mt-1 text-xs font-medium text-[#78716c] dark:text-white/70">
                {t("auth.joinVisionaries")}
              </p>
            </header>

            {error && (
              <div className="mb-5 rounded-xl bg-red-500/15 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:text-red-300 border border-red-500/30">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* First Name & Last Name */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label
                    className="px-1 text-xs font-extrabold text-[#44403c] dark:text-white/90 uppercase tracking-wider"
                    htmlFor="reg-firstname"
                  >
                    {t("auth.firstName")}
                  </label>
                  <input
                    className="h-12 w-full rounded-xl border border-transparent bg-[#eae3d9] dark:bg-white/10 px-4 text-sm font-medium text-[#1c1917] dark:text-white placeholder:text-[#a8a29e] dark:placeholder:text-white/40 outline-none transition-all focus:border-[#a67443] dark:focus:border-amber-400 focus:bg-white dark:focus:bg-white/15"
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
                <div className="flex flex-col gap-1.5">
                  <label
                    className="px-1 text-xs font-extrabold text-[#44403c] dark:text-white/90 uppercase tracking-wider"
                    htmlFor="reg-lastname"
                  >
                    {t("auth.lastName")}
                  </label>
                  <input
                    className="h-12 w-full rounded-xl border border-transparent bg-[#eae3d9] dark:bg-white/10 px-4 text-sm font-medium text-[#1c1917] dark:text-white placeholder:text-[#a8a29e] dark:placeholder:text-white/40 outline-none transition-all focus:border-[#a67443] dark:focus:border-amber-400 focus:bg-white dark:focus:bg-white/15"
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

              {/* Email Address */}
              <div className="flex flex-col gap-1.5">
                <label
                  className="px-1 text-xs font-extrabold text-[#44403c] dark:text-white/90 uppercase tracking-wider"
                  htmlFor="reg-email"
                >
                  {t("auth.emailAddress")}
                </label>
                <div className="group relative flex items-center">
                  <Icon
                    name="mail"
                    className="absolute left-3.5 rtl:left-auto rtl:right-3.5 text-[#78716c] dark:text-white/50 transition-colors group-focus-within:text-[#a67443] dark:group-focus-within:text-amber-400"
                    size={18}
                  />
                  <input
                    className="h-12 w-full rounded-xl border border-transparent bg-[#eae3d9] dark:bg-white/10 pl-10 pr-4 rtl:pl-4 rtl:pr-10 text-sm font-medium text-[#1c1917] dark:text-white placeholder:text-[#a8a29e] dark:placeholder:text-white/40 outline-none transition-all focus:border-[#a67443] dark:focus:border-amber-400 focus:bg-white dark:focus:bg-white/15"
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

              {/* Date of Birth */}
              <div className="flex flex-col gap-1.5">
                <label
                  className="px-1 text-xs font-extrabold text-[#44403c] dark:text-white/90 uppercase tracking-wider"
                  htmlFor="reg-dob"
                >
                  {t("auth.dateOfBirth")}
                </label>
                <div className="group relative flex items-center">
                  <Icon
                    name="calendar_today"
                    className="absolute left-3.5 rtl:left-auto rtl:right-3.5 text-[#78716c] dark:text-white/50 transition-colors group-focus-within:text-[#a67443] dark:group-focus-within:text-amber-400"
                    size={18}
                  />
                  <input
                    className="h-12 w-full rounded-xl border border-transparent bg-[#eae3d9] dark:bg-white/10 pl-10 pr-4 rtl:pl-4 rtl:pr-10 text-sm font-medium text-[#1c1917] dark:text-white outline-none transition-all focus:border-[#a67443] dark:focus:border-amber-400 focus:bg-white dark:focus:bg-white/15"
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

              {/* Vendor Specific Credentials */}
              {role === "SELLER" && (
                <div className="space-y-4 pt-3 pb-1 border-t border-[#d6d3d1] dark:border-white/15">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-[#a67443] dark:text-amber-400">
                    <Icon name="storefront" size={16} />
                    <span>Vendor Business Credentials</span>
                  </div>

                  {/* Business / Store Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="px-1 text-xs font-extrabold text-[#44403c] dark:text-white/90 uppercase tracking-wider">
                      Business / Store Name
                    </label>
                    <input
                      className="h-12 w-full rounded-xl border border-transparent bg-[#eae3d9] dark:bg-white/10 px-4 text-sm font-medium text-[#1c1917] dark:text-white placeholder:text-[#a8a29e] dark:placeholder:text-white/40 outline-none transition-all focus:border-[#a67443] dark:focus:border-amber-400 focus:bg-white dark:focus:bg-white/15"
                      placeholder="e.g. Modern Cairo Furniture"
                      type="text"
                      name="businessName"
                      value={form.businessName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Contact Phone & Tax ID */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="px-1 text-xs font-extrabold text-[#44403c] dark:text-white/90 uppercase tracking-wider">
                        Contact Phone
                      </label>
                      <input
                        className="h-12 w-full rounded-xl border border-transparent bg-[#eae3d9] dark:bg-white/10 px-4 text-sm font-medium text-[#1c1917] dark:text-white placeholder:text-[#a8a29e] dark:placeholder:text-white/40 outline-none transition-all focus:border-[#a67443] dark:focus:border-amber-400 focus:bg-white dark:focus:bg-white/15"
                        placeholder="+20 100 123 4567"
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="px-1 text-xs font-extrabold text-[#44403c] dark:text-white/90 uppercase tracking-wider">
                        Tax Reg. Number
                      </label>
                      <input
                        className="h-12 w-full rounded-xl border border-transparent bg-[#eae3d9] dark:bg-white/10 px-4 text-sm font-medium text-[#1c1917] dark:text-white placeholder:text-[#a8a29e] dark:placeholder:text-white/40 outline-none transition-all focus:border-[#a67443] dark:focus:border-amber-400 focus:bg-white dark:focus:bg-white/15"
                        placeholder="EG-987654321"
                        type="text"
                        name="taxId"
                        value={form.taxId}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* Physical Store Location */}
                  <div className="flex flex-col gap-1.5">
                    <label className="px-1 text-xs font-extrabold text-[#44403c] dark:text-white/90 uppercase tracking-wider">
                      Store Physical Location
                    </label>
                    <input
                      className="h-12 w-full rounded-xl border border-transparent bg-[#eae3d9] dark:bg-white/10 px-4 text-sm font-medium text-[#1c1917] dark:text-white placeholder:text-[#a8a29e] dark:placeholder:text-white/40 outline-none transition-all focus:border-[#a67443] dark:focus:border-amber-400 focus:bg-white dark:focus:bg-white/15"
                      placeholder="e.g. 15 El-Tahrir St, New Cairo"
                      type="text"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label
                  className="px-1 text-xs font-extrabold text-[#44403c] dark:text-white/90 uppercase tracking-wider"
                  htmlFor="reg-password"
                >
                  {t("auth.password")}
                </label>
                <div className="group relative flex items-center">
                  <Icon
                    name="lock"
                    className="absolute left-3.5 rtl:left-auto rtl:right-3.5 text-[#78716c] dark:text-white/50 transition-colors group-focus-within:text-[#a67443] dark:group-focus-within:text-amber-400"
                    size={18}
                  />
                  <input
                    className="h-12 w-full rounded-xl border border-transparent bg-[#eae3d9] dark:bg-white/10 pl-10 pr-4 rtl:pl-4 rtl:pr-10 text-sm font-medium text-[#1c1917] dark:text-white placeholder:text-[#a8a29e] dark:placeholder:text-white/40 outline-none transition-all focus:border-[#a67443] dark:focus:border-amber-400 focus:bg-white dark:focus:bg-white/15"
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
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label
                  className="px-1 text-xs font-extrabold text-[#44403c] dark:text-white/90 uppercase tracking-wider"
                  htmlFor="reg-confirm"
                >
                  {t("auth.confirmPassword")}
                </label>
                <div className="group relative flex items-center">
                  <Icon
                    name="shield"
                    className="absolute left-3.5 rtl:left-auto rtl:right-3.5 text-[#78716c] dark:text-white/50 transition-colors group-focus-within:text-[#a67443] dark:group-focus-within:text-amber-400"
                    size={18}
                  />
                  <input
                    className="h-12 w-full rounded-xl border border-transparent bg-[#eae3d9] dark:bg-white/10 pl-10 pr-4 rtl:pl-4 rtl:pr-10 text-sm font-medium text-[#1c1917] dark:text-white placeholder:text-[#a8a29e] dark:placeholder:text-white/40 outline-none transition-all focus:border-[#a67443] dark:focus:border-amber-400 focus:bg-white dark:focus:bg-white/15"
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

              {/* Terms Agreement Checkbox */}
              <label className="flex cursor-pointer items-center gap-2.5 px-1 pt-1">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={agree}
                  onChange={() => setAgree((value) => !value)}
                />
                <div className="flex h-4.5 w-4.5 items-center justify-center rounded-md border border-[#a8a29e] dark:border-white/30 bg-[#eae3d9] dark:bg-white/10 transition-all peer-checked:border-[#a67443] dark:peer-checked:border-amber-500 peer-checked:bg-[#a67443] dark:peer-checked:bg-amber-500 peer-checked:text-white">
                  {agree && (
                    <Icon name="check" size={13} className="font-bold" />
                  )}
                </div>
                <span className="select-none text-xs font-bold text-[#44403c] dark:text-white/90">
                  {t("auth.agreeToTerms")}
                </span>
              </label>

              {/* Submit Button */}
              <button
                className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#a67443] hover:bg-[#946334] text-white font-bold text-base tracking-wide shadow-md shadow-[#a67443]/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? t("auth.creatingAccount") : t("auth.createAccount")}
                {!loading && (
                  <Icon
                    name="arrow_forward"
                    className="rtl:rotate-180"
                    size={18}
                  />
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-[1px] flex-1 bg-[#d6d3d1] dark:bg-white/15" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#a8a29e] dark:text-white/50">
                OR CONTINUE WITH
              </span>
              <div className="h-[1px] flex-1 bg-[#d6d3d1] dark:bg-white/15" />
            </div>

            {/* Google Signup Button */}
            <button
              className="group flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-[#e7e5e4] dark:border-white/20 bg-white dark:bg-white/10 hover:bg-stone-50 dark:hover:bg-white/15 text-[#1c1917] dark:text-white font-semibold text-sm shadow-sm transition-all active:scale-[0.99]"
              type="button"
              onClick={handleGoogleLogin}
            >
              <svg
                className="w-5 h-5 min-w-[20px] min-h-[20px] max-w-[20px] max-h-[20px] shrink-0 transition-transform group-hover:scale-110 inline-block align-middle"
                width="20"
                height="20"
                viewBox="0 0 24 24"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{t("auth.google")}</span>
            </button>

            {/* Log In Link */}
            <p className="mt-5 text-center text-xs font-medium text-[#78716c] dark:text-white/70">
              {t("auth.alreadyHaveAccount")}
              <Link
                className="ml-1 rtl:mr-1 font-bold text-[#a67443] dark:text-amber-400 hover:underline transition-colors"
                to="/login"
              >
                {t("common.logIn")}
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Simple Clean Page Footer Copyright */}
      <footer className="relative z-10 text-center pb-5 text-xs font-medium text-white/60 drop-shadow">
        {t("common.copyright")}
      </footer>
    </div>
  );
};

export default Register;
