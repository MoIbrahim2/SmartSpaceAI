import { useState, useEffect } from "react";
import Modal from "../Shared/Modal";

export default function EditCommissionModal({ seller, isOpen, onClose, onUpdate }) {
  const [rate, setRate] = useState(12);

  useEffect(() => {
    if (seller) setRate(seller.commissionRate || 12);
  }, [seller]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(seller.id, rate);
    onClose();
  };

  if (!seller) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Update Commission: ${seller.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
            New Commission Rate (%)
          </label>
          <input
            required
            type="number"
            min="0"
            max="50"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="w-full rounded-xl bg-surface px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 border border-outline/20"
          />
          <p className="text-xs text-on-surface-variant mt-1.5">
            This rate will apply to all future marketplace sales by {seller.name}.
          </p>
        </div>

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
            className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white neo-shadow hover:bg-primary/90 transition-all"
          >
            Save Commission
          </button>
        </div>
      </form>
    </Modal>
  );
}
