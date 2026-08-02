import { Search, Filter, RefreshCw } from "lucide-react";

export default function Filters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  statusOptions = ["All", "Active", "Pending", "Suspended"],
  onReset,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 rounded-2xl bg-surface p-4 border border-outline/10 neomorph-raised">
      {/* Search Field */}
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter records..."
          className="w-full rounded-xl bg-surface-bright pl-10 pr-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:ring-2 focus:ring-primary/40 border border-outline/20 transition-all"
        />
      </div>

      {/* Select & Reset Actions */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        <div className="flex items-center gap-2 bg-surface-bright px-3 py-2 rounded-xl border border-outline/20 text-sm">
          <Filter className="size-4 text-on-surface-variant" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="bg-transparent text-on-surface font-semibold outline-none cursor-pointer text-sm"
          >
            {statusOptions.map((opt) => (
              <option key={opt} value={opt} className="bg-surface text-on-surface">
                {opt}
              </option>
            ))}
          </select>
        </div>

        {onReset && (
          <button
            onClick={onReset}
            className="p-2.5 rounded-xl bg-surface-bright text-on-surface-variant hover:text-primary transition-all neo-shadow neo-button"
            title="Reset Filters"
          >
            <RefreshCw className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
