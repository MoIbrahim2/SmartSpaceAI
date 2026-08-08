import { useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "../Shared/Modal";

export default function RejectReasonModal({ isOpen, onClose, onConfirm }) {
  const { t } = useTranslation();

  const presets = [
    { key: "reason1", label: t("admin.moderation.reason1") },
    { key: "reason2", label: t("admin.moderation.reason2") },
    { key: "reason3", label: t("admin.moderation.reason3") },
    { key: "reason4", label: t("admin.moderation.reason4") },
    { key: "reason5", label: t("admin.moderation.reason5") },
  ];

  const [reason, setReason] = useState("reason1");
  const [customReason, setCustomReason] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedPreset = presets.find((p) => p.key === reason);
    const finalReason = reason === "Other" ? customReason : selectedPreset ? selectedPreset.label : reason;
    onConfirm(finalReason);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("admin.moderation.rejectModalTitle")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          {presets.map((p) => (
            <label
              key={p.key}
              className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-outline/10 hover:border-primary/40 cursor-pointer transition-all text-xs font-semibold text-on-surface"
            >
              <input
                type="radio"
                name="rejectReason"
                value={p.key}
                checked={reason === p.key}
                onChange={() => setReason(p.key)}
                className="accent-primary size-4"
              />
              <span>{p.label}</span>
            </label>
          ))}
          <label className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-outline/10 hover:border-primary/40 cursor-pointer transition-all text-xs font-semibold text-on-surface">
            <input
              type="radio"
              name="rejectReason"
              value="Other"
              checked={reason === "Other"}
              onChange={() => setReason("Other")}
              className="accent-primary size-4"
            />
            <span>{t("admin.moderation.reasonOther")}</span>
          </label>
        </div>

        {reason === "Other" && (
          <textarea
            required
            rows={3}
            placeholder={t("admin.moderation.customPlaceholder")}
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            className="w-full rounded-xl bg-surface px-4 py-2.5 text-xs text-on-surface outline-none focus:ring-2 focus:ring-primary/40 border border-outline/20"
          />
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline/10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface border border-outline/20"
          >
            {t("admin.shared.cancel")}
          </button>
          <button
            type="submit"
            className="rounded-xl bg-error px-5 py-2 text-sm font-semibold text-white neo-shadow hover:bg-error/90 transition-all"
          >
            {t("admin.moderation.rejectBtn")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
