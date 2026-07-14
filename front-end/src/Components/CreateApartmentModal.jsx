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
      const msg = err.response?.data?.message || t("createModal.failedCreateApartment");
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
            {t("createModal.createApartmentTitle")}
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
              {t("createModal.nameLabel")} <span className="text-error">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder={t("createModal.namePlaceholderApt")}
              className="rounded-xl bg-surface-bright px-4 py-3 text-sm text-on-surface placeholder:text-outline border-none outline-none neo-inset focus:ring-0"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-on-surface pl-1">{t("createModal.descriptionLabel")}</label>
            <textarea
              name="description"
              rows={2}
              placeholder={t("createModal.descriptionPlaceholderApt")}
              className="rounded-xl bg-surface-bright px-4 py-3 text-sm text-on-surface placeholder:text-outline border-none outline-none neo-inset focus:ring-0 resize-none"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* Location: Country & City */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface pl-1">
                {t("createModal.countryLabel")} <span className="text-error">*</span>
              </label>
              <input
                type="text"
                name="country"
                required
                placeholder={t("createModal.countryPlaceholder")}
                className="rounded-xl bg-surface-bright px-4 py-3 text-sm text-on-surface placeholder:text-outline border-none outline-none neo-inset focus:ring-0"
                value={formData.country}
                onChange={handleChange}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface pl-1">
                {t("createModal.cityLabel")} <span className="text-error">*</span>
              </label>
              <input
                type="text"
                name="city"
                required
                placeholder={t("createModal.cityPlaceholder")}
                className="rounded-xl bg-surface-bright px-4 py-3 text-sm text-on-surface placeholder:text-outline border-none outline-none neo-inset focus:ring-0"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Location: District & Street */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface pl-1">{t("createModal.districtLabel")}</label>
              <input
                type="text"
                name="district"
                placeholder={t("createModal.districtPlaceholder")}
                className="rounded-xl bg-surface-bright px-4 py-3 text-sm text-on-surface placeholder:text-outline border-none outline-none neo-inset focus:ring-0"
                value={formData.district}
                onChange={handleChange}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface pl-1">{t("createModal.streetLabel")}</label>
              <input
                type="text"
                name="street"
                placeholder={t("createModal.streetPlaceholder")}
                className="rounded-xl bg-surface-bright px-4 py-3 text-sm text-on-surface placeholder:text-outline border-none outline-none neo-inset focus:ring-0"
                value={formData.street}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Building, Floor, Apt Number */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface pl-1">{t("createModal.buildingLabel")}</label>
              <input
                type="text"
                name="building"
                placeholder={t("createModal.buildingPlaceholder")}
                className="rounded-xl bg-surface-bright px-4 py-3 text-sm text-on-surface placeholder:text-outline border-none outline-none neo-inset focus:ring-0"
                value={formData.building}
                onChange={handleChange}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface pl-1">{t("createModal.floorLabel")}</label>
              <input
                type="number"
                name="floor"
                placeholder={t("createModal.floorPlaceholder")}
                className="rounded-xl bg-surface-bright px-4 py-3 text-sm text-on-surface placeholder:text-outline border-none outline-none neo-inset focus:ring-0"
                value={formData.floor}
                onChange={handleChange}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface pl-1">{t("createModal.aptNumberLabel")}</label>
              <input
                type="text"
                name="apartmentNumber"
                placeholder={t("createModal.aptNumberPlaceholder")}
                className="rounded-xl bg-surface-bright px-4 py-3 text-sm text-on-surface placeholder:text-outline border-none outline-none neo-inset focus:ring-0"
                value={formData.apartmentNumber}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Cover Image */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-on-surface pl-1">{t("createModal.coverImageLabel")}</label>
            <div
              onClick={() => document.getElementById("apt-cover-input").click()}
              className="flex cursor-pointer items-center gap-3 rounded-xl bg-surface-bright px-4 py-3 text-sm neo-inset transition-colors hover:bg-surface-bright/80"
            >
              <Icon name="image" size={20} className="text-primary" />
              <span className="text-on-surface-variant">
                {coverImage ? coverImage.name : t("createModal.clickToUploadImage")}
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
                {t("createModal.createApartmentBtn")}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
