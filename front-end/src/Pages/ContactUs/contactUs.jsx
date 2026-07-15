import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "../../Components/Icon";
import AuthHeader from "../../Components/AuthHeader";
import AuthFooter from "../../Components/AuthFooter";
import { submitContactMessage } from "../../api";

const ContactUs = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language.startsWith("ar");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear field-specific error as user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const tempErrors = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      tempErrors.name = t("contact.nameRequired");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      tempErrors.email = t("contact.emailRequired");
    }
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      tempErrors.message = t("contact.messageRequired");
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await submitContactMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
      });
      setSuccess(true);
      setFormData({ name: "", email: "", message: "" });
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      setSubmitError(serverMessage || t("contact.errorMsg"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-on-surface selection:bg-primary selection:text-white flex flex-col bg-surface transition-colors duration-300">
      <AuthHeader />

      <main className="flex-grow pt-28 pb-16 flex items-center justify-center">
        <div className="max-w-6xl w-full mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          {/* Info Panel */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 md:p-12 rounded-3xl border border-surface-container relative overflow-hidden neo-raised">
            {/* Visual glow element */}
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10">
              <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                {t("common.contactUs")}
              </span>
              <h1 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tight mt-6 text-on-surface leading-tight">
                {t("contact.title")}
              </h1>
              <p className="mt-4 text-on-surface-variant font-medium text-base">
                {t("contact.subtitle")}
              </p>

              {/* Info Items */}
              <div className="mt-12 space-y-8">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center size-12 rounded-2xl bg-surface-bright text-primary neo-raised flex-shrink-0">
                    <Icon name="mail" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-on-surface-variant">{t("contact.emailLabel")}</h3>
                    <a href="mailto:support@smartspace.ai" className="text-primary font-semibold text-lg hover:underline transition-all">
                      support@smartspace.ai
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center size-12 rounded-2xl bg-surface-bright text-primary neo-raised flex-shrink-0">
                    <Icon name="location_on" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-on-surface-variant">Office Location</h3>
                    <p className="text-on-surface font-semibold text-lg">
                      Smart Village, Giza, Egypt
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center size-12 rounded-2xl bg-surface-bright text-primary neo-raised flex-shrink-0">
                    <Icon name="calendar_today" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-on-surface-variant">Business Hours</h3>
                    <p className="text-on-surface font-semibold text-lg">
                      Sunday - Thursday, 9:00 AM - 5:00 PM
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-surface-container relative z-10">
              <p className="text-sm font-medium text-on-surface-variant">
                Looking for virtual staging features?
              </p>
              <Link to="/register" className="inline-flex items-center gap-2 mt-2 text-primary font-bold hover:gap-3 transition-all">
                <span>Start Designing</span>
                <Icon name="arrow_forward" size={16} className={isRTL ? "rotate-180" : ""} />
              </Link>
            </div>
          </div>

          {/* Form Panel */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {success ? (
              <div className="bg-surface-bright p-8 md:p-12 rounded-3xl border border-surface-container text-center neo-raised flex flex-col items-center justify-center min-h-[400px] transition-all duration-500 scale-100">
                <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6 neo-raised">
                  <Icon name="check_circle" size={32} />
                </div>
                <h3 className="text-2xl font-headline font-bold text-on-surface">
                  Message Sent!
                </h3>
                <p className="mt-4 text-on-surface-variant max-w-md font-medium">
                  {t("contact.successMsg")}
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="mt-8 px-8 h-12 rounded-full bg-surface text-primary font-headline font-bold transition-all hover:opacity-90 active:scale-95 neo-raised"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <div className="bg-surface-bright p-8 md:p-12 rounded-3xl border border-surface-container neo-raised">
                {submitError && (
                  <div className="mb-6 rounded-2xl bg-error/10 px-5 py-3 text-sm font-medium text-error flex items-center gap-3">
                    <Icon name="close" size={16} className="text-error cursor-pointer" onClick={() => setSubmitError("")} />
                    <span>{submitError}</span>
                  </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                  {/* Name field */}
                  <div className="flex flex-col gap-2">
                    <label className="px-2 text-sm font-semibold text-on-surface-variant" htmlFor="contact-name">
                      {t("contact.nameLabel")}
                    </label>
                    <div className="group relative flex items-center">
                      <Icon name="person" className={`absolute ${isRTL ? "right-5" : "left-5"} text-outline transition-colors group-focus-within:text-primary`} />
                      <input
                        className={`h-12 w-full rounded-full border-none bg-surface ${isRTL ? "pr-14 pl-5" : "pl-14 pr-5"} text-on-surface outline-none transition-all placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 neo-inset`}
                        placeholder={t("contact.namePlaceholder")}
                        type="text"
                        name="name"
                        id="contact-name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    {errors.name && (
                      <span className="px-2 text-xs font-semibold text-error">{errors.name}</span>
                    )}
                  </div>

                  {/* Email field */}
                  <div className="flex flex-col gap-2">
                    <label className="px-2 text-sm font-semibold text-on-surface-variant" htmlFor="contact-email">
                      {t("contact.emailLabel")}
                    </label>
                    <div className="group relative flex items-center">
                      <Icon name="mail" className={`absolute ${isRTL ? "right-5" : "left-5"} text-outline transition-colors group-focus-within:text-primary`} />
                      <input
                        className={`h-12 w-full rounded-full border-none bg-surface ${isRTL ? "pr-14 pl-5" : "pl-14 pr-5"} text-on-surface outline-none transition-all placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 neo-inset`}
                        placeholder={t("contact.emailPlaceholder")}
                        type="email"
                        name="email"
                        id="contact-email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    {errors.email && (
                      <span className="px-2 text-xs font-semibold text-error">{errors.email}</span>
                    )}
                  </div>

                  {/* Message field */}
                  <div className="flex flex-col gap-2">
                    <label className="px-2 text-sm font-semibold text-on-surface-variant" htmlFor="contact-message">
                      {t("contact.messageLabel")}
                    </label>
                    <div className="group relative flex items-start">
                      <Icon name="inbox" className={`absolute ${isRTL ? "right-5" : "left-5"} top-4 text-outline transition-colors group-focus-within:text-primary`} />
                      <textarea
                        className={`min-h-[140px] w-full rounded-3xl border-none bg-surface ${isRTL ? "pr-14 pl-5" : "pl-14 pr-5"} py-3 text-on-surface outline-none transition-all placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 neo-inset resize-none`}
                        placeholder={t("contact.messagePlaceholder")}
                        name="message"
                        id="contact-message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    {errors.message && (
                      <span className="px-2 text-xs font-semibold text-error">{errors.message}</span>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    className="h-12 w-full rounded-full bg-surface font-headline text-lg font-bold text-primary transition-all hover:opacity-90 active:scale-95 disabled:pointer-events-none disabled:opacity-50 neo-raised flex items-center justify-center gap-2"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting && (
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {submitting ? t("contact.submitting") : t("contact.submitBtn")}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      <AuthFooter />
    </div>
  );
};

export default ContactUs;
