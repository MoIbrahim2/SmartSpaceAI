import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function StatCard({ title, value, change, isPositive, icon: IconComponent }) {
  return (
    <div className="rounded-2xl bg-surface p-5 neomorph-raised border border-outline/10 flex flex-col justify-between transition-all hover:translate-y-[-2px]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          {title}
        </span>
        {IconComponent && (
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary neo-shadow">
            <IconComponent className="size-5" />
          </div>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-2xl font-extrabold text-on-surface tracking-tight">{value}</h3>

        {change && (
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold">
            <span
              className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 ${
                isPositive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-error/10 text-error"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="size-3.5" />
              ) : (
                <ArrowDownRight className="size-3.5" />
              )}
              {change}
            </span>
            <span className="text-on-surface-variant font-medium">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
}
