const User = require('../models/user.model');
const ApiError = require('../errors/ApiError');
const HTTP_STATUS = require('../constants/statusCodes');
const ROLES = require('../constants/roles');
const emailService = require('./email.service');
const crypto = require('crypto');
const { generateOtp, verifyOtp } = require('../helpers/otp.helper');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} = require('../helpers/token');
const {
  getGoogleAuthUrl: getGoogleUrlHelper,
  getGoogleTokens,
  getGoogleUserProfile
} = require('../helpers/googleOAuth.helper');

/**
 * Utility to hash a token using SHA-256
 * @param {string} token
 * @returns {string} Hex-encoded hash
 */
const hashToken = (token) => {
  if (!token) return '';
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Securely compare two hashes using constant-time check to prevent timing attacks
 * @param {string} storedHash
 * @param {string} incomingHash
 * @returns {boolean} True if they match
 */
const compareHash = (storedHash, incomingHash) => {
  if (!storedHash || !incomingHash) return false;
  const a = Buffer.from(storedHash, 'hex');
  const b = Buffer.from(incomingHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

/**
 * Register a new user in the database with PENDING_ACTIVATION and send OTP email
 * @param {Object} userData - User sign up details
 * @returns {Promise<Object>} The registered User instance and status
 */
const signUp = async (userData) => {
  const { firstName, lastName, email, dateOfBirth, password } = userData;

  // Normalize email to lowercase
  const normalizedEmail = email.toLowerCase();

  // Check if email already exists
  const existingUser = await User.findOne({ 'authentication.email': normalizedEmail });
  if (existingUser) {
    throw new ApiError(HTTP_STATUS.CONFLICT, 'auth.email_exists');
  }

  // Generate 6-digit OTP using helper
  const { rawCode, hashedCode, expiresAt } = generateOtp(15);

  // Create new user in PENDING_ACTIVATION state
  const newUser = await User.create({
    status: 'PENDING_ACTIVATION',
    verificationCode: hashedCode,
    verificationCodeExpiresAt: expiresAt,
    profile: {
      firstName,
      lastName,
      dateOfBirth,
      avatar: ''
    },
    authentication: {
      email: normalizedEmail,
      passwordHash: password,
      provider: 'local',
      emailVerified: false
    }
  });

  // Send email verification code
  await emailService.sendUserVerificationEmail({
    email: normalizedEmail,
    firstName,
    verificationCode: rawCode
  });

  return {
    user: newUser,
    requiresVerification: true
  };
};

/**
 * Verify user email address with 6-digit OTP code and issue tokens
 * @param {Object} data - { email, verificationCode }
 * @returns {Promise<Object>} User instance, accessToken, refreshToken
 */
const verifyEmailOtp = async (data) => {
  const { email, verificationCode } = data;
  if (!email || !verificationCode) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'fields.required');
  }

  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({
    'authentication.email': normalizedEmail
  }).select('+verificationCode');

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'user.not_found');
  }

  if (user.status === 'ACTIVE' && user.authentication.emailVerified) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'auth.already_activated');
  }

  const result = verifyOtp(verificationCode, user.verificationCode, user.verificationCodeExpiresAt);
  if (!result.isValid) {
    const errorKey = result.reason === 'code_expired' ? 'auth.code_expired' : 'auth.invalid_code';
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, errorKey);
  }

  // Mark user as ACTIVE and verified
  user.status = 'ACTIVE';
  user.authentication.emailVerified = true;
  user.activatedAt = new Date();
  user.verificationCode = undefined;
  user.verificationCodeExpiresAt = undefined;

  // Issue tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.authentication.refreshToken = hashToken(refreshToken);
  user.authentication.lastLogin = new Date();
  await user.save();

  return {
    user: user.toObject(),
    accessToken,
    refreshToken
  };
};

/**
 * Resend a 6-digit OTP code for regular user email verification
 * @param {Object} data - { email }
 */
const resendUserVerificationCode = async (data) => {
  const { email } = data;
  if (!email) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'fields.email');
  }

  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ 'authentication.email': normalizedEmail }).select('+verificationCode');

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'user.not_found');
  }

  if (user.status === 'ACTIVE' && user.authentication.emailVerified) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'auth.already_activated');
  }

  const { rawCode, hashedCode, expiresAt } = generateOtp(15);
  user.verificationCode = hashedCode;
  user.verificationCodeExpiresAt = expiresAt;
  await user.save();

  await emailService.sendUserVerificationEmail({
    email: normalizedEmail,
    firstName: user.profile?.firstName || 'User',
    verificationCode: rawCode
  });

  return { email: normalizedEmail };
};

