import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import ApartmentCard from "../../Components/ApartmentCard";
import EmptyState from "../../Components/EmptyState/EmptyState";
import CreateApartmentModal from "../../Components/CreateApartmentModal";
import { getApartments, deleteApartment } from "../../api";
import { useTranslation } from "react-i18next";
import Icon from "../../Components/Icon";

const Dashboard = () => {
  const { t, i18n } = useTranslation();
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
    if (!window.confirm(t("common.confirmDeleteApartment"))) return;
    try {
      await deleteApartment(id);
      fetchApartments();
    } catch {
      setError(t("common.failedDeleteApartment"));
    }
  };

  const handleApartmentCreated = (apartment) => {
    setShowCreateModal(false);
    navigate(`/apartments/${apartment._id}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-bright text-on-surface font-body">
      <main className="mx-auto w-full max-w-[1200px] flex-grow px-6 py-10 md:px-20">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl flex-1">
            <div className="relative flex h-14 items-center rounded-full bg-surface-bright px-6 neo-inset">
              <Icon name="search" className="text-outline" />
              <input
                className="ml-3 rtl:ml-0 rtl:mr-3 w-full bg-transparent text-base text-on-surface placeholder:text-outline outline-none border-none focus:outline-none focus:border-none focus:ring-0 focus:ring-transparent"
                placeholder={t("dashboard.searchApartments")}
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
            className="flex h-14 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-8 font-bold text-white transition-all hover:bg-on-primary-fixed-variant neo-shadow neo-button"
          >
            <Icon name="add" />
            {t("dashboard.createNewApartment")}
          </button>
        </div>

        <h2 className="mb-8 text-3xl font-extrabold tracking-tight text-on-surface">
          {t("dashboard.myApartments")}
        </h2>

        {error && (
          <div className="mb-6 rounded-xl bg-error/10 px-5 py-3 text-sm font-medium text-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : apartments.length === 0 ? (
          <EmptyState
            icon="domain"
            title={t("dashboard.noApartmentsTitle")}
            description={t("dashboard.noApartmentsDesc")}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {apartments.map((apartment) => (
                <div key={apartment._id} className="relative group">
                  <ApartmentCard apartment={apartment} />
                  <button
                    onClick={() => handleDelete(apartment._id)}
                    className="absolute top-4 right-4 rtl:right-auto rtl:left-4 flex h-8 w-8 items-center justify-center rounded-full bg-error/80 text-white opacity-0 transition-opacity hover:bg-error group-hover:opacity-100"
                    aria-label="Delete apartment"
                  >
                    <Icon name="delete" size={14} />
                  </button>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-full bg-surface-bright px-6 py-3 font-bold text-primary neo-shadow neo-button disabled:opacity-40"
                >
                  {t("common.previous")}
                </button>
                <span className="text-sm font-medium text-on-surface-variant">
                  {t("common.pageOf", { page, totalPages })}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-full bg-surface-bright px-6 py-3 font-bold text-primary neo-shadow neo-button disabled:opacity-40"
                >
                  {t("common.next")}
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
