import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { forgotPassword, resetPassword } from "../../api/AuthApi";
import { useTranslation } from "react-i18next";
import Icon from "../../Components/Icon";

const ForgotPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(1); // Step 1: Send OTP, Step 2: Verify OTP & Reset
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
      setStep(2);
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

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      setInfoMessage(t("auth.resetOtpSent", "Password reset code sent to your email."));
      setStep(2);
      setCooldown(60);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to send reset code.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) return;
    setError("");
    setInfoMessage("");
    setResending(true);
    try {
      await forgotPassword(email);
      setInfoMessage(t("auth.resetOtpResent", "New password reset code sent to your email."));
      setCooldown(60);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to resend code.";
      setError(msg);
    } finally {
      setResending(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (verificationCode.trim().length !== 6) {
      setError(t("auth.codeLengthError", "Verification code must be 6 digits."));
      return;
    }

    if (!password) {
      setError(t("auth.passwordRequired", "New password is required."));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.passwordsMatchError", "Passwords do not match."));
      return;
    }

    setLoading(true);
    try {
      await resetPassword({
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
      const msg = err.response?.data?.message || err.message || "Failed to reset password.";
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
            <Icon name="key" size={32} />
          </div>
          <h2 className="text-2xl font-headline font-bold tracking-tight text-on-surface">
            {t("auth.forgotPasswordTitle", "Forgot Password?")}
          </h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            {step === 1
              ? t("auth.forgotPasswordSubtitle", "Enter your email to receive a 6-digit password reset code")
              : `Enter the code sent to ${email} and your new password`}
          </p>
        </div>

        {success ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/50 p-6 text-center shadow-sm dark:bg-emerald-950/20">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Icon name="check_circle" size={36} />
            </div>
            <h3 className="mt-4 text-xl font-headline font-bold text-on-surface">
              {t("auth.passwordResetSuccessTitle", "Password Reset Successful!")}
            </h3>
            <p className="mt-2 text-xs text-on-surface-variant">
              {t("auth.passwordResetSuccessDesc", "Your password has been reset. Redirecting to sign in...")}
            </p>
            <div className="mt-6">
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary-hover shadow-md"
              >
                <span>{t("auth.signIn", "Sign In")}</span>
                <Icon name="arrow_forward" size={18} />
              </Link>
            </div>
          </div>
        ) : step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            {error && (
              <div className="rounded-xl bg-error/10 px-4 py-3 text-sm font-medium text-error">
                {error}
              </div>
            )}

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
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-outline/30 bg-surface-container-lowest py-3 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="flex w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:bg-primary-hover active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t("auth.sending", "Sending Code...") : t("auth.sendResetCode", "Send Reset Code")}
            </button>

            <div className="text-center text-xs font-medium text-on-surface-variant">
              {t("auth.rememberPassword", "Remember your password?")}{" "}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                {t("auth.signIn", "Sign In")}
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
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

            {/* OTP Code */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  {t("auth.verificationCodeLabel", "6-Digit Reset Code")}
                </label>
                <button
                  type="button"
                  onClick={handleResendOtp}
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
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full tracking-[0.5em] text-center font-mono text-xl font-bold rounded-2xl border border-outline/30 bg-surface-container-lowest py-3.5 px-4 text-on-surface placeholder:text-on-surface-variant/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-inner"
                />
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                {t("auth.newPassword", "New Password")}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-on-surface-variant/60">
                  <Icon name="lock" size={18} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-outline/30 bg-surface-container-lowest py-3 pl-10 pr-10 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-on-surface-variant/60 hover:text-on-surface"
                >
                  <Icon name={showPassword ? "visibility_off" : "visibility"} size={18} />
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                {t("auth.confirmPassword", "Confirm New Password")}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-on-surface-variant/60">
                  <Icon name="lock" size={18} />
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-outline/30 bg-surface-container-lowest py-3 pl-10 pr-10 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-on-surface-variant/60 hover:text-on-surface"
                >
                  <Icon name={showConfirmPassword ? "visibility_off" : "visibility"} size={18} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || verificationCode.trim().length !== 6 || !password}
              className="flex w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:bg-primary-hover active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t("auth.resetting", "Resetting Password...") : t("auth.resetPasswordBtn", "Reset Password")}
            </button>

            <div className="flex items-center justify-between text-xs font-medium text-on-surface-variant">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-on-surface-variant hover:text-on-surface underline"
              >
                ← Change Email
              </button>
              <Link to="/login" className="font-semibold text-primary hover:underline">
                {t("auth.signIn", "Sign In")}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
