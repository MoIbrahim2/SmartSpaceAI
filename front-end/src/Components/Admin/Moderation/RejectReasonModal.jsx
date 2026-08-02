import { useState } from "react";
import Modal from "../Shared/Modal";

const presetReasons = [
  "Inaccurate AI category match",
  "Low resolution or invalid product image",
  "Incorrect pricing or currency format",
  "Prohibited or unsupported furniture item",
  "Missing material & dimension specifications",
];

export default function RejectReasonModal({ isOpen, onClose, onConfirm }) {
  const [reason, setReason] = useState(presetReasons[0]);
  const [customReason, setCustomReason] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalReason = reason === "Other" ? customReason : reason;
    onConfirm(finalReason);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Rejection Reason">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          {presetReasons.map((r) => (
            <label
              key={r}
              className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-outline/10 hover:border-primary/40 cursor-pointer transition-all text-xs font-semibold text-on-surface"
            >
              <input
                type="radio"
                name="rejectReason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
                className="accent-primary size-4"
              />
              <span>{r}</span>
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
            <span>Other Reason (Custom)</span>
          </label>
        </div>

        {reason === "Other" && (
          <textarea
            required
            rows={3}
            placeholder="Type custom rejection feedback for the seller..."
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
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-error px-5 py-2 text-sm font-semibold text-white neo-shadow hover:bg-error/90 transition-all"
          >
            Reject Product
          </button>
        </div>
      </form>
    </Modal>
  );
}
