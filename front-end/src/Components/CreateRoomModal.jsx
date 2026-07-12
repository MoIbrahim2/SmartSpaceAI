import { useState } from "react";
import Icon from "./Icon";
import { createRoom } from "../api";

export default function CreateRoomModal({ isOpen, onClose, onCreated, apartmentId }) {
  const [formData, setFormData] = useState({
    name: "",
    roomType: "",
    description: "",
    width: "",
    length: "",
    height: "",
    unit: "ft",
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

      const dimensions = {
        width: Number(formData.width),
        length: Number(formData.length),
        height: Number(formData.height),
        unit: formData.unit,
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
      const msg = err.response?.data?.message || "Failed to create room.";
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
            Create Room
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
              Room Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. Master Bedroom"
              className="rounded-xl bg-surface-bright px-4 py-3 text-sm text-on-surface placeholder:text-outline border-none outline-none neo-inset focus:ring-0"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          {/* Room Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-on-surface pl-1">
              Room Type <span className="text-error">*</span>
            </label>
            <select
              name="roomType"
              required
              className="rounded-xl bg-surface-bright px-4 py-3 text-sm text-on-surface border-none outline-none neo-inset focus:ring-0 appearance-none cursor-pointer"
              value={formData.roomType}
              onChange={handleChange}
            >
              <option value="" disabled>Select room type...</option>
              {roomTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-on-surface pl-1">Description</label>
            <textarea
              name="description"
              rows={2}
              placeholder="Brief description of the room..."
              className="rounded-xl bg-surface-bright px-4 py-3 text-sm text-on-surface placeholder:text-outline border-none outline-none neo-inset focus:ring-0 resize-none"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* Dimensions */}
          <div>
            <label className="text-sm font-semibold text-on-surface pl-1 mb-2 block">
              Dimensions <span className="text-error">*</span>
            </label>
            <div className="grid grid-cols-4 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-on-surface-variant pl-1">Width</span>
                <input
                  type="number"
                  name="width"
                  required
                  placeholder="10"
                  className="rounded-xl bg-surface-bright px-3 py-2.5 text-sm text-on-surface placeholder:text-outline border-none outline-none neo-inset focus:ring-0"
                  value={formData.width}
                  onChange={handleChange}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-on-surface-variant pl-1">Length</span>
                <input
                  type="number"
                  name="length"
                  required
                  placeholder="12"
                  className="rounded-xl bg-surface-bright px-3 py-2.5 text-sm text-on-surface placeholder:text-outline border-none outline-none neo-inset focus:ring-0"
                  value={formData.length}
                  onChange={handleChange}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-on-surface-variant pl-1">Height</span>
                <input
                  type="number"
                  name="height"
                  required
                  placeholder="9"
                  className="rounded-xl bg-surface-bright px-3 py-2.5 text-sm text-on-surface placeholder:text-outline border-none outline-none neo-inset focus:ring-0"
                  value={formData.height}
                  onChange={handleChange}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-on-surface-variant pl-1">Unit</span>
                <select
                  name="unit"
                  className="rounded-xl bg-surface-bright px-3 py-2.5 text-sm text-on-surface border-none outline-none neo-inset focus:ring-0 appearance-none cursor-pointer"
                  value={formData.unit}
                  onChange={handleChange}
                >
                  <option value="ft">ft</option>
                  <option value="m">m</option>
                </select>
              </div>
            </div>
          </div>

          {/* Source Images */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-on-surface pl-1">Room Photos</label>
            <div
              onClick={() => document.getElementById("room-images-input").click()}
              className="flex cursor-pointer items-center gap-3 rounded-xl bg-surface-bright px-4 py-3 text-sm neo-inset transition-colors hover:bg-surface-bright/80"
            >
              <Icon name="photo_camera" size={20} className="text-primary" />
              <span className="text-on-surface-variant">
                {sourceImages
                  ? `${sourceImages.length} file(s) selected`
                  : "Click to upload room photos..."}
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
                Create Room
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
