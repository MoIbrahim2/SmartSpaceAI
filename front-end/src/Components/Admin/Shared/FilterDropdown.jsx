import { Filter } from "lucide-react";

export default function FilterDropdown({ value, onChange, options = [], label }) {
  return (
    <div className="flex items-center gap-2 bg-surface-bright px-3 py-2 rounded-xl border border-outline/20 text-sm">
      <Filter className="size-4 text-on-surface-variant shrink-0" />
      {label && <span className="text-xs text-on-surface-variant font-medium">{label}:</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-on-surface font-semibold outline-none cursor-pointer text-sm"
      >
        {options.map((opt) => (
          <option key={opt.value || opt} value={opt.value || opt} className="bg-surface text-on-surface">
            {opt.label || opt}
          </option>
        ))}
      </select>
    </div>
  );
}
