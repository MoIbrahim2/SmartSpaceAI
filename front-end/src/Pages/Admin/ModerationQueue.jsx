import { useState, useEffect } from "react";
import { ShieldCheck, Eye, Check, X, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
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
import { normalizeImageUrl } from "../../utils/productUtils";

export default function ModerationQueue() {
  const { t } = useTranslation();
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
      showToast(t("admin.moderation.toastApproved"), "success");
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
      showToast(t("admin.moderation.toastRejected", { reason }), "warning");
      setRejectModalOpen(false);
      setDrawerOpen(false);
      fetchModerationQueue();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to reject product", "error");
    }
  };

  const columns = [
    {
      label: t("admin.moderation.colProduct"),
      key: "productTitle",
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={normalizeImageUrl(row.imageUrl)}
            alt={row.productTitle}
            className="size-12 rounded-xl object-cover border border-outline/20 neo-shadow"
            onError={(e) => {
              e.target.src = "/img/no-product-image.svg";
            }}
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
    { label: t("admin.moderation.colSeller"), key: "sellerName" },
    {
      label: t("admin.moderation.colAiConfidence", t("admin.moderation.colAiConf")),
      key: "aiConfidence",
      render: (row) => (
        <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <Sparkles className="size-3.5" />
          <span>{row.aiConfidence}</span>
        </div>
      ),
    },
    {
      label: t("admin.moderation.colQualityIndex", t("admin.moderation.colQualityIdx")),
      key: "qualityScore",
      render: (row) => (
        <span className="rounded-lg bg-surface-bright px-2.5 py-1 text-xs font-extrabold border border-outline/20">
          {row.qualityScore}
        </span>
      ),
    },
    {
      label: t("admin.moderation.colStatus"),
      key: "status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      label: t("admin.moderation.colActions"),
      key: "actions",
      sortable: false,
      render: (row) => (
        <ActionDropdown
          actions={[
            {
              label: t("admin.moderation.actInspect"),
              icon: Eye,
              onClick: () => {
                setActiveProduct(row);
                setDrawerOpen(true);
              },
            },
            {
              label: t("admin.moderation.actApprove"),
              icon: Check,
              onClick: () => {
                setActiveProduct(row);
                setApproveConfirmOpen(true);
              },
            },
            {
              label: t("admin.moderation.actReject"),
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
    return <LoadingState message={t("admin.moderation.loading")} />;
  }

  const statusOptions = [
    { label: t("admin.moderation.optAll", t("admin.moderation.allStatuses")), value: "ALL" },
    { label: t("admin.moderation.optManualReview", t("admin.moderation.manualReviewRequired")), value: "MANUAL_REVIEW_REQUIRED" },
    { label: t("admin.moderation.optPendingAi", t("admin.moderation.pendingAiValidation")), value: "PENDING_AI_VALIDATION" },
    { label: t("admin.moderation.optAccepted", t("admin.moderation.accepted")), value: "ACCEPTED" },
    { label: t("admin.moderation.optRejected", t("admin.moderation.rejected")), value: "REJECTED" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admin.moderation.title")}
        description={t("admin.moderation.description")}
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-outline/10 neomorph-raised">
        <SearchInput value={search} onChange={setSearch} placeholder={t("admin.moderation.searchPlaceholder")} />
        <FilterDropdown value={status} onChange={setStatus} label={t("admin.moderation.statusFilter")} options={statusOptions} />
      </div>

      {queue.length === 0 ? (
        <EmptyState title={t("admin.moderation.emptyTitle")} description={t("admin.moderation.emptyDesc")} icon={ShieldCheck} />
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
        title={t("admin.moderation.confirmApproveTitle")}
        message={t("admin.moderation.confirmApproveMsg", { title: activeProduct?.productTitle })}
        confirmText={t("admin.moderation.confirmApproveBtn")}
        variant="success"
        onConfirm={() => handleApprove(activeProduct?.id)}
      />
    </div>
  );
}
