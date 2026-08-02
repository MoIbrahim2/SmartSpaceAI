import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ isOpen, onClose, title, children }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl bg-surface-bright p-6 shadow-2xl border border-outline/10 z-10 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-outline/10 pb-4 mb-4">
          <h3 className="text-lg font-extrabold text-on-surface tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-on-surface-variant hover:text-primary transition-all neo-shadow neo-button"
            aria-label="Close modal"
          >
            <X className="size-5" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
