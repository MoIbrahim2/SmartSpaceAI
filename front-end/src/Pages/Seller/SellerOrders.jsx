import { useState, useEffect } from "react";
import { Receipt, Search, Eye, Check, X, ShieldAlert, Truck, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../Components/Admin/Shared/PageHeader";
import DataTable from "../../Components/Admin/Shared/DataTable";
import StatusBadge from "../../Components/Admin/Shared/StatusBadge";
import FilterDropdown from "../../Components/Admin/Shared/FilterDropdown";
import Modal from "../../Components/Admin/Shared/Modal";
import { getSellerOrders, updateSellerOrderStatus } from "../../api/SellerApi";
import { useToast } from "../../Components/Admin/Shared/ToastContext";

export default function SellerOrders() {
  const { showToast } = useToast();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Drawer / details modal state
  const [activeOrder, setActiveOrder] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      setLoading(true);
      const res = await getSellerOrders();
      if (res?.success) {
        setOrders(Array.isArray(res?.data) ? res.data : (res?.data?.orders || []));
      }
    } catch (error) {
      console.error("Error loading seller orders:", error);
      showToast(t("seller.orders.fetchError"), "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let result = orders;

    if (searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (o) =>
          o._id.toLowerCase().includes(q) ||
          o.customer?.name?.toLowerCase().includes(q) ||
          o.items?.some((i) => i.product?.name?.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== "ALL") {
      result = result.filter((o) => o.status === statusFilter);
    }

    setFilteredOrders(result);
  }, [orders, searchTerm, statusFilter]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const res = await updateSellerOrderStatus(id, newStatus);
      if (res?.success) {
        const translatedStatus = t(`status.${newStatus}`, { defaultValue: newStatus });
        showToast(t("seller.orders.statusUpdated", { status: translatedStatus }), "success");
        setOrders((prev) =>
          prev.map((o) => (o._id === id ? { ...o, status: newStatus } : o))
        );
        if (activeOrder && activeOrder._id === id) {
          setActiveOrder((prev) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      showToast(t("seller.orders.updateError"), "error");
    }
  };

  const columns = [
    {
      label: t("seller.orders.colOrderId"),
      key: "_id",
      render: (row) => <span className="font-mono font-bold text-primary">{row._id}</span>,
    },
    {
      label: t("seller.orders.colDate"),
      key: "createdAt",
      render: (row) => (
        <span className="text-xs text-on-surface-variant font-medium">
          {new Date(row.createdAt).toLocaleDateString(i18n.language?.startsWith("ar") ? "ar-EG" : "en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
    {
      label: t("seller.orders.colCustomer"),
      key: "customerName",
      render: (row) => (
        <div>
          <p className="font-bold text-on-surface text-sm">{row.customer?.name}</p>
          <p className="text-xs text-on-surface-variant font-medium">{row.customer?.phone}</p>
        </div>
      ),
    },
    {
      label: t("seller.orders.colItemsBreakdown"),
      key: "items",
      render: (row) => (
        <span className="text-xs font-semibold text-on-surface-variant">
          {row.items?.map((item) => `${item.product?.name} (x${item.quantity})`).join(", ")}
        </span>
      ),
    },
    {
      label: t("seller.orders.colTotalAmount"),
      key: "totalAmount",
      render: (row) => (
        <span className="font-extrabold text-primary text-sm">
          {row.totalAmount?.toLocaleString()} {t("seller.dashboard.egp")}
        </span>
      ),
    },
    {
      label: t("seller.orders.colFulfillmentStatus"),
      key: "status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      label: t("seller.orders.colActions"),
      key: "actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveOrder(row);
              setDetailsOpen(true);
            }}
            className="p-2 rounded-xl text-on-surface-variant hover:text-primary transition-all hover:bg-surface border border-outline/10"
            title={t("seller.orders.viewDetails")}
          >
            <Eye className="size-4" />
          </button>
          
          {row.status === "PENDING" && (
            <>
              <button
                onClick={() => handleStatusUpdate(row._id, "PROCESSING")}
                className="p-2 rounded-xl text-emerald-600 hover:text-white hover:bg-emerald-600 transition-all border border-emerald-500/20 bg-emerald-500/10"
                title={t("seller.orders.acceptProcess")}
              >
                <Check className="size-4" />
              </button>
              <button
                onClick={() => handleStatusUpdate(row._id, "REJECTED")}
                className="p-2 rounded-xl text-red-600 hover:text-white hover:bg-red-600 transition-all border border-red-500/20 bg-red-500/10"
                title={t("seller.orders.reject")}
              >
                <X className="size-4" />
              </button>
            </>
          )}

          {row.status === "PROCESSING" && (
            <button
              onClick={() => handleStatusUpdate(row._id, "DELIVERED")}
              className="p-2 rounded-xl text-primary hover:text-white hover:bg-primary transition-all border border-primary/20 bg-primary/10 flex items-center gap-1 text-xs font-bold"
              title={t("seller.orders.ship")}
            >
              <Truck className="size-4" />
              <span>{t("seller.orders.ship")}</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  const statusOptions = [
    { label: t("seller.orders.allOrders"), value: "ALL" },
    { label: t("seller.orders.pendingRequests"), value: "PENDING" },
    { label: t("seller.orders.processingFulfillments"), value: "PROCESSING" },
    { label: t("seller.orders.deliveredSettled"), value: "DELIVERED" },
    { label: t("seller.orders.rejectedRequests"), value: "REJECTED" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("seller.orders.title")}
        description={t("seller.orders.description")}
      />

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-outline/10 neo-shadow">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder={t("seller.orders.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl bg-background pl-9 pr-4 rtl:pr-9 rtl:pl-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none border border-outline/20 focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-3">
          <FilterDropdown
            label={t("seller.orders.fulfillmentFilter")}
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-surface rounded-2xl p-5 border border-outline/10 neo-shadow">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <DataTable columns={columns} data={filteredOrders} />
        )}
      </div>

      {/* Details Modal */}
      {activeOrder && (
        <Modal
          isOpen={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          title={t("seller.orders.orderDetailsTitle", { id: activeOrder._id })}
        >
          <div className="space-y-6">
            {/* Status Header */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-outline/10 neo-inset">
              <div>
                <span className="text-xs text-on-surface-variant block font-bold">{t("seller.orders.fulfillmentStatusLabel")}</span>
                <StatusBadge status={activeOrder.status} />
              </div>
              <div>
                <span className="text-xs text-on-surface-variant block text-right rtl:text-left font-bold font-mono">{t("seller.orders.dateReceived")}</span>
                <span className="text-sm font-semibold text-on-surface">
                  {new Date(activeOrder.createdAt).toLocaleString(i18n.language?.startsWith("ar") ? "ar-EG" : "en-US")}
                </span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-sm text-on-surface border-b border-outline/10 pb-1">{t("seller.orders.customerInfoSection")}</h4>
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-on-surface-variant">
                <div>
                  <span className="text-outline block text-[10px] uppercase font-bold">{t("seller.orders.fullName")}</span>
                  <span className="text-on-surface text-sm">{activeOrder.customer?.name}</span>
                </div>
                <div>
                  <span className="text-outline block text-[10px] uppercase font-bold">{t("seller.orders.contactNumber")}</span>
                  <span className="text-on-surface text-sm">{activeOrder.customer?.phone}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-outline block text-[10px] uppercase font-bold">{t("seller.orders.shippingAddress")}</span>
                  <span className="text-on-surface leading-relaxed">
                    {activeOrder.customer?.address?.street}, {activeOrder.customer?.address?.district}, {activeOrder.customer?.address?.city}, {activeOrder.customer?.address?.country}
                  </span>
                </div>
              </div>
            </div>

            {/* Product Item Details */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-sm text-on-surface border-b border-outline/10 pb-1">{t("seller.orders.orderSummarySection")}</h4>
              <div className="space-y-2">
                {activeOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="size-3 text-primary rtl:rotate-180" />
                      <span className="font-bold text-on-surface">{item.product?.name}</span>
                      <span className="text-on-surface-variant">× {item.quantity}</span>
                    </div>
                    <span className="font-bold text-on-surface">
                      {(item.product?.price * item.quantity).toLocaleString()} {t("seller.dashboard.egp")}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-outline/10 pt-3 text-sm font-extrabold">
                  <span className="text-on-surface">{t("seller.orders.totalSaleRevenue")}</span>
                  <span className="text-primary">{activeOrder.totalAmount?.toLocaleString()} {t("seller.dashboard.egp")}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-outline/10 pt-4">
              <button
                onClick={() => setDetailsOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface border border-outline/20 transition-all"
              >
                {t("seller.orders.closeDialog")}
              </button>
              
              {activeOrder.status === "PENDING" && (
                <>
                  <button
                    onClick={() => {
                      handleStatusUpdate(activeOrder._id, "REJECTED");
                    }}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-red-600 bg-red-500/10 hover:bg-red-600 hover:text-white transition-all"
                  >
                    {t("seller.orders.rejectOrder")}
                  </button>
                  <button
                    onClick={() => {
                      handleStatusUpdate(activeOrder._id, "PROCESSING");
                    }}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all"
                  >
                    {t("seller.orders.acceptOrder")}
                  </button>
                </>
              )}

              {activeOrder.status === "PROCESSING" && (
                <button
                  onClick={() => {
                    handleStatusUpdate(activeOrder._id, "DELIVERED");
                  }}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition-all"
                >
                  {t("seller.orders.markDelivered")}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