/**
 * Initiate Forgot Password flow by sending a 6-digit OTP
 * @param {Object} data - { email }
 */
const forgotPassword = async (data) => {
  const { email } = data;
  if (!email) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'fields.email');
  }

  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ 'authentication.email': normalizedEmail }).select('+verificationCode');

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'user.not_found');
  }

  const { rawCode, hashedCode, expiresAt } = generateOtp(15);
  user.verificationCode = hashedCode;
  user.verificationCodeExpiresAt = expiresAt;
  await user.save();

  await emailService.sendPasswordResetEmail({
    email: normalizedEmail,
    firstName: user.profile?.firstName || 'User',
    verificationCode: rawCode
  });

  return { email: normalizedEmail };
};

/**
 * Reset password using 6-digit OTP code
 * @param {Object} data - { email, verificationCode, password, confirmPassword }
 */
const resetPassword = async (data) => {
  const { email, verificationCode, password, confirmPassword } = data;
  if (!email || !verificationCode || !password) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'fields.required');
  }

  if (password !== confirmPassword) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'auth.password_mismatch');
  }

  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({
    'authentication.email': normalizedEmail
  }).select('+verificationCode +authentication.passwordHash');

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'user.not_found');
  }

  const result = verifyOtp(verificationCode, user.verificationCode, user.verificationCodeExpiresAt);
  if (!result.isValid) {
    const errorKey = result.reason === 'code_expired' ? 'auth.code_expired' : 'auth.invalid_code';
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, errorKey);
  }

  // Update password (pre-save hook hashes it)
  user.authentication.passwordHash = password;
  user.verificationCode = undefined;
  user.verificationCodeExpiresAt = undefined;
  await user.save();

  return { email: normalizedEmail };
};

/**
 * Authenticate a user with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} User instance, accessToken, refreshToken
 */
const signIn = async (email, password) => {
  // Normalize email to lowercase
  const normalizedEmail = email.toLowerCase();

  // Explicitly select password field to perform verification
  const user = await User.findOne({ 'authentication.email': normalizedEmail }).select('+authentication.passwordHash');
  if (!user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'auth.invalid_credentials');
  }

  // Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'auth.invalid_credentials');
  }

  // Check user status
  if (user.status === 'PENDING_ACTIVATION') {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'auth.pending_activation');
  }
  if (user.status === 'SUSPENDED') {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'auth.suspended');
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Hash the refresh token before storing it in the database
  user.authentication.refreshToken = hashToken(refreshToken);
  user.authentication.lastLogin = new Date();
  await user.save();

  // Convert mongoose document to plain object and remove password/refresh token
  const userObj = user.toObject();

  return {
    user: userObj,
    accessToken,
    refreshToken
  };
};

/**
 * Activate a seller account using 6-digit OTP verification code and set password
 * @param {Object} activationData - email, verificationCode, password, confirmPassword
 */
const activateSeller = async (activationData) => {
  const { email, verificationCode, password, confirmPassword } = activationData;
  const normalizedEmail = email.toLowerCase();

  if (password && password !== confirmPassword) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'auth.password_mismatch');
  }

  // Find user and explicitly select verificationCode and passwordHash
  const user = await User.findOne({
    'authentication.email': normalizedEmail,
    role: ROLES.SELLER
  }).select('+verificationCode +authentication.passwordHash');

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'user.not_found');
  }

  if (user.status === 'ACTIVE') {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'auth.already_activated');
  }

  if (user.status !== 'PENDING_ACTIVATION') {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'auth.forbidden');
  }

  const result = verifyOtp(verificationCode, user.verificationCode, user.verificationCodeExpiresAt);
  if (!result.isValid) {
    const errorKey = result.reason === 'code_expired' ? 'auth.code_expired' : 'auth.invalid_code';
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, errorKey);
  }

  // Activate account
  if (password) {
    user.authentication.passwordHash = password;
  }
  user.authentication.emailVerified = true;
  user.status = 'ACTIVE';
  user.activatedAt = new Date();
  user.verificationCode = undefined;
  user.verificationCodeExpiresAt = undefined;

  await user.save();

  return user;
};

/**
 * Resend a 6-digit OTP verification code for seller activation
 * @param {Object} data - email
 */
