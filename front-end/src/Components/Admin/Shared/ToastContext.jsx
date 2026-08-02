import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let bgClass = "bg-emerald-600 text-white";
          let IconComp = CheckCircle2;

          if (toast.type === "error") {
            bgClass = "bg-error text-white";
            IconComp = XCircle;
          } else if (toast.type === "warning") {
            bgClass = "bg-amber-600 text-white";
            IconComp = AlertTriangle;
          } else if (toast.type === "info") {
            bgClass = "bg-primary text-white";
            IconComp = Info;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl px-4 py-3 shadow-xl transition-all animate-in slide-in-from-bottom-3 duration-200 ${bgClass}`}
            >
              <div className="flex items-center gap-2.5 text-sm font-semibold">
                <IconComp className="size-5 shrink-0" />
                <span>{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="rounded-lg p-1 hover:bg-white/20 transition-all"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return { showToast: (msg) => console.log("Toast:", msg) };
  }
  return context;
}
