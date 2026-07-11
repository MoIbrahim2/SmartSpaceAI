const jwt = require('jsonwebtoken');

const getAccessSecret = () => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (process.env.NODE_ENV === 'production' && (!secret || secret === 'fallback_access_secret')) {
    throw new Error('FATAL: JWT_ACCESS_SECRET is required and must be secure in production!');
  }
  return secret || 'fallback_access_secret';
};

const getRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (process.env.NODE_ENV === 'production' && (!secret || secret === 'fallback_refresh_secret')) {
    throw new Error('FATAL: JWT_REFRESH_SECRET is required and must be secure in production!');
  }
  return secret || 'fallback_refresh_secret';
};

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, getAccessSecret(), {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '15m'
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, getRefreshSecret(), {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES || '7d'
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, getAccessSecret());
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, getRefreshSecret());
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
