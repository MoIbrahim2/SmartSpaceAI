import api from "./axios";

export const createCheckout = (tier) =>
  api.post("/billing/create-checkout", { tier });

export const getPaymentHistory = (page = 1, limit = 10) =>
  api.get(`/billing/history?page=${page}&limit=${limit}`);
