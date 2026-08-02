import { useState, useEffect } from "react";
import { DollarSign, Clock, Percent, ShieldCheck } from "lucide-react";
import PageHeader from "../../Components/Admin/Shared/PageHeader";
import StatCard from "../../Components/Admin/Shared/StatCard";
import DataTable from "../../Components/Admin/Shared/DataTable";
import StatusBadge from "../../Components/Admin/Shared/StatusBadge";
import { getSellerEarnings } from "../../api/SellerApi";
import { useToast } from "../../Components/Admin/Shared/ToastContext";

export default function SellerEarnings() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [earningsData, setEarningsData] = useState({
    grossRevenue: 0,
    commissionRate: 0.12,
    platformFees: 0,
    outstandingFees: 0,
    paidFees: 0,
    ledger: [],
  });

  useEffect(() => {
    async function loadEarnings() {
      try {
        setLoading(true);
        const res = await getSellerEarnings();
        if (res?.success && res.data) {
          setEarningsData(res.data);
        }
      } catch (error) {
        console.error("Error loading earnings:", error);
        showToast("Failed to load earnings ledger", "error");
      } finally {
        setLoading(false);
      }
    }
    loadEarnings();
  }, [showToast]);

  const columns = [
    {
      label: "Period",
      key: "period",
      render: (row) => <span className="font-bold text-on-surface text-sm">{row.period}</span>,
    },
    {
      label: "Gross Sales",
      key: "totalSales",
      render: (row) => (
        <span className="font-semibold text-on-surface-variant">
          {row.totalSales?.toLocaleString()} EGP
        </span>
      ),
    },
    {
      label: "Platform Fee (12%)",
      key: "platformFee",
      render: (row) => (
        <span className="font-semibold text-error">
          - {row.platformFee?.toLocaleString()} EGP
        </span>
      ),
    },
    {
      label: "Net Earnings",
      key: "netEarnings",
      render: (row) => (
        <span className="font-extrabold text-emerald-600">
          {(row.totalSales - row.platformFee)?.toLocaleString()} EGP
        </span>
      ),
    },
    {
      label: "Payment Status",
      key: "paymentStatus",
      render: (row) => <StatusBadge status={row.paymentStatus} />,
    },
    {
      label: "Verification Date",
      key: "verificationDate",
      render: (row) => (
        <span className="text-xs font-semibold text-outline">
          {row.verificationDate || "-"}
        </span>
      ),
    },
  ];

  const netSellerProfit = earningsData.grossRevenue - earningsData.platformFees;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Earnings & Commission Ledger"
        description="Review gross store sales, calculate platform commission fees, and monitor settlement statuses."
      />

      {/* Financial Stats */}
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Revenue"
            value={`${earningsData.grossRevenue.toLocaleString()} EGP`}
            change="Gross sales"
            isPositive={true}
            icon={DollarSign}
          />
          <StatCard
            title="Platform Commission"
            value={`${(earningsData.commissionRate * 100).toFixed(0)}%`}
            change="Standard rate"
            isPositive={true}
            icon={Percent}
          />
          <StatCard
            title="Net Profit"
            value={`${netSellerProfit.toLocaleString()} EGP`}
            change="After commission"
            isPositive={true}
            icon={ShieldCheck}
          />
          <StatCard
            title="Outstanding Fees"
            value={`${earningsData.outstandingFees.toLocaleString()} EGP`}
            change="To be verified"
            isPositive={false}
            icon={Clock}
          />
        </div>
      )}

      {/* Ledger Table */}
      <div className="rounded-2xl bg-surface p-5 border border-outline/10 neomorph-raised space-y-4">
        <h3 className="font-bold text-base text-on-surface">Monthly Payout Ledger</h3>
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <DataTable columns={columns} data={earningsData.ledger} />
        )}
      </div>
    </div>
  );
}
