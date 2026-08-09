import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RoomCard from "../../Components/RoomCard";
import EmptyState from "../../Components/EmptyState/EmptyState";
import CreateRoomModal from "../../Components/CreateRoomModal";
import { getApartmentById, getRooms, deleteRoom } from "../../api";
import { useTranslation } from "react-i18next";
import Icon from "../../Components/Icon";

const ApartmentRooms = () => {
  const { t } = useTranslation();
  const { apartmentId } = useParams();
  const navigate = useNavigate();

  const [apartment, setApartment] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [aptRes, roomsRes] = await Promise.all([
        getApartmentById(apartmentId),
        getRooms({ apartmentId }),
      ]);
      if (aptRes.data.success) {
        setApartment(aptRes.data.data.apartment);
      }
      if (roomsRes.data.success) {
        setRooms(roomsRes.data.data?.rooms || []);
      }
    } catch (err) {
      if (err.response?.status !== 401) {
        setError(t("dashboard.failedLoadApartmentData") || "Failed to load apartment data.");
      }
    } finally {
      setLoading(false);
    }
  }, [apartmentId, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id) => {
    if (!window.confirm(t("common.confirmDeleteRoom") || "Are you sure you want to delete this room?")) return;
    try {
      await deleteRoom(id);
      fetchData();
    } catch {
      setError(t("common.failedDeleteRoom") || "Failed to delete room.");
    }
  };

  const handleRoomCreated = (room) => {
    setShowCreateModal(false);
    navigate(`/apartments/${apartmentId}/rooms/${room._id}`);
  };

  const locationStr = apartment?.location
    ? [apartment.location.city, apartment.location.district, apartment.location.street]
        .filter(Boolean)
        .join(", ") || ""
    : "";

  return (
    <div className="flex min-h-screen flex-col bg-background dark:bg-[#0a0908] text-on-surface dark:text-white font-body transition-colors">
      <main className="mx-auto w-full max-w-7xl flex-grow px-6 py-12 md:px-12">
        {/* Back Button & Header */}
        <div className="mb-12">
          <button
            onClick={() => navigate("/home")}
            className="mb-8 inline-flex items-center gap-2 rounded-xl border border-outline/20 dark:border-white/10 bg-surface dark:bg-[#12100e] px-4 py-2.5 text-sm font-bold text-on-surface dark:text-white shadow-sm transition-all hover:bg-stone-50 dark:hover:bg-white/10"
          >
            <Icon name="arrow_back" size={18} className="rtl:rotate-180 text-[#a67443] dark:text-amber-400" />
            <span>{t("dashboard.backToApartments") || "Back to Apartments"}</span>
          </button>

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-headline font-extrabold tracking-tight text-on-surface dark:text-white md:text-4xl">
                {loading ? t("common.loading") : apartment?.name || "Apartment"}
              </h1>
              {locationStr && (
                <p className="mt-2 flex items-center gap-2 text-base font-semibold text-on-surface-variant dark:text-white/70">
                  <Icon name="location_on" size={18} className="text-[#a67443] dark:text-amber-400 shrink-0" />
                  <span>{locationStr}</span>
                </p>
              )}
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex h-14 items-center justify-center gap-3 whitespace-nowrap rounded-2xl bg-[#a67443] hover:bg-[#946334] text-white font-bold text-base px-8 shadow-lg shadow-[#a67443]/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Icon name="add" size={22} />
              <span>{t("common.createNewRoom") || "Create New Room"}</span>
            </button>
          </div>
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
        ) : rooms.length === 0 ? (
          <EmptyState
            icon="meeting_room"
            title={t("dashboard.noRoomsTitle") || "No rooms found"}
            description={t("dashboard.noRoomsDesc") || "Create your first room to start generating designs."}
          />
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <div
                key={room._id}
                className="relative group cursor-pointer"
                onClick={() => navigate(`/apartments/${apartmentId}/rooms/${room._id}`)}
              >
                <RoomCard room={room} />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(room._id);
                  }}
                  className="absolute top-5 right-5 rtl:right-auto rtl:left-5 flex h-10 w-10 items-center justify-center rounded-full bg-red-600/90 text-white opacity-0 transition-opacity hover:bg-red-700 shadow-lg group-hover:opacity-100"
                  aria-label="Delete room"
                  title="Delete room"
                >
                  <Icon name="delete" size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleRoomCreated}
        apartmentId={apartmentId}
      />
    </div>
  );
};

export default ApartmentRooms;
