import api from "./axios";

// Helper to manage localStorage simulation for fallback when backend endpoints return 404
const LOCAL_STORAGE_PRODUCTS = "smartspace_seller_products";
const LOCAL_STORAGE_ORDERS = "smartspace_seller_orders";
const LOCAL_STORAGE_EARNINGS = "smartspace_seller_earnings";

const is404 = (error) => {
  return error?.response?.status === 404 || error?.code === "ERR_NETWORK";
};

const getLocalProducts = () => {
  const data = localStorage.getItem(LOCAL_STORAGE_PRODUCTS);
  if (!data) {
    const seed = [
      {
        _id: "prod-s1",
        basic: {
          name: "Velvet Accent Chair",
          brand: "SmartSpace Seller",
          description: "Comfortable velvet armchair with gold-painted metal legs, perfect for living rooms or bedrooms.",
          sku: "SEL-ACC-001"
        },
        classification: {
          canonicalCategory: "Armchair",
          roomTypes: ["LIVING_ROOM", "BEDROOM"],
          styles: ["Modern"],
          materials: ["Velvet", "Metal"],
          colors: ["Teal"]
        },
        pricing: {
          currentPrice: 3200,
          currency: "EGP"
        },
        dimensions: {
          width: 75,
          height: 85,
          length: 70,
          dimensionUnit: "cm"
        },
        images: [
          { url: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&auto=format&fit=crop&q=80", isPrimary: true }
        ],
        availability: {
          inStock: true,
          stockStatus: "IN_STOCK",
          quantity: 15
        },
        processing: {
          status: "PENDING_AI_VALIDATION"
        }
      },
      {
        _id: "prod-s2",
        basic: {
          name: "Marble Coffee Table",
          brand: "SmartSpace Seller",
          description: "Sleek marble-top coffee table with geometric black steel frame.",
          sku: "SEL-COF-002"
        },
        classification: {
          canonicalCategory: "Coffee Table",
          roomTypes: ["LIVING_ROOM"],
          styles: ["Minimalist", "Modern"],
          materials: ["Marble", "Steel"],
          colors: ["White", "Black"]
        },
        pricing: {
          currentPrice: 5500,
          currency: "EGP"
        },
        dimensions: {
          width: 90,
          height: 45,
          length: 90,
          dimensionUnit: "cm"
        },
        images: [
          { url: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600&auto=format&fit=crop&q=80", isPrimary: true }
        ],
        availability: {
          inStock: true,
          stockStatus: "IN_STOCK",
          quantity: 4
        },
        processing: {
          status: "MANUAL_REVIEW_REQUIRED"
        }
      },
      {
        _id: "prod-s3",
        basic: {
          name: "Glass Dining Table",
          brand: "SmartSpace Seller",
          description: "Tempered glass top dining table with solid dark oak wooden base.",
          sku: "SEL-DIN-003"
        },
        classification: {
          canonicalCategory: "Dining Table",
          roomTypes: ["DINING_ROOM"],
          styles: ["Modern"],
          materials: ["Glass", "Wood"],
          colors: ["Clear", "Dark Brown"]
        },
        pricing: {
          currentPrice: 8000,
          currency: "EGP"
        },
        dimensions: {
          width: 160,
          height: 75,
          length: 90,
          dimensionUnit: "cm"
        },
        images: [
          { url: "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=600&auto=format&fit=crop&q=80", isPrimary: true }
        ],
        availability: {
          inStock: false,
          stockStatus: "OUT_OF_STOCK",
          quantity: 0
        },
        processing: {
          status: "REJECTED",
          issues: ["The primary image displays a dark oak dining table with no visible glass elements. This does not match your description or material selection of tempered glass. Please upload a correct photo or update the classification."]
        }
      },
      {
        _id: "prod-s4",
        basic: {
          name: "Modern Bookcase",
          brand: "SmartSpace Seller",
          description: "Minimalist oak wood bookshelf with five spacious tiers for books and decor items.",
          sku: "SEL-BOO-004"
        },
        classification: {
          canonicalCategory: "Bookcase",
          roomTypes: ["OFFICE", "LIVING_ROOM"],
          styles: ["Scandinavian"],
          materials: ["Wood"],
          colors: ["Natural Wood"]
        },
        pricing: {
          currentPrice: 2400,
          currency: "EGP"
        },
        dimensions: {
          width: 80,
          height: 180,
          length: 30,
          dimensionUnit: "cm"
        },
        images: [
          { url: "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=600&auto=format&fit=crop&q=80", isPrimary: true }
        ],
        availability: {
          inStock: true,
          stockStatus: "IN_STOCK",
          quantity: 20
        },
        processing: {
          status: "ACCEPTED"
        }
      }
    ];
    localStorage.setItem(LOCAL_STORAGE_PRODUCTS, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(data);
};

const saveLocalProducts = (products) => {
  localStorage.setItem(LOCAL_STORAGE_PRODUCTS, JSON.stringify(products));
};

const getLocalOrders = () => {
  const data = localStorage.getItem(LOCAL_STORAGE_ORDERS);
  if (!data) {
    const seed = [
      {
        _id: "ord-s1",
        customer: {
          name: "Amr Hassan",
          phone: "+20 100 555 1234",
          address: {
            country: "Egypt",
            city: "Cairo",
            district: "Maadi",
            street: "Road 250, Building 12"
          }
        },
        items: [
          {
            product: {
              _id: "prod-s4",
              name: "Modern Bookcase",
              price: 2400
            },
            quantity: 1
          }
        ],
        totalAmount: 2400,
        status: "PENDING",
        createdAt: "2026-08-01T10:30:00Z"
      },
      {
        _id: "ord-s2",
        customer: {
          name: "Sarah Al-Mansoori",
          phone: "+20 112 444 9876",
          address: {
            country: "Egypt",
            city: "Giza",
            district: "Sheikh Zayed",
            street: "Zayed Regency, Villa 45"
          }
        },
        items: [
          {
            product: {
              _id: "prod-s1",
              name: "Velvet Accent Chair",
              price: 3200
            },
            quantity: 2
          }
        ],
        totalAmount: 6400,
        status: "PROCESSING",
        createdAt: "2026-08-01T13:10:00Z"
      },
      {
        _id: "ord-s3",
        customer: {
          name: "Khaled Zaki",
          phone: "+20 120 777 3344",
          address: {
            country: "Egypt",
            city: "Cairo",
            district: "Zamalek",
            street: "14 Gezira St, Apartment 7"
          }
        },
        items: [
          {
            product: {
              _id: "prod-s4",
              name: "Modern Bookcase",
              price: 2400
            },
            quantity: 1
          }
        ],
        totalAmount: 2400,
        status: "DELIVERED",
        createdAt: "2026-07-31T09:00:00Z"
      }
    ];
    localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(data);
};

const saveLocalOrders = (orders) => {
  localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(orders));
};

const getLocalEarnings = () => {
  const data = localStorage.getItem(LOCAL_STORAGE_EARNINGS);
  if (!data) {
    const seed = {
      grossRevenue: 2400, // Delivered order total
      commissionRate: 0.12, // 12% SmartSpace commission
      platformFees: 288, // 12% of 2400
      outstandingFees: 0,
      paidFees: 288,
      ledger: [
        {
          period: "July 2026",
          totalSales: 2400,
          platformFee: 288,
          paymentStatus: "PAID",
          verificationDate: "2026-08-01"
        }
      ]
    };
    localStorage.setItem(LOCAL_STORAGE_EARNINGS, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(data);
};

const saveLocalEarnings = (earnings) => {
  localStorage.setItem(LOCAL_STORAGE_EARNINGS, JSON.stringify(earnings));
};

// Recalculates earnings statistics from delivered orders
export const syncEarningsFromOrders = () => {
  const orders = getLocalOrders();
  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");
  
  const grossRevenue = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const commissionRate = 0.12;
  const platformFees = Math.round(grossRevenue * commissionRate);
  
  const earnings = getLocalEarnings();
  earnings.grossRevenue = grossRevenue;
  earnings.platformFees = platformFees;
  
  // Rebuild the ledger if needed
  const julySales = deliveredOrders
    .filter((o) => o.createdAt.startsWith("2026-07"))
    .reduce((sum, o) => sum + o.totalAmount, 0);
  
  const augustSales = deliveredOrders
    .filter((o) => o.createdAt.startsWith("2026-08"))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const newLedger = [];
  if (julySales > 0) {
    newLedger.push({
      period: "July 2026",
      totalSales: julySales,
      platformFee: Math.round(julySales * commissionRate),
      paymentStatus: "PAID",
      verificationDate: "2026-08-01"
    });
  }
  if (augustSales > 0) {
    newLedger.push({
      period: "August 2026",
      totalSales: augustSales,
      platformFee: Math.round(augustSales * commissionRate),
      paymentStatus: "UNPAID",
      verificationDate: "-"
    });
  }
  
  if (newLedger.length === 0) {
    newLedger.push({
      period: "August 2026",
      totalSales: 0,
      platformFee: 0,
      paymentStatus: "UNPAID",
      verificationDate: "-"
    });
  }
  
  earnings.ledger = newLedger;
  
  // Update Outstanding vs Paid based on paidStatus
  const unpaidFees = newLedger
    .filter((l) => l.paymentStatus === "UNPAID")
    .reduce((sum, l) => sum + l.platformFee, 0);
    
  const paidFees = newLedger
    .filter((l) => l.paymentStatus === "PAID")
    .reduce((sum, l) => sum + l.platformFee, 0);
    
  earnings.outstandingFees = unpaidFees;
  earnings.paidFees = paidFees;
  
  saveLocalEarnings(earnings);
};

export const getSellerProducts = async () => {
  try {
    const res = await api.get("/seller/products");
    return res.data;
  } catch (error) {
    if (is404(error)) {
      const data = getLocalProducts();
      return { success: true, data };
    }
    throw error;
  }
};

export const createSellerProduct = async (productData) => {
  try {
    const res = await api.post("/seller/products", productData);
    return res.data;
  } catch (error) {
    if (is404(error)) {
      const data = getLocalProducts();
      const newProduct = {
        _id: "prod-s" + (data.length + 1) + "_" + Date.now(),
        ...productData,
        processing: {
          status: "PENDING_AI_VALIDATION"
        }
      };
      data.unshift(newProduct);
      saveLocalProducts(data);
      return { success: true, data: newProduct };
    }
    throw error;
  }
};

export const updateSellerProduct = async (id, productData) => {
  try {
    const res = await api.patch(`/seller/products/${id}`, productData);
    return res.data;
  } catch (error) {
    if (is404(error)) {
      const data = getLocalProducts();
      const idx = data.findIndex((p) => p._id === id);
      if (idx !== -1) {
        const updated = {
          ...data[idx],
          ...productData,
          basic: {
            ...data[idx].basic,
            ...productData.basic
          },
          classification: {
            ...data[idx].classification,
            ...productData.classification
          },
          pricing: {
            ...data[idx].pricing,
            ...productData.pricing
          },
          dimensions: {
            ...data[idx].dimensions,
            ...productData.dimensions
          },
          // Trigger AI revalidation if description, name, colors, materials, or images are modified
          processing: {
            status: "PENDING_AI_VALIDATION"
          }
        };
        data[idx] = updated;
        saveLocalProducts(data);
        return { success: true, data: updated };
      }
      throw new Error("Product not found");
    }
    throw error;
  }
};

export const deleteSellerProduct = async (id) => {
  try {
    const res = await api.delete(`/seller/products/${id}`);
    return res.data;
  } catch (error) {
    if (is404(error)) {
      const data = getLocalProducts();
      const filtered = data.filter((p) => p._id !== id);
      saveLocalProducts(filtered);
      return { success: true };
    }
    throw error;
  }
};

export const getSellerOrders = async () => {
  try {
    const res = await api.get("/seller/buy-requests");
    return res.data;
  } catch (error) {
    if (is404(error)) {
      const data = getLocalOrders();
      return { success: true, data };
    }
    throw error;
  }
};

export const updateSellerOrderStatus = async (id, status) => {
  try {
    const res = await api.patch(`/seller/buy-requests/${id}/status`, { status });
    return res.data;
  } catch (error) {
    if (is404(error)) {
      const data = getLocalOrders();
      const idx = data.findIndex((o) => o._id === id);
      if (idx !== -1) {
        data[idx].status = status;
        saveLocalOrders(data);
        syncEarningsFromOrders();
        return { success: true, data: data[idx] };
      }
      throw new Error("Order not found");
    }
    throw error;
  }
};

export const getSellerEarnings = async () => {
  try {
    const res = await api.get("/seller/earnings");
    return res.data;
  } catch (error) {
    if (is404(error)) {
      syncEarningsFromOrders();
      const data = getLocalEarnings();
      return { success: true, data };
    }
    throw error;
  }
};
