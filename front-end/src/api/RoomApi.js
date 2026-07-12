import api from "./axios";

export const getRooms = (params) =>
  api.get("/rooms", { params });

export const getRoomById = (id) =>
  api.get(`/rooms/${id}`);

export const createRoom = (formData) =>
  api.post("/rooms", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateRoom = (id, formData) =>
  api.patch(`/rooms/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteRoom = (id) =>
  api.delete(`/rooms/${id}`);
