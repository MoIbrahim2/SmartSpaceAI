import { useState } from "react";
import Modal from "../Shared/Modal";

export default function CreateSellerModal({ isOpen, onClose, onCreate }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    base_commission_percentage: 12,
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.firstName.trim()) {
      setError("First name is required.");
      return;
    }
    if (!form.lastName.trim()) {
      setError("Last name or store name is required.");
      return;
    }
    if (!form.email.trim()) {
      setError("Email address is required.");
      return;
    }

    setSubmitting(true);
    try {
      await onCreate({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        base_commission_percentage: Number(form.base_commission_percentage),
      });
      setForm({ firstName: "", lastName: "", email: "", base_commission_percentage: 12 });
      setError("");
      onClose();
    } catch (err) {
      let message = "Failed to register seller.";
      if (err?.response?.data?.errors && Array.isArray(err.response.data.errors) && err.response.data.errors.length > 0) {
        message = err.response.data.errors.map((e) => (typeof e === "string" ? e : e.message)).join(". ");
      } else if (err?.response?.data?.message) {
        message = err.response.data.message;
      } else if (err?.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Register New Seller">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-error/10 border border-error/20 p-3 text-xs font-semibold text-error">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              First Name *
            </label>
            <input
              required
              type="text"
              placeholder="e.g. Hassan"
              value={form.firstName}
              onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
              className="w-full rounded-xl bg-surface px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 border border-outline/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Last Name / Store *
            </label>
            <input
              required
              type="text"
              placeholder="e.g. Woodcrafts"
              value={form.lastName}
              onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
              className="w-full rounded-xl bg-surface px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 border border-outline/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
            Contact Email *
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

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
            Commission Rate (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={form.base_commission_percentage}
            onChange={(e) => setForm((prev) => ({ ...prev, base_commission_percentage: e.target.value }))}
            className="w-full rounded-xl bg-surface px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 border border-outline/20"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline/10">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface border border-outline/20 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white neo-shadow hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {submitting ? "Registering..." : "Create Seller"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
