import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getMyOrders } from "../../api";
import Icon from "../../Components/Icon";

const STATUS_COLOR_MAP = {
  PENDING: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  PROCESSING: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30",
  SHIPPED: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
  DELIVERED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  REJECTED: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  CANCELLED: "bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/30"
};

const MyOrders = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const showSuccessBanner = location.state?.orderSuccess;
  const isRtl = i18n.language?.startsWith("ar");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const { data } = await getMyOrders();
        if (data.success) {
          setOrders(data.data.orders || []);
        }
      } catch (err) {
        console.error("Fetch my orders error:", err);
        setError(t("myOrdersPage.loadError", "Failed to load your orders. Please try again."));
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [t]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <Icon name="refresh" className="animate-spin text-primary mb-4" size={40} />
        <p className="text-on-surface-variant font-semibold">
          {t("myOrdersPage.loading", "Loading your order history...")}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 animate-fade-in">
      {/* Order Success Banner */}
      {showSuccessBanner && (
        <div className="mb-8 p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
              <Icon name="check_circle" size={28} />
            </div>
            <div>
              <h3 className="font-headline font-bold text-lg">
                {t("myOrdersPage.successTitle", "Orders Placed Successfully!")}
              </h3>
              <p className="text-xs opacity-90">
                {t("myOrdersPage.successDesc", "Your orders have been dispatched directly to the sellers' fulfillment dashboards.")}
              </p>
            </div>
          </div>
          <Link
            to="/projects"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md hover:bg-emerald-700 transition-all shrink-0"
          >
            {t("myOrdersPage.backToMyRooms", "Back to My Rooms")}
          </Link>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-headline text-3xl font-bold text-on-surface flex items-center gap-3">
            <Icon name="local_shipping" className="text-primary" size={32} />
            {t("myOrdersPage.title", "My Furniture Orders")}
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            {t("myOrdersPage.subtitle", "Track the status of your purchases directly with partner sellers.")}
          </p>
        </div>

        <Link
          to="/projects"
          className="px-5 py-2.5 rounded-xl bg-background neomorph-raised text-on-surface font-semibold text-xs hover:text-primary transition-all flex items-center gap-2"
        >
          <Icon name="design_services" size={16} />
          {t("myOrdersPage.exploreFurniture", "Explore Furniture")}
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-semibold flex items-center gap-3">
          <Icon name="error" size={20} />
          <span>{error}</span>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-background rounded-3xl p-12 neomorph-raised text-center border border-outline-variant/30 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-surface-variant/30 text-primary flex items-center justify-center mb-4">
            <Icon name="receipt_long" size={40} />
          </div>
          <h3 className="font-headline font-bold text-xl text-on-surface mb-2">
            {t("myOrdersPage.noOrdersTitle", "No Orders Found")}
          </h3>
          <p className="text-sm text-on-surface-variant max-w-md mb-6">
            {t("myOrdersPage.noOrdersDesc", "You haven't placed any furniture orders yet. Once you complete checkout, your order history will appear here.")}
          </p>
          <Link
            to="/projects"
            className="px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:bg-primary-variant transition-all"
          >
            {t("myOrdersPage.startDesigning", "Start Designing & Shop")}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {orders.map((order) => {
            const product = order.productId || {};
            const itemsList = (Array.isArray(order.items) && order.items.length > 0)
              ? order.items
              : [{
                  name: product.basic?.name || t("myOrdersPage.furniturePiece", "Furniture Piece"),
                  price: order.unitPriceAtPurchase || order.grossTotalAmount || 0,
                  quantity: order.quantity || 1,
                  image: product.images?.find((i) => i.isPrimary)?.url || product.images?.[0]?.url || "/img/no-product-image.svg"
                }];

            const statusStyle = STATUS_COLOR_MAP[order.status] || STATUS_COLOR_MAP.PENDING;
            const address = order.customer?.address || {};
            const sellerName = order.sellerId?.sellerProfile?.businessName || order.sellerId?.profile?.firstName || t("myOrdersPage.partnerSeller", "Partner Seller");
            const statusLabel = t(`myOrdersPage.status.${order.status}`, order.status);

            return (
              <div key={order._id} className="bg-background rounded-3xl p-6 neomorph-raised border border-outline-variant/30 flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-on-surface-variant font-bold">
                      {t("myOrdersPage.orderNumber", { id: String(order._id).slice(-8), defaultValue: `Order #${String(order._id).slice(-8)}` })}
                    </span>
                    <span className="text-xs font-bold text-primary flex items-center gap-1">
                      <Icon name="store" size={14} />
                      {sellerName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusStyle}`}>
                      {statusLabel}
                    </span>
                    <span className="text-[11px] text-on-surface-variant font-mono">
                      {new Date(order.createdAt).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                    </span>
                  </div>
                </div>

                {/* Items List inside this order batch */}
                <div className="flex flex-col gap-3">
                  {itemsList.map((item, idx) => {
                    const itemName = item.name || item.product?.name || t("myOrdersPage.furniturePiece", "Furniture Piece");
                    const itemPrice = item.price || item.product?.price || 0;
                    const itemQty = item.quantity || 1;
                    const itemImg = item.image || item.product?.image || "/img/no-product-image.svg";

                    return (
                      <div key={idx} className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-surface-bright/20 neomorph-inset">
                        <div className="flex items-center gap-4">
                          <img
                            src={itemImg}
                            alt={itemName}
                            className="w-16 h-16 rounded-xl object-cover shrink-0 neomorph-inset bg-surface p-1"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "/img/no-product-image.svg";
                            }}
                          />
                          <div>
                            <h4 className="font-headline font-bold text-sm text-on-surface line-clamp-1">{itemName}</h4>
                            <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-1">
                              <span>
                                {t("myOrdersPage.qty", "Qty:")} <strong className="text-on-surface">{itemQty.toLocaleString(isRtl ? "ar-EG" : "en-US")}</strong>
                              </span>
                              <span>
                                {t("myOrdersPage.unitPrice", "Unit Price:")} <strong className="text-primary">{itemPrice?.toLocaleString(isRtl ? "ar-EG" : "en-US")} {t("myOrdersPage.egp", "EGP")}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        <span className="font-extrabold text-sm text-primary shrink-0">
                          {(itemPrice * itemQty).toLocaleString(isRtl ? "ar-EG" : "en-US")} {t("myOrdersPage.egp", "EGP")}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Total & Address */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-3 border-t border-outline-variant/20">
                  {order.customer?.phone ? (
                    <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                      <Icon name="local_shipping" size={14} className="text-primary" />
                      {t("myOrdersPage.deliverTo", "Deliver to:")} <strong>{order.customer?.name}</strong> ({order.customer?.phone}) — {address.street || ""}, {address.city || ""}
                    </span>
                  ) : <div />}

                  <div className={`text-right ${isRtl ? "mr-auto ml-0 text-left" : "ml-auto"}`}>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                      {t("myOrdersPage.totalOrderAmount", "Total Order Amount")}
                    </span>
                    <span className="font-headline font-black text-xl text-primary">
                      {order.grossTotalAmount?.toLocaleString(isRtl ? "ar-EG" : "en-US")} {t("myOrdersPage.egp", "EGP")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
