import { useState } from "react";
import { Sliders, Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import SectionHeader from "../Shared/SectionHeader";
import { useToast } from "../Shared/ToastContext";

export default function PreferencesSection() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [commissionRate, setCommissionRate] = useState("12");
  const [autoApproveScore, setAutoApproveScore] = useState("90");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    showToast(t("admin.settings.prefSavedToast"), "success");
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="rounded-2xl bg-surface p-6 border border-outline/10 neomorph-raised space-y-4">
        <SectionHeader
          title={t("admin.settings.prefMarketplaceTitle")}
          subtitle={t("admin.settings.prefMarketplaceSub")}
          icon={Sliders}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              {t("admin.settings.defaultCommRate")}
            </label>
            <input
              type="number"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              className="w-full rounded-xl bg-surface-bright px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 border border-outline/20"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              {t("admin.settings.autoApproveScore")}
            </label>
            <input
              type="number"
              value={autoApproveScore}
              onChange={(e) => setAutoApproveScore(e.target.value)}
              className="w-full rounded-xl bg-surface-bright px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 border border-outline/20"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-surface p-6 border border-outline/10 neomorph-raised space-y-4">
        <SectionHeader
          title={t("admin.settings.prefNotificationsTitle")}
          subtitle={t("admin.settings.prefNotificationsSub")}
          icon={Bell}
        />

        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-semibold text-sm text-on-surface">{t("admin.settings.emailAlertsLabel")}</p>
              <p className="text-xs text-on-surface-variant">{t("admin.settings.emailAlertsSub")}</p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="size-5 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer border-t border-outline/10 pt-4">
            <div>
              <p className="font-semibold text-sm text-on-surface">{t("admin.settings.maintModeLabel")}</p>
              <p className="text-xs text-on-surface-variant">{t("admin.settings.maintModeSub")}</p>
            </div>
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="size-5 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
            />
          </label>
        </div>

        <div className="flex justify-end pt-4 border-t border-outline/10">
          <button
            type="submit"
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white neo-shadow hover:bg-primary/90 transition-all"
          >
            {t("admin.settings.savePrefBtn")}
          </button>
        </div>
      </div>
    </form>
  );
}
