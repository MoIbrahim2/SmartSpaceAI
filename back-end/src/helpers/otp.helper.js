const crypto = require('crypto');

/**
 * Reusable OTP Helper utility for code generation, hashing, and verification
 */

/**
 * Generate a 6-digit random verification code OTP with SHA-256 hash and expiration date
 * @param {number} expirationMinutes - Expiration time in minutes (default: 15)
 * @returns {Object} { rawCode, hashedCode, expiresAt }
 */
const generateOtp = (expirationMinutes = 15) => {
  const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedCode = crypto.createHash('sha256').update(rawCode).digest('hex');
  const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

  return {
    rawCode,
    hashedCode,
    expiresAt
  };
};

/**
 * Hash an incoming OTP string using SHA-256
 * @param {string} code
 * @returns {string} Hex-encoded SHA-256 hash
 */
const hashOtp = (code) => {
  if (!code) return '';
  return crypto.createHash('sha256').update(code.trim()).digest('hex');
};

/**
 * Verify an incoming raw OTP against a stored hash and expiration date
 * @param {string} rawCode
 * @param {string} storedHash
 * @param {Date|string} expiresAt
 * @returns {Object} { isValid, reason }
 */
const verifyOtp = (rawCode, storedHash, expiresAt) => {
  if (!rawCode || !storedHash) {
    return { isValid: false, reason: 'invalid_code' };
  }

  if (!expiresAt || new Date(expiresAt) < new Date()) {
    return { isValid: false, reason: 'code_expired' };
  }

  const incomingHash = hashOtp(rawCode);
  if (incomingHash !== storedHash) {
    return { isValid: false, reason: 'invalid_code' };
  }

  return { isValid: true };
};

module.exports = {
  generateOtp,
  hashOtp,
  verifyOtp
};
