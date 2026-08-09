import { useState } from "react";
import Icon from "./Icon";
import { createApartment } from "../api";
import { useTranslation } from "react-i18next";

export default function CreateApartmentModal({ isOpen, onClose, onCreated }) {
  const { t } = useTranslation();
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
      const msg = err.response?.data?.message || t("createModal.failedCreateApartment") || "Failed to create apartment.";
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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl bg-surface dark:bg-[#12100e] p-7 md:p-8 shadow-2xl border border-outline/20 dark:border-white/15 text-on-surface dark:text-white transition-all">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b border-outline/10 dark:border-white/10 pb-4">
          <h2 className="text-2xl font-headline font-bold text-on-surface dark:text-white tracking-tight">
            {t("createModal.createApartmentTitle") || "Create New Apartment"}
          </h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-outline/20 dark:border-white/20 bg-background dark:bg-white/10 text-on-surface dark:text-white transition-all hover:bg-surface-variant dark:hover:bg-white/20"
            aria-label="Close modal"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-xl bg-red-500/15 px-4 py-3 text-xs font-medium text-red-700 dark:text-red-300 border border-red-500/30">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-extrabold text-[#44403c] dark:text-white/90 uppercase tracking-wider px-1">
              {t("createModal.nameLabel") || "Apartment Name"} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder={t("createModal.namePlaceholderApt") || "e.g. Modern Sunset Penthouse"}
              className="h-12 w-full rounded-xl border border-outline/20 dark:border-white/15 bg-background dark:bg-white/5 px-4 text-sm font-medium text-on-surface dark:text-white placeholder:text-outline/60 dark:placeholder:text-white/40 outline-none focus:border-[#a67443] dark:focus:border-amber-400 focus:bg-white dark:focus:bg-white/10 transition-all"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-extrabold text-[#44403c] dark:text-white/90 uppercase tracking-wider px-1">
              {t("createModal.descriptionLabel") || "Description"}
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder={t("createModal.descriptionPlaceholderApt") || "Brief overview of this property..."}
              className="w-full rounded-xl border border-outline/20 dark:border-white/15 bg-background dark:bg-white/5 px-4 py-3 text-sm font-medium text-on-surface dark:text-white placeholder:text-outline/60 dark:placeholder:text-white/40 outline-none focus:border-[#a67443] dark:focus:border-amber-400 focus:bg-white dark:focus:bg-white/10 transition-all resize-none"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* Location: Country & City */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-[#44403c] dark:text-white/90 uppercase tracking-wider px-1">
                {t("createModal.countryLabel") || "Country"} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="country"
                required
                placeholder={t("createModal.countryPlaceholder") || "Egypt"}
                className="h-12 w-full rounded-xl border border-outline/20 dark:border-white/15 bg-background dark:bg-white/5 px-4 text-sm font-medium text-on-surface dark:text-white placeholder:text-outline/60 dark:placeholder:text-white/40 outline-none focus:border-[#a67443] dark:focus:border-amber-400 focus:bg-white dark:focus:bg-white/10 transition-all"
                value={formData.country}
                onChange={handleChange}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-[#44403c] dark:text-white/90 uppercase tracking-wider px-1">
                {t("createModal.cityLabel") || "City"} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                required
                placeholder={t("createModal.cityPlaceholder") || "Cairo"}
                className="h-12 w-full rounded-xl border border-outline/20 dark:border-white/15 bg-background dark:bg-white/5 px-4 text-sm font-medium text-on-surface dark:text-white placeholder:text-outline/60 dark:placeholder:text-white/40 outline-none focus:border-[#a67443] dark:focus:border-amber-400 focus:bg-white dark:focus:bg-white/10 transition-all"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Location: District & Street */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-[#44403c] dark:text-white/90 uppercase tracking-wider px-1">
                {t("createModal.districtLabel") || "District"}
              </label>
              <input
                type="text"
                name="district"
                placeholder={t("createModal.districtPlaceholder") || "New Cairo"}
                className="h-12 w-full rounded-xl border border-outline/20 dark:border-white/15 bg-background dark:bg-white/5 px-4 text-sm font-medium text-on-surface dark:text-white placeholder:text-outline/60 dark:placeholder:text-white/40 outline-none focus:border-[#a67443] dark:focus:border-amber-400 focus:bg-white dark:focus:bg-white/10 transition-all"
                value={formData.district}
                onChange={handleChange}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-[#44403c] dark:text-white/90 uppercase tracking-wider px-1">
                {t("createModal.streetLabel") || "Street"}
              </label>
              <input
                type="text"
                name="street"
                placeholder={t("createModal.streetPlaceholder") || "90th Street"}
                className="h-12 w-full rounded-xl border border-outline/20 dark:border-white/15 bg-background dark:bg-white/5 px-4 text-sm font-medium text-on-surface dark:text-white placeholder:text-outline/60 dark:placeholder:text-white/40 outline-none focus:border-[#a67443] dark:focus:border-amber-400 focus:bg-white dark:focus:bg-white/10 transition-all"
                value={formData.street}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Building, Floor, Apt Number */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-[#44403c] dark:text-white/90 uppercase tracking-wider px-1">
                {t("createModal.buildingLabel") || "Building"}
              </label>
              <input
                type="text"
                name="building"
                placeholder="A1"
                className="h-12 w-full rounded-xl border border-outline/20 dark:border-white/15 bg-background dark:bg-white/5 px-3.5 text-sm font-medium text-on-surface dark:text-white outline-none focus:border-[#a67443] dark:focus:border-amber-400 focus:bg-white dark:focus:bg-white/10 transition-all"
                value={formData.building}
                onChange={handleChange}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-[#44403c] dark:text-white/90 uppercase tracking-wider px-1">
                {t("createModal.floorLabel") || "Floor"}
              </label>
              <input
                type="number"
                name="floor"
                placeholder="4"
                className="h-12 w-full rounded-xl border border-outline/20 dark:border-white/15 bg-background dark:bg-white/5 px-3.5 text-sm font-medium text-on-surface dark:text-white outline-none focus:border-[#a67443] dark:focus:border-amber-400 focus:bg-white dark:focus:bg-white/10 transition-all"
                value={formData.floor}
                onChange={handleChange}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-[#44403c] dark:text-white/90 uppercase tracking-wider px-1">
                {t("createModal.aptNumberLabel") || "Apt #"}
              </label>
              <input
                type="text"
                name="apartmentNumber"
                placeholder="402"
                className="h-12 w-full rounded-xl border border-outline/20 dark:border-white/15 bg-background dark:bg-white/5 px-3.5 text-sm font-medium text-on-surface dark:text-white outline-none focus:border-[#a67443] dark:focus:border-amber-400 focus:bg-white dark:focus:bg-white/10 transition-all"
                value={formData.apartmentNumber}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Cover Image */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-extrabold text-[#44403c] dark:text-white/90 uppercase tracking-wider px-1">
              {t("createModal.coverImageLabel") || "Cover Photo"}
            </label>
            <div
              onClick={() => document.getElementById("apt-cover-input").click()}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-outline/30 dark:border-white/20 bg-background dark:bg-white/5 px-4 py-3.5 text-sm transition-all hover:border-[#a67443] dark:hover:border-amber-400"
            >
              <Icon name="image" size={20} className="text-[#a67443] dark:text-amber-400 shrink-0" />
              <span className="truncate text-on-surface-variant dark:text-white/70 font-medium">
                {coverImage ? coverImage.name : (t("createModal.clickToUploadImage") || "Click to upload property cover image")}
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-3 flex h-13 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#a67443] hover:bg-[#946334] text-white font-bold text-base tracking-wide shadow-lg shadow-[#a67443]/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Icon name="add" size={20} />
                <span>{t("createModal.createApartmentBtn") || "Create Apartment"}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
