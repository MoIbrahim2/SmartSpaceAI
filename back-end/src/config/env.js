require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV || 'development';

// In production, block start-up if security secrets are missing or using insecure fallbacks
if (NODE_ENV === 'production') {
  if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET === 'fallback_access_secret') {
    console.error('FATAL ERROR: JWT_ACCESS_SECRET is required and must not be default in production!');
    process.exit(1);
  }
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET === 'fallback_refresh_secret') {
    console.error('FATAL ERROR: JWT_REFRESH_SECRET is required and must not be default in production!');
    process.exit(1);
  }
}

module.exports = {
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/smartspace_db',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'fallback_access_secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
  ACCESS_TOKEN_EXPIRES: process.env.ACCESS_TOKEN_EXPIRES || '15m',
  REFRESH_TOKEN_EXPIRES: process.env.REFRESH_TOKEN_EXPIRES || '7d',
  REFRESH_TOKEN_COOKIE_MAX_AGE: parseInt(process.env.REFRESH_TOKEN_COOKIE_MAX_AGE, 10) || 7 * 24 * 60 * 60 * 1000, // 7 days default
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  NODE_ENV
};
