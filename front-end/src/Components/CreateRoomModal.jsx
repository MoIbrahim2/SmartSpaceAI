import { useState } from "react";
import Icon from "./Icon";
import { createRoom } from "../api";
import { useTranslation } from "react-i18next";

export default function CreateRoomModal({ isOpen, onClose, onCreated, apartmentId }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    roomType: "",
    description: "",
  });
  const [sourceImages, setSourceImages] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roomTypes = [
    "Living Room",
    "Bedroom",
    "Kitchen",
    "Bathroom",
    "Dining Room",
    "Office",
    "Studio",
    "Other",
  ];

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSourceImages(e.target.files);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("apartmentId", apartmentId);
      fd.append("name", formData.name);
      fd.append("roomType", formData.roomType);
      if (formData.description) fd.append("description", formData.description);

      // Default dimensions for backend validation schema
      const dimensions = {
        width: 10,
        length: 12,
        height: 9,
        unit: "ft",
      };
      fd.append("dimensions", JSON.stringify(dimensions));

      if (sourceImages) {
        Array.from(sourceImages).forEach((file) => {
          fd.append("sourceImages", file);
        });
      }

      const { data } = await createRoom(fd);
      if (data.success) {
        onCreated(data.data.room);
      }
    } catch (err) {
      const msg = err.response?.data?.message || t("createModal.failedCreateRoom") || "Failed to create room.";
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
            {t("createModal.createRoomTitle") || "Create New Room"}
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
              {t("createModal.roomNameLabel") || "Room Name"} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder={t("createModal.namePlaceholderRoom") || "e.g. Master Bedroom"}
              className="h-12 w-full rounded-xl border border-outline/20 dark:border-white/15 bg-background dark:bg-white/5 px-4 text-sm font-medium text-on-surface dark:text-white placeholder:text-outline/60 dark:placeholder:text-white/40 outline-none focus:border-[#a67443] dark:focus:border-amber-400 focus:bg-white dark:focus:bg-white/10 transition-all"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          {/* Room Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-extrabold text-[#44403c] dark:text-white/90 uppercase tracking-wider px-1">
              {t("createModal.roomTypeLabel") || "Room Type"} <span className="text-red-500">*</span>
            </label>
            <select
              name="roomType"
              required
              className="h-12 w-full rounded-xl border border-outline/20 dark:border-white/15 bg-background dark:bg-[#181614] px-4 text-sm font-medium text-on-surface dark:text-white outline-none focus:border-[#a67443] dark:focus:border-amber-400 cursor-pointer transition-all"
              value={formData.roomType}
              onChange={handleChange}
            >
              <option value="" disabled>{t("createModal.selectRoomType") || "Select room type"}</option>
              {roomTypes.map((type) => (
                <option key={type} value={type}>
                  {t(`createModal.roomType_${type.toLowerCase().replace(" ", "")}`) || type}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-extrabold text-[#44403c] dark:text-white/90 uppercase tracking-wider px-1">
              {t("createModal.descriptionLabel") || "Description"}
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder={t("createModal.descriptionPlaceholderRoom") || "Brief notes about room layout..."}
              className="w-full rounded-xl border border-outline/20 dark:border-white/15 bg-background dark:bg-white/5 px-4 py-3 text-sm font-medium text-on-surface dark:text-white placeholder:text-outline/60 dark:placeholder:text-white/40 outline-none focus:border-[#a67443] dark:focus:border-amber-400 focus:bg-white dark:focus:bg-white/10 transition-all resize-none"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* Source Images */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-extrabold text-[#44403c] dark:text-white/90 uppercase tracking-wider px-1">
              {t("createModal.roomPhotosLabel") || "Room Photos"}
            </label>
            <div
              onClick={() => document.getElementById("room-images-input").click()}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-outline/30 dark:border-white/20 bg-background dark:bg-white/5 px-4 py-3.5 text-sm transition-all hover:border-[#a67443] dark:hover:border-amber-400"
            >
              <Icon name="photo_camera" size={20} className="text-[#a67443] dark:text-amber-400 shrink-0" />
              <span className="truncate text-on-surface-variant dark:text-white/70 font-medium">
                {sourceImages
                  ? t("dashboard.filesSelected", { count: sourceImages.length }) || `${sourceImages.length} files selected`
                  : (t("createModal.clickToUploadPhotos") || "Click to upload room photos")}
              </span>
              <input
                type="file"
                id="room-images-input"
                className="hidden"
                accept="image/*"
                multiple
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
                <span>{t("createModal.createRoomBtn") || "Create Room"}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
