import api from "./axios";

export const getGenerations = (params) =>
  api.get("/generations", { params });

export const getGenerationById = (id) =>
  api.get(`/generations/${id}`);

export const getLatestGenerationForRoom = (roomId) =>
  api.get(`/generations/room/${roomId}/latest`);

export const createGeneration = (formData) =>
  api.post("/generations", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateGeneration = (id, formData) =>
  api.patch(`/generations/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteGeneration = (id) =>
  api.delete(`/generations/${id}`);

export const extractPreferences = (data) =>
  api.post("/generations/extract-preferences", data);

export const saveUserPrompt = (id, data) =>
  api.post(`/generations/${id}/save-prompt`, data);

export const saveResolution = (id, data) =>
  api.post(`/generations/${id}/save-resolution`, data);

export const saveSelectedProducts = (id, data) =>
  api.post(`/generations/${id}/save-products`, data);

export const generateRoomImage = (id, data = {}) =>
  api.post(`/generations/${id}/generate-image`, data);
