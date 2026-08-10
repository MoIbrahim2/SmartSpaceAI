import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { verifyEmail, resendVerificationCode } from "../../api/AuthApi";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import Icon from "../../Components/Icon";

const VerifyEmail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
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
      setError("Please enter your email address.");
      return;
    }
    setError("");
    setInfoMessage("");
    setResending(true);
    try {
      await resendVerificationCode(email);
      setInfoMessage(
        t("auth.codeResentSuccess", "Verification code resent successfully!"),
      );
      setCooldown(60);
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Failed to resend code.";
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
      setError("Please enter your email address.");
      return;
    }

    if (verificationCode.trim().length !== 6) {
      setError(
        t("auth.codeLengthError", "Verification code must be 6 digits."),
      );
      return;
    }

    setLoading(true);
    try {
      const { data } = await verifyEmail(email, verificationCode.trim());
      if (data.success && data.data) {
        const { accessToken, user } = data.data;
        if (accessToken) {
          localStorage.setItem("accessToken", accessToken);
        }
        if (user) {
          setUser(user);
        }
        setSuccess(true);
        setTimeout(() => {
          navigate("/home", { replace: true });
        }, 2000);
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Verification failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-surface-container-lowest via-surface to-surface-container/30 p-4 text-on-surface selection:bg-primary selection:text-white">
      <div className="w-full max-w-md rounded-3xl border border-outline/10 bg-surface p-8 shadow-2xl backdrop-blur-md md:p-10">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon name="mail" size={32} />
          </div>
          <h2 className="text-2xl font-headline font-bold tracking-tight text-on-surface">
            {t("auth.verifyEmailTitle", "Verify Your Email")}
          </h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            {email ? (
              <>
                Enter the 6-digit OTP code sent to{" "}
                <span className="font-semibold text-on-surface">{email}</span>
              </>
            ) : (
              t(
                "auth.verifyEmailSubtitle",
                "Enter your email and the 6-digit code sent to you",
              )
            )}
          </p>
        </div>

        {success ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/50 p-6 text-center shadow-sm dark:bg-emerald-950/20">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Icon name="check_circle" size={36} />
            </div>
            <h3 className="mt-4 text-xl font-headline font-bold text-on-surface">
              {t("auth.verificationSuccessTitle", "Email Verified!")}
            </h3>
            <p className="mt-2 text-xs text-on-surface-variant">
              {t(
                "auth.verificationSuccessDesc",
                "Your account is active. Redirecting to home...",
              )}
            </p>
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

            {/* Email Field if not in URL */}
            {!searchParams.get("email") && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  {t("auth.email", "Email Address")}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-on-surface-variant/60">
                    <Icon name="mail" size={18} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-2xl border border-outline/30 bg-surface-container-lowest py-3 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            )}

            {/* Verification Code Field */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  {t("auth.verificationCodeLabel", "6-Digit OTP Code")}
                </label>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resending || cooldown > 0}
                  className="text-xs font-semibold text-primary transition hover:underline disabled:opacity-50"
                >
                  {resending
                    ? t("auth.resendingCode", "Resending...")
                    : cooldown > 0
                      ? `${t("auth.resendCode", "Resend Code")} (${cooldown}s)`
                      : t("auth.resendCode", "Resend Code")}
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="123456"
                  className="w-full tracking-[0.5em] text-center font-mono text-xl font-bold rounded-2xl border border-outline/30 bg-surface-container-lowest py-3.5 px-4 text-on-surface placeholder:text-on-surface-variant/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-inner"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                loading || verificationCode.trim().length !== 6 || !email
              }
              className="flex w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:bg-primary-hover active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? t("auth.verifying", "Verifying...")
                : t("auth.verifyCodeBtn", "Verify Email")}
            </button>

            <div className="text-center text-xs font-medium text-on-surface-variant">
              {t("auth.alreadyHaveAccount", "Already have an account?")}{" "}
              <Link
                to="/login"
                className="font-semibold text-primary hover:underline"
              >
                {t("auth.signIn", "Sign In")}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
