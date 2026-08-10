/**
 * Unit & Integration Tests — Seller Dashboard Backend Services
 */

const sellerService = require('../src/services/seller.service');
const Product = require('../src/models/product.model');
const Order = require('../src/models/order.model');
const User = require('../src/models/user.model');
const ApiError = require('../src/errors/ApiError');
const { validateSellerProductSubmission } = require('../src/services/aiService');

// Mock all Mongoose models
jest.mock('../src/models/product.model');
jest.mock('../src/models/order.model');
jest.mock('../src/models/user.model');
jest.mock('../src/services/aiService', () => ({
  validateSellerProductSubmission: jest.fn().mockResolvedValue(true)
}));

describe('Seller Services', () => {
  const mockSellerId = '64f8c9b29c9c9c9c9c9c9c9c';
  const mockProductId = '64f8c9b29c9c9c9c9c9c9c9d';
  const mockOrderId = '64f8c9b29c9c9c9c9c9c9c9e';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── listSellerProducts ────────────────────────────────────
  describe('listSellerProducts', () => {
    test('should fetch and return products filtered by seller ID with pagination', async () => {
      const mockProducts = [
        { _id: mockProductId, basic: { name: 'Modern Chair' }, sellerId: mockSellerId }
      ];
      
      Product.countDocuments.mockResolvedValue(1);
      Product.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockProducts)
          })
        })
      });

      const result = await sellerService.listSellerProducts(mockSellerId, { page: 1, limit: 10 });
      
      expect(Product.find).toHaveBeenCalledWith({ sellerId: mockSellerId });
      expect(result).toEqual({
        products: mockProducts,
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      });
    });

    test('should apply optional filters for status and search query', async () => {
      Product.countDocuments.mockResolvedValue(0);
      Product.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      });

      await sellerService.listSellerProducts(mockSellerId, {
        status: 'ACCEPTED',
        search: 'Sofa'
      });

      expect(Product.find).toHaveBeenCalledWith({
        sellerId: mockSellerId,
        'processing.status': 'ACCEPTED',
        'basic.name': { $regex: 'Sofa', $options: 'i' }
      });
    });
  });

  // ─── createSellerProduct ───────────────────────────────────
  describe('createSellerProduct', () => {
    test('should throw error if user is not found or is not a seller', async () => {
      User.findById.mockResolvedValue(null);

      await expect(
        sellerService.createSellerProduct(mockSellerId, {})
      ).rejects.toThrow(ApiError);

      User.findById.mockResolvedValue({ role: 'user' });
      await expect(
        sellerService.createSellerProduct(mockSellerId, {})
      ).rejects.toThrow(ApiError);
    });

    test('should throw error if seller account is pending activation', async () => {
      User.findById.mockResolvedValue({ _id: mockSellerId, role: 'seller', status: 'PENDING_ACTIVATION' });
      await expect(
        sellerService.createSellerProduct(mockSellerId, {})
      ).rejects.toThrow(ApiError);
    });

    test('should throw error if seller account is suspended', async () => {
      User.findById.mockResolvedValue({ _id: mockSellerId, role: 'seller', status: 'SUSPENDED' });
      await expect(
        sellerService.createSellerProduct(mockSellerId, {})
      ).rejects.toThrow(ApiError);
    });

    test('should create a product and trigger background AI validation', async () => {
      User.findById.mockResolvedValue({ _id: mockSellerId, role: 'seller' });
      
      const mockSave = jest.fn().mockResolvedValue(true);
      Product.mockImplementation(() => ({
        _id: mockProductId,
        save: mockSave
      }));

      const productData = { basic: { name: 'Comfy Sofa' } };
      const mockFile = { filename: 'test.jpg' };
      const result = await sellerService.createSellerProduct(mockSellerId, productData, mockFile);

      expect(mockSave).toHaveBeenCalled();
      expect(validateSellerProductSubmission).toHaveBeenCalledWith(mockProductId);
      expect(result._id).toBe(mockProductId);
    });
  });

  // ─── updateSellerProduct ───────────────────────────────────
  describe('updateSellerProduct', () => {
    test('should throw error if product is not found or does not belong to the seller', async () => {
      Product.findOne.mockResolvedValue(null);

      await expect(
        sellerService.updateSellerProduct(mockSellerId, mockProductId, {})
      ).rejects.toThrow(ApiError);
    });

    test('should update product fields and trigger AI validation if visual/spatial fields change', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      const mockProduct = {
        _id: mockProductId,
        basic: { name: 'Old Chair' },
        save: mockSave
      };
      
      Product.findOne.mockResolvedValue(mockProduct);

      const updateData = { basic: { name: 'New Chair' } };
      await sellerService.updateSellerProduct(mockSellerId, mockProductId, updateData);

      expect(mockProduct.basic.name).toBe('New Chair');
      expect(mockProduct.processing.status).toBe('PENDING_AI_VALIDATION');
      expect(mockSave).toHaveBeenCalled();
      expect(validateSellerProductSubmission).toHaveBeenCalledWith(mockProductId);
    });

    test('should not trigger AI validation if only non-visual fields like pricing change', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      const mockProduct = {
        _id: mockProductId,
        pricing: { currentPrice: 1000 },
        save: mockSave
      };
      
      Product.findOne.mockResolvedValue(mockProduct);

      const updateData = { pricing: { currentPrice: 1200 } };
      await sellerService.updateSellerProduct(mockSellerId, mockProductId, updateData);

      expect(mockProduct.pricing.currentPrice).toBe(1200);
      expect(mockProduct.processing).toBeUndefined(); // status remains unchanged
      expect(mockSave).toHaveBeenCalled();
      expect(validateSellerProductSubmission).not.toHaveBeenCalled();
    });
  });

  // ─── deleteSellerProduct ───────────────────────────────────
  describe('deleteSellerProduct', () => {
    test('should throw error if product has active pending/processing orders', async () => {
      Product.findOne.mockResolvedValue({ _id: mockProductId });
      Order.countDocuments.mockResolvedValue(1);

      await expect(
        sellerService.deleteSellerProduct(mockSellerId, mockProductId)
      ).rejects.toThrow(ApiError);
    });

    test('should delete product when no active orders exist', async () => {
      Product.findOne.mockResolvedValue({ _id: mockProductId });
      Order.countDocuments.mockResolvedValue(0);
      Product.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await sellerService.deleteSellerProduct(mockSellerId, mockProductId);

      expect(Product.deleteOne).toHaveBeenCalledWith({ _id: mockProductId });
      expect(result).toBe(true);
    });
  });

  // ─── listSellerOrders ──────────────────────────────────────
  describe('listSellerOrders', () => {
    test('should fetch seller orders and map them to the frontend items array format', async () => {
      const mockOrderDoc = {
        _id: mockOrderId,
        unitPriceAtPurchase: 2500,
        grossTotalAmount: 5000,
        quantity: 2,
        productId: {
          _id: mockProductId,
          basic: { name: 'Wooden Desk' }
        },
        toObject: function() { return this; }
      };

      const mockPopulate = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([mockOrderDoc])
        })
      });

      Order.find.mockReturnValue({
        populate: mockPopulate
      });

      const result = await sellerService.listSellerOrders(mockSellerId);

      expect(result[0].items).toEqual([
        {
          product: {
            _id: mockProductId,
            name: 'Wooden Desk',
            price: 2500
          },
          quantity: 2
        }
      ]);
      expect(result[0].totalAmount).toBe(5000);
    });
  });

  // ─── updateOrderStatus ─────────────────────────────────────
  describe('updateOrderStatus', () => {
    test('should throw error on invalid order status transitions', async () => {
      const mockOrder = {
        status: 'DELIVERED',
        toObject: function() { return this; }
      };
      Order.findOne.mockResolvedValue(mockOrder);

      await expect(
        sellerService.updateOrderStatus(mockSellerId, mockOrderId, 'PENDING')
      ).rejects.toThrow(ApiError);
    });

    test('should transition status and calculate commissions on delivery', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      const mockOrder = {
        status: 'PROCESSING',
        grossTotalAmount: 10000,
        commission: {},
        save: mockSave,
        populate: jest.fn().mockResolvedValue({
          _id: mockOrderId,
          status: 'DELIVERED',
          grossTotalAmount: 10000,
          commission: {
            appliedRate: 0.15,
            amountOwed: 1500,
            isCommissionPaid: false
          },
          toObject: function() { return this; }
        })
      };

      Order.findOne.mockResolvedValue(mockOrder);
      User.findById.mockResolvedValue({
        sellerProfile: { commissionRate: 0.15 }
      });

      const result = await sellerService.updateOrderStatus(mockSellerId, mockOrderId, 'DELIVERED');

      expect(mockOrder.status).toBe('DELIVERED');
      expect(mockOrder.commission.appliedRate).toBe(0.15);
      expect(mockOrder.commission.amountOwed).toBe(1500);
      expect(mockOrder.commission.isCommissionPaid).toBe(false);
      expect(mockSave).toHaveBeenCalled();
      expect(result.status).toBe('DELIVERED');
    });
  });

  // ─── getSellerEarnings ─────────────────────────────────────
  describe('getSellerEarnings', () => {
    test('should calculate aggregated gross sales and platform fee analytics', async () => {
      User.findById.mockResolvedValue({
        sellerProfile: { commissionRate: 0.10 }
      });

      const mockDeliveredOrders = [
        {
          grossTotalAmount: 4000,
          commission: { amountOwed: 400, isCommissionPaid: true },
          createdAt: new Date('2026-07-15')
        },
        {
          grossTotalAmount: 6000,
          commission: { amountOwed: 600, isCommissionPaid: false },
          createdAt: new Date('2026-08-01')
        }
      ];

      Order.find.mockResolvedValue(mockDeliveredOrders);

      const result = await sellerService.getSellerEarnings(mockSellerId);

      expect(result.grossRevenue).toBe(10000);
      expect(result.platformFees).toBe(1000);
      expect(result.outstandingFees).toBe(600);
      expect(result.paidFees).toBe(400);
      expect(result.ledger.length).toBe(2);
    });
  });
});
