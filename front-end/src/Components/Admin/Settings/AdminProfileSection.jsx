import { useState } from "react";
import { User, Save } from "lucide-react";
import SectionHeader from "../Shared/SectionHeader";
import { useToast } from "../Shared/ToastContext";

export default function AdminProfileSection() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState({
    firstName: "System",
    lastName: "Administrator",
    email: "admin@smartspace.ai",
    role: "Super Admin",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    showToast("Admin profile updated successfully!", "success");
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-surface p-6 border border-outline/10 neomorph-raised space-y-4">
      <SectionHeader title="Admin Profile & Identity" subtitle="Manage primary system administrator details" icon={User} />

      <div className="flex items-center gap-4 py-2">
        <div className="size-16 rounded-full bg-primary text-white flex items-center justify-center font-extrabold text-xl neo-shadow">
          SA
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
            First Name
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
            Last Name
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
          Email Address
        </label>
        <input
          type="email"
          value={profile.email}
          onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
          className="w-full rounded-xl bg-surface-bright px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 border border-outline/20"
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white neo-shadow hover:bg-primary/90 transition-all"
        >
          <Save className="size-4" />
          <span>Save Profile</span>
        </button>
      </div>
    </form>
  );
}
