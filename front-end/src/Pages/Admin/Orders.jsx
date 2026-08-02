import { useState } from "react";
import { ShoppingBag, Eye, RefreshCw } from "lucide-react";
import PageHeader from "../../Components/Admin/Shared/PageHeader";
import DataTable from "../../Components/Admin/Shared/DataTable";
import StatusBadge from "../../Components/Admin/Shared/StatusBadge";
import SearchInput from "../../Components/Admin/Shared/SearchInput";
import FilterDropdown from "../../Components/Admin/Shared/FilterDropdown";
import ActionDropdown from "../../Components/Admin/Shared/ActionDropdown";
import EmptyState from "../../Components/Admin/Shared/EmptyState";
import OrderDetailsDrawer from "../../Components/Admin/Orders/OrderDetailsDrawer";
import { useToast } from "../../Components/Admin/Shared/ToastContext";
import { mockOrders } from "./adminMockData";

export default function Orders() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState(mockOrders);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const [activeOrder, setActiveOrder] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.sellerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "All" || o.status === status;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      label: "Order ID",
      key: "id",
      render: (row) => <span className="font-mono font-bold text-primary">{row.id}</span>,
    },
    {
      label: "Customer",
      key: "customerName",
      render: (row) => (
        <div>
          <p className="font-bold text-on-surface">{row.customerName}</p>
          <p className="text-xs text-on-surface-variant">{row.date}</p>
        </div>
      ),
    },
    { label: "Seller", key: "sellerName" },
    { label: "Items", key: "itemsCount" },
    {
      label: "Total Amount",
      key: "totalAmount",
      render: (row) => <span className="font-extrabold text-on-surface">{row.totalAmount}</span>,
    },
    {
      label: "Status",
      key: "status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      label: "Actions",
      key: "actions",
      sortable: false,
      render: (row) => (
        <ActionDropdown
          actions={[
            {
              label: "View Order Details",
              icon: Eye,
              onClick: () => {
                setActiveOrder(row);
                setDrawerOpen(true);
              },
            },
            {
              label: "Advance Fulfillment",
              icon: RefreshCw,
              onClick: () => {
                setOrders((prev) =>
                  prev.map((o) => (o.id === row.id ? { ...o, status: "Shipped" } : o))
                );
                showToast(`Order '${row.id}' status updated to Shipped!`, "success");
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace Orders & Buy Requests"
        description="Track customer orders, seller fulfillments, item breakdowns, and shipping timelines."
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-outline/10 neomorph-raised">
        <SearchInput value={search} onChange={setSearch} placeholder="Search ID, customer, or store..." />
        <FilterDropdown
          value={status}
          onChange={setStatus}
          label="Status"
          options={["All", "Pending", "Processing", "Shipped", "Completed", "Cancelled"]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No orders found" description="Try clearing filters or search terms." icon={ShoppingBag} />
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}

      <OrderDetailsDrawer order={activeOrder} isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
