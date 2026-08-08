import { useState, useEffect } from "react";
import { ShieldCheck, Eye, Check, X, Sparkles } from "lucide-react";
import PageHeader from "../../Components/Admin/Shared/PageHeader";
import DataTable from "../../Components/Admin/Shared/DataTable";
import StatusBadge from "../../Components/Admin/Shared/StatusBadge";
import SearchInput from "../../Components/Admin/Shared/SearchInput";
import FilterDropdown from "../../Components/Admin/Shared/FilterDropdown";
import ActionDropdown from "../../Components/Admin/Shared/ActionDropdown";
import EmptyState from "../../Components/Admin/Shared/EmptyState";
import ConfirmDialog from "../../Components/Admin/Shared/ConfirmDialog";
import ProductDetailsDrawer from "../../Components/Admin/Moderation/ProductDetailsDrawer";
import RejectReasonModal from "../../Components/Admin/Moderation/RejectReasonModal";
import LoadingState from "../../Components/Admin/LoadingState";
import { useToast } from "../../Components/Admin/Shared/ToastContext";
import { getModerationItems, updateModerationStatus } from "../../api/AdminApi";

export default function ModerationQueue() {
  const { showToast } = useToast();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  const [activeProduct, setActiveProduct] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);

  const fetchModerationQueue = async () => {
    try {
      setLoading(true);
      const res = await getModerationItems({ search, status });
      const items = res.items || (Array.isArray(res) ? res : []);
      setQueue(items);
    } catch (err) {
      console.error("Failed to fetch moderation queue:", err);
      showToast("Failed to load moderation items", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModerationQueue();
  }, [search, status]);

  const handleApprove = async (id) => {
    try {
      await updateModerationStatus(id, "ACCEPTED", "Approved by admin review");
      showToast("Product approved and published to catalog!", "success");
      setApproveConfirmOpen(false);
      setDrawerOpen(false);
      fetchModerationQueue();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to approve product", "error");
    }
  };

  const handleReject = async (id, reason) => {
    try {
      await updateModerationStatus(id, "REJECTED", reason);
      showToast(`Product rejected. Reason: ${reason}`, "warning");
      setRejectModalOpen(false);
      setDrawerOpen(false);
      fetchModerationQueue();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to reject product", "error");
    }
  };

  const columns = [
    {
      label: "Product",
      key: "productTitle",
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.imageUrl}
            alt={row.productTitle}
            className="size-12 rounded-xl object-cover border border-outline/20 neo-shadow"
          />
          <div>
            <p className="font-bold text-on-surface line-clamp-1">{row.productTitle}</p>
            <p className="text-xs text-on-surface-variant">
              {row.category} • <span className="font-bold text-primary">{row.price}</span>
            </p>
          </div>
        </div>
      ),
    },
    { label: "Seller", key: "sellerName" },
    {
      label: "AI Confidence",
      key: "aiConfidence",
      render: (row) => (
        <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <Sparkles className="size-3.5" />
          <span>{row.aiConfidence}</span>
        </div>
      ),
    },
    {
      label: "Quality Index",
      key: "qualityScore",
      render: (row) => (
        <span className="rounded-lg bg-surface-bright px-2.5 py-1 text-xs font-extrabold border border-outline/20">
          {row.qualityScore}
        </span>
      ),
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
              label: "Inspect Product Details",
              icon: Eye,
              onClick: () => {
                setActiveProduct(row);
                setDrawerOpen(true);
              },
            },
            {
              label: "Approve Product",
              icon: Check,
              onClick: () => {
                setActiveProduct(row);
                setApproveConfirmOpen(true);
              },
            },
            {
              label: "Reject Product",
              icon: X,
              variant: "danger",
              onClick: () => {
                setActiveProduct(row);
                setRejectModalOpen(true);
              },
            },
          ]}
        />
      ),
    },
  ];

  if (loading && queue.length === 0) {
    return <LoadingState message="Loading moderation queue..." />;
  }

  const statusOptions = [
    { label: "All Statuses", value: "ALL" },
    { label: "Manual Review Required", value: "MANUAL_REVIEW_REQUIRED" },
    { label: "Pending AI Validation", value: "PENDING_AI_VALIDATION" },
    { label: "Accepted", value: "ACCEPTED" },
    { label: "Rejected", value: "REJECTED" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Moderation Queue"
        description="Review AI confidence metrics and approve or reject catalog additions."
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-outline/10 neomorph-raised">
        <SearchInput value={search} onChange={setSearch} placeholder="Search product or seller..." />
        <FilterDropdown value={status} onChange={setStatus} label="Status" options={statusOptions} />
      </div>

      {queue.length === 0 ? (
        <EmptyState title="Moderation queue clear" description="All submitted products have been reviewed!" icon={ShieldCheck} />
      ) : (
        <DataTable columns={columns} data={queue} />
      )}

      <ProductDetailsDrawer
        product={activeProduct}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onApprove={(id) => handleApprove(id)}
        onReject={(id) => {
          setActiveProduct(queue.find((p) => p.id === id));
          setRejectModalOpen(true);
        }}
      />

      <RejectReasonModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={(reason) => handleReject(activeProduct?.id, reason)}
      />

      <ConfirmDialog
        isOpen={approveConfirmOpen}
        onClose={() => setApproveConfirmOpen(false)}
        title="Approve Catalog Product"
        message={`Approve '${activeProduct?.productTitle}' and publish it live?`}
        confirmText="Approve & Publish"
        variant="success"
        onConfirm={() => handleApprove(activeProduct?.id)}
      />
    </div>
  );
}
