const MESSAGES = {
  AUTH: {
    SIGNUP_SUCCESS: 'User signed up successfully',
    SIGNIN_SUCCESS: 'User signed in successfully',
    LOGOUT_SUCCESS: 'User logged out successfully',
    REFRESH_SUCCESS: 'Token refreshed successfully',
    EMAIL_EXISTS: 'Email is already registered',
    PASSWORD_MISMATCH: 'Password and password confirmation do not match',
    INVALID_CREDENTIALS: 'Invalid email or password',
    UNAUTHORIZED: 'Access denied. No token provided',
    INVALID_TOKEN: 'Invalid or expired access token',
    INVALID_REFRESH: 'Invalid or expired refresh token'
  },
  USER: {
    PROFILE_FETCHED: 'Profile fetched successfully',
    PROFILE_UPDATED: 'Profile updated successfully',
    NOT_FOUND: 'User not found'
  },
  GENERAL: {
    ROUTE_NOT_FOUND: 'Requested resource not found',
    SERVER_ERROR: 'Internal server error',
    RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later'
  }
};

module.exports = MESSAGES;
