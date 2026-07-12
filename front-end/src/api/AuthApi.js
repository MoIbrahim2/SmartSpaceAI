import api from "./axios";

export const signup = (data) =>
  api.post("/auth/signup", {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    dateOfBirth: data.dateOfBirth,
    password: data.password,
    confirmPassword: data.confirmPassword,
  });

export const signin = (email, password) =>
  api.post("/auth/signin", { email, password });

export const logout = () => api.post("/auth/logout");

export const refreshToken = () => api.post("/auth/refresh");
