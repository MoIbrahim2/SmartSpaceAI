import api from "./axios";

export const createSeller = async (sellerData) => {
  const res = await api.post("/admin/sellers", sellerData);
  return res.data;
};

export const getSellers = async () => {
  const res = await api.get("/admin/sellers");
  return res.data;
};

export const updateSellerCommission = async (id, commissionRate) => {
  const res = await api.patch(`/admin/sellers/${id}/commission`, { commissionRate });
  return res.data;
};

export const deleteSeller = async (id) => {
  const res = await api.delete(`/admin/sellers/${id}`);
  return res.data;
};
