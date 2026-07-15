import api from "./axios";

/**
 * Submit contact message
 * @param {Object} contactData - { name, email, message }
 * @returns {Promise<Object>} API response
 */
export const submitContactMessage = (contactData) =>
  api.post("/contact", contactData);
