import api from "./axios";

export const createSeller = async (sellerData) => {
  const res = await api.post("/admin/sellers", sellerData);
  return res.data;
};
