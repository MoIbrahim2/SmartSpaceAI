const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/responseHelper');
const HTTP_STATUS = require('../constants/statusCodes');
const MESSAGES = require('../constants/messages');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Utility to parse duration strings (e.g. "7d", "30m", "2h") into milliseconds
 * @param {string} duration
 * @returns {number} duration in milliseconds
 */
const parseDurationToMs = (duration) => {
  if (!duration) return 7 * 24 * 60 * 60 * 1000; // default 7 days in ms
  const number = parseInt(duration, 10);
  const unit = duration.slice(-1).toLowerCase();
  switch (unit) {
    case 's': return number * 1000;
    case 'm': return number * 60 * 1000;
    case 'h': return number * 60 * 60 * 1000;
    case 'd': return number * 24 * 60 * 60 * 1000;
    default: return number; // fallback if already a number in ms
  }
};

/**
 * Dynamically build cookie options using process.env
 */
const getCookieOptions = () => {
  const expires = process.env.REFRESH_TOKEN_EXPIRES || '7d';
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: parseDurationToMs(expires)
  };
};

/**
 * Handle user registration
 */
const signup = asyncHandler(async (req, res) => {
  const newUser = await authService.signUp(req.body);
  return sendSuccess(res, MESSAGES.AUTH.SIGNUP_SUCCESS, { user: newUser }, HTTP_STATUS.CREATED);
});

/**
 * Handle user login
 */
const signin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.signIn(email, password);

  // Set the refresh token inside an HttpOnly Cookie
  res.cookie('refreshToken', refreshToken, getCookieOptions());

  // Return the access token in the response body
  return sendSuccess(res, MESSAGES.AUTH.SIGNIN_SUCCESS, {
    user,
    accessToken
  }, HTTP_STATUS.OK);
});

/**
 * Handle user logout
 */
const logout = asyncHandler(async (req, res) => {
  // If user is authenticated, invalidate the refresh token in the database
  if (req.user) {
    await authService.logout(req.user._id);
  }

  // Clear the refresh token cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  return sendSuccess(res, MESSAGES.AUTH.LOGOUT_SUCCESS, {}, HTTP_STATUS.OK);
});

/**
 * Refresh token and retrieve a new access token
 */
const refresh = asyncHandler(async (req, res) => {
  // Retrieve the refresh token from HttpOnly cookies
  const token = req.cookies.refreshToken;

  const { accessToken, refreshToken, user } = await authService.refresh(token);

  // Set the new rotated refresh token in HttpOnly Cookie
  res.cookie('refreshToken', refreshToken, getCookieOptions());

  return sendSuccess(res, MESSAGES.AUTH.REFRESH_SUCCESS, {
    user,
    accessToken
  }, HTTP_STATUS.OK);
});

module.exports = {
  signup,
  signin,
  logout,
  refresh
};
