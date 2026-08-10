import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { checkoutOrders } from "../../api";
import Icon from "../../Components/Icon";

const Cart = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    groupedBySeller
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod] = useState("request");

  const isRtl = i18n.language?.startsWith("ar");

  const [shippingAddress, setShippingAddress] = useState({
    name: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "",
    phone: "",
    country: "Egypt",
    city: "",
    district: "",
    street: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (!shippingAddress.phone || !shippingAddress.city || !shippingAddress.street) {
      setError(t("cartPage.requiredFieldsError", "Please fill in all required shipping address fields (Phone, City, Street)."));
      return;
    }

    setError("");
    setLoading(true);

    try {
      const payload = {
        items: cartItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          image: item.image,
          sellerId: item.sellerId,
          quantity: item.quantity
        })),
        customer: {
          name: shippingAddress.name || "Valued Customer",
          phone: shippingAddress.phone,
          address: {
            country: shippingAddress.country || "Egypt",
            city: shippingAddress.city,
            district: shippingAddress.district || shippingAddress.city,
            street: shippingAddress.street
          }
        },
        paymentMethod
      };

      const { data } = await checkoutOrders(payload);

      if (data.success) {
        clearCart();
        navigate("/orders", { state: { orderSuccess: true } });
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.response?.data?.message || t("cartPage.checkoutError", "Failed to process checkout. Please try again."));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 rounded-full bg-surface-variant/30 flex items-center justify-center mb-6 text-primary neomorph-raised">
          <Icon name="shopping_cart" size={48} />
        </div>
        <h2 className="font-headline font-bold text-2xl text-on-surface mb-2">
          {t("cartPage.emptyTitle", "Your Cart is Empty")}
        </h2>
        <p className="text-on-surface-variant max-w-md mb-8">
          {t("cartPage.emptyDesc", "You haven't added any products to your cart yet. Explore your AI room generations and select furniture pieces to place an order.")}
        </p>
        <Link
          to="/projects"
          className="px-8 py-3.5 rounded-2xl bg-primary text-white font-bold shadow-lg hover:bg-primary-variant transition-all flex items-center gap-2"
        >
          <Icon name="design_services" size={20} />
          {t("cartPage.exploreRooms", "Explore My Rooms")}
        </Link>
      </div>
    );
  }

  const itemTextLabel = cartItems.length === 1 ? t("cartPage.itemOne", "Item") : t("cartPage.itemOther", "Items");

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-headline text-3xl font-bold text-on-surface flex items-center gap-3">
            <Icon name="shopping_bag" className="text-primary" size={32} />
            {t("cartPage.title", { count: cartItems.length, itemText: itemTextLabel, defaultValue: `Shopping Cart (${cartItems.length} ${itemTextLabel})` })}
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            {t("cartPage.subtitle", "Review your selected furniture pieces grouped by seller and complete your order.")}
          </p>
        </div>

        <button
          onClick={clearCart}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-all flex items-center gap-1.5"
        >
          <Icon name="delete_sweep" size={18} />
          {t("cartPage.clearCart", "Clear Cart")}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-semibold flex items-center gap-3 animate-shake">
          <Icon name="error" size={22} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Cart Items Grouped by Seller */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {groupedBySeller.map((group, gIdx) => (
            <div key={group.sellerId} className="bg-background rounded-3xl p-6 neomorph-raised border border-outline-variant/30">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center neomorph-raised">
                    #{gIdx + 1}
                  </span>
                  <div>
                    <h3 className="font-headline font-bold text-base text-on-surface">
                      {t("cartPage.sellerOrderBatch", "Seller Order Batch")}
                    </h3>
                    <span className="text-[11px] text-on-surface-variant block font-mono">
                      {t("cartPage.sellerId", "Seller ID:")} {group.sellerId}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                  {t("cartPage.separateFulfillment", "Separate Fulfillment Order")}
                </span>
              </div>

              <div className="flex flex-col gap-4">
                {group.items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-4 p-3 rounded-2xl bg-surface-bright/40 neomorph-inset">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 rounded-xl object-cover shrink-0"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/img/no-product-image.svg";
                      }}
                    />

                    <div className="flex-grow overflow-hidden">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                        {item.category} • {item.brand}
                      </span>
                      <h4 className="font-headline font-bold text-base text-on-surface line-clamp-1">
                        {item.name}
                      </h4>
                      <p className="font-bold text-sm text-primary mt-1">
                        {item.price?.toLocaleString(isRtl ? "ar-EG" : "en-US")} {t("cartPage.egp", "EGP")}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-on-surface-variant hover:text-red-500 transition-colors p-1"
                        title={t("cartPage.removeItem", "Remove Item")}
                      >
                        <Icon name="delete" size={18} />
                      </button>

                      <div className="flex items-center gap-2 bg-background p-1 rounded-xl border border-primary/20 neomorph-raised">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-6 h-6 rounded-lg bg-surface-variant hover:bg-red-500 hover:text-white flex items-center justify-center font-bold text-xs transition-colors"
                        >
                          -
                        </button>
                        <span className="px-2 font-bold text-xs text-on-surface">
                          {item.quantity?.toLocaleString(isRtl ? "ar-EG" : "en-US")}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-6 h-6 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-outline-variant/20 flex justify-between items-center text-xs font-semibold text-on-surface-variant">
                <span>
                  {t("cartPage.batchSubtotal", { count: group.items.reduce((s, i) => s + i.quantity, 0), defaultValue: `Batch Subtotal (${group.items.reduce((s, i) => s + i.quantity, 0)} items)` })}
                </span>
                <span className="font-bold text-sm text-primary">
                  {group.subtotal?.toLocaleString(isRtl ? "ar-EG" : "en-US")} {t("cartPage.egp", "EGP")}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Customer Shipping Address & Order Summary */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <form onSubmit={handleCheckout} className="bg-background rounded-3xl p-6 neomorph-raised border border-outline-variant/30 flex flex-col gap-6">
            <h2 className="font-headline font-bold text-xl text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-3">
              <Icon name="local_shipping" className="text-primary" size={24} />
              {t("cartPage.deliveryDetails", "Delivery Details")}
            </h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  {t("cartPage.recipientName", "Recipient Name *")}
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={shippingAddress.name}
                  onChange={handleInputChange}
                  placeholder={t("cartPage.namePlaceholder", "Full Name")}
                  className="w-full p-3.5 rounded-xl bg-background border border-outline-variant text-on-surface font-semibold focus:outline-none focus:border-primary neomorph-inset text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  {t("cartPage.phoneLabel", "Mobile Phone Number *")}
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={shippingAddress.phone}
                  onChange={handleInputChange}
                  placeholder={t("cartPage.phonePlaceholder", "+20 123 456 7890")}
                  className="w-full p-3.5 rounded-xl bg-background border border-outline-variant text-on-surface font-semibold focus:outline-none focus:border-primary neomorph-inset text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    {t("cartPage.cityLabel", "City *")}
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={shippingAddress.city}
                    onChange={handleInputChange}
                    placeholder={t("cartPage.cityPlaceholder", "Cairo, Giza, Alex...")}
                    className="w-full p-3.5 rounded-xl bg-background border border-outline-variant text-on-surface font-semibold focus:outline-none focus:border-primary neomorph-inset text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    {t("cartPage.districtLabel", "District / Area")}
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={shippingAddress.district}
                    onChange={handleInputChange}
                    placeholder={t("cartPage.districtPlaceholder", "Maadi, Nasr City...")}
                    className="w-full p-3.5 rounded-xl bg-background border border-outline-variant text-on-surface font-semibold focus:outline-none focus:border-primary neomorph-inset text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  {t("cartPage.streetLabel", "Street Address & Building No. *")}
                </label>
                <textarea
                  name="street"
                  required
                  rows={2}
                  value={shippingAddress.street}
                  onChange={handleInputChange}
                  placeholder={t("cartPage.streetPlaceholder", "Street name, building number, floor, apartment...")}
                  className="w-full p-3.5 rounded-xl bg-background border border-outline-variant text-on-surface font-semibold focus:outline-none focus:border-primary neomorph-inset text-sm"
                />
              </div>
            </div>

            {/* Direct Request to Seller (No Online Payment Required) */}
            <div className="pt-4 border-t border-outline-variant/20">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">
                {t("cartPage.orderProcess", "Order Process")}
              </label>

              <div className="p-4 rounded-2xl flex items-center justify-between border border-primary/40 bg-primary/10 text-primary shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md">
                    <Icon name="send" size={20} />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-on-surface block">
                      {t("cartPage.directRequestTitle", "Direct Request to Seller")}
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      {t("cartPage.directRequestDesc", "No online payment required. Request sent directly to seller.")}
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-primary text-white uppercase tracking-wider">
                  {t("cartPage.directRequestBadge", "Direct Request")}
                </span>
              </div>
            </div>

            {/* Order Summary & Send Request Button */}
            <div className="neomorph-inset p-4 rounded-2xl flex flex-col gap-2 mt-2">
              <div className="flex justify-between text-xs text-on-surface-variant">
                <span>{t("cartPage.totalBatches", "Total Batches (Sellers)")}</span>
                <span className="font-bold text-on-surface">
                  {t("cartPage.ordersCount", { count: groupedBySeller.length, defaultValue: `${groupedBySeller.length} Order(s)` })}
                </span>
              </div>
              <div className="flex justify-between text-xs text-on-surface-variant">
                <span>{t("cartPage.shippingDelivery", "Shipping & Delivery")}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {t("cartPage.free", "FREE")}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-outline-variant/20 font-headline font-bold text-xl text-primary">
                <span>{t("cartPage.grandTotal", "Grand Total")}</span>
                <span>{cartTotal?.toLocaleString(isRtl ? "ar-EG" : "en-US")} {t("cartPage.egp", "EGP")}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-primary text-white font-headline font-bold text-base shadow-xl hover:bg-primary-variant active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Icon name="refresh" className="animate-spin" size={20} />
                  <span>{t("cartPage.sendingRequest", "Sending Request to Seller...")}</span>
                </div>
              ) : (
                <>
                  <Icon name="send" size={20} />
                  <span>{t("cartPage.sendRequest", "Send Request to Seller")}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Cart;
