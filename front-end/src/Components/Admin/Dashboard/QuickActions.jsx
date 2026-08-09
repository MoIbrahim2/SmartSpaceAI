import { UserPlus, ShieldAlert, PieChart, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function QuickActions({ onCreateSeller }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl bg-surface p-5 border border-outline/10 neomorph-raised space-y-3">
      <h3 className="font-extrabold text-base text-on-surface tracking-tight">{t("admin.dashboard.quickActions")}</h3>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onCreateSeller}
          className="flex items-center gap-2.5 rounded-xl bg-surface-bright p-3 text-xs font-bold text-on-surface hover:text-primary border border-outline/20 hover:neomorph-inset transition-all"
        >
          <UserPlus className="size-4 text-primary shrink-0" />
          <span>{t("admin.dashboard.addSeller")}</span>
        </button>

        <Link
          to="/admin/moderation"
          className="flex items-center gap-2.5 rounded-xl bg-surface-bright p-3 text-xs font-bold text-on-surface hover:text-primary border border-outline/20 hover:neomorph-inset transition-all"
        >
          <ShieldAlert className="size-4 text-primary shrink-0" />
          <span>{t("admin.dashboard.reviewModeration")}</span>
        </Link>

        <Link
          to="/admin/commissions"
          className="flex items-center gap-2.5 rounded-xl bg-surface-bright p-3 text-xs font-bold text-on-surface hover:text-primary border border-outline/20 hover:neomorph-inset transition-all"
        >
          <PieChart className="size-4 text-primary shrink-0" />
          <span>{t("admin.dashboard.viewReports")}</span>
        </Link>

        <Link
          to="/admin/settings"
          className="flex items-center gap-2.5 rounded-xl bg-surface-bright p-3 text-xs font-bold text-on-surface hover:text-primary border border-outline/20 hover:neomorph-inset transition-all"
        >
          <Settings className="size-4 text-primary shrink-0" />
          <span>{t("admin.dashboard.systemSettings")}</span>
        </Link>
      </div>
    </div>
  );
}
