import { useState, useEffect } from "react";
import { DollarSign, ShoppingBag, ShieldAlert, Package, CheckCircle, HelpCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../../Components/Admin/Shared/PageHeader";
import StatCard from "../../Components/Admin/Shared/StatCard";
import DataTable from "../../Components/Admin/Shared/DataTable";
import StatusBadge from "../../Components/Admin/Shared/StatusBadge";
import { getSellerProducts, getSellerOrders, getSellerEarnings } from "../../api/SellerApi";
import { useToast } from "../../Components/Admin/Shared/ToastContext";

export default function SellerDashboard() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    activeProducts: 0,
    pendingValidation: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [validationAlerts, setValidationAlerts] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [prodRes, orderRes, earnRes] = await Promise.all([
          getSellerProducts(),
          getSellerOrders(),
          getSellerEarnings(),
        ]);

        const products = prodRes?.data || [];
        const orders = orderRes?.data || [];
        const earnings = earnRes?.data || {};

        // Calculate KPIs
        const activeProds = products.filter((p) => p.processing?.status === "ACCEPTED").length;
        const pendingProds = products.filter(
          (p) =>
            p.processing?.status === "PENDING_AI_VALIDATION" ||
            p.processing?.status === "MANUAL_REVIEW_REQUIRED"
        ).length;

        setStats({
          totalSales: earnings.grossRevenue || 0,
          totalOrders: orders.length,
          activeProducts: activeProds,
          pendingValidation: pendingProds,
        });

        // Filter recent orders
        setRecentOrders(orders.slice(0, 5));

        // Get products needing attention
        const alerts = products.filter(
          (p) =>
            p.processing?.status === "MANUAL_REVIEW_REQUIRED" ||
            p.processing?.status === "REJECTED"
        );
        setValidationAlerts(alerts);

        // Chart Data based on delivered orders (actual monthly revenue)
        const delivered = orders.filter((o) => o.status === "DELIVERED");
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const salesByMonth = {};
        delivered.forEach((o) => {
          const d = new Date(o.createdAt);
          const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
          salesByMonth[key] = (salesByMonth[key] || 0) + (o.totalAmount || 0);
        });

        const generatedChartData = Object.keys(salesByMonth)
          .sort((a, b) => new Date(a) - new Date(b))
          .map((month) => ({
            month,
            revenue: salesByMonth[month],
          }));
        setChartData(generatedChartData);

      } catch (error) {
        console.error("Error fetching seller dashboard data:", error);
        showToast("Failed to load dashboard statistics", "error");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [showToast]);

  const columns = [
    {
      label: "Order ID",
      key: "_id",
      render: (row) => <span className="font-bold text-on-surface">{row._id}</span>,
    },
    {
      label: "Customer",
      key: "customer",
      render: (row) => (
        <div>
          <p className="font-bold text-on-surface">{row.customer?.name}</p>
          <p className="text-xs text-on-surface-variant">{row.customer?.phone}</p>
        </div>
      ),
    },
    {
      label: "Items",
      key: "items",
      render: (row) => (
        <span className="text-sm font-semibold">
          {row.items?.map((item) => `${item.product?.name} (x${item.quantity})`).join(", ")}
        </span>
      ),
    },
    {
      label: "Total Amount",
      key: "totalAmount",
      render: (row) => (
        <span className="font-bold text-primary">
          {row.totalAmount?.toLocaleString()} EGP
        </span>
      ),
    },
    {
      label: "Status",
      key: "status",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Seller Dashboard"
        description="Manage your custom catalog, monitor incoming client buy-requests, and check earnings ledger."
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Gross Sales"
          value={`${stats.totalSales.toLocaleString()} EGP`}
          change="+18.4%"
          isPositive={true}
          icon={DollarSign}
        />
        <StatCard
          title="Buy Requests"
          value={stats.totalOrders}
          change="+12.5%"
          isPositive={true}
          icon={ShoppingBag}
        />
        <StatCard
          title="Active Products"
          value={stats.activeProducts}
          change="+4"
          isPositive={true}
          icon={Package}
        />
        <StatCard
          title="Needs Attention"
          value={stats.pendingValidation}
          change="AI Validation Active"
          isPositive={true}
          icon={ShieldAlert}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-surface p-5 border border-outline/10 neomorph-raised space-y-4">
          <div className="flex items-center justify-between border-b border-outline/10 pb-3">
            <div>
              <h3 className="font-bold text-base text-on-surface">Store Sales Trend</h3>
              <p className="text-xs text-on-surface-variant">Monthly sales performance including platform transactions</p>
            </div>
            <DollarSign className="size-5 text-primary" />
          </div>
          
          <div className="relative h-48 w-full pt-4">
            <div className="absolute inset-0 flex items-end justify-between gap-2 px-2 pb-6">
              {chartData.map((item, idx) => {
                const heightPercent = Math.round((item.revenue / maxRevenue) * 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="relative w-full flex justify-center items-end h-full">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[32px] rounded-t-lg bg-primary/80 group-hover:bg-primary transition-all neo-shadow"
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-[10px] font-bold px-2 py-1 rounded shadow-md pointer-events-none transition-all z-20 whitespace-nowrap">
                          {item.revenue.toLocaleString()} EGP
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-on-surface-variant">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* AI Validation Notifications */}
        <div className="rounded-2xl bg-surface p-5 border border-outline/10 neomorph-raised space-y-4">
          <div className="flex items-center justify-between border-b border-outline/10 pb-3">
            <div>
              <h3 className="font-bold text-base text-on-surface">AI Validation Alerts</h3>
              <p className="text-xs text-on-surface-variant">Requires manual updates or review</p>
            </div>
            <ShieldAlert className="size-5 text-error animate-pulse" />
          </div>
          
          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
            {validationAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-on-surface-variant">
                <CheckCircle className="size-8 text-green-500 mb-2" />
                <p className="text-sm font-semibold text-on-surface">All Products Verified</p>
                <p className="text-xs text-on-surface-variant">Your listings comply with SmartSpace design systems.</p>
              </div>
            ) : (
              validationAlerts.map((alert) => (
                <div
                  key={alert._id}
                  className="flex items-start gap-3 rounded-xl p-3 bg-surface-container border border-outline/10 text-xs"
                >
                  <div className="mt-0.5">
                    {alert.processing?.status === "REJECTED" ? (
                      <span className="inline-block p-1 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-lg">
                        <ShieldAlert className="size-4" />
                      </span>
                    ) : (
                      <span className="inline-block p-1 bg-yellow-100 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400 rounded-lg">
                        <HelpCircle className="size-4" />
                      </span>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-bold text-on-surface">{alert.basic?.name}</p>
                    <p className="text-on-surface-variant leading-relaxed text-[11px]">
                      {alert.processing?.status === "REJECTED"
                        ? alert.processing?.issues?.[0] || "Declined during automated structural check."
                        : "Flagged for manual alignment review by admin."}
                    </p>
                    <div className="pt-1">
                      <Link
                        to={`/seller/products/${alert._id}/edit`}
                        className="text-primary hover:underline font-bold inline-flex items-center gap-1 text-[11px]"
                      >
                        Update Listing <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Buy Requests */}
      <div className="rounded-2xl bg-surface p-5 border border-outline/10 neomorph-raised space-y-4">
        <div className="flex items-center justify-between border-b border-outline/10 pb-3">
          <div>
            <h3 className="font-bold text-base text-on-surface">Recent Buy Requests</h3>
            <p className="text-xs text-on-surface-variant">Incoming purchaser requests waiting for processing</p>
          </div>
          <Link
            to="/seller/orders"
            className="text-primary hover:underline font-bold text-sm inline-flex items-center gap-1"
          >
            View All Requests <ArrowRight className="size-4" />
          </Link>
        </div>
        <DataTable columns={columns} data={recentOrders} />
      </div>
    </div>
  );
}
