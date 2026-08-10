import { useState, useEffect } from "react";
import { DollarSign, Clock, CheckCircle2, Eye, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../Components/Admin/Shared/PageHeader";
import StatCard from "../../Components/Admin/Shared/StatCard";
import DataTable from "../../Components/Admin/Shared/DataTable";
import StatusBadge from "../../Components/Admin/Shared/StatusBadge";
import ActionDropdown from "../../Components/Admin/Shared/ActionDropdown";
import EmptyState from "../../Components/Admin/Shared/EmptyState";
import ConfirmDialog from "../../Components/Admin/Shared/ConfirmDialog";
import CommissionDetailsDrawer from "../../Components/Admin/Reports/CommissionDetailsDrawer";
import LoadingState from "../../Components/Admin/LoadingState";
import { useToast } from "../../Components/Admin/Shared/ToastContext";
import { getMonthlyCommissions, markCommissionPaid } from "../../api/AdminApi";

export default function CommissionReports() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeReport, setActiveReport] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [markPaidConfirmOpen, setMarkPaidConfirmOpen] = useState(false);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const data = await getMonthlyCommissions();
      const rawReports = data?.reports || data?.items || (Array.isArray(data) ? data : []);

      const formatted = rawReports.map((c) => {
        const sellerObj = c.seller || {};
        const firstName = sellerObj.firstName || c.firstName || "";
        const lastName = sellerObj.lastName || c.lastName || "";
        const fullName = `${firstName} ${lastName}`.trim();
        const displayName =
          fullName ||
          c.sellerName ||
          c.storeName ||
          sellerObj.name ||
          sellerObj.email ||
          c.email ||
          "Seller";

        return {
          id: c.payoutId || c._id || `COM-${Math.floor(Math.random() * 9000)}`,
          sellerId: c.sellerId || sellerObj._id,
          sellerName: displayName,
          sellerEmail: sellerObj.email || c.email || "",
          period: c.period || "All Time",
          month: c.month || "All",
          year: c.year || "All",
          grossSales: `EGP ${(c.grossSales || 0).toLocaleString()}`,
          commissionRate: `${c.commissionRate || sellerObj.base_commission_percentage || 10}%`,
          earnedCommission: `EGP ${(c.earnedCommission || c.commissionAmount || 0).toLocaleString()}`,
          numericEarned: c.earnedCommission || c.commissionAmount || 0,
          payoutStatus: c.payoutStatus || c.status || "Unpaid",
          payoutDate: c.payoutDate && c.payoutDate !== "Pending" ? c.payoutDate : "Pending",
          transactionsCount: c.transactionsCount || c.totalOrders || 0,
        };
      });

      setReports(formatted);
    } catch (err) {
      console.error("Failed to fetch commission reports:", err);
      showToast(err.response?.data?.message || err.message || "Failed to load commission reports", "error");
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, []);

  const handleMarkPaid = async (reportItem) => {
    if (!reportItem) return;
    if (reportItem.payoutStatus?.toLowerCase() === "paid") {
      showToast("Payout is already marked as Paid", "info");
      return;
    }
    try {
      await markCommissionPaid({
        sellerId: reportItem.sellerId,
        year: parseInt(reportItem.year, 10) || new Date().getFullYear(),
        month: parseInt(reportItem.month, 10) || (new Date().getMonth() + 1),
      });
      showToast(t("admin.commissions.toastPayoutPaid"), "success");
      setMarkPaidConfirmOpen(false);
      setDrawerOpen(false);
      fetchCommissions();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to mark payout as paid", "error");
    }
  };

  const totalEarned = reports.reduce((acc, curr) => acc + (curr.numericEarned || 0), 0);
  const pendingEarned = reports
    .filter((r) => r.payoutStatus.toLowerCase() !== "paid")
    .reduce((acc, curr) => acc + (curr.numericEarned || 0), 0);
  const paidEarned = reports
    .filter((r) => r.payoutStatus.toLowerCase() === "paid")
    .reduce((acc, curr) => acc + (curr.numericEarned || 0), 0);

  const columns = [
    {
      label: t("admin.commissions.colSellerName"),
      key: "sellerName",
      render: (row) => (
        <div>
          <p className="font-bold text-on-surface">{row.sellerName}</p>
          <p className="text-xs text-on-surface-variant">
            {row.sellerEmail ? `${row.sellerEmail} • ${row.period}` : row.period}
          </p>
        </div>
      ),
    },
    { label: t("admin.commissions.colGrossSales"), key: "grossSales" },
    { label: t("admin.commissions.colCommissionRate", t("admin.commissions.colCommRate")), key: "commissionRate" },
    {
      label: t("admin.commissions.colEarnedFee"),
      key: "earnedCommission",
      render: (row) => <span className="font-extrabold text-primary">{row.earnedCommission}</span>,
    },
    {
      label: t("admin.commissions.colStatus"),
      key: "payoutStatus",
      render: (row) => <StatusBadge status={row.payoutStatus} />,
    },
    {
      label: t("admin.commissions.colActions"),
      key: "actions",
      sortable: false,
      render: (row) => (
        <ActionDropdown
          actions={[
            {
              label: t("admin.commissions.actViewDetails", t("admin.commissions.actViewReport")),
              icon: Eye,
              onClick: () => {
                setActiveReport(row);
                setDrawerOpen(true);
              },
            },
            ...(row.payoutStatus.toLowerCase() !== "paid"
              ? [
                  {
                    label: t("admin.commissions.actMarkPaid"),
                    icon: Check,
                    onClick: () => {
                      setActiveReport(row);
                      setMarkPaidConfirmOpen(true);
                    },
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ];

  if (loading && reports.length === 0) {
    return <LoadingState message={t("admin.commissions.loading")} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admin.commissions.title")}
        description={t("admin.commissions.description")}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard title={t("admin.commissions.totalEarnedFees")} value={`EGP ${totalEarned.toLocaleString()}`} change="+18.5%" isPositive={true} icon={DollarSign} />
        <StatCard title={t("admin.commissions.pendingPayouts")} value={`EGP ${pendingEarned.toLocaleString()}`} change={`${reports.filter(r => r.payoutStatus.toLowerCase() !== "paid").length} sellers`} isPositive={false} icon={Clock} />
        <StatCard title={t("admin.commissions.completedPayouts")} value={`EGP ${paidEarned.toLocaleString()}`} change="Completed" isPositive={true} icon={CheckCircle2} />
      </div>

      {reports.length === 0 ? (
        <EmptyState title={t("admin.commissions.noReportsTitle")} description={t("admin.commissions.noReportsDesc")} />
      ) : (
        <DataTable columns={columns} data={reports} />
      )}

      <CommissionDetailsDrawer
        item={activeReport}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onMarkPaid={() => handleMarkPaid(activeReport)}
      />

      <ConfirmDialog
        isOpen={markPaidConfirmOpen}
        onClose={() => setMarkPaidConfirmOpen(false)}
        title={t("admin.commissions.confirmPayTitle")}
        message={t("admin.commissions.confirmPayMsg", { amount: activeReport?.earnedCommission, seller: activeReport?.sellerName })}
        confirmText={t("admin.commissions.confirmPayBtn")}
        variant="success"
        onConfirm={() => handleMarkPaid(activeReport)}
      />
    </div>
  );
}
