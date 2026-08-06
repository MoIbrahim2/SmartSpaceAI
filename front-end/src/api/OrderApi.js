import api from "./axios";

/**
 * Submit checkout payload (items + shippingAddress + optional paymentMethod)
 */
export const checkoutOrders = (data) =>
  api.post("/orders/checkout", data);

/**
 * Retrieve authenticated user's orders history
 */
export const getMyOrders = () =>
  api.get("/orders/my-orders");

/**
 * Get single order details
 */
export const getOrderById = (id) =>
  api.get(`/orders/${id}`);
