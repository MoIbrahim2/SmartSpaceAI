import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import SectionHeader from "../Shared/SectionHeader";

export default function NotificationsWidget({ items = [] }) {
  const { t } = useTranslation();
  const [list, setList] = useState(items);

  const markAllRead = () => {
    setList((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  return (
    <div className="rounded-2xl bg-surface p-5 border border-outline/10 neomorph-raised space-y-4">
      <SectionHeader
        title={t("admin.dashboard.latestNotifications")}
        icon={Bell}
        action={
          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <CheckCheck className="size-3.5" />
            <span>{t("admin.dashboard.markAllRead")}</span>
          </button>
        }
      />

      <div className="space-y-3">
        {list.map((item) => (
          <div
            key={item.id}
            className={`p-3 rounded-xl border border-outline/10 transition-all ${
              item.read ? "bg-surface-bright/40 opacity-70" : "bg-surface-bright border-l-4 rtl:border-r-4 rtl:border-l-0 border-l-primary rtl:border-r-primary"
            }`}
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-on-surface">{item.title}</h4>
              <span className="text-[10px] text-outline">{item.time}</span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1 leading-snug">{item.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
