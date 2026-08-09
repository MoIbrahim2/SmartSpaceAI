import { useState } from "react";
import { User, KeyRound, Sliders } from "lucide-react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../Components/Admin/Shared/PageHeader";
import AdminProfileSection from "../../Components/Admin/Settings/AdminProfileSection";
import SecuritySection from "../../Components/Admin/Settings/SecuritySection";
import PreferencesSection from "../../Components/Admin/Settings/PreferencesSection";

export default function Settings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", label: t("admin.settings.tabProfile"), icon: User },
    { id: "security", label: t("admin.settings.tabSecurity"), icon: KeyRound },
    { id: "preferences", label: t("admin.settings.tabPreferences"), icon: Sliders },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title={t("admin.settings.title")}
        description={t("admin.settings.description")}
      />

      {/* Tab Controls */}
      <div className="flex items-center gap-2 border-b border-outline/10 pb-2">
        {tabs.map((tab) => {
          const IconComp = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                active
                  ? "bg-primary text-white neo-shadow"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface"
              }`}
            >
              <IconComp className="size-4 shrink-0" />
              <span>{tab.label}</span>
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
