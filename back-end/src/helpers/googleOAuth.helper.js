const ApiError = require('../errors/ApiError');
const HTTP_STATUS = require('../constants/statusCodes');

/**
 * Generate Google OAuth authorization URL
 * @returns {string} Google authorization URL
 */
const getGoogleAuthUrl = () => {
  const authUrl = process.env.GOOGLE_AUTH_URL || 'https://accounts.google.com/o/oauth2/v2/auth';
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback';

  if (!clientId) {
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Google OAuth Client ID is not configured');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent'
  });

  return `${authUrl}?${params.toString()}`;
};

/**
 * Exchange authorization code for Google tokens
 * @param {string} code - Google authorization code
 * @returns {Promise<Object>} Google tokens object containing access_token
 */
const getGoogleTokens = async (code) => {
  const tokenUrl = process.env.GOOGLE_TOKEN_URL || 'https://oauth2.googleapis.com/token';
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback';

  if (!clientId || !clientSecret) {
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Google OAuth credentials are not configured');
  }

  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  });

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Google token exchange error:', data);
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, data.error_description || 'Failed to exchange authorization code with Google');
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Google token fetch error:', error);
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'auth.google_auth_failed');
  }
};

/**
 * Fetch Google user profile using access token
 * @param {string} accessToken - Google access token
 * @returns {Promise<Object>} Google user profile
 */
const getGoogleUserProfile = async (accessToken) => {
  const userInfoUrl = process.env.GOOGLE_USERINFO_URL || 'https://www.googleapis.com/oauth2/v3/userinfo';

  try {
    const response = await fetch(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const profile = await response.json();

    if (!response.ok) {
      console.error('Google userinfo fetch error:', profile);
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Failed to fetch user profile from Google');
    }

    return profile;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Google userinfo network error:', error);
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'auth.google_auth_failed');
  }
};

module.exports = {
  getGoogleAuthUrl,
  getGoogleTokens,
  getGoogleUserProfile
};
