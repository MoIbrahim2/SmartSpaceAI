import SearchInput from "../Shared/SearchInput";
import FilterDropdown from "../Shared/FilterDropdown";
import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";

export default function ReportFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  month,
  onMonthChange,
  year,
  onYearChange,
  onExportCSV,
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-6 rounded-2xl bg-surface p-4 border border-outline/10 neomorph-raised">
      <SearchInput value={search} onChange={onSearchChange} placeholder={t("admin.commissions.searchPlaceholder")} />

      <div className="flex flex-wrap items-center gap-3">
        <FilterDropdown
          label={t("admin.commissions.filterStatus")}
          value={status}
          onChange={onStatusChange}
          options={["All", "Paid", "Pending", "Processing"]}
        />
        <FilterDropdown
          label={t("admin.commissions.filterMonth")}
          value={month}
          onChange={onMonthChange}
          options={["All", "May", "June", "July", "August"]}
        />
        <FilterDropdown
          label={t("admin.commissions.filterYear")}
          value={year}
          onChange={onYearChange}
          options={["2026", "2025"]}
        />
        {onExportCSV && (
          <button
            onClick={onExportCSV}
            className="flex items-center gap-2 rounded-xl bg-surface-bright px-3.5 py-2 text-xs font-bold text-on-surface hover:text-primary border border-outline/20 neo-shadow neo-button transition-all"
          >
            <Download className="size-3.5" />
            <span>{t("admin.commissions.exportCsv")}</span>
          </button>
        )}
      </div>
    </div>
  );
}
