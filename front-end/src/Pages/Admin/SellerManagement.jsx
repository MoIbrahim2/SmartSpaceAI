import { useState, useEffect } from "react";
import { UserPlus, Eye, Edit2, Ban, Trash2, Users, CheckCircle, ShieldAlert, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../Components/Admin/Shared/PageHeader";
import StatCard from "../../Components/Admin/Shared/StatCard";
import DataTable from "../../Components/Admin/Shared/DataTable";
import StatusBadge from "../../Components/Admin/Shared/StatusBadge";
import SearchInput from "../../Components/Admin/Shared/SearchInput";
import FilterDropdown from "../../Components/Admin/Shared/FilterDropdown";
import ActionDropdown from "../../Components/Admin/Shared/ActionDropdown";
import EmptyState from "../../Components/Admin/Shared/EmptyState";
import ConfirmDialog from "../../Components/Admin/Shared/ConfirmDialog";
import CreateSellerModal from "../../Components/Admin/Sellers/CreateSellerModal";
import SellerDetailsDrawer from "../../Components/Admin/Sellers/SellerDetailsDrawer";
import EditCommissionModal from "../../Components/Admin/Sellers/EditCommissionModal";
import LoadingState from "../../Components/Admin/LoadingState";
import { useToast } from "../../Components/Admin/Shared/ToastContext";
import {
  getSellers,
  createSeller,
  updateSellerCommission,
  deleteSeller,
  resendSellerVerificationCode
} from "../../api/AdminApi";

export default function SellerManagement() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const [activeSeller, setActiveSeller] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editCommissionOpen, setEditCommissionOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const fetchSellersList = async () => {
    try {
      setLoading(true);
      const res = await getSellers({ search, status });
      const rawSellers = res.sellers || res.data || (Array.isArray(res) ? res : []);

      const formatted = rawSellers.map((s) => {
        const firstName = s.profile?.firstName || "";
        const lastName = s.profile?.lastName || "";
        const fullName = `${firstName} ${lastName}`.trim();
        const sellerName = fullName || s.name || s.storeName || s.sellerProfile?.businessName || s.email || s.authentication?.email || "Seller";
        const sellerEmail = s.email || s.authentication?.email || "";
        const totalSalesVal = typeof s.totalSalesAmount === "number" ? s.totalSalesAmount : (s.sellerMetrics?.totalSalesAmount || 0);

        return {
          id: s._id || s.id,
          _id: s._id || s.id,
          name: sellerName,
          email: sellerEmail,
          phone: s.phone || s.sellerProfile?.phone || "",
          storeUrl: s.storeUrl || s.sellerProfile?.storeUrl || "",
          address: s.address || s.sellerProfile?.address || "",
          productsCount: s.productsCount ?? s.sellerMetrics?.productsCount ?? 0,
          commissionRate: s.commissionRate ?? s.baseCommissionPercentage ?? s.base_commission_percentage ?? 10,
          status: s.status || "ACTIVE",
          totalSales: `$${totalSalesVal.toLocaleString()}`,
          totalSalesAmount: totalSalesVal,
          joinedDate: s.createdAt ? new Date(s.createdAt).toISOString().split("T")[0] : "",
          taxId: s.taxId || s.sellerProfile?.taxId || "",
          bankAccount: s.bankAccount || s.sellerProfile?.bankAccount || "",
        };
      });

      setSellers(formatted);
    } catch (err) {
      console.error("Failed to fetch sellers:", err);
      showToast("Failed to load seller accounts", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellersList();
  }, [search, status]);

  const handleCreateSeller = async (formData) => {
    try {
      await createSeller(formData);
      showToast(t("admin.sellers.toastRegistered", { email: formData.email }), "success");
      setCreateModalOpen(false);
      fetchSellersList();
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

  const handleUpdateCommission = async (sellerId, newRate) => {
    try {
      await updateSellerCommission(sellerId, newRate);
      showToast(t("admin.sellers.toastCommissionUpdated"), "success");
      setEditCommissionOpen(false);
      fetchSellersList();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to update commission", "error");
    }
  };

  const handleResendCode = async (seller) => {
    try {
      await resendSellerVerificationCode(seller.id);
      showToast(t("admin.sellers.toastCodeSent", { email: seller.email }), "success");
    } catch (err) {
      showToast(
        err.response?.data?.message || err.message || "Failed to resend verification code",
        "error"
      );
    }
  };

  const handleDeleteSeller = async () => {
    if (!activeSeller) return;
    try {
      await deleteSeller(activeSeller.id);
      showToast(t("admin.sellers.toastDeleted", { name: activeSeller.name }), "success");
      setDeleteConfirmOpen(false);
      setActiveSeller(null);
      fetchSellersList();
    } catch (err) {
      showToast(
        err.response?.data?.message || err.message || "Failed to delete seller account",
        "error"
      );
    }
  };

  const statusOptions = [
    { label: t("admin.sellers.allStatuses"), value: "All" },
    { label: t("admin.sellers.verified"), value: "Verified" },
    { label: t("admin.sellers.pendingVerification"), value: "Pending Verification" },
  ];

  const columns = [
    {
      label: t("admin.sellers.colSellerName"),
      key: "name",
      render: (row) => (
        <div>
          <p className="font-bold text-on-surface">{row.name}</p>
          <p className="text-xs text-on-surface-variant">{row.email}</p>
        </div>
      ),
    },
    { label: t("admin.sellers.colProducts"), key: "productsCount" },
    {
      label: t("admin.sellers.colCommission"),
      key: "commissionRate",
      render: (row) => <span className="font-bold">{row.commissionRate}%</span>,
    },
    { label: t("admin.sellers.colTotalSales"), key: "totalSales" },
    {
      label: t("admin.sellers.colStatus"),
      key: "status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      label: t("admin.sellers.colActions"),
      key: "actions",
      sortable: false,
      render: (row) => {
        const isPending =
          row.status === "PENDING_ACTIVATION" ||
          row.status === "Pending Verification" ||
          String(row.status).toLowerCase().includes("pending");

        return (
          <ActionDropdown
            actions={[
              {
                label: t("admin.sellers.actViewProfile"),
                icon: Eye,
                onClick: () => {
                  setActiveSeller(row);
                  setDrawerOpen(true);
                },
              },
              ...(isPending
                ? [
                    {
                      label: t("admin.sellers.actResendCode"),
                      icon: Send,
                      onClick: () => handleResendCode(row),
                    },
                  ]
                : []),
              {
                label: t("admin.sellers.actEditCommission"),
                icon: Edit2,
                onClick: () => {
                  setActiveSeller(row);
                  setEditCommissionOpen(true);
                },
              },
              {
                label: t("admin.sellers.actDeleteSeller"),
                icon: Trash2,
                variant: "danger",
                onClick: () => {
                  setActiveSeller(row);
                  setDeleteConfirmOpen(true);
                },
              },
            ]}
          />
        );
      },
    },
  ];

  if (loading && sellers.length === 0) {
    return <LoadingState message={t("admin.sellers.loading")} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admin.sellers.title")}
        description={t("admin.sellers.description")}
      >
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white neo-shadow hover:bg-primary/90 transition-all"
        >
          <UserPlus className="size-4" />
          <span>{t("admin.sellers.registerSeller")}</span>
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard title={t("admin.sellers.totalStores")} value={sellers.length} icon={Users} />
        <StatCard title={t("admin.sellers.verifiedSellers")} value={sellers.filter((s) => s.status === "Verified" || s.status === "ACTIVE").length} isPositive={true} icon={CheckCircle} />
        <StatCard title={t("admin.sellers.pendingReview")} value={sellers.filter((s) => s.status.includes("Pending") || s.status === "PENDING_ACTIVATION").length} icon={ShieldAlert} />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-outline/10 neomorph-raised">
        <SearchInput value={search} onChange={setSearch} placeholder={t("admin.sellers.searchPlaceholder")} />
        <FilterDropdown value={status} onChange={setStatus} label={t("admin.sellers.statusFilter")} options={statusOptions} />
      </div>

      {sellers.length === 0 ? (
        <EmptyState title={t("admin.sellers.noSellersTitle")} description={t("admin.sellers.noSellersDesc")} />
      ) : (
        <DataTable columns={columns} data={sellers} />
      )}

      <SellerDetailsDrawer seller={activeSeller} isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <EditCommissionModal
        seller={activeSeller}
        isOpen={editCommissionOpen}
        onClose={() => setEditCommissionOpen(false)}
        onUpdate={(id, rate) => handleUpdateCommission(id, rate)}
      />

      <CreateSellerModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateSeller}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title={t("admin.sellers.deleteConfirmTitle")}
        message={t("admin.sellers.deleteConfirmMsg", { name: activeSeller?.name })}
        confirmText={t("admin.sellers.deleteConfirmBtn")}
        variant="danger"
        onConfirm={handleDeleteSeller}
      />
    </div>
  );
}

