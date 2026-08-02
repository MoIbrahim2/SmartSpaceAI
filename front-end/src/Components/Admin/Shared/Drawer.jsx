import { useEffect } from "react";
import { X } from "lucide-react";

export default function Drawer({ isOpen, onClose, title, children }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-surface-bright p-6 shadow-2xl border-l border-outline/10 flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-outline/10 pb-4 mb-4">
            <h3 className="text-lg font-extrabold text-on-surface tracking-tight">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-on-surface-variant hover:text-primary transition-all neo-shadow neo-button"
              aria-label="Close drawer"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
