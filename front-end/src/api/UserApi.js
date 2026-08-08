import api from "./axios";

export const getProfile = () =>
  api.get("/users/profile");

export const getCredits = () =>
  api.get("/users/credits");

export const editProfile = (formData) =>
  api.patch("/users/profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const changePassword = (data) =>
  api.patch("/users/change-password", {
    currentPassword: data.currentPassword,
    newPassword: data.newPassword,
    confirmPassword: data.confirmPassword,
  });

