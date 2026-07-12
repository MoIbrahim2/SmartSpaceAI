import api from "./axios";

export const getProfile = () =>
  api.get("/users/profile");

export const editProfile = (formData) =>
  api.patch("/users/profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
