import { useState } from "react";
import Modal from "../Shared/Modal";

export default function CreateSellerModal({ isOpen, onClose, onCreate }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    commissionRate: 12,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(form);
    setForm({ name: "", email: "", phone: "", commissionRate: 12 });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register New Seller">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
            Store / Seller Name
          </label>
          <input
            required
            type="text"
            placeholder="e.g. Artisans Studio"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-xl bg-surface px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 border border-outline/20"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
            Contact Email
          </label>
          <input
            required
            type="email"
            placeholder="seller@example.com"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            className="w-full rounded-xl bg-surface px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 border border-outline/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Phone Number
            </label>
            <input
              type="text"
              placeholder="+20 100 000 0000"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              className="w-full rounded-xl bg-surface px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 border border-outline/20"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Commission Rate (%)
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={form.commissionRate}
              onChange={(e) => setForm((prev) => ({ ...prev, commissionRate: e.target.value }))}
              className="w-full rounded-xl bg-surface px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 border border-outline/20"
            />
          </div>
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
            Create Seller
          </button>
        </div>
      </form>
    </Modal>
  );
}
