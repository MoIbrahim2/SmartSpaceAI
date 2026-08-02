import { useState } from "react";
import { Sliders, Bell, Globe, Moon } from "lucide-react";
import SectionHeader from "../Shared/SectionHeader";
import { useToast } from "../Shared/ToastContext";

export default function PreferencesSection() {
  const { showToast } = useToast();
  const [commissionRate, setCommissionRate] = useState("12");
  const [autoApproveScore, setAutoApproveScore] = useState("90");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    showToast("Preferences & marketplace policies saved!", "success");
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="rounded-2xl bg-surface p-6 border border-outline/10 neomorph-raised space-y-4">
        <SectionHeader title="Marketplace Configuration" subtitle="Set platform commission rates & automation thresholds" icon={Sliders} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Default Seller Commission Rate (%)
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
              AI Auto-Approve Score Threshold (%)
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
        <SectionHeader title="System Notifications & Controls" subtitle="Enable automatic system alerts" icon={Bell} />

        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-semibold text-sm text-on-surface">Email Alerts for Moderation Queue</p>
              <p className="text-xs text-on-surface-variant">Notify admins when AI flags low-confidence products.</p>
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
              <p className="font-semibold text-sm text-on-surface">Platform Maintenance Mode</p>
              <p className="text-xs text-on-surface-variant">Restrict new seller submissions temporarily.</p>
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
            Save Preferences
          </button>
        </div>
      </div>
    </form>
  );
}
