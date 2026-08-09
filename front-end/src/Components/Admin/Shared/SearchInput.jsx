import { Search, X } from "lucide-react";

export default function SearchInput({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative w-full sm:w-72">
      <Search className="absolute left-3.5 rtl:right-3.5 rtl:left-auto top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl bg-surface-bright pl-10 pr-9 rtl:pr-10 rtl:pl-9 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:ring-2 focus:ring-primary/40 border border-outline/20 transition-all"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 rtl:left-3 rtl:right-auto top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
