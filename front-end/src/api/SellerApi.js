import api from "./axios";

export const getSellerProducts = async () => {
  const res = await api.get("/seller/products");
  return res.data;
};

export const getSellerProduct = async (id) => {
  const res = await api.get(`/seller/products/${id}`);
  return res.data;
};

export const createSellerProduct = async (productData) => {
  const res = await api.post("/seller/products", productData);
  return res.data;
};

export const updateSellerProduct = async (id, productData) => {
  const res = await api.patch(`/seller/products/${id}`, productData);
  return res.data;
};

export const deleteSellerProduct = async (id) => {
  const res = await api.delete(`/seller/products/${id}`);
  return res.data;
};

export const getSellerOrders = async () => {
  const res = await api.get("/seller/buy-requests");
  return res.data;
};

export const updateSellerOrderStatus = async (id, status) => {
  const res = await api.patch(`/seller/buy-requests/${id}/status`, { status });
  return res.data;
};

export const getSellerEarnings = async () => {
  const res = await api.get("/seller/earnings");
  return res.data;
};
