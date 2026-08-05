const User = require('../src/models/user.model');
const adminController = require('../src/controllers/admin.controller');
const ApiError = require('../src/errors/ApiError');

jest.mock('../src/models/user.model');

describe('Admin Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSeller', () => {
    test('should pass ApiError to next if email already exists', async () => {
      User.findOne.mockResolvedValue({ _id: 'some-existing-id' });

      const req = {
        body: {
          name: 'Artisans Studio',
          email: 'exists@example.com',
          phone: '1234567890',
          commissionRate: 15
        }
      };
      const res = {};
      const next = jest.fn();

      adminController.createSeller(req, res, next);

      // wait for the promise inside asyncHandler to resolve/reject
      await new Promise((resolve) => setImmediate(resolve));

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      const errorPassed = next.mock.calls[0][0];
      expect(errorPassed.statusCode).toBe(409);
      expect(errorPassed.message).toBe('auth.email_exists');

      expect(User.findOne).toHaveBeenCalledWith({ 'authentication.email': 'exists@example.com' });
      expect(User.create).not.toHaveBeenCalled();
    });

    test('should create a seller successfully and return 201', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: 'new-seller-id',
        role: 'seller',
        sellerProfile: {
          businessName: 'Artisans Studio',
          phone: '1234567890',
          commissionRate: 0.15
        },
        profile: {
          firstName: 'Artisans',
          lastName: 'Studio'
        },
        authentication: {
          email: 'seller@example.com'
        }
      });

      const req = {
        body: {
          name: 'Artisans Studio',
          email: 'seller@example.com',
          phone: '1234567890',
          commissionRate: 15
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      adminController.createSeller(req, res, next);

      // wait for the promise inside asyncHandler to resolve
      await new Promise((resolve) => setImmediate(resolve));

      expect(User.findOne).toHaveBeenCalledWith({ 'authentication.email': 'seller@example.com' });
      expect(User.create).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'admin.seller_created',
          data: expect.objectContaining({
            seller: expect.objectContaining({ _id: 'new-seller-id' })
          })
        })
      );
    });
  });
});