const resendSellerCode = async (data) => {
  const { email } = data;
  const normalizedEmail = email.toLowerCase();

  const user = await User.findOne({
    'authentication.email': normalizedEmail,
    role: ROLES.SELLER
  }).select('+verificationCode');

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'user.not_found');
  }

  if (user.status === 'ACTIVE') {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'auth.already_activated');
  }

  if (user.status !== 'PENDING_ACTIVATION') {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'auth.forbidden');
  }

  const { rawCode, hashedCode, expiresAt } = generateOtp(15);
  user.verificationCode = hashedCode;
  user.verificationCodeExpiresAt = expiresAt;
  await user.save();

  // Send new email
  await emailService.sendSellerInvitationEmail({
    email: normalizedEmail,
    firstName: user.profile?.firstName || 'Seller',
    verificationCode: rawCode
  });

  return { email: normalizedEmail };
};

/**
 * Invalidate the user refresh token upon logout
 * @param {string} userId
 */
const logout = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'user.not_found');
  }

  // Remove refresh token from database
  user.authentication.refreshToken = null;
  await user.save();
};

/**
 * Verify refresh token and generate a new access token (and fresh refresh token)
 * @param {string} token - The incoming refresh token
 * @returns {Promise<Object>} New tokens and user details
 */
const refresh = async (token) => {
  if (!token) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'auth.invalid_refresh');
  }

  try {
    // Verify refresh token signature and validity
    const decoded = verifyRefreshToken(token);

    // Fetch user and select the stored hashed refreshToken
    const user = await User.findById(decoded.id).select('+authentication.refreshToken');
    const hashedIncoming = hashToken(token);

    if (!user || !compareHash(user.authentication.refreshToken, hashedIncoming)) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'auth.invalid_refresh');
    }

    // Generate new tokens (rotation)
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Store the new hashed refresh token
    user.authentication.refreshToken = hashToken(newRefreshToken);
    await user.save();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: user.toObject()
    };
  } catch (error) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'auth.invalid_refresh');
  }
};

/**
 * Generate Google OAuth consent screen URL
 * @returns {string} authorization URL
 */
const getGoogleAuthUrl = () => {
  return getGoogleUrlHelper();
};

/**
 * Process Google OAuth callback: exchange code, retrieve profile, find/create user, issue tokens
 * @param {string} code - Google authorization code
 * @returns {Promise<Object>} User instance, accessToken, refreshToken
 */
const googleCallback = async (code) => {
  if (!code) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'fields.required');
  }

  // 1. Exchange authorization code for Google tokens
  const tokens = await getGoogleTokens(code);

  // 2. Retrieve user profile from Google
  const profile = await getGoogleUserProfile(tokens.access_token);

  // 3. Extract and validate required profile fields
  const { email, email_verified, sub, given_name, family_name, name, picture } = profile;

  if (!email) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'auth.google_email_missing');
  }

  if (email_verified === false) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'auth.email_not_verified');
  }

  const normalizedEmail = email.toLowerCase();

  // 4. Find existing user or create a new user
  let user = await User.findOne({ 'authentication.email': normalizedEmail });

  if (user) {
    // Check if account is suspended
    if (user.status === 'SUSPENDED') {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'auth.suspended');
    }

    // If account was pending activation, mark as ACTIVE & verified via Google
    if (user.status === 'PENDING_ACTIVATION') {
      user.status = 'ACTIVE';
      user.authentication.emailVerified = true;
      user.activatedAt = new Date();
      user.verificationCode = undefined;
      user.verificationCodeExpiresAt = undefined;
    }

    // Link providerId if not already stored
    if (!user.authentication.providerId && sub) {
      user.authentication.providerId = sub;
    }

    // Set avatar if missing
    if (!user.profile?.avatar && picture) {
      user.profile.avatar = picture;
    }
  } else {
    // Create new user using Google profile information
    const firstName = given_name || (name ? name.split(' ')[0] : 'Google');
    const lastName = family_name || (name ? name.split(' ').slice(1).join(' ') : 'User') || 'User';

    user = new User({
      status: 'ACTIVE',
      activatedAt: new Date(),
      profile: {
        firstName,
        lastName,
        avatar: picture || ''
      },
      authentication: {
        email: normalizedEmail,
        provider: 'google',
        providerId: sub,
        emailVerified: true
      }
    });
  }

  // 5. Generate authentication tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.authentication.refreshToken = hashToken(refreshToken);
  user.authentication.lastLogin = new Date();
  await user.save();

  return {
    user: user.toObject(),
    accessToken,
    refreshToken
  };
};

module.exports = {
  signUp,
  signIn,
  logout,
  refresh,
  activateSeller,
  resendSellerCode,
  verifyEmailOtp,
  resendUserVerificationCode,
  forgotPassword,
  resetPassword,
  getGoogleAuthUrl,
  googleCallback
};

