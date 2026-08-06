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

export const activateSeller = (data) =>
  api.post("/auth/activate-seller", {
    email: data.email,
    verificationCode: data.verificationCode,
    ...(data.password ? { password: data.password } : {}),
    ...(data.confirmPassword ? { confirmPassword: data.confirmPassword } : {}),
  });

export const resendSellerCode = (email) =>
  api.post("/auth/resend-seller-code", { email });

export const verifyEmail = (email, verificationCode) =>
  api.post("/auth/verify-email", { email, verificationCode });

export const resendVerificationCode = (email) =>
  api.post("/auth/resend-verification-code", { email });

export const forgotPassword = (email) =>
  api.post("/auth/forgot-password", { email });

export const resetPassword = (data) =>
  api.post("/auth/reset-password", {
    email: data.email,
    verificationCode: data.verificationCode,
    password: data.password,
    confirmPassword: data.confirmPassword,
  });


