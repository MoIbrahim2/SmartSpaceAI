import { TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import SectionHeader from "../Shared/SectionHeader";

export default function RevenueChart({ data = [] }) {
  const { t } = useTranslation();
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="rounded-2xl bg-surface p-5 border border-outline/10 neomorph-raised space-y-4">
      <SectionHeader
        title={t("admin.dashboard.revenueTrend")}
        subtitle={t("admin.dashboard.revenueSubtitle")}
        icon={TrendingUp}
      />

      {/* SVG Trend Area Placeholder */}
      <div className="relative h-48 w-full pt-4">
        <div className="absolute inset-0 flex items-end justify-between gap-2 px-2 pb-6">
          {data.map((item, idx) => {
            const heightPercent = Math.round((item.revenue / maxRevenue) * 100);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div className="relative w-full flex justify-center items-end h-full">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[28px] rounded-t-lg bg-primary/80 group-hover:bg-primary transition-all neo-shadow"
                  >
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-[10px] font-bold px-2 py-1 rounded shadow-md pointer-events-none transition-all z-20 whitespace-nowrap">
                      ${item.revenue.toLocaleString()}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-on-surface-variant">{item.month}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
