import { useState, useEffect } from "react";
import { DollarSign, Clock, CheckCircle2, Eye, Check } from "lucide-react";
import PageHeader from "../../Components/Admin/Shared/PageHeader";
import StatCard from "../../Components/Admin/Shared/StatCard";
import DataTable from "../../Components/Admin/Shared/DataTable";
import StatusBadge from "../../Components/Admin/Shared/StatusBadge";
import ActionDropdown from "../../Components/Admin/Shared/ActionDropdown";
import EmptyState from "../../Components/Admin/Shared/EmptyState";
import ConfirmDialog from "../../Components/Admin/Shared/ConfirmDialog";
import ReportFilters from "../../Components/Admin/Reports/ReportFilters";
import CommissionDetailsDrawer from "../../Components/Admin/Reports/CommissionDetailsDrawer";
import LoadingState from "../../Components/Admin/LoadingState";
import { useToast } from "../../Components/Admin/Shared/ToastContext";
import { getMonthlyCommissions, markCommissionPaid } from "../../api/AdminApi";

export default function CommissionReports() {
  const { showToast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [month, setMonth] = useState("All");
  const [year, setYear] = useState("2026");

  const [activeReport, setActiveReport] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [markPaidConfirmOpen, setMarkPaidConfirmOpen] = useState(false);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const data = await getMonthlyCommissions({ year: year !== "All" ? year : undefined, month: month !== "All" ? month : undefined });
      const rawReports = data.reports || data.items || (Array.isArray(data) ? data : []);

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
          period: c.period || `${c.month || "May"} ${c.year || "2026"}`,
          month: c.month || "May",
          year: c.year || "2026",
          grossSales: `$${(c.grossSales || 0).toLocaleString()}`,
          commissionRate: `${c.commissionRate || sellerObj.base_commission_percentage || 10}%`,
          earnedCommission: `$${(c.earnedCommission || c.commissionAmount || 0).toLocaleString()}`,
          numericEarned: c.earnedCommission || c.commissionAmount || 0,
          payoutStatus: c.payoutStatus || c.status || "Pending",
          payoutDate: c.payoutDate ? new Date(c.payoutDate).toISOString().split("T")[0] : "Pending",
          transactionsCount: c.transactionsCount || c.totalOrders || 0,
        };
      });

      setReports(formatted);
    } catch (err) {
      console.error("Failed to fetch commission reports:", err);
      showToast("Failed to load commission reports", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, [month, year]);

  const handleMarkPaid = async (reportItem) => {
    if (!reportItem) return;
    try {
      await markCommissionPaid({
        sellerId: reportItem.sellerId,
        year: parseInt(reportItem.year, 10) || 2026,
        month: parseInt(reportItem.month, 10) || 5,
        amount: reportItem.numericEarned || 0,
      });
      showToast("Payout marked as Paid!", "success");
      setMarkPaidConfirmOpen(false);
      setDrawerOpen(false);
      fetchCommissions();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to mark payout as paid", "error");
    }
  };

  const filtered = reports.filter((c) => {
    const matchesSearch = c.sellerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "All" || c.payoutStatus === status;
    return matchesSearch && matchesStatus;
  });

  const totalEarned = reports.reduce((acc, curr) => acc + (curr.numericEarned || 0), 0);
  const pendingEarned = reports
    .filter((r) => r.payoutStatus !== "Paid")
    .reduce((acc, curr) => acc + (curr.numericEarned || 0), 0);
  const paidEarned = reports
    .filter((r) => r.payoutStatus === "Paid")
    .reduce((acc, curr) => acc + (curr.numericEarned || 0), 0);

  const columns = [
    {
      label: "Seller Name",
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
    { label: "Gross Sales", key: "grossSales" },
    { label: "Commission Rate", key: "commissionRate" },
    {
      label: "Earned Fee",
      key: "earnedCommission",
      render: (row) => <span className="font-extrabold text-primary">{row.earnedCommission}</span>,
    },
    {
      label: "Status",
      key: "payoutStatus",
      render: (row) => <StatusBadge status={row.payoutStatus} />,
    },
    {
      label: "Actions",
      key: "actions",
      sortable: false,
      render: (row) => (
        <ActionDropdown
          actions={[
            {
              label: "View Report Details",
              icon: Eye,
              onClick: () => {
                setActiveReport(row);
                setDrawerOpen(true);
              },
            },
            ...(row.payoutStatus !== "Paid"
              ? [
                  {
                    label: "Mark Payout Paid",
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
    return <LoadingState message="Loading commission reports..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commission & Financial Reports"
        description="Audit gross sales, earned platform fees, and track seller payouts."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard title="Total Earned Fees" value={`$${totalEarned.toLocaleString()}`} change="+18.5%" isPositive={true} icon={DollarSign} />
        <StatCard title="Pending Payouts" value={`$${pendingEarned.toLocaleString()}`} change={`${reports.filter(r => r.payoutStatus !== "Paid").length} sellers`} isPositive={false} icon={Clock} />
        <StatCard title="Completed Payouts" value={`$${paidEarned.toLocaleString()}`} change="Completed" isPositive={true} icon={CheckCircle2} />
      </div>

      <ReportFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        month={month}
        onMonthChange={setMonth}
        year={year}
        onYearChange={setYear}
        onExportCSV={() => showToast("Exporting financial report CSV...", "info")}
      />

      {filtered.length === 0 ? (
        <EmptyState title="No commission reports found" description="Try modifying your filters or search terms." />
      ) : (
        <DataTable columns={columns} data={filtered} />
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
        title="Confirm Payout Payment"
        message={`Mark commission payout of ${activeReport?.earnedCommission} to '${activeReport?.sellerName}' as Paid?`}
        confirmText="Confirm Payment"
        variant="success"
        onConfirm={() => handleMarkPaid(activeReport)}
      />
    </div>
  );
}
