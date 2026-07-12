import api from "./axios";

export const getGenerations = (params) =>
  api.get("/generations", { params });

export const getGenerationById = (id) =>
  api.get(`/generations/${id}`);

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
