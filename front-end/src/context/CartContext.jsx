import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { parseProductDetails } from "../utils/productUtils";

const CartContext = createContext();

const CART_STORAGE_KEY = "smartspace_cart_v1";

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load cart from localStorage", e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    if (!product) return;
    const parsed = parseProductDetails(product, product.category);
    const productId = parsed.id;
    const sellerId = parsed.sellerId || (product.productData && product.productData.sellerId) || product.sellerId || "default_seller";

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.productId === productId);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        };
        return updated;
      }

      return [
        ...prevItems,
        {
          productId,
          sellerId: String(sellerId),
          name: parsed.title,
          price: parsed.price,
          image: parsed.img,
          category: product.category || "Furniture",
          brand: parsed.brand,
          quantity
        }
      ];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  }, [cartItems]);

  const cartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [cartItems]);

  // Group items by sellerId for multi-seller fulfillment
  const groupedBySeller = useMemo(() => {
    const map = {};
    cartItems.forEach((item) => {
      const sId = item.sellerId || "default_seller";
      if (!map[sId]) {
        map[sId] = {
          sellerId: sId,
          items: [],
          subtotal: 0
        };
      }
      map[sId].items.push(item);
      map[sId].subtotal += (item.price || 0) * (item.quantity || 1);
    });
    return Object.values(map);
  }, [cartItems]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    setIsDrawerOpen((prev) => !prev);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        groupedBySeller,
        isDrawerOpen,
        setIsDrawerOpen,
        toggleDrawer
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
