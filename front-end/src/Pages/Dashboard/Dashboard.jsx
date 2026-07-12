import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import ApartmentCard from "../../Components/ApartmentCard";
import EmptyState from "../../Components/EmptyState/EmptyState";
import { getApartments, deleteApartment } from "../../api";

const Dashboard = () => {
  const navigate = useNavigate();
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");

  const fetchApartments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await getApartments({ search, page, limit: 10 });
      if (data.success) {
        const list = data.data?.apartments || [];
        setApartments(list);
        setTotalPages(data.data?.totalPages || 1);
      }
    } catch (err) {
      if (err.response?.status !== 401) {
        setError("Failed to load apartments.");
      }
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchApartments();
  }, [fetchApartments]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this apartment?")) return;
    try {
      await deleteApartment(id);
      fetchApartments();
    } catch {
      setError("Failed to delete apartment.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-bright text-on-surface font-body">
      <main className="mx-auto w-full max-w-[1200px] flex-grow px-6 py-10 md:px-20">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl flex-1">
            <div className="relative flex h-14 items-center rounded-full bg-surface-bright px-6 neo-inset">
              <span className="material-symbols-outlined text-outline">search</span>
              <input
                className="ml-3 w-full bg-transparent text-base text-on-surface placeholder:text-outline outline-none border-none focus:outline-none focus:border-none focus:ring-0 focus:ring-transparent"
                placeholder="Search your apartments..."
                type="text"
                aria-label="Search apartments"
                autoComplete="off"
                name="search"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
          <Link
            className="flex h-14 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-8 font-bold text-white transition-all hover:bg-on-primary-fixed-variant neo-shadow neo-button"
            to="/room-generation"
          >
            <span className="material-symbols-outlined">add</span>
            Create New Apartment
          </Link>
        </div>

        <h2 className="mb-8 text-3xl font-extrabold tracking-tight text-on-surface">
          My Apartments
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
            title="No Apartments Yet"
            description="Create your first apartment to get started with AI-powered room design."
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {apartments.map((apartment) => (
                <div key={apartment._id} className="relative group">
                  <ApartmentCard apartment={apartment} />
                  <button
                    onClick={() => handleDelete(apartment._id)}
                    className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-error/80 text-white opacity-0 transition-opacity hover:bg-error group-hover:opacity-100"
                    aria-label="Delete apartment"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
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
                  Previous
                </button>
                <span className="text-sm font-medium text-on-surface-variant">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-full bg-surface-bright px-6 py-3 font-bold text-primary neo-shadow neo-button disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
