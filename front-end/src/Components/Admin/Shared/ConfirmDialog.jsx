import Modal from "./Modal";
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  variant = "primary",
}) {
  const { t } = useTranslation();
  const effectiveConfirmText = confirmText || t("admin.shared.confirm");

  let btnClass = "bg-primary text-white hover:bg-primary/90";
  let IconComp = Info;

  if (variant === "danger") {
    btnClass = "bg-error text-white hover:bg-error/90";
    IconComp = AlertTriangle;
  } else if (variant === "success") {
    btnClass = "bg-emerald-600 text-white hover:bg-emerald-700";
    IconComp = CheckCircle2;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <div
            className={`rounded-xl p-3 shrink-0 ${
              variant === "danger"
                ? "bg-error/10 text-error"
                : variant === "success"
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-primary/10 text-primary"
            }`}
          >
            <IconComp className="size-6" />
          </div>
          <p className="text-sm font-medium text-on-surface-variant leading-relaxed mt-1">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-outline/10 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface border border-outline/20 transition-all"
          >
            {t("admin.shared.cancel")}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`rounded-xl px-5 py-2 text-sm font-semibold neo-shadow transition-all ${btnClass}`}
          >
            {effectiveConfirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
