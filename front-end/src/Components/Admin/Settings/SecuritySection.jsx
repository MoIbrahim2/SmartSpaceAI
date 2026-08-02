import { useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import SectionHeader from "../Shared/SectionHeader";
import { useToast } from "../Shared/ToastContext";

export default function SecuritySection() {
  const { showToast } = useToast();
  const [passwords, setPasswords] = useState({
    current: "",
    newPass: "",
    confirmPass: "",
  });

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirmPass) {
      showToast("New passwords do not match!", "error");
      return;
    }
    showToast("Password updated successfully!", "success");
    setPasswords({ current: "", newPass: "", confirmPass: "" });
  };

  return (
    <form onSubmit={handlePasswordSubmit} className="rounded-2xl bg-surface p-6 border border-outline/10 neomorph-raised space-y-4">
      <SectionHeader title="Security & Authentication" subtitle="Update account password and security settings" icon={KeyRound} />

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
            Current Password
          </label>
          <input
            required
            type="password"
            placeholder="••••••••"
            value={passwords.current}
            onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
            className="w-full rounded-xl bg-surface-bright px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 border border-outline/20"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              New Password
            </label>
            <input
              required
              type="password"
              placeholder="••••••••"
              value={passwords.newPass}
              onChange={(e) => setPasswords((p) => ({ ...p, newPass: e.target.value }))}
              className="w-full rounded-xl bg-surface-bright px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 border border-outline/20"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Confirm New Password
            </label>
            <input
              required
              type="password"
              placeholder="••••••••"
              value={passwords.confirmPass}
              onChange={(e) => setPasswords((p) => ({ ...p, confirmPass: e.target.value }))}
              className="w-full rounded-xl bg-surface-bright px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 border border-outline/20"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white neo-shadow hover:bg-primary/90 transition-all"
        >
          <ShieldCheck className="size-4" />
          <span>Update Password</span>
        </button>
      </div>
    </form>
  );
}
