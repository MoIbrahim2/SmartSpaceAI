import { useState } from "react";
import { DollarSign, Users, ShieldAlert, ShoppingBag } from "lucide-react";
import PageHeader from "../../Components/Admin/Shared/PageHeader";
import StatCard from "../../Components/Admin/Shared/StatCard";
import DataTable from "../../Components/Admin/Shared/DataTable";
import StatusBadge from "../../Components/Admin/Shared/StatusBadge";
import QuickActions from "../../Components/Admin/Dashboard/QuickActions";
import RevenueChart from "../../Components/Admin/Dashboard/RevenueChart";
import NotificationsWidget from "../../Components/Admin/Dashboard/NotificationsWidget";
import ActivityFeed from "../../Components/Admin/Dashboard/ActivityFeed";
import CreateSellerModal from "../../Components/Admin/Sellers/CreateSellerModal";
import { useToast } from "../../Components/Admin/Shared/ToastContext";
import {
  mockDashboardStats,
  mockRevenueChartData,
  mockNotifications,
  mockModerationQueue,
  mockRecentActivities,
} from "./adminMockData";

export default function AdminDashboard() {
  const { showToast } = useToast();
  const [createSellerOpen, setCreateSellerOpen] = useState(false);
  const [moderations] = useState(mockModerationQueue.slice(0, 3));

  const columns = [
    {
      label: "Product",
      key: "productTitle",
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.imageUrl}
            alt={row.productTitle}
            className="size-10 rounded-lg object-cover border border-outline/20"
          />
          <div>
            <p className="font-bold text-on-surface line-clamp-1">{row.productTitle}</p>
            <p className="text-xs text-on-surface-variant">{row.category}</p>
          </div>
        </div>
      ),
    },
    { label: "Seller", key: "sellerName" },
    { label: "Price", key: "price" },
    {
      label: "Status",
      key: "status",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Overview"
        description="Monitor revenue, seller activities, pending product moderations, and orders."
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Revenue"
          value={mockDashboardStats.totalRevenue.value}
          change={mockDashboardStats.totalRevenue.change}
          isPositive={mockDashboardStats.totalRevenue.isPositive}
          icon={DollarSign}
        />
        <StatCard
          title="Active Sellers"
          value={mockDashboardStats.activeSellers.value}
          change={mockDashboardStats.activeSellers.change}
          isPositive={mockDashboardStats.activeSellers.isPositive}
          icon={Users}
        />
        <StatCard
          title="Pending Moderation"
          value={mockDashboardStats.pendingModeration.value}
          change={mockDashboardStats.pendingModeration.change}
          isPositive={mockDashboardStats.pendingModeration.isPositive}
          icon={ShieldAlert}
        />
        <StatCard
          title="Total Orders"
          value={mockDashboardStats.totalOrders.value}
          change={mockDashboardStats.totalOrders.change}
          isPositive={mockDashboardStats.totalOrders.isPositive}
          icon={ShoppingBag}
        />
      </div>

      {/* Quick Actions & Revenue Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={mockRevenueChartData} />
        </div>
        <div className="space-y-6">
          <QuickActions onCreateSeller={() => setCreateSellerOpen(true)} />
          <NotificationsWidget items={mockNotifications} />
        </div>
      </div>

      {/* Table & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-extrabold text-on-surface">Pending Product Moderation</h2>
          <DataTable columns={columns} data={moderations} />
        </div>
        <div>
          <ActivityFeed activities={mockRecentActivities} />
        </div>
      </div>

      <CreateSellerModal
        isOpen={createSellerOpen}
        onClose={() => setCreateSellerOpen(false)}
        onCreate={(newSeller) => {
          showToast(`Seller account '${newSeller.name}' created!`, "success");
        }}
      />
    </div>
  );
}
