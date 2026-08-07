require('dotenv').config();
const { getGoogleAuthUrl, getGoogleTokens, getGoogleUserProfile } = require('../src/helpers/googleOAuth.helper');
const authService = require('../src/services/auth.service');
const User = require('../src/models/user.model');

jest.mock('../src/helpers/googleOAuth.helper', () => {
  const originalModule = jest.requireActual('../src/helpers/googleOAuth.helper');
  return {
    ...originalModule,
    getGoogleTokens: jest.fn(),
    getGoogleUserProfile: jest.fn()
  };
});

describe('Google OAuth Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('googleOAuth helper', () => {
    test('getGoogleAuthUrl generates valid Google OAuth URL with env configurations', () => {
      const url = getGoogleAuthUrl();
      expect(url).toContain(process.env.GOOGLE_AUTH_URL || 'https://accounts.google.com/o/oauth2/v2/auth');
      expect(url).toContain(encodeURIComponent(process.env.GOOGLE_CLIENT_ID));
      expect(url).toContain('response_type=code');
    });
  });

  describe('auth.service googleCallback', () => {
    test('throws error if code is missing', async () => {
      await expect(authService.googleCallback('')).rejects.toThrow();
    });

    test('creates new user if Google profile email does not exist', async () => {
      const mockTokens = { access_token: 'mock_access_token' };
      const mockProfile = {
        sub: 'google_user_12345',
        email: 'testgoogleuser@example.com',
        email_verified: true,
        given_name: 'GoogleTest',
        family_name: 'User',
        picture: 'https://example.com/avatar.jpg'
      };

      getGoogleTokens.mockResolvedValue(mockTokens);
      getGoogleUserProfile.mockResolvedValue(mockProfile);

      // Mock User DB methods
      const mockUserDoc = {
        _id: '507f1f77bcf86cd799439011',
        profile: { firstName: 'GoogleTest', lastName: 'User', avatar: 'https://example.com/avatar.jpg' },
        authentication: { email: 'testgoogleuser@example.com', provider: 'google', emailVerified: true },
        status: 'ACTIVE',
        save: jest.fn().mockResolvedValue(true),
        toObject: function() { return this; }
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(null);
      jest.spyOn(User.prototype, 'save').mockImplementation(function() {
        this._id = '507f1f77bcf86cd799439011';
        return Promise.resolve(this);
      });

      const result = await authService.googleCallback('mock_code');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(getGoogleTokens).toHaveBeenCalledWith('mock_code');
      expect(getGoogleUserProfile).toHaveBeenCalledWith('mock_access_token');
    });

    test('links existing user if email already exists', async () => {
      const mockTokens = { access_token: 'mock_access_token' };
      const mockProfile = {
        sub: 'google_user_99999',
        email: 'existinguser@example.com',
        email_verified: true,
        given_name: 'Existing',
        family_name: 'User',
        picture: 'https://example.com/newavatar.jpg'
      };

      getGoogleTokens.mockResolvedValue(mockTokens);
      getGoogleUserProfile.mockResolvedValue(mockProfile);

      const existingUser = {
        _id: '507f1f77bcf86cd799439022',
        status: 'PENDING_ACTIVATION',
        profile: { firstName: 'Existing', lastName: 'User', avatar: '' },
        authentication: { email: 'existinguser@example.com', provider: 'local', emailVerified: false },
        save: jest.fn().mockResolvedValue(true),
        toObject: function() { return this; }
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(existingUser);

      const result = await authService.googleCallback('mock_code');

      expect(existingUser.status).toBe('ACTIVE');
      expect(existingUser.authentication.emailVerified).toBe(true);
      expect(existingUser.authentication.providerId).toBe('google_user_99999');
      expect(existingUser.profile.avatar).toBe('https://example.com/newavatar.jpg');
      expect(result).toHaveProperty('accessToken');
    });
  });
});
