import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, ShieldAlert, CheckCircle, Clock, AlertTriangle, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageHeader from "../../Components/Admin/Shared/PageHeader";
import DataTable from "../../Components/Admin/Shared/DataTable";
import StatusBadge from "../../Components/Admin/Shared/StatusBadge";
import FilterDropdown from "../../Components/Admin/Shared/FilterDropdown";
import ConfirmDialog from "../../Components/Admin/Shared/ConfirmDialog";
import { getSellerProducts, deleteSellerProduct } from "../../api/SellerApi";
import { useToast } from "../../Components/Admin/Shared/ToastContext";
import { getProductImage } from "../../utils/productUtils";

function ValidationReasonPopover({ status, issues, detectedObject }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  if (!status || status === "ACCEPTED" || status === "PENDING_AI_VALIDATION") {
    return null;
  }

  const hasIssues = Array.isArray(issues) && issues.length > 0;

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="p-1 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors focus:outline-none"
        title={t("seller.products.popoverTooltip")}
        aria-label={t("seller.products.popoverTooltip")}
      >
        <Info className="size-4 text-outline hover:text-primary cursor-pointer" />
      </button>

      {isOpen && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3.5 bg-surface text-on-surface rounded-xl shadow-xl border border-outline/20 text-xs text-left rtl:text-right space-y-2 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-outline/10 pb-1.5 font-bold">
            <span className="text-on-surface">{t("seller.products.popoverReason")}</span>
            {detectedObject && detectedObject !== "Error" && detectedObject !== "None" && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant">
                {t("seller.products.popoverDetected")} {detectedObject}
              </span>
            )}
          </div>
          
          {hasIssues ? (
            <ul className="space-y-1.5 text-on-surface-variant leading-normal">
              {issues.map((issue, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="font-bold text-primary">•</span>
                  <span className="break-words flex-1">{issue}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-on-surface-variant italic">
              {status === "REJECTED"
                ? t("seller.products.popoverDeclined")
                : t("seller.products.popoverFlagged")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function SellerProducts() {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  // Dialog state
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [page, searchTerm, statusFilter]);

  async function fetchProducts() {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search: searchTerm.trim() || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined
      };
      const res = await getSellerProducts(params);
      if (res?.success) {
        if (res.data?.products) {
          setProducts(res.data.products || []);
          setPagination(res.data.pagination || { total: res.data.products.length, page, limit, totalPages: 1 });
        } else if (Array.isArray(res.data)) {
          setProducts(res.data);
          setPagination({ total: res.data.length, page: 1, limit: res.data.length || 10, totalPages: 1 });
        }
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      showToast(t("seller.products.fetchError"), "error");
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      const res = await deleteSellerProduct(deleteId);
      if (res?.success) {
        showToast(t("seller.products.deleteSuccess"), "success");
        setProducts((prev) => prev.filter((p) => p._id !== deleteId));
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      showToast(t("seller.products.deleteError"), "error");
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
      label: t("seller.products.colProduct"),
      key: "name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={getProductImage(row)}
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
      label: t("seller.products.colCategory"),
      key: "canonicalCategory",
      render: (row) => {
        const cat = row.classification?.canonicalCategory;
        const translatedCat = cat ? t(`seller.categories.${cat}`, cat) : "N/A";
        return (
          <span className="font-semibold text-on-surface-variant text-sm">
            {translatedCat}
          </span>
        );
      },
    },
    {
      label: t("seller.products.colDimensions"),
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
      label: t("seller.products.colPrice"),
      key: "price",
      render: (row) => (
        <span className="font-bold text-primary">
          {row.pricing?.currentPrice?.toLocaleString()} {row.pricing?.currency || t("seller.dashboard.egp")}
        </span>
      ),
    },
    {
      label: t("seller.products.colStockStatus"),
      key: "stock",
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
            row.availability?.inStock
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-red-500/10 text-red-600"
          }`}
        >
          {row.availability?.inStock
            ? t("seller.products.inStock", { count: row.availability?.quantity || 0 })
            : t("seller.products.outOfStock")}
        </span>
      ),
    },
    {
      label: t("seller.products.colValidationStatus"),
      key: "validationStatus",
      render: (row) => {
        const status = row.processing?.status;
        const issues = row.processing?.issues;
        const detectedObject = row.processing?.detectedObject;

        return (
          <div className="flex items-center gap-2">
            {getStatusIcon(status)}
            <StatusBadge status={status} />
            <ValidationReasonPopover
              status={status}
              issues={issues}
              detectedObject={detectedObject}
            />
          </div>
        );
      },
    },
    {
      label: t("seller.products.colActions"),
      key: "actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/seller/products/${row._id}/edit`}
            className="p-2 rounded-xl text-on-surface-variant hover:text-primary transition-all hover:bg-surface border border-outline/10"
            title={t("seller.products.editTooltip")}
          >
            <Edit2 className="size-4" />
          </Link>
          <button
            onClick={() => setDeleteId(row._id)}
            className="p-2 rounded-xl text-on-surface-variant hover:text-error transition-all hover:bg-surface border border-outline/10"
            title={t("seller.products.deleteTooltip")}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  const statusOptions = [
    { label: t("seller.products.filterAll"), value: "ALL" },
    { label: t("seller.products.filterAccepted"), value: "ACCEPTED" },
    { label: t("seller.products.filterPendingAi"), value: "PENDING_AI_VALIDATION" },
    { label: t("seller.products.filterManualReview"), value: "MANUAL_REVIEW_REQUIRED" },
    { label: t("seller.products.filterRejected"), value: "REJECTED" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("seller.products.title")}
        description={t("seller.products.description")}
      >
        <Link
          to="/seller/products/create"
          className="bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-bold neo-shadow hover:bg-primary/95 flex items-center gap-2 transition-all"
        >
          <Plus className="size-4" />
          <span>{t("seller.products.addNewProduct")}</span>
        </Link>
      </PageHeader>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-outline/10 neo-shadow">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder={t("seller.products.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl bg-background pl-9 pr-4 rtl:pr-9 rtl:pl-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none border border-outline/20 focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-3">
          <FilterDropdown
            label={t("seller.products.filterAiValidation")}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
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
          <DataTable
            columns={columns}
            data={products}
            manualPagination={true}
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalRecords={pagination.total}
            onPageChange={(newPage) => setPage(newPage)}
          />
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title={t("seller.products.deleteTitle")}
        message={t("seller.products.deleteMessage")}
        confirmText={isDeleting ? t("seller.products.deleting") : t("seller.products.deleteConfirm")}
        variant="danger"
      />
    </div>
  );
}
