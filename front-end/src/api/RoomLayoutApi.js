import api from "./axios";

/**
 * Validate room layout (Step 1) — sends dimensions, budget, roomId, and image.
 * @param {FormData} formData - multipart/form-data with roomId, length_cm, width_cm, height_cm, budget_egp, image
 */
export const validateRoomLayout = (formData) =>
  api.post("/v1/rooms/validate", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

/**
 * Fetch existing validated room layout for a room.
 * @param {string} roomId - The room's ObjectId
 */
export const getRoomLayout = (roomId) =>
  api.get(`/v1/rooms/${roomId}/layout`);
