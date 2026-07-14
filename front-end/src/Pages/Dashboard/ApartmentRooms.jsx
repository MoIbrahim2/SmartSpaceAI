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
    if (!window.confirm(t("common.confirmDeleteRoom"))) return;
    try {
      await deleteRoom(id);
      fetchData();
    } catch {
      setError(t("common.failedDeleteRoom"));
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
    <div className="flex min-h-screen flex-col bg-background text-on-surface font-body">
      <main className="mx-auto w-full max-w-7xl flex-grow px-6 py-12">
        {/* Back Button & Header */}
        <div className="mb-10">
          <button
            onClick={() => navigate("/home")}
            className="mb-6 flex items-center gap-2 rounded-xl bg-background px-4 py-2 text-sm font-semibold text-on-surface-variant transition-all hover:text-primary neomorph-raised active:neomorph-inset"
          >
            <Icon name="arrow_back" size={16} className="rtl:rotate-180" />
            {t("dashboard.backToApartments") || "Back to Apartments"}
          </button>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">
                {loading ? t("common.loading") : apartment?.name || "Apartment"}
              </h1>
              {locationStr && (
                <p className="mt-1 flex items-center gap-1 text-on-surface-variant">
                  <Icon name="location_on" size={16} />
                  {locationStr}
                </p>
              )}
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex h-14 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-8 font-bold text-white transition-all hover:bg-on-primary-fixed-variant neomorph-active neomorph-raised"
            >
              <Icon name="add" />
              {t("common.createNewRoom")}
            </button>
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
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <div key={room._id} className="relative group cursor-pointer" onClick={() => navigate(`/apartments/${apartmentId}/rooms/${room._id}`)}>
                <RoomCard room={room} />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(room._id);
                  }}
                  className="absolute top-8 right-8 rtl:right-auto rtl:left-8 flex h-8 w-8 items-center justify-center rounded-full bg-error/80 text-white opacity-0 transition-opacity hover:bg-error group-hover:opacity-100"
                  aria-label="Delete room"
                >
                  <Icon name="delete" size={14} />
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
