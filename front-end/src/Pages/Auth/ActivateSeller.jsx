import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
      setError("Email address is missing in activation link.");
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

    if (!email) {
      setError("Email address is missing in activation link.");
      return;
    }

    if (verificationCode.trim().length !== 6) {
      setError(t("auth.codeLengthError"));
      return;
    }

    if (!password) {
      setError(t("auth.password") + " " + t("common.required", "is required"));
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
      }, 2500);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || t("auth.activationFailed");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-surface-container-lowest via-surface to-surface-container/30 p-3 sm:p-4 text-on-surface selection:bg-primary selection:text-white">
      <div className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-outline/10 bg-surface p-5 sm:p-8 md:p-10 shadow-2xl backdrop-blur-md">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon name="shield" size={32} />
          </div>
          <h2 className="text-2xl font-headline font-bold tracking-tight text-on-surface">
            {t("auth.activateSellerTitle")}
          </h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            {email ? (
              <>
                Enter code and set password for{" "}
                <span className="font-semibold text-on-surface">{email}</span>
              </>
            ) : (
              t("auth.activateSellerSubtitle")
            )}
          </p>
        </div>

        {success ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/50 p-6 text-center shadow-sm dark:bg-emerald-950/20">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Icon name="check_circle" size={36} />
            </div>
            <h3 className="mt-4 text-xl font-headline font-bold text-on-surface">
              {t("auth.activationSuccessTitle")}
            </h3>
            <p className="mt-2 text-xs text-on-surface-variant">
              {t("auth.activationSuccessDesc")}
            </p>
            <div className="mt-6">
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary-hover shadow-md"
              >
                <span>{t("auth.signIn")}</span>
                <Icon name="arrow_forward" size={18} />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl bg-error/10 px-4 py-3 text-sm font-medium text-error">
                {error}
              </div>
            )}

            {infoMessage && (
              <div className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {infoMessage}
              </div>
            )}

            {/* Verification Code Field */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
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
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full tracking-[0.5em] text-center font-mono text-xl font-bold rounded-2xl border border-outline/30 bg-surface-container-lowest py-3.5 px-4 text-on-surface placeholder:text-on-surface-variant/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-inner"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
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
                  className="w-full rounded-2xl border border-outline/30 bg-surface-container-lowest py-3 pl-10 pr-10 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 rtl:pl-10 rtl:pr-10 text-sm"
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
              <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
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
                  className="w-full rounded-2xl border border-outline/30 bg-surface-container-lowest py-3 pl-10 pr-10 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 rtl:pl-10 rtl:pr-10 text-sm"
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
              disabled={loading || verificationCode.trim().length !== 6 || !password}
              className="flex w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:bg-primary-hover active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t("auth.activatingAccount") : t("auth.activateAccountBtn")}
            </button>

            <div className="text-center text-xs font-medium text-on-surface-variant">
              {t("auth.alreadyHaveAccount")}{" "}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                {t("auth.signIn")}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ActivateSeller;
