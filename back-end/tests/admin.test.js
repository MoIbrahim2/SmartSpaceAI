const User = require('../src/models/user.model');
const Product = require('../src/models/product.model');
const BuyRequest = require('../src/models/buyRequest.model');
const adminController = require('../src/controllers/admin.controller');
const ApiError = require('../src/errors/ApiError');
const ROLES = require('../src/constants/roles');

jest.mock('../src/models/user.model');
jest.mock('../src/models/product.model');
jest.mock('../src/models/buyRequest.model');

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

  describe('getSellers', () => {
    test('should return all sellers with count and stats', async () => {
      const mockSellers = [
        {
          _id: 'seller1',
          role: 'seller',
          sellerProfile: { businessName: 'Store 1', commissionRate: 0.12 }
        },
        {
          _id: 'seller2',
          role: 'seller',
          sellerProfile: { businessName: 'Store 2', commissionRate: 0.15 }
        }
      ];

      User.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockSellers)
        })
      });

      Product.aggregate.mockResolvedValue([
        { _id: 'seller1', count: 5 }
      ]);

      BuyRequest.aggregate.mockResolvedValue([
        { _id: 'seller1', totalSales: 1500 }
      ]);

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      adminController.getSellers(req, res, next);

      await new Promise((resolve) => setImmediate(resolve));

      expect(User.find).toHaveBeenCalledWith({ role: ROLES.SELLER });
      expect(Product.aggregate).toHaveBeenCalled();
      expect(BuyRequest.aggregate).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'admin.sellers_fetched',
          data: {
            sellers: [
              expect.objectContaining({ _id: 'seller1', productsCount: 5, totalSales: 1500 }),
              expect.objectContaining({ _id: 'seller2', productsCount: 0, totalSales: 0 })
            ]
          }
        })
      );
    });
  });

  describe('updateSellerCommission', () => {
    test('should update commission rate successfully', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      const mockSeller = {
        _id: 'seller1',
        role: 'seller',
        sellerProfile: { businessName: 'Store 1', commissionRate: 0.12 },
        save: mockSave
      };

      User.findOne.mockResolvedValue(mockSeller);

      const req = {
        params: { id: 'seller1' },
        body: { commissionRate: 20 }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      adminController.updateSellerCommission(req, res, next);

      await new Promise((resolve) => setImmediate(resolve));

      expect(User.findOne).toHaveBeenCalledWith({ _id: 'seller1', role: ROLES.SELLER });
      expect(mockSeller.sellerProfile.commissionRate).toBe(0.2);
      expect(mockSave).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'admin.commission_updated'
        })
      );
    });

    test('should throw 404 error if seller not found', async () => {
      User.findOne.mockResolvedValue(null);

      const req = {
        params: { id: 'non-existent' },
        body: { commissionRate: 20 }
      };
      const res = {};
      const next = jest.fn();

      adminController.updateSellerCommission(req, res, next);

      await new Promise((resolve) => setImmediate(resolve));

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      const errorPassed = next.mock.calls[0][0];
      expect(errorPassed.statusCode).toBe(404);
      expect(errorPassed.message).toBe('user.not_found');
    });
  });

  describe('deleteSeller', () => {
    test('should delete seller and associated products if no active orders', async () => {
      const mockSeller = {
        _id: 'seller1',
        role: 'seller'
      };

      User.findOne.mockResolvedValue(mockSeller);
      BuyRequest.countDocuments.mockResolvedValue(0);
      Product.deleteMany.mockResolvedValue({ deletedCount: 5 });
      User.findByIdAndDelete.mockResolvedValue(mockSeller);

      const req = {
        params: { id: 'seller1' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      adminController.deleteSeller(req, res, next);

      await new Promise((resolve) => setImmediate(resolve));

      expect(User.findOne).toHaveBeenCalledWith({ _id: 'seller1', role: ROLES.SELLER });
      expect(BuyRequest.countDocuments).toHaveBeenCalledWith({
        sellerId: 'seller1',
        status: { $in: ['PENDING', 'PROCESSING', 'SHIPPED'] }
      });
      expect(Product.deleteMany).toHaveBeenCalledWith({ sellerId: 'seller1' });
      expect(User.findByIdAndDelete).toHaveBeenCalledWith('seller1');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'admin.seller_deleted',
          data: { id: 'seller1' }
        })
      );
    });

    test('should throw 400 error if seller has active orders', async () => {
      const mockSeller = {
        _id: 'seller1',
        role: 'seller'
      };

      User.findOne.mockResolvedValue(mockSeller);
      BuyRequest.countDocuments.mockResolvedValue(1);

      const req = {
        params: { id: 'seller1' }
      };
      const res = {};
      const next = jest.fn();

      adminController.deleteSeller(req, res, next);

      await new Promise((resolve) => setImmediate(resolve));

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      const errorPassed = next.mock.calls[0][0];
      expect(errorPassed.statusCode).toBe(400);
      expect(errorPassed.message).toContain('Cannot delete seller with active');
      expect(Product.deleteMany).not.toHaveBeenCalled();
      expect(User.findByIdAndDelete).not.toHaveBeenCalled();
    });
  });
});
