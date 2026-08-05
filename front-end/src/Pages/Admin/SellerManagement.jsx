import { useState, useEffect } from "react";
import { UserPlus, Eye, Edit2, Ban, Trash2, Users, CheckCircle, ShieldAlert } from "lucide-react";
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
import { useToast } from "../../Components/Admin/Shared/ToastContext";
import { createSeller, getSellers, updateSellerCommission, deleteSeller } from "../../api";

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

  useEffect(() => {
    fetchSellersList();
  }, []);

  const fetchSellersList = async () => {
    try {
      setLoading(true);
      const response = await getSellers();
      if (response.success && response.data?.sellers) {
        const mapped = response.data.sellers.map((s) => ({
          id: s._id,
          name: s.sellerProfile?.businessName || `${s.profile?.firstName || ''} ${s.profile?.lastName || ''}`.trim() || 'Store Name',
          email: s.authentication?.email || '',
          phone: s.sellerProfile?.phone || '',
          commissionRate: Math.round((s.sellerProfile?.commissionRate || 0) * 100),
          productsCount: s.productsCount || 0,
          totalSales: `$${(s.totalSales || 0).toLocaleString()}`,
          status: s.sellerProfile?.phone ? "Verified" : "Pending Verification"
        }));
        setSellers(mapped);
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to load seller list", "error");
    } finally {
      setLoading(false);
    }
  };

  const filtered = sellers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "All" || s.status === status;
    return matchesSearch && matchesStatus;
  });

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
      render: (row) => (
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
      ),
    },
  ];

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
        <StatCard title="Verified Sellers" value={sellers.filter((s) => s.status === "Verified").length} isPositive={true} icon={CheckCircle} />
        <StatCard title="Pending Review" value={sellers.filter((s) => s.status.includes("Pending")).length} icon={ShieldAlert} />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-outline/10 neomorph-raised">
        <SearchInput value={search} onChange={setSearch} placeholder="Search seller or email..." />
        <FilterDropdown value={status} onChange={setStatus} label="Status" options={["All", "Verified", "Pending Verification"]} />
      </div>

      <div className="bg-surface rounded-2xl p-5 border border-outline/10 neo-shadow">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No sellers found" description="Try clearing search query or changing filters." />
        ) : (
          <DataTable columns={columns} data={filtered} />
        )}
      </div>

      <SellerDetailsDrawer seller={activeSeller} isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <EditCommissionModal
        seller={activeSeller}
        isOpen={editCommissionOpen}
        onClose={() => setEditCommissionOpen(false)}
        onUpdate={async (id, rate) => {
          try {
            const response = await updateSellerCommission(id, rate);
            if (response.success) {
              setSellers((prev) => prev.map((s) => (s.id === id ? { ...s, commissionRate: rate } : s)));
              showToast("Commission rate updated!", "success");
            } else {
              throw new Error(response.message || "Failed to update commission rate");
            }
          } catch (err) {
            showToast(err.response?.data?.message || err.message || "Failed to update commission rate", "error");
          }
        }}
      />

      <CreateSellerModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={async (newS) => {
          try {
            const response = await createSeller(newS);
            if (response.success && response.data?.seller) {
              const created = response.data.seller;
              const newRow = {
                id: created._id,
                name: created.sellerProfile?.businessName || `${created.profile?.firstName} ${created.profile?.lastName}`,
                email: created.authentication?.email || '',
                phone: created.sellerProfile?.phone || '',
                commissionRate: Math.round((created.sellerProfile?.commissionRate || 0) * 100),
                productsCount: 0,
                totalSales: "$0",
                status: created.sellerProfile?.phone ? "Verified" : "Pending Verification"
              };
              setSellers((prev) => [newRow, ...prev]);
              showToast(`Seller '${newRow.name}' created!`, "success");
            } else {
              throw new Error(response.message || "Failed to create seller");
            }
          } catch (err) {
            const message = err.response?.data?.message || err.message || "Failed to create seller";
            throw new Error(message);
          }
        }}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete Seller Account"
        message={`Are you sure you want to permanently delete '${activeSeller?.name}'? This will delete all products owned by this seller.`}
        confirmText="Delete Seller"
        variant="danger"
        onConfirm={async () => {
          try {
            const response = await deleteSeller(activeSeller.id);
            if (response.success) {
              setSellers((prev) => prev.filter((s) => s.id !== activeSeller?.id));
              showToast("Seller account deleted.", "error");
            } else {
              throw new Error(response.message || "Failed to delete seller");
            }
          } catch (err) {
            showToast(err.response?.data?.message || err.message || "Failed to delete seller", "error");
          }
        }}
      />
    </div>
  );
}
