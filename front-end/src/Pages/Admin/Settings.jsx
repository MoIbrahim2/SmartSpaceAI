import { useState } from "react";
import { User, KeyRound, Sliders } from "lucide-react";
import PageHeader from "../../Components/Admin/Shared/PageHeader";
import AdminProfileSection from "../../Components/Admin/Settings/AdminProfileSection";
import SecuritySection from "../../Components/Admin/Settings/SecuritySection";
import PreferencesSection from "../../Components/Admin/Settings/PreferencesSection";

const tabs = [
  { id: "profile", label: "Admin Profile", icon: User },
  { id: "security", label: "Security & Passwords", icon: KeyRound },
  { id: "preferences", label: "Platform Preferences", icon: Sliders },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Admin Settings & Policies"
        description="Configure admin profile, security settings, commission rates, and notification preferences."
      />

      {/* Tab Controls */}
      <div className="flex items-center gap-2 border-b border-outline/10 pb-2">
        {tabs.map((t) => {
          const IconComp = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                active
                  ? "bg-primary text-white neo-shadow"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface"
              }`}
            >
              <IconComp className="size-4 shrink-0" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "profile" && <AdminProfileSection />}
        {activeTab === "security" && <SecuritySection />}
        {activeTab === "preferences" && <PreferencesSection />}
      </div>
    </div>
  );
}
