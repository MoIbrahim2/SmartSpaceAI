const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/responseHelper');
const HTTP_STATUS = require('../constants/statusCodes');
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
  const result = await authService.signUp(req.body);

  return sendSuccess(res, 'auth.verification_sent', {
    user: result.user,
    requiresVerification: true
  }, HTTP_STATUS.CREATED);
});

/**
 * Handle user email OTP verification
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.verifyEmailOtp(req.body);

  // Set the refresh token inside an HttpOnly Cookie
  res.cookie('refreshToken', refreshToken, getCookieOptions());

  return sendSuccess(res, 'auth.verification_success', {
    user,
    accessToken
  }, HTTP_STATUS.OK);
});

/**
 * Handle resending user verification OTP
 */
const resendUserVerificationCode = asyncHandler(async (req, res) => {
  const result = await authService.resendUserVerificationCode(req.body);
  return sendSuccess(res, 'auth.code_resent', result, HTTP_STATUS.OK);
});

/**
 * Handle forgot password request
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body);
  return sendSuccess(res, 'auth.forgot_password_sent', result, HTTP_STATUS.OK);
});

/**
 * Handle password reset
 */
const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);
  return sendSuccess(res, 'auth.password_reset_success', result, HTTP_STATUS.OK);
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
  return sendSuccess(res, 'auth.signin_success', {
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

  return sendSuccess(res, 'auth.logout_success', {}, HTTP_STATUS.OK);
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

  return sendSuccess(res, 'auth.refresh_success', {
    user,
    accessToken
  }, HTTP_STATUS.OK);
});

/**
 * Handle seller account activation
 */
const activateSeller = asyncHandler(async (req, res) => {
  const user = await authService.activateSeller(req.body);
  return sendSuccess(res, 'auth.activation_success', { user }, HTTP_STATUS.OK);
});

/**
 * Handle resending seller activation code
 */
const resendSellerCode = asyncHandler(async (req, res) => {
  const result = await authService.resendSellerCode(req.body);
  return sendSuccess(res, 'auth.code_resent', result, HTTP_STATUS.OK);
});

/**
 * Redirect user to Google OAuth consent screen
 */
const redirectToGoogle = asyncHandler(async (req, res) => {
  const url = authService.getGoogleAuthUrl();
  return res.redirect(url);
});

/**
 * Handle Google OAuth callback from Google consent screen
 */
const googleCallback = asyncHandler(async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    return res.redirect(`${clientUrl}/login?error=${encodeURIComponent(error)}`);
  }

  const { user, accessToken, refreshToken } = await authService.googleCallback(code);

  // Set the refresh token in HttpOnly Cookie
  res.cookie('refreshToken', refreshToken, getCookieOptions());

  // Check if client expects JSON response or HTML redirect
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return sendSuccess(res, 'auth.signin_success', {
      user,
      accessToken
    }, HTTP_STATUS.OK);
  }

  // Redirect to frontend application with accessToken
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  return res.redirect(`${clientUrl}/login?token=${encodeURIComponent(accessToken)}`);
});

module.exports = {
  signup,
  signin,
  logout,
  refresh,
  activateSeller,
  resendSellerCode,
  verifyEmail,
  resendUserVerificationCode,
  forgotPassword,
  resetPassword,
  redirectToGoogle,
  googleCallback
};

