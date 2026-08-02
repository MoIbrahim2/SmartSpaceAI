import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, ShieldAlert, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../../Components/Admin/Shared/PageHeader";
import DataTable from "../../Components/Admin/Shared/DataTable";
import StatusBadge from "../../Components/Admin/Shared/StatusBadge";
import FilterDropdown from "../../Components/Admin/Shared/FilterDropdown";
import ConfirmDialog from "../../Components/Admin/Shared/ConfirmDialog";
import { getSellerProducts, deleteSellerProduct } from "../../api/SellerApi";
import { useToast } from "../../Components/Admin/Shared/ToastContext";

export default function SellerProducts() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  // Dialog state
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      const res = await getSellerProducts();
      if (res?.success) {
        setProducts(res.data || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      showToast("Failed to fetch product catalog", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let result = products;

    if (searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.basic?.name?.toLowerCase().includes(q) ||
          p.basic?.sku?.toLowerCase().includes(q) ||
          p.classification?.canonicalCategory?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "ALL") {
      result = result.filter((p) => p.processing?.status === statusFilter);
    }

    setFilteredProducts(result);
  }, [products, searchTerm, statusFilter]);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      const res = await deleteSellerProduct(deleteId);
      if (res?.success) {
        showToast("Product listing deleted successfully", "success");
        setProducts((prev) => prev.filter((p) => p._id !== deleteId));
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      showToast("Failed to delete product", "error");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "ACCEPTED":
        return <CheckCircle className="size-4 text-emerald-500" />;
      case "PENDING_AI_VALIDATION":
        return <Clock className="size-4 text-amber-500 animate-pulse" />;
      case "MANUAL_REVIEW_REQUIRED":
        return <AlertTriangle className="size-4 text-yellow-500" />;
      case "REJECTED":
        return <ShieldAlert className="size-4 text-red-500" />;
      default:
        return null;
    }
  };

  const columns = [
    {
      label: "Product",
      key: "name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.images?.[0]?.url || "/img/no-product-image.svg"}
            alt={row.basic?.name}
            className="size-12 rounded-xl object-cover border border-outline/20 bg-surface"
            onError={(e) => {
              e.target.src = "/img/no-product-image.svg";
            }}
          />
          <div>
            <p className="font-bold text-on-surface line-clamp-1">{row.basic?.name}</p>
            <p className="text-xs text-on-surface-variant font-medium">SKU: {row.basic?.sku || "N/A"}</p>
          </div>
        </div>
      ),
    },
    {
      label: "Category",
      key: "canonicalCategory",
      render: (row) => (
        <span className="font-semibold text-on-surface-variant text-sm">
          {row.classification?.canonicalCategory || "N/A"}
        </span>
      ),
    },
    {
      label: "Dimensions",
      key: "dimensions",
      render: (row) => {
        const d = row.dimensions;
        if (!d) return <span className="text-xs text-outline">N/A</span>;
        return (
          <span className="text-xs font-semibold text-on-surface-variant">
            {d.length} × {d.width} × {d.height} {d.dimensionUnit || "cm"}
          </span>
        );
      },
    },
    {
      label: "Price",
      key: "price",
      render: (row) => (
        <span className="font-bold text-primary">
          {row.pricing?.currentPrice?.toLocaleString()} {row.pricing?.currency || "EGP"}
        </span>
      ),
    },
    {
      label: "Stock Status",
      key: "stock",
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
            row.availability?.inStock
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-red-500/10 text-red-600"
          }`}
        >
          {row.availability?.inStock ? `In Stock (${row.availability?.quantity || 0})` : "Out of Stock"}
        </span>
      ),
    },
    {
      label: "Validation Status",
      key: "validationStatus",
      render: (row) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(row.processing?.status)}
          <StatusBadge status={row.processing?.status} />
        </div>
      ),
    },
    {
      label: "Actions",
      key: "actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/seller/products/${row._id}/edit`}
            className="p-2 rounded-xl text-on-surface-variant hover:text-primary transition-all hover:bg-surface border border-outline/10"
            title="Edit Product"
          >
            <Edit2 className="size-4" />
          </Link>
          <button
            onClick={() => setDeleteId(row._id)}
            className="p-2 rounded-xl text-on-surface-variant hover:text-error transition-all hover:bg-surface border border-outline/10"
            title="Delete Product"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  const statusOptions = [
    { label: "All Statuses", value: "ALL" },
    { label: "Accepted", value: "ACCEPTED" },
    { label: "Pending AI Validation", value: "PENDING_AI_VALIDATION" },
    { label: "Manual Review", value: "MANUAL_REVIEW_REQUIRED" },
    { label: "Rejected", value: "REJECTED" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Products Catalog"
        description="List, filter, and manage your products. Any created or updated products will go through the design validation queue."
      >
        <Link
          to="/seller/products/create"
          className="bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-bold neo-shadow hover:bg-primary/95 flex items-center gap-2 transition-all"
        >
          <Plus className="size-4" />
          <span>Add New Product</span>
        </Link>
      </PageHeader>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-outline/10 neo-shadow">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search by name, SKU, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl bg-background pl-9 pr-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none border border-outline/20 focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-3">
          <FilterDropdown
            label="AI Validation"
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
          />
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-surface rounded-2xl p-5 border border-outline/10 neo-shadow">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <DataTable columns={columns} data={filteredProducts} />
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product Listing"
        message="Are you sure you want to delete this product? This action cannot be undone and will permanently remove it from our database."
        confirmText={isDeleting ? "Deleting..." : "Delete Listing"}
        variant="danger"
      />
    </div>
  );
}
