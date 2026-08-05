import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthFooter from "../../Components/AuthFooter";
import AuthHeader from "../../Components/AuthHeader";
import { activateSeller, resendSellerCode } from "../../api/AuthApi";
import { useTranslation } from "react-i18next";
import Icon from "../../Components/Icon";

const ActivateSeller = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

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

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResendCode = async () => {
    if (!email) {
      setError(t("auth.emailAddress") + " " + t("common.required", "is required"));
      return;
    }
    setError("");
    setInfoMessage("");
    setResending(true);
    try {
      await resendSellerCode(email);
      setInfoMessage(t("auth.codeResentSuccess"));
      setCooldown(60);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || t("auth.activationFailed");
      setError(msg);
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");

    if (verificationCode.trim().length !== 6) {
      setError(t("auth.codeLengthError"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.passwordsMatchError"));
      return;
    }

    setLoading(true);
    try {
      await activateSeller({
        email,
        verificationCode: verificationCode.trim(),
        password,
        confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 3000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || t("auth.activationFailed");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden text-on-surface selection:bg-primary selection:text-white">
      <AuthHeader />
      <main className="flex min-h-screen w-full flex-col pt-20 md:flex-row">
        {/* Left Side Banner */}
        <section className="relative flex h-64 w-full items-center justify-center overflow-hidden md:min-h-[calc(100vh-5rem)] md:h-auto md:w-1/2">
          <div
            className="absolute inset-0 z-0 scale-105 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCHp4ZIqIomzFkHSjBBx14sVRUI7ZV5UQ2xYqSnT3TciafPr8JbngCQYkI9sjc7MNjDCoCOfVjAIzaz31KBUS1HAjI09UC6p5d-Kfaf-WBOiq5xLx9kT2lA5-UCViGPC45P6upgRaSSQleuHUmXKVTlbB6yd12GNfR4YENrCcjBsq5FnrHisUnpQV9hRwMQ0dF3q9EMCvJGtxRV1-gKlylmQZdPkco6kgTQH7iWAkE-1InA5ZadwwzI')",
            }}
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          </div>
          <div className="relative z-10 px-6 text-center">
            <h1 className="text-4xl font-headline font-extrabold tracking-tight text-white drop-shadow-2xl md:text-6xl">
              {t("common.logoMain")}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-lg font-medium text-white/90 drop-shadow-lg">
              {t("auth.activateSellerSubtitle")}
            </p>
          </div>
        </section>

        {/* Right Side Form / Content */}
        <section className="flex w-full flex-col items-center justify-center overflow-y-auto bg-surface p-8 md:w-1/2 md:p-16 lg:p-24">
          <div className="w-full max-w-md">
            {success ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/50 p-8 text-center shadow-lg dark:bg-emerald-950/20">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <Icon name="check_circle" size={40} />
                </div>
                <h3 className="mt-6 text-2xl font-headline font-bold text-on-surface">
                  {t("auth.activationSuccessTitle")}
                </h3>
                <p className="mt-2 text-sm text-on-surface-variant">
                  {t("auth.activationSuccessDesc")}
                </p>
                <div className="mt-6">
                  <Link
                    to="/login"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-white transition hover:bg-primary-hover"
                  >
                    <span>{t("auth.signIn")}</span>
                    <Icon name="arrow_forward" size={18} />
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <header className="mb-8 text-center md:text-left rtl:md:text-right">
                  <h3 className="text-3xl font-headline font-semibold text-on-surface">
                    {t("auth.activateSellerTitle")}
                  </h3>
                  <p className="mt-2 font-medium text-on-surface-variant">
                    {t("auth.activateSellerSubtitle")}
                  </p>
                </header>

                {error && (
                  <div className="mb-6 rounded-xl bg-error/10 px-5 py-3 text-sm font-medium text-error">
                    {error}
                  </div>
                )}

                {infoMessage && (
                  <div className="mb-6 rounded-xl bg-emerald-500/10 px-5 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    {infoMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-on-surface-variant">
                      {t("auth.emailAddress")}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-on-surface-variant/60 rtl:left-auto rtl:right-0 rtl:pl-0 rtl:pr-3">
                        <Icon name="mail" size={18} />
                      </span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seller@example.com"
                        className="w-full rounded-xl border border-outline bg-surface-container-lowest py-3 pl-10 pr-4 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary rtl:pl-4 rtl:pr-10"
                      />
                    </div>
                  </div>

                  {/* Verification Code */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="block text-sm font-medium text-on-surface-variant">
                        {t("auth.verificationCodeLabel")}
                      </label>
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={resending || cooldown > 0}
                        className="text-xs font-semibold text-primary transition hover:underline disabled:opacity-50"
                      >
                        {resending
                          ? t("auth.resendingCode")
                          : cooldown > 0
                          ? `${t("auth.resendCode")} (${cooldown}s)`
                          : t("auth.resendCode")}
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-on-surface-variant/60 rtl:left-auto rtl:right-0 rtl:pl-0 rtl:pr-3">
                        <Icon name="shield" size={18} />
                      </span>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                        placeholder={t("auth.verificationCodePlaceholder")}
                        className="w-full tracking-widest font-mono text-lg rounded-xl border border-outline bg-surface-container-lowest py-3 pl-10 pr-4 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary rtl:pl-4 rtl:pr-10"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-on-surface-variant">
                      {t("auth.password")}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-on-surface-variant/60 rtl:left-auto rtl:right-0 rtl:pl-0 rtl:pr-3">
                        <Icon name="lock" size={18} />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-outline bg-surface-container-lowest py-3 pl-10 pr-10 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary rtl:pl-10 rtl:pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-on-surface-variant/60 hover:text-on-surface rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0"
                      >
                        <Icon name={showPassword ? "visibility_off" : "visibility"} size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-on-surface-variant">
                      {t("auth.confirmPassword")}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-on-surface-variant/60 rtl:left-auto rtl:right-0 rtl:pl-0 rtl:pr-3">
                        <Icon name="lock" size={18} />
                      </span>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-outline bg-surface-container-lowest py-3 pl-10 pr-10 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary rtl:pl-10 rtl:pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-on-surface-variant/60 hover:text-on-surface rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0"
                      >
                        <Icon name={showConfirmPassword ? "visibility_off" : "visibility"} size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-6 flex w-full items-center justify-center rounded-xl bg-primary py-3.5 font-semibold text-white shadow-lg transition hover:bg-primary-hover disabled:opacity-50"
                  >
                    {loading ? t("auth.activatingAccount") : t("auth.activateAccountBtn")}
                  </button>
                </form>

                <div className="mt-8 text-center text-sm font-medium text-on-surface-variant">
                  {t("auth.alreadyHaveAccount")}{" "}
                  <Link to="/login" className="font-semibold text-primary hover:underline">
                    {t("auth.signIn")}
                  </Link>
                </div>
              </>
            )}
          </div>

          <AuthFooter />
        </section>
      </main>
    </div>
  );
};

export default ActivateSeller;
