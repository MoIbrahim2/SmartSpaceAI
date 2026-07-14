import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRoomById } from "../../api";
import { useTranslation } from "react-i18next";
import Icon from "../../Components/Icon";

const RoomDetail = () => {
  const { t } = useTranslation();
  const { apartmentId, roomId } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRoom = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await getRoomById(roomId);
        if (data.success) {
          setRoom(data.data.room);
        }
      } catch (err) {
        if (err.response?.status !== 401) {
          setError(t("dashboard.failedLoadRoomData") || "Failed to load room data.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [roomId, t]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6">
        <div className="rounded-xl bg-error/10 px-5 py-3 text-sm font-medium text-error">
          {error}
        </div>
        <button
          onClick={() => navigate(`/apartments/${apartmentId}`)}
          className="flex items-center gap-2 rounded-xl bg-background px-4 py-2 text-sm font-semibold text-primary neomorph-raised"
        >
          <Icon name="arrow_back" size={16} className="rtl:rotate-180" />
          {t("common.goBack")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface font-body">
      <main className="mx-auto w-full max-w-5xl flex-grow px-6 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/apartments/${apartmentId}`)}
          className="mb-8 flex items-center gap-2 rounded-xl bg-background px-4 py-2 text-sm font-semibold text-on-surface-variant transition-all hover:text-primary neomorph-raised active:neomorph-inset"
        >
          <Icon name="arrow_back" size={16} className="rtl:rotate-180" />
          {t("dashboard.backToRooms")}
        </button>

        {/* Room Info Header */}
        <div className="neomorph-raised rounded-[2rem] p-8 mb-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">
                {room?.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-on-surface-variant">
                {room?.roomType && (
                  <span className="flex items-center gap-1">
                    <Icon name="category" size={16} className="text-primary" />
                    {room.roomType}
                  </span>
                )}
                {room?.dimensions && (
                  <span className="flex items-center gap-1">
                    <Icon name="straighten" size={16} className="text-primary" />
                    {room.dimensions.width} × {room.dimensions.length} × {room.dimensions.height} {room.dimensions.unit}
                  </span>
                )}
              </div>
            </div>
          </div>
          {room?.description && (
            <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">
              {room.description}
            </p>
          )}
        </div>

        {/* No Generation State */}
        <div className="neomorph-raised rounded-[2rem] p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
          <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-background neomorph-inset">
            <Icon name="auto_awesome" size={56} className="text-primary/60" />
          </div>
          <h2 className="mb-3 text-2xl font-extrabold text-on-surface">
            {t("dashboard.noRoomDesignTitle")}
          </h2>
          <p className="mb-8 max-w-md text-on-surface-variant leading-relaxed">
            {t("dashboard.noRoomDesignDesc")}
          </p>
          <button
            onClick={() => navigate(`/room-generation?roomId=${roomId}&apartmentId=${apartmentId}`)}
            className="flex h-14 items-center justify-center gap-2 rounded-full bg-primary px-10 font-bold text-white transition-all hover:bg-on-primary-fixed-variant hover:scale-[1.02] active:scale-[0.98] neomorph-raised"
          >
            <Icon name="auto_awesome" size={20} />
            {t("common.createNow")}
          </button>
        </div>
      </main>
    </div>
  );
};

export default RoomDetail;
