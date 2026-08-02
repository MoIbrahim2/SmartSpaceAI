import { useState } from "react";
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
import { useToast } from "../../Components/Admin/Shared/ToastContext";
import { mockCommissions } from "./adminMockData";

export default function CommissionReports() {
  const { showToast } = useToast();
  const [reports, setReports] = useState(mockCommissions);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [month, setMonth] = useState("All");
  const [year, setYear] = useState("2026");

  const [activeReport, setActiveReport] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [markPaidConfirmOpen, setMarkPaidConfirmOpen] = useState(false);

  const handleMarkPaid = (id) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, payoutStatus: "Paid", payoutDate: new Date().toISOString().split("T")[0] } : r))
    );
    showToast("Payout marked as Paid!", "success");
  };

  const filtered = reports.filter((c) => {
    const matchesSearch = c.sellerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "All" || c.payoutStatus === status;
    const matchesMonth = month === "All" || c.month === month;
    const matchesYear = year === "All" || c.year === year;
    return matchesSearch && matchesStatus && matchesMonth && matchesYear;
  });

  const columns = [
    {
      label: "Seller Name",
      key: "sellerName",
      render: (row) => (
        <div>
          <p className="font-bold text-on-surface">{row.sellerName}</p>
          <p className="text-xs text-on-surface-variant">{row.period}</p>
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commission & Financial Reports"
        description="Audit gross sales, earned platform fees, and track seller payouts."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard title="Total Earned Fees" value="$4,948" change="+18.5%" isPositive={true} icon={DollarSign} />
        <StatCard title="Pending Payouts" value="$1,850" change="1 seller" isPositive={false} icon={Clock} />
        <StatCard title="Completed Payouts" value="$2,468" change="Completed" isPositive={true} icon={CheckCircle2} />
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
        onMarkPaid={handleMarkPaid}
      />

      <ConfirmDialog
        isOpen={markPaidConfirmOpen}
        onClose={() => setMarkPaidConfirmOpen(false)}
        title="Confirm Payout Payment"
        message={`Mark commission payout of ${activeReport?.earnedCommission} to '${activeReport?.sellerName}' as Paid?`}
        confirmText="Confirm Payment"
        variant="success"
        onConfirm={() => handleMarkPaid(activeReport?.id)}
      />
    </div>
  );
}
