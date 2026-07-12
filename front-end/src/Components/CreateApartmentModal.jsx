import { useState } from "react";
import Icon from "./Icon";
import { createApartment } from "../api";

export default function CreateApartmentModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    country: "",
    city: "",
    district: "",
    street: "",
    building: "",
    floor: "",
    apartmentNumber: "",
  });
  const [coverImage, setCoverImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCoverImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("name", formData.name);
      if (formData.description) fd.append("description", formData.description);

      const location = {
        country: formData.country,
        city: formData.city,
      };
      if (formData.district) location.district = formData.district;
      if (formData.street) location.street = formData.street;
      if (formData.building) location.building = formData.building;
      if (formData.floor) location.floor = Number(formData.floor);
      if (formData.apartmentNumber) location.apartmentNumber = formData.apartmentNumber;

      fd.append("location", JSON.stringify(location));
      if (coverImage) fd.append("coverImage", coverImage);

      const { data } = await createApartment(fd);
      if (data.success) {
        onCreated(data.data.apartment);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create apartment.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-on-surface/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[2rem] bg-surface-bright p-8 neo-shadow">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-on-surface">
            Create Apartment
          </h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-bright text-on-surface-variant transition-all hover:text-on-surface neo-shadow neo-button"
            aria-label="Close modal"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-error/10 px-5 py-3 text-sm font-medium text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-on-surface pl-1">
              Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. My Studio Apartment"
              className="rounded-xl bg-surface-bright px-4 py-3 text-sm text-on-surface placeholder:text-outline border-none outline-none neo-inset focus:ring-0"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-on-surface pl-1">Description</label>
            <textarea
              name="description"
              rows={2}
              placeholder="Brief description of your apartment..."
              className="rounded-xl bg-surface-bright px-4 py-3 text-sm text-on-surface placeholder:text-outline border-none outline-none neo-inset focus:ring-0 resize-none"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* Location: Country & City */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface pl-1">
                Country <span className="text-error">*</span>
              </label>
              <input
                type="text"
                name="country"
                required
                placeholder="e.g. Egypt"
                className="rounded-xl bg-surface-bright px-4 py-3 text-sm text-on-surface placeholder:text-outline border-none outline-none neo-inset focus:ring-0"
                value={formData.country}
                onChange={handleChange}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface pl-1">
                City <span className="text-error">*</span>
              </label>
              <input
                type="text"
                name="city"
                required
                placeholder="e.g. Cairo"
                className="rounded-xl bg-surface-bright px-4 py-3 text-sm text-on-surface placeholder:text-outline border-none outline-none neo-inset focus:ring-0"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Location: District & Street */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface pl-1">District</label>
              <input
                type="text"
                name="district"
                placeholder="e.g. Maadi"
                className="rounded-xl bg-surface-bright px-4 py-3 text-sm text-on-surface placeholder:text-outline border-none outline-none neo-inset focus:ring-0"
                value={formData.district}
                onChange={handleChange}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface pl-1">Street</label>
              <input
                type="text"
                name="street"
                placeholder="e.g. 15 Nile St"
                className="rounded-xl bg-surface-bright px-4 py-3 text-sm text-on-surface placeholder:text-outline border-none outline-none neo-inset focus:ring-0"
                value={formData.street}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Building, Floor, Apt Number */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface pl-1">Building</label>
              <input
                type="text"
                name="building"
                placeholder="e.g. A"
                className="rounded-xl bg-surface-bright px-4 py-3 text-sm text-on-surface placeholder:text-outline border-none outline-none neo-inset focus:ring-0"
                value={formData.building}
                onChange={handleChange}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface pl-1">Floor</label>
              <input
                type="number"
                name="floor"
                placeholder="e.g. 3"
                className="rounded-xl bg-surface-bright px-4 py-3 text-sm text-on-surface placeholder:text-outline border-none outline-none neo-inset focus:ring-0"
                value={formData.floor}
                onChange={handleChange}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface pl-1">Apt #</label>
              <input
                type="text"
                name="apartmentNumber"
                placeholder="e.g. 5B"
                className="rounded-xl bg-surface-bright px-4 py-3 text-sm text-on-surface placeholder:text-outline border-none outline-none neo-inset focus:ring-0"
                value={formData.apartmentNumber}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Cover Image */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-on-surface pl-1">Cover Image</label>
            <div
              onClick={() => document.getElementById("apt-cover-input").click()}
              className="flex cursor-pointer items-center gap-3 rounded-xl bg-surface-bright px-4 py-3 text-sm neo-inset transition-colors hover:bg-surface-bright/80"
            >
              <Icon name="image" size={20} className="text-primary" />
              <span className="text-on-surface-variant">
                {coverImage ? coverImage.name : "Click to upload an image..."}
              </span>
              <input
                type="file"
                id="apt-cover-input"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-14 items-center justify-center gap-2 rounded-full bg-primary px-8 font-bold text-white transition-all hover:bg-on-primary-fixed-variant neo-shadow neo-button disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Icon name="add" size={20} />
                Create Apartment
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
