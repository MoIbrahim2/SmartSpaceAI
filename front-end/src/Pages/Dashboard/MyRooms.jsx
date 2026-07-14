import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import RoomCard from "../../Components/RoomCard";
import EmptyState from "../../Components/EmptyState/EmptyState";
import { getRooms, deleteRoom } from "../../api";
import { useTranslation } from "react-i18next";
import Icon from "../../Components/Icon";

const MyRooms = () => {
  const { t, i18n } = useTranslation();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(e.target.value);
    }, 400);
  };

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await getRooms({ search: debouncedSearch, page, limit: 10 });
      if (data.success) {
        const list = data.data?.rooms || [];
        setRooms(list);
        setTotalPages(data.data?.totalPages || 1);
      }
    } catch (err) {
      if (err.response?.status !== 401) {
        setError(t("dashboard.failedLoadRooms") || "Failed to load rooms.");
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, t]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleDelete = async (id) => {
    if (!window.confirm(t("common.confirmDeleteRoom"))) return;
    try {
      await deleteRoom(id);
      fetchRooms();
    } catch {
      setError(t("common.failedDeleteRoom"));
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface font-body">
      <main className="mx-auto w-full max-w-7xl flex-grow px-6 py-12">
        <div className="mb-16 text-center">
          <h2 className="mb-8 text-3xl font-extrabold tracking-tight text-on-surface uppercase">
            {t("dashboard.myApartmentRooms")}
          </h2>
          <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-6 md:flex-row">
            <div className="max-w-xl flex-1 w-full">
              <div className="relative flex h-14 items-center rounded-full bg-background px-6 neomorph-inset">
                <Icon name="search" className="text-outline" />
                <input
                  className="ml-3 rtl:ml-0 rtl:mr-3 w-full bg-transparent text-base text-on-surface placeholder:text-outline outline-none border-none focus:outline-none focus:border-none focus:ring-0 focus:ring-transparent"
                  placeholder={t("dashboard.searchRooms")}
                  type="text"
                  aria-label="Search rooms"
                  autoComplete="off"
                  name="search"
                  value={search}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            <Link
              to="/room-generation"
              className="flex h-14 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-8 font-bold text-white transition-all hover:bg-on-primary-fixed-variant neomorph-active neomorph-raised"
            >
              <Icon name="add" />
              {t("common.createNewRoom")}
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-error/10 px-5 py-3 text-sm font-medium text-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : rooms.length === 0 ? (
          <EmptyState
            icon="meeting_room"
            title={t("dashboard.noRoomsTitle")}
            description={t("dashboard.noRoomsDesc")}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <div key={room._id} className="relative group">
                  <RoomCard room={room} />
                  <button
                    onClick={() => handleDelete(room._id)}
                    className="absolute top-8 right-8 rtl:right-auto rtl:left-8 flex h-8 w-8 items-center justify-center rounded-full bg-error/80 text-white opacity-0 transition-opacity hover:bg-error group-hover:opacity-100"
                    aria-label="Delete room"
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
                  className="rounded-full bg-background px-6 py-3 font-bold text-primary neomorph-raised disabled:opacity-40"
                >
                  {t("common.previous")}
                </button>
                <span className="text-sm font-medium text-on-surface-variant">
                  {t("common.pageOf", { page, totalPages })}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-full bg-background px-6 py-3 font-bold text-primary neomorph-raised disabled:opacity-40"
                >
                  {t("common.next")}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <div className="sticky bottom-0 left-0 z-50 flex w-full items-center justify-around bg-background p-4 shadow-[0_-6px_12px_rgba(0,0,0,0.05),0_-6px_12px_rgba(255,255,255,0.6)] md:hidden">
        <button className="flex flex-col items-center font-bold text-primary" aria-label="Apartments">
          <Icon name="domain" />
          <span className="mt-1 text-xs">{t("common.apartments")}</span>
        </button>
        <button className="flex flex-col items-center font-medium text-on-surface-variant" aria-label="Alerts">
          <Icon name="notifications" />
          <span className="mt-1 text-xs">{t("common.alerts")}</span>
        </button>
        <button className="flex flex-col items-center font-medium text-on-surface-variant" aria-label="Profile">
          <Icon name="person" />
          <span className="mt-1 text-xs">{t("dashboard.profile")}</span>
        </button>
      </div>
    </div>
  );
};

export default MyRooms;
