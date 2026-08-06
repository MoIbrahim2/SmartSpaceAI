import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { changePassword } from "../../api";
import { useTranslation } from "react-i18next";
import Icon from "../../Components/Icon";

const ChangePasswordPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [passForm, setPassForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passSaving, setPassSaving] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");

  const handlePassChange = (e) => {
    setPassForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");

    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassError(t("auth.passwordsMatchError", "New passwords do not match."));
      return;
    }

    setPassSaving(true);
    try {
      await changePassword(passForm);
      setPassSuccess(t("auth.passwordChangedSuccess", "Password updated successfully!"));
      setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => {
        navigate("/profile");
      }, 2000);
    } catch (err) {
      setPassError(err.response?.data?.message || err.message || "Failed to change password.");
    } finally {
      setPassSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-bright text-on-surface font-body">
      <main className="mx-auto w-full max-w-[1200px] flex-grow px-6 py-10 md:px-20">
        <div className="flex flex-col gap-12 md:flex-row">
          <aside className="w-full space-y-6 md:w-64">
            <div className="flex flex-col gap-2 rounded-3xl bg-surface-bright p-6 neo-shadow">
              <Link
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-on-surface-variant transition-all hover:text-primary neo-button"
                to="/profile"
              >
                <Icon name="person" />
                <span>{t("dashboard.profile", "Profile")}</span>
              </Link>
              <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-bold text-primary neo-inset">
                <Icon name="lock" />
                <span>{t("auth.changePassword", "Change Password")}</span>
              </button>
              <Link
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-on-surface-variant transition-all hover:text-primary neo-button"
                to="/credits"
              >
                <Icon name="payments" />
                <span>{t("dashboard.billing", "Billing")}</span>
              </Link>
            </div>
          </aside>

          <section className="flex-grow">
            <div className="rounded-3xl bg-surface-bright p-8 neo-shadow md:p-12">
              <h2 className="mb-2 text-2xl font-headline font-bold text-on-surface flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon name="lock" size={24} />
                </div>
                <span>{t("auth.changePassword", "Change Password")}</span>
              </h2>
              <p className="mb-8 text-sm text-on-surface-variant">
                {t("auth.changePasswordSubtitle", "Enter your current password and a new secure password.")}
              </p>

              {passError && (
                <div className="mb-6 rounded-xl bg-error/10 px-5 py-3 text-sm font-medium text-error">
                  {passError}
                </div>
              )}
              {passSuccess && (
                <div className="mb-6 rounded-xl bg-success/10 px-5 py-3 text-sm font-medium text-success">
                  {passSuccess}
                </div>
              )}

              <form className="space-y-6" onSubmit={handlePasswordSubmit}>
                <div className="flex flex-col gap-2">
                  <label className="px-1 text-sm font-semibold text-on-surface-variant" htmlFor="currentPassword">
                    {t("auth.currentPassword", "Current Password")}
                  </label>
                  <div className="relative">
                    <input
                      className="w-full rounded-2xl border-none bg-surface-bright px-6 py-4 text-on-surface placeholder-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 neo-inset pr-12 text-sm"
                      id="currentPassword"
                      type={showCurrentPass ? "text" : "password"}
                      name="currentPassword"
                      value={passForm.currentPassword}
                      onChange={handlePassChange}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface"
                    >
                      <Icon name={showCurrentPass ? "visibility_off" : "visibility"} size={20} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="px-1 text-sm font-semibold text-on-surface-variant" htmlFor="newPassword">
                      {t("auth.newPassword", "New Password")}
                    </label>
                    <div className="relative">
                      <input
                        className="w-full rounded-2xl border-none bg-surface-bright px-6 py-4 text-on-surface placeholder-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 neo-inset pr-12 text-sm"
                        id="newPassword"
                        type={showNewPass ? "text" : "password"}
                        name="newPassword"
                        value={passForm.newPassword}
                        onChange={handlePassChange}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface"
                      >
                        <Icon name={showNewPass ? "visibility_off" : "visibility"} size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="px-1 text-sm font-semibold text-on-surface-variant" htmlFor="confirmPassword">
                      {t("auth.confirmPassword", "Confirm New Password")}
                    </label>
                    <div className="relative">
                      <input
                        className="w-full rounded-2xl border-none bg-surface-bright px-6 py-4 text-on-surface placeholder-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 neo-inset pr-12 text-sm"
                        id="confirmPassword"
                        type={showConfirmPass ? "text" : "password"}
                        name="confirmPassword"
                        value={passForm.confirmPassword}
                        onChange={handlePassChange}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface"
                      >
                        <Icon name={showConfirmPass ? "visibility_off" : "visibility"} size={20} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6">
                  <Link
                    to="/profile"
                    className="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
                  >
                    ← {t("common.backToProfile", "Back to Profile")}
                  </Link>
                  <button
                    className="rounded-full bg-surface-bright px-10 py-3.5 font-bold tracking-wide text-primary neo-shadow neo-button disabled:opacity-50"
                    type="submit"
                    disabled={passSaving || !passForm.currentPassword || !passForm.newPassword}
                  >
                    {passSaving ? t("common.saving", "Updating...") : t("auth.updatePasswordBtn", "Update Password")}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ChangePasswordPage;
