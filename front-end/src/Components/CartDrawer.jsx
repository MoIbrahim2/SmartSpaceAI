import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { API_HOST } from "../api";
import Icon from "./Icon";

const CartDrawer = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    cartTotal,
    groupedBySeller,
    isDrawerOpen,
    setIsDrawerOpen
  } = useCart();

  if (!isDrawerOpen) return null;

  const getImageUrl = (url) => {
    if (!url) return "/placeholder.jpg";
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    return `${API_HOST}/${url.replace(/^\//, "")}`;
  };

  const handleGoToCheckout = () => {
    setIsDrawerOpen(false);
    navigate("/cart");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Backdrop overlay click handler */}
      <div
        className="absolute inset-0"
        onClick={() => setIsDrawerOpen(false)}
      />

      {/* Drawer content panel */}
      <div className="relative w-full max-w-md bg-background h-full p-6 shadow-2xl flex flex-col justify-between border-l border-outline-variant/30 z-10 overflow-hidden animate-slide-left">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center neomorph-raised">
              <Icon name="shopping_cart" size={20} />
            </div>
            <div>
              <h2 className="font-headline font-extrabold text-xl text-on-surface">
                Your Shopping Cart
              </h2>
              <p className="text-xs text-on-surface-variant">
                {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in cart
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsDrawerOpen(false)}
            className="w-9 h-9 rounded-xl neomorph-raised flex items-center justify-center text-on-surface-variant hover:text-primary transition-all active:neomorph-inset"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-grow overflow-y-auto py-4 flex flex-col gap-6 pr-1">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="w-20 h-20 rounded-full bg-surface-variant/30 flex items-center justify-center text-primary/60 mb-4 neomorph-inset">
                <Icon name="remove_shopping_cart" size={40} />
              </div>
              <h3 className="font-headline font-bold text-lg text-on-surface mb-1">
                Your Cart is Empty
              </h3>
              <p className="text-xs text-on-surface-variant max-w-xs mb-6">
                Add products from your AI Room design to start your multi-seller order!
              </p>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:bg-primary-variant transition-all"
              >
                Browse & Add Products
              </button>
            </div>
          ) : (
            groupedBySeller.map((group, groupIdx) => (
              <div
                key={group.sellerId || groupIdx}
                className="neomorph-raised rounded-2xl p-4 flex flex-col gap-3 border border-outline-variant/20"
              >
                {/* Seller Group Header */}
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                  <div className="flex items-center gap-2">
                    <Icon name="store" size={16} className="text-primary" />
                    <span className="text-xs font-bold text-on-surface">
                      {group.items[0]?.brand || `Seller Store #${groupIdx + 1}`}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/10 text-primary">
                    Seller Group #{groupIdx + 1}
                  </span>
                </div>

                {/* Items under this seller */}
                <div className="flex flex-col gap-3">
                  {group.items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center gap-3 p-2 rounded-xl bg-background border border-outline-variant/10"
                    >
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        className="w-14 h-14 rounded-lg object-cover shrink-0 neomorph-inset"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/placeholder.jpg";
                        }}
                      />

                      <div className="flex-grow overflow-hidden">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                          {item.category}
                        </span>
                        <h4 className="text-xs font-bold text-on-surface line-clamp-1">
                          {item.name}
                        </h4>
                        <p className="text-xs font-extrabold text-primary mt-0.5">
                          {item.price?.toLocaleString()} EGP
                        </p>
                      </div>

                      {/* Quantity controls */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-1 bg-surface-bright p-1 rounded-lg border border-outline-variant/20">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-5 h-5 rounded bg-background hover:bg-red-500 hover:text-white text-on-surface flex items-center justify-center text-xs font-bold transition-all"
                          >
                            -
                          </button>
                          <span className="px-1 text-xs font-black text-primary">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-5 h-5 rounded bg-primary text-white flex items-center justify-center text-xs font-bold transition-all hover:scale-105"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-[10px] text-red-400 hover:underline flex items-center gap-0.5"
                        >
                          <Icon name="delete" size={12} />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center text-xs font-semibold text-on-surface-variant pt-2 border-t border-outline-variant/10">
                  <span>Seller Subtotal:</span>
                  <span className="font-bold text-on-surface">{group.subtotal.toLocaleString()} EGP</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout Summary */}
        {cartItems.length > 0 && (
          <div className="pt-4 border-t border-outline-variant/20 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Total Amount ({groupedBySeller.length} {groupedBySeller.length === 1 ? "seller" : "sellers"})
              </span>
              <span className="font-headline font-black text-xl text-primary">
                {cartTotal.toLocaleString()} EGP
              </span>
            </div>

            <button
              onClick={handleGoToCheckout}
              className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-variant text-white font-headline font-bold text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <Icon name="arrow_forward" size={18} className="rtl:rotate-180" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
