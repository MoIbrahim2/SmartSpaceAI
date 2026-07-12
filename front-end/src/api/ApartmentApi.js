import api from "./axios";

export const getApartments = (params) =>
  api.get("/apartments", { params });

export const getApartmentById = (id) =>
  api.get(`/apartments/${id}`);

export const createApartment = (formData) =>
  api.post("/apartments", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateApartment = (id, formData) =>
  api.patch(`/apartments/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteApartment = (id) =>
  api.delete(`/apartments/${id}`);
