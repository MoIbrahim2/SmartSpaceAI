import { useState, useRef, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";

export default function ActionDropdown({ actions = [] }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 rounded-xl text-on-surface-variant hover:text-primary transition-all neo-shadow neo-button"
        aria-label="Actions menu"
      >
        <MoreHorizontal className="size-4" />
      </button>

      {open && (
        <div className="absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-44 rounded-xl bg-surface-bright p-1.5 shadow-xl border border-outline/20 z-30 animate-in fade-in zoom-in-95 duration-150">
          {actions.map((action, idx) => {
            const IconComp = action.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  setOpen(false);
                  action.onClick();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                  action.variant === "danger"
                    ? "text-error hover:bg-error/10"
                    : "text-on-surface hover:bg-surface hover:text-primary"
                }`}
              >
                {IconComp && <IconComp className="size-4 shrink-0" />}
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
