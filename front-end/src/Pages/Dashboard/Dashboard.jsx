import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ApartmentCard from "../../Components/ApartmentCard";
import EmptyState from "../../Components/EmptyState/EmptyState";
import CreateApartmentModal from "../../Components/CreateApartmentModal";
import { getApartments, deleteApartment } from "../../api";
import { useTranslation } from "react-i18next";
import Icon from "../../Components/Icon";

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const debounceRef = useRef(null);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(e.target.value);
    }, 400);
  };

  const fetchApartments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await getApartments({ search: debouncedSearch, page, limit: 10 });
      if (data.success) {
        const list = data.data?.apartments || [];
        setApartments(list);
        setTotalPages(data.data?.totalPages || 1);
      }
    } catch (err) {
      if (err.response?.status !== 401) {
        setError(t("dashboard.failedLoadApartments") || "Failed to load apartments.");
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, t]);

  useEffect(() => {
    fetchApartments();
  }, [fetchApartments]);

  const handleDelete = async (id) => {
    if (!window.confirm(t("common.confirmDeleteApartment") || "Are you sure you want to delete this apartment?")) return;
    try {
      await deleteApartment(id);
      fetchApartments();
    } catch {
      setError(t("common.failedDeleteApartment") || "Failed to delete apartment.");
    }
  };

  const handleApartmentCreated = (apartment) => {
    setShowCreateModal(false);
    navigate(`/apartments/${apartment._id}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background dark:bg-[#0a0908] text-on-surface dark:text-white font-body transition-colors">
      <main className="mx-auto w-full max-w-7xl flex-grow px-6 py-12 md:px-12">
        
        {/* Search & Actions Header */}
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-lg flex-1">
            <div className="group relative flex h-14 items-center rounded-2xl bg-surface dark:bg-[#12100e] border border-outline/20 dark:border-white/10 px-5 shadow-sm transition-all focus-within:border-[#a67443] dark:focus-within:border-amber-400">
              <Icon name="search" className="text-outline dark:text-white/50 group-focus-within:text-[#a67443] dark:group-focus-within:text-amber-400 transition-colors" size={22} />
              <input
                className="ml-3.5 rtl:ml-0 rtl:mr-3.5 w-full bg-transparent text-base font-medium text-on-surface dark:text-white placeholder:text-outline/60 dark:placeholder:text-white/40 outline-none"
                placeholder={t("dashboard.searchApartments") || "Search your apartments..."}
                type="text"
                aria-label="Search apartments"
                autoComplete="off"
                name="search"
                value={search}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex h-14 items-center justify-center gap-3 whitespace-nowrap rounded-2xl bg-[#a67443] hover:bg-[#946334] text-white font-bold text-base px-8 shadow-lg shadow-[#a67443]/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <Icon name="add" size={22} />
            <span>{t("dashboard.createNewApartment") || "Create New Apartment"}</span>
          </button>
        </div>

        {/* Section Heading */}
        <div className="mb-10 flex items-center justify-between">
          <h2 className="text-3xl font-headline font-extrabold tracking-tight text-on-surface dark:text-white md:text-4xl">
            {t("dashboard.myApartments") || "My Apartments"}
          </h2>
        </div>

        {error && (
          <div className="mb-8 rounded-2xl bg-red-500/15 px-5 py-4 text-sm font-semibold text-red-700 dark:text-red-300 border border-red-500/30">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-28">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#a67443] border-t-transparent" />
          </div>
        ) : apartments.length === 0 ? (
          <EmptyState
            icon="domain"
            title={t("dashboard.noApartmentsTitle") || "No apartments found"}
            description={t("dashboard.noApartmentsDesc") || "Create your first apartment to start staging rooms."}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {apartments.map((apartment) => (
                <div key={apartment._id} className="relative group">
                  <ApartmentCard apartment={apartment} />
                  <button
                    onClick={() => handleDelete(apartment._id)}
                    className="absolute top-5 right-5 rtl:right-auto rtl:left-5 flex h-10 w-10 items-center justify-center rounded-full bg-red-600/90 text-white opacity-0 transition-opacity hover:bg-red-700 shadow-lg group-hover:opacity-100"
                    aria-label="Delete apartment"
                    title="Delete apartment"
                  >
                    <Icon name="delete" size={18} />
                  </button>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-14 flex items-center justify-center gap-5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-xl border border-outline/20 dark:border-white/10 bg-surface dark:bg-[#12100e] px-6 py-3 text-base font-bold text-on-surface dark:text-white shadow-sm transition-all hover:bg-stone-50 dark:hover:bg-white/10 disabled:opacity-40"
                >
                  {t("common.previous") || "Previous"}
                </button>
                <span className="text-base font-semibold text-on-surface-variant dark:text-white/80">
                  {t("common.pageOf", { page, totalPages }) || `Page ${page} of ${totalPages}`}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-xl border border-outline/20 dark:border-white/10 bg-surface dark:bg-[#12100e] px-6 py-3 text-base font-bold text-on-surface dark:text-white shadow-sm transition-all hover:bg-stone-50 dark:hover:bg-white/10 disabled:opacity-40"
                >
                  {t("common.next") || "Next"}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Create Apartment Modal */}
      <CreateApartmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleApartmentCreated}
      />
    </div>
  );
};

export default Dashboard;
