import { useState, useEffect } from "react";
import { User, Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import SectionHeader from "../Shared/SectionHeader";
import { useToast } from "../Shared/ToastContext";
import { useAuth } from "../../../context/AuthContext";
import { editProfile } from "../../../api/UserApi";

export default function AdminProfileSection() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { user, setUser } = useAuth();

  const [profile, setProfile] = useState({
    firstName: user?.firstName || "System",
    lastName: user?.lastName || "Administrator",
    email: user?.email || "admin@smartspace.ai",
    role: user?.role || "ADMIN",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        role: user.role || "ADMIN",
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("firstName", profile.firstName);
      formData.append("lastName", profile.lastName);
      const res = await editProfile(formData);
      if (res?.data?.data?.user || res?.data?.data) {
        setUser(res.data.data.user || res.data.data);
      }
      showToast(t("admin.settings.profileUpdatedToast"), "success");
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const initials = `${(profile.firstName[0] || "A").toUpperCase()}${(profile.lastName[0] || "D").toUpperCase()}`;

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-surface p-6 border border-outline/10 neomorph-raised space-y-4">
      <SectionHeader title={t("admin.settings.profileTitle")} subtitle={t("admin.settings.profileSubtitle")} icon={User} />

      <div className="flex items-center gap-4 py-2">
        <div className="size-16 rounded-full bg-primary text-white flex items-center justify-center font-extrabold text-xl neo-shadow">
          {initials}
        </div>
        <div>
          <h4 className="font-extrabold text-base text-on-surface">
            {profile.firstName} {profile.lastName}
          </h4>
          <span className="inline-block mt-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
            {profile.role}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
            {t("admin.settings.firstName")}
          </label>
          <input
            type="text"
            value={profile.firstName}
            onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
            className="w-full rounded-xl bg-surface-bright px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 border border-outline/20"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
            {t("admin.settings.lastName")}
          </label>
          <input
            type="text"
            value={profile.lastName}
            onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
            className="w-full rounded-xl bg-surface-bright px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 border border-outline/20"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
          {t("admin.settings.emailAddress")}
        </label>
        <input
          type="email"
          disabled
          value={profile.email}
          className="w-full rounded-xl bg-surface-bright/50 px-4 py-2.5 text-sm text-on-surface-variant outline-none border border-outline/10 cursor-not-allowed"
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white neo-shadow hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          <Save className="size-4" />
          <span>{saving ? t("admin.settings.savingProfile") : t("admin.settings.saveProfile")}</span>
        </button>
      </div>
    </form>
  );
}
