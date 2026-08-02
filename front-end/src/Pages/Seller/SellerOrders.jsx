import { useState, useEffect } from "react";
import { Receipt, Search, Eye, Check, X, ShieldAlert, Truck, ChevronRight } from "lucide-react";
import PageHeader from "../../Components/Admin/Shared/PageHeader";
import DataTable from "../../Components/Admin/Shared/DataTable";
import StatusBadge from "../../Components/Admin/Shared/StatusBadge";
import FilterDropdown from "../../Components/Admin/Shared/FilterDropdown";
import Modal from "../../Components/Admin/Shared/Modal";
import { getSellerOrders, updateSellerOrderStatus } from "../../api/SellerApi";
import { useToast } from "../../Components/Admin/Shared/ToastContext";

export default function SellerOrders() {
  const { showToast } = useToast();
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
        setOrders(res.data || []);
      }
    } catch (error) {
      console.error("Error loading seller orders:", error);
      showToast("Failed to fetch buy-requests", "error");
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
        showToast(`Order status updated to ${newStatus}`, "success");
        setOrders((prev) =>
          prev.map((o) => (o._id === id ? { ...o, status: newStatus } : o))
        );
        if (activeOrder && activeOrder._id === id) {
          setActiveOrder((prev) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      showToast("Failed to update status", "error");
    }
  };

  const columns = [
    {
      label: "Order ID",
      key: "_id",
      render: (row) => <span className="font-mono font-bold text-primary">{row._id}</span>,
    },
    {
      label: "Date",
      key: "createdAt",
      render: (row) => (
        <span className="text-xs text-on-surface-variant font-medium">
          {new Date(row.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
    {
      label: "Customer",
      key: "customerName",
      render: (row) => (
        <div>
          <p className="font-bold text-on-surface text-sm">{row.customer?.name}</p>
          <p className="text-xs text-on-surface-variant font-medium">{row.customer?.phone}</p>
        </div>
      ),
    },
    {
      label: "Items Breakdown",
      key: "items",
      render: (row) => (
        <span className="text-xs font-semibold text-on-surface-variant">
          {row.items?.map((item) => `${item.product?.name} (x${item.quantity})`).join(", ")}
        </span>
      ),
    },
    {
      label: "Total Amount",
      key: "totalAmount",
      render: (row) => (
        <span className="font-extrabold text-primary text-sm">
          {row.totalAmount?.toLocaleString()} EGP
        </span>
      ),
    },
    {
      label: "Fulfillment Status",
      key: "status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      label: "Actions",
      key: "actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveOrder(row);
              setDetailsOpen(true);
            }}
            className="p-2 rounded-xl text-on-surface-variant hover:text-primary transition-all hover:bg-surface border border-outline/10"
            title="View Details"
          >
            <Eye className="size-4" />
          </button>
          
          {row.status === "PENDING" && (
            <>
              <button
                onClick={() => handleStatusUpdate(row._id, "PROCESSING")}
                className="p-2 rounded-xl text-emerald-600 hover:text-white hover:bg-emerald-600 transition-all border border-emerald-500/20 bg-emerald-500/10"
                title="Accept / Process"
              >
                <Check className="size-4" />
              </button>
              <button
                onClick={() => handleStatusUpdate(row._id, "REJECTED")}
                className="p-2 rounded-xl text-red-600 hover:text-white hover:bg-red-600 transition-all border border-red-500/20 bg-red-500/10"
                title="Reject"
              >
                <X className="size-4" />
              </button>
            </>
          )}

          {row.status === "PROCESSING" && (
            <button
              onClick={() => handleStatusUpdate(row._id, "DELIVERED")}
              className="p-2 rounded-xl text-primary hover:text-white hover:bg-primary transition-all border border-primary/20 bg-primary/10 flex items-center gap-1 text-xs font-bold"
              title="Deliver Order"
            >
              <Truck className="size-4" />
              <span>Ship</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  const statusOptions = [
    { label: "All Orders", value: "ALL" },
    { label: "Pending Requests", value: "PENDING" },
    { label: "Processing Fulfillments", value: "PROCESSING" },
    { label: "Delivered & Settled", value: "DELIVERED" },
    { label: "Rejected Requests", value: "REJECTED" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Buy Requests & Orders"
        description="Fulfill incoming customer purchases, review delivery addresses, and track order cycles."
      />

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-outline/10 neo-shadow">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search by ID, customer name, items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl bg-background pl-9 pr-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none border border-outline/20 focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-3">
          <FilterDropdown
            label="Fulfillment"
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
          title={`Order Details: ${activeOrder._id}`}
        >
          <div className="space-y-6">
            {/* Status Header */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-outline/10 neo-inset">
              <div>
                <span className="text-xs text-on-surface-variant block font-bold">Fulfillment Status</span>
                <StatusBadge status={activeOrder.status} />
              </div>
              <div>
                <span className="text-xs text-on-surface-variant block text-right font-bold font-mono">Date Received</span>
                <span className="text-sm font-semibold text-on-surface">
                  {new Date(activeOrder.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-sm text-on-surface border-b border-outline/10 pb-1">Customer & Delivery Info</h4>
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-on-surface-variant">
                <div>
                  <span className="text-outline block text-[10px] uppercase font-bold">Full Name</span>
                  <span className="text-on-surface text-sm">{activeOrder.customer?.name}</span>
                </div>
                <div>
                  <span className="text-outline block text-[10px] uppercase font-bold">Contact Number</span>
                  <span className="text-on-surface text-sm">{activeOrder.customer?.phone}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-outline block text-[10px] uppercase font-bold">Shipping Address</span>
                  <span className="text-on-surface leading-relaxed">
                    {activeOrder.customer?.address?.street}, {activeOrder.customer?.address?.district}, {activeOrder.customer?.address?.city}, {activeOrder.customer?.address?.country}
                  </span>
                </div>
              </div>
            </div>

            {/* Product Item Details */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-sm text-on-surface border-b border-outline/10 pb-1">Order Summary</h4>
              <div className="space-y-2">
                {activeOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="size-3 text-primary" />
                      <span className="font-bold text-on-surface">{item.product?.name}</span>
                      <span className="text-on-surface-variant">× {item.quantity}</span>
                    </div>
                    <span className="font-bold text-on-surface">
                      {(item.product?.price * item.quantity).toLocaleString()} EGP
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-outline/10 pt-3 text-sm font-extrabold">
                  <span className="text-on-surface">Total Sale Revenue</span>
                  <span className="text-primary">{activeOrder.totalAmount?.toLocaleString()} EGP</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-outline/10 pt-4">
              <button
                onClick={() => setDetailsOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface border border-outline/20 transition-all"
              >
                Close Dialog
              </button>
              
              {activeOrder.status === "PENDING" && (
                <>
                  <button
                    onClick={() => {
                      handleStatusUpdate(activeOrder._id, "REJECTED");
                    }}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-red-600 bg-red-500/10 hover:bg-red-600 hover:text-white transition-all"
                  >
                    Reject Order
                  </button>
                  <button
                    onClick={() => {
                      handleStatusUpdate(activeOrder._id, "PROCESSING");
                    }}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all"
                  >
                    Accept Order
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
                  Mark as Shipped & Delivered
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
