import { useState, useEffect } from "react";
import { ShoppingBag, Eye, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../Components/Admin/Shared/PageHeader";
import DataTable from "../../Components/Admin/Shared/DataTable";
import StatusBadge from "../../Components/Admin/Shared/StatusBadge";
import SearchInput from "../../Components/Admin/Shared/SearchInput";
import FilterDropdown from "../../Components/Admin/Shared/FilterDropdown";
import ActionDropdown from "../../Components/Admin/Shared/ActionDropdown";
import EmptyState from "../../Components/Admin/Shared/EmptyState";
import OrderDetailsDrawer from "../../Components/Admin/Orders/OrderDetailsDrawer";
import LoadingState from "../../Components/Admin/LoadingState";
import { useToast } from "../../Components/Admin/Shared/ToastContext";
import { getOrders, updateOrderStatus } from "../../api/AdminApi";

export default function Orders() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const [activeOrder, setActiveOrder] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchOrdersList = async () => {
    try {
      setLoading(true);
      const data = await getOrders({ search, status });
      const rawOrders = data.orders || data.items || (Array.isArray(data) ? data : []);

      const formatted = rawOrders.map((o) => ({
        id: o.orderNumber || o._id || `ORD-${o.id}`,
        _id: o._id || o.id,
        customerName: o.customerInfo?.name || o.shippingAddress?.fullName || o.customerName || "Customer",
        customerEmail: o.customerInfo?.email || o.customerEmail || "",
        customerPhone: o.customerInfo?.phone || o.customerPhone || "",
        sellerName: o.sellerId?.storeName || o.sellerName || "Store Seller",
        itemsCount: o.itemsCount || (o.items ? o.items.length : 1),
        totalAmount: `$${(o.totalAmount || 0).toLocaleString()}`,
        status: o.status || "Pending",
        date: o.createdAt ? new Date(o.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        shippingAddress: typeof o.shippingAddress === "string" ? o.shippingAddress : (o.shippingAddress?.street || "Cairo, Egypt"),
        paymentMethod: o.paymentMethod || "Card Payment",
        items: (o.items || []).map((item) => ({
          name: item.name || item.productTitle || "Furniture Item",
          qty: item.quantity || item.qty || 1,
          price: `$${(item.price || 0).toLocaleString()}`,
        })),
        timeline: o.timeline || [
          { status: "Order Placed", date: o.createdAt ? new Date(o.createdAt).toLocaleString() : "Recently", done: true },
        ],
      }));

      setOrders(formatted);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      showToast("Failed to load orders list", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersList();
  }, [search, status]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      showToast(t("admin.orders.toastStatusUpdated", { status: newStatus }), "success");
      fetchOrdersList();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to update order status", "error");
    }
  };

  const columns = [
    {
      label: t("admin.orders.colOrderId"),
      key: "id",
      render: (row) => <span className="font-mono font-bold text-primary">{row.id}</span>,
    },
    {
      label: t("admin.orders.colCustomer"),
      key: "customerName",
      render: (row) => (
        <div>
          <p className="font-bold text-on-surface">{row.customerName}</p>
          <p className="text-xs text-on-surface-variant">{row.date}</p>
        </div>
      ),
    },
    { label: t("admin.orders.colSeller"), key: "sellerName" },
    { label: t("admin.orders.colItems"), key: "itemsCount" },
    {
      label: t("admin.orders.colTotalAmount"),
      key: "totalAmount",
      render: (row) => <span className="font-extrabold text-on-surface">{row.totalAmount}</span>,
    },
    {
      label: t("admin.orders.colStatus"),
      key: "status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      label: t("admin.orders.colActions"),
      key: "actions",
      sortable: false,
      render: (row) => (
        <ActionDropdown
          actions={[
            {
              label: t("admin.orders.actViewDetails"),
              icon: Eye,
              onClick: () => {
                setActiveOrder(row);
                setDrawerOpen(true);
              },
            },
            {
              label: t("admin.orders.actAdvanceFulfillment"),
              icon: RefreshCw,
              onClick: () => handleUpdateStatus(row._id || row.id, "Shipped"),
            },
          ]}
        />
      ),
    },
  ];

  if (loading && orders.length === 0) {
    return <LoadingState message={t("admin.orders.loading")} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admin.orders.title")}
        description={t("admin.orders.description")}
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-outline/10 neomorph-raised">
        <SearchInput value={search} onChange={setSearch} placeholder={t("admin.orders.searchPlaceholder")} />
        <FilterDropdown
          value={status}
          onChange={setStatus}
          label={t("admin.orders.statusFilter")}
          options={["All", "Pending", "Processing", "Shipped", "Completed", "Cancelled"]}
        />
      </div>

      {orders.length === 0 ? (
        <EmptyState title={t("admin.orders.noOrdersTitle")} description={t("admin.orders.noOrdersDesc")} icon={ShoppingBag} />
      ) : (
        <DataTable columns={columns} data={orders} />
      )}

      <OrderDetailsDrawer order={activeOrder} isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
