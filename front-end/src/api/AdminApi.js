import api from "./axios";

/**
 * Fetch aggregated Admin Dashboard stats & chart data
 */
export const getDashboardStats = async () => {
  const { data } = await api.get("/admin/dashboard");
  return data.data;
};

/**
 * Fetch paginated list of sellers with optional filters
 */
export const getSellers = async (params = {}) => {
  const { data } = await api.get("/admin/sellers", { params });
  return data.data;
};

/**
 * Fetch detailed info for a single seller
 */
export const getSellerById = async (id) => {
  const { data } = await api.get(`/admin/sellers/${id}`);
  return data.data;
};

/**
 * Create a new seller account
 */
export const createSeller = async (sellerData) => {
  const { data } = await api.post("/admin/sellers", sellerData);
  return data.data;
};

/**
 * Update seller base commission percentage
 */
export const updateSellerCommission = async (id, baseCommissionPercentage) => {
  const { data } = await api.patch(`/admin/sellers/${id}/commission`, {
    base_commission_percentage: baseCommissionPercentage,
  });
  return data.data;
};

/**
 * Fetch paginated list of orders
 */
export const getOrders = async (params = {}) => {
  const { data } = await api.get("/admin/orders", { params });
  return data.data;
};

/**
 * Fetch detailed info for a single order
 */
export const getOrderById = async (id) => {
  const { data } = await api.get(`/admin/orders/${id}`);
  return data.data;
};

/**
 * Create a new order
 */
export const createOrder = async (orderData) => {
  const { data } = await api.post("/admin/orders", orderData);
  return data.data;
};

/**
 * Update order status
 */
export const updateOrderStatus = async (id, status, notes = "") => {
  const { data } = await api.patch(`/admin/orders/${id}/status`, { status, notes });
  return data.data;
};

/**
 * Fetch monthly commission breakdown reports
 */
export const getMonthlyCommissions = async (params = {}) => {
  const { data } = await api.get("/admin/commission/monthly", { params });
  return data.data;
};

/**
 * Fetch seller commission history
 */
export const getSellerCommissionHistory = async (sellerId) => {
  const { data } = await api.get(`/admin/commission/sellers/${sellerId}`);
  return data.data;
};

/**
 * Mark a seller's monthly commission payout as paid
 */
export const markCommissionPaid = async (payoutData) => {
  const { data } = await api.post("/admin/commission/mark-paid", payoutData);
  return data.data;
};

/**
 * Fetch products in moderation queue
 */
export const getModerationItems = async (params = {}) => {
  const { data } = await api.get("/admin/moderation", { params });
  return data.data;
};

/**
 * Update moderation status for a product (e.g. ACCEPTED, REJECTED)
 */
export const updateModerationStatus = async (id, status, notes = "") => {
  const { data } = await api.patch(`/admin/moderation/${id}`, { status, notes });
  return data.data;
};
