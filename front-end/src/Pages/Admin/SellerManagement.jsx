import { useState, useEffect } from "react";
import { UserPlus, Eye, Edit2, Ban, Trash2, Users, CheckCircle, ShieldAlert, Send } from "lucide-react";
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

      const formatted = rawSellers.map((s) => ({
        id: s._id || s.id,
        _id: s._id || s.id,
        name: s.storeName || `${s.profile?.firstName || ""} ${s.profile?.lastName || ""}`.trim() || s.name || s.email,
        email: s.authentication?.email || s.email || "",
        phone: s.phone || "+20 100 000 0000",
        storeUrl: s.storeUrl || "https://smartspace.ai",
        address: s.address || "Cairo, Egypt",
        productsCount: s.productsCount || 0,
        commissionRate: s.sellerMetrics?.baseCommissionPercentage ?? s.baseCommissionPercentage ?? s.commissionRate ?? 10,
        status: s.status || "Verified",
        totalSales: `$${(s.sellerMetrics?.totalSalesAmount || 0).toLocaleString()}`,
        joinedDate: s.createdAt ? new Date(s.createdAt).toISOString().split("T")[0] : "2025-01-01",
        taxId: s.taxId || "TAX-000000",
        bankAccount: s.bankAccount || "N/A",
      }));

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
      showToast(`Seller account '${formData.email}' registered successfully!`, "success");
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
      showToast("Commission rate updated!", "success");
      setEditCommissionOpen(false);
      fetchSellersList();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to update commission", "error");
    }
  };

  const handleResendCode = async (seller) => {
    try {
      await resendSellerVerificationCode(seller.id);
      showToast(`Verification code sent to ${seller.email}!`, "success");
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
      showToast(`Seller account '${activeSeller.name}' permanently deleted.`, "success");
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

  const columns = [
    {
      label: "Seller Name",
      key: "name",
      render: (row) => (
        <div>
          <p className="font-bold text-on-surface">{row.name}</p>
          <p className="text-xs text-on-surface-variant">{row.email}</p>
        </div>
      ),
    },
    { label: "Products", key: "productsCount" },
    {
      label: "Commission",
      key: "commissionRate",
      render: (row) => <span className="font-bold">{row.commissionRate}%</span>,
    },
    { label: "Total Sales", key: "totalSales" },
    {
      label: "Status",
      key: "status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      label: "Actions",
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
                label: "View Profile Details",
                icon: Eye,
                onClick: () => {
                  setActiveSeller(row);
                  setDrawerOpen(true);
                },
              },
              ...(isPending
                ? [
                    {
                      label: "Resend Verification Code",
                      icon: Send,
                      onClick: () => handleResendCode(row),
                    },
                  ]
                : []),
              {
                label: "Edit Commission",
                icon: Edit2,
                onClick: () => {
                  setActiveSeller(row);
                  setEditCommissionOpen(true);
                },
              },
              {
                label: "Delete Seller Account",
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
    return <LoadingState message="Loading sellers..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Seller Management"
        description="Verify seller identity, update commission fees, and audit store metrics."
      >
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white neo-shadow hover:bg-primary/90 transition-all"
        >
          <UserPlus className="size-4" />
          <span>Register Seller</span>
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard title="Total Stores" value={sellers.length} icon={Users} />
        <StatCard title="Verified Sellers" value={sellers.filter((s) => s.status === "Verified" || s.status === "ACTIVE").length} isPositive={true} icon={CheckCircle} />
        <StatCard title="Pending Review" value={sellers.filter((s) => s.status.includes("Pending") || s.status === "PENDING_ACTIVATION").length} icon={ShieldAlert} />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-outline/10 neomorph-raised">
        <SearchInput value={search} onChange={setSearch} placeholder="Search seller or email..." />
        <FilterDropdown value={status} onChange={setStatus} label="Status" options={["All", "Verified", "Pending Verification", "Suspended"]} />
      </div>

      {sellers.length === 0 ? (
        <EmptyState title="No sellers found" description="Try clearing search query or changing filters." />
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
        title="Delete Seller Account"
        message={`Are you sure you want to permanently delete '${activeSeller?.name}' from the users database?`}
        confirmText="Delete Seller"
        variant="danger"
        onConfirm={handleDeleteSeller}
      />
    </div>
  );
}

