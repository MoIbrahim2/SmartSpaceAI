import { useState, useEffect } from "react";
import { DollarSign, Users, ShieldAlert, ShoppingBag } from "lucide-react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../Components/Admin/Shared/PageHeader";
import StatCard from "../../Components/Admin/Shared/StatCard";
import DataTable from "../../Components/Admin/Shared/DataTable";
import StatusBadge from "../../Components/Admin/Shared/StatusBadge";
import QuickActions from "../../Components/Admin/Dashboard/QuickActions";
import NotificationsWidget from "../../Components/Admin/Dashboard/NotificationsWidget";
import ActivityFeed from "../../Components/Admin/Dashboard/ActivityFeed";
import CreateSellerModal from "../../Components/Admin/Sellers/CreateSellerModal";
import LoadingState from "../../Components/Admin/LoadingState";
import { useToast } from "../../Components/Admin/Shared/ToastContext";
import { getDashboardStats, getModerationItems, createSeller } from "../../api/AdminApi";

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [createSellerOpen, setCreateSellerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalRevenue: { value: "$0", change: "+0%", isPositive: true },
    activeSellers: { value: "0", change: "0 sellers", isPositive: true },
    pendingModeration: { value: "0", change: "0 items", isPositive: true },
    totalOrders: { value: "0", change: "+0%", isPositive: true },
    revenueChartData: [],
    recentActivities: [],
  });

  const [moderations, setModerations] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [dashStats, modRes] = await Promise.all([
          getDashboardStats().catch(() => null),
          getModerationItems({ limit: 5 }).catch(() => null),
        ]);

        if (isMounted) {
          if (dashStats) {
            setStats(dashStats);
          }
          if (modRes?.items) {
            setModerations(modRes.items.slice(0, 3));
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateSeller = async (newSellerData) => {
    try {
      const created = await createSeller(newSellerData);
      showToast(t("admin.sellers.toastRegistered", { email: created.seller?.email || newSellerData.email }), "success");
      setCreateSellerOpen(false);
      // Refresh dashboard stats
      const dashStats = await getDashboardStats().catch(() => null);
      if (dashStats) setStats(dashStats);
    } catch (err) {
      let errMsg = "Failed to create seller";
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors) && err.response.data.errors.length > 0) {
        errMsg = err.response.data.errors.map((e) => (typeof e === "string" ? e : e.message)).join(". ");
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      } else if (err.message) {
        errMsg = err.message;
      }
      showToast(errMsg, "error");
      throw err;
    }
  };

  const columns = [
    {
      label: t("admin.moderation.colProduct"),
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
    { label: t("admin.moderation.colSeller"), key: "sellerName" },
    { label: t("seller.products.colPrice"), key: "price" },
    {
      label: t("admin.moderation.colStatus"),
      key: "status",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  if (loading) {
    return <LoadingState message={t("admin.dashboard.loading")} />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("admin.dashboard.title")}
        description={t("admin.dashboard.description")}
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title={t("admin.dashboard.totalRevenue")}
          value={stats.totalRevenue?.value || "$0"}
          change={stats.totalRevenue?.change || "0%"}
          isPositive={stats.totalRevenue?.isPositive ?? true}
          icon={DollarSign}
        />
        <StatCard
          title={t("admin.dashboard.activeSellers")}
          value={stats.activeSellers?.value || "0"}
          change={stats.activeSellers?.change || "0"}
          isPositive={stats.activeSellers?.isPositive ?? true}
          icon={Users}
        />
        <StatCard
          title={t("admin.dashboard.pendingModeration")}
          value={stats.pendingModeration?.value || "0"}
          change={stats.pendingModeration?.change || "0"}
          isPositive={stats.pendingModeration?.isPositive ?? true}
          icon={ShieldAlert}
        />
        <StatCard
          title={t("admin.dashboard.totalOrders")}
          value={stats.totalOrders?.value || "0"}
          change={stats.totalOrders?.change || "0%"}
          isPositive={stats.totalOrders?.isPositive ?? true}
          icon={ShoppingBag}
        />
      </div>

      {/* Quick Actions & Notifications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions onCreateSeller={() => setCreateSellerOpen(true)} />
        <NotificationsWidget items={[]} />
      </div>

      {/* Table & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-extrabold text-on-surface">{t("admin.dashboard.pendingModerationTable")}</h2>
          <DataTable columns={columns} data={moderations} />
        </div>
        <div>
          <ActivityFeed activities={stats.recentActivities || []} />
        </div>
      </div>

      <CreateSellerModal
        isOpen={createSellerOpen}
        onClose={() => setCreateSellerOpen(false)}
        onCreate={handleCreateSeller}
      />
    </div>
  );
}
