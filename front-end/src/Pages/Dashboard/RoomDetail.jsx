import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRoomById, getRoomGenerationsHistory, API_HOST } from "../../api";
import { useTranslation } from "react-i18next";
import Icon from "../../Components/Icon";

const RoomDetail = () => {
  const { t } = useTranslation();
  const { apartmentId, roomId } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [generations, setGenerations] = useState([]);
  const [selectedGeneration, setSelectedGeneration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    return `${API_HOST}/${url.replace(/^\//, "")}`;
  };

  useEffect(() => {
    const fetchRoomData = async () => {
      setLoading(true);
      setError("");
      try {
        const { data: roomRes } = await getRoomById(roomId);
        if (roomRes.success) {
          setRoom(roomRes.data.room);
        }

        // Fetch generation history for this room
        const { data: historyRes } = await getRoomGenerationsHistory(roomId);
        if (historyRes.success && historyRes.data?.generations) {
          const genList = historyRes.data.generations;
          setGenerations(genList);
          if (genList.length > 0) {
            // Set active generation to either selected Generation or the newest one
            const active = genList.find((g) => g._id === roomRes.data?.room?.selectedGenerationId) || genList[0];
            setSelectedGeneration(active);
          }
        }
      } catch (err) {
        if (err.response?.status !== 401) {
          setError(t("dashboard.failedLoadRoomData") || "Failed to load room data.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRoomData();
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

  const hasGenerations = selectedGeneration || generations.length > 0;
  const activeImage = getImageUrl(selectedGeneration?.generatedImage?.url) ||
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200&auto=format&fit=crop";

  const selectedProductsList = selectedGeneration?.selectedProducts || [];
  const prefStyle = selectedGeneration?.extractedPreferences?.style || "Modern Scandinavian";
  const prefColors = selectedGeneration?.extractedPreferences?.colorPalette || "Warm Neutral";

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface font-body pb-16">
      <main className="mx-auto w-full max-w-6xl flex-grow px-6 py-8">
        {/* Top Header & Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <button
            onClick={() => navigate(`/apartments/${apartmentId}`)}
            className="flex items-center gap-2 rounded-xl bg-background px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition-all hover:text-primary neomorph-raised active:neomorph-inset"
          >
            <Icon name="arrow_back" size={16} className="rtl:rotate-180" />
            {t("dashboard.backToRooms", "Back to Rooms")}
          </button>

          {hasGenerations && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistoryDrawer(true)}
                className="flex items-center gap-2 rounded-xl bg-background px-4 py-2.5 text-sm font-semibold text-primary transition-all hover:text-primary-variant neomorph-raised active:neomorph-inset"
              >
                <Icon name="history" size={18} />
                <span>History ({generations.length})</span>
              </button>

              <button
                onClick={() => navigate(`/room-generation?roomId=${roomId}&apartmentId=${apartmentId}`)}
                className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary-variant shadow-md hover:scale-105 active:scale-95"
              >
                <Icon name="auto_awesome" size={18} />
                <span>New Design</span>
              </button>
            </div>
          )}
        </div>

        {/* Room Header Info */}
        <div className="neomorph-raised rounded-[2rem] p-6 lg:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-headline font-extrabold text-on-surface">
                  {room?.name}
                </h1>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                  {room?.roomType || "Bedroom"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-6 text-sm text-on-surface-variant">
                {room?.dimensions && (
                  <span className="flex items-center gap-1.5 font-medium">
                    <Icon name="straighten" size={18} className="text-primary" />
                    {room.dimensions.width} × {room.dimensions.length} × {room.dimensions.height} {room.dimensions.unit || "cm"}
                  </span>
                )}
                <span className="flex items-center gap-1.5 font-medium">
                  <Icon name="palette" size={18} className="text-primary" />
                  {prefStyle} • {prefColors}
                </span>
              </div>
            </div>
          </div>
        </div>

        {!hasGenerations ? (
          /* Empty State: No Generations Yet */
          <div className="neomorph-raised rounded-[2rem] p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
            <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-background neomorph-inset">
              <Icon name="auto_awesome" size={56} className="text-primary/60" />
            </div>
            <h2 className="mb-3 text-2xl font-extrabold text-on-surface">
              {t("dashboard.noRoomDesignTitle", "No Room Designs Generated Yet")}
            </h2>
            <p className="mb-8 max-w-md text-on-surface-variant leading-relaxed">
              Transform your room into a beautifully rendered 3D spatial design using AI-curated products.
            </p>
            <button
              onClick={() => navigate(`/room-generation?roomId=${roomId}&apartmentId=${apartmentId}`)}
              className="flex h-14 items-center justify-center gap-2 rounded-full bg-primary px-10 font-bold text-white transition-all hover:bg-primary-variant hover:scale-[1.02] active:scale-[0.98] neomorph-raised"
            >
              <Icon name="auto_awesome" size={20} />
              {t("common.createNow", "Create Design Now")}
            </button>
          </div>
        ) : (
          /* Main Saved Room View */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Col (2 cols wide): AI Generated Image Rendering */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="neomorph-raised rounded-[2rem] p-4 lg:p-6 overflow-hidden relative group">
                <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden neomorph-inset bg-black/5">
                  <img
                    src={activeImage}
                    alt="Rendered Room Design"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-2">
                    <Icon name="auto_awesome" size={16} className="text-amber-400" />
                    <span>AI Rendered Composite</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between px-2">
                  <span className="text-xs font-medium text-on-surface-variant">
                    Generated: {selectedGeneration?.createdAt ? new Date(selectedGeneration.createdAt).toLocaleDateString() : "Recent"}
                  </span>

                  <button
                    onClick={() => navigate(`/room-generation?roomId=${roomId}&apartmentId=${apartmentId}`)}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <Icon name="edit" size={14} />
                    Edit Design Parameters
                  </button>
                </div>
              </div>
            </div>

            {/* Right Col (1 col wide): Selected Products & Specs Breakdown */}
            <div className="flex flex-col gap-6">
              <div className="neomorph-raised rounded-[2rem] p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
                  <h3 className="font-headline font-bold text-lg text-on-surface flex items-center gap-2">
                    <Icon name="shopping_bag" size={20} className="text-primary" />
                    Selected Furniture ({selectedProductsList.length})
                  </h3>
                </div>

                {selectedProductsList.length === 0 ? (
                  <p className="text-xs text-on-surface-variant py-4 text-center">
                    No individual products selected for this generation.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1">
                    {selectedProductsList.map((item, idx) => {
                      const pData = item.productData || item;
                      const title = pData.title || pData.name || `Item ${idx + 1}`;
                      const price = pData.price || item.price || 0;
                      const img = pData.imageUrl || pData.img || "/placeholder.jpg";
                      const isGold = item.isRecommended;

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-2xl bg-background neomorph-raised flex items-center gap-3 transition-all ${
                            isGold ? "border border-amber-400/40" : ""
                          }`}
                        >
                          <img
                            src={getImageUrl(img)}
                            alt={title}
                            className="w-14 h-14 rounded-xl object-cover"
                          />
                          <div className="flex-grow overflow-hidden">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                                {item.category || "Furniture"}
                              </span>
                              {isGold && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-400/20 text-amber-600">
                                  Top Pick
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-bold text-on-surface line-clamp-1">{title}</h4>
                            <p className="text-xs font-semibold text-primary mt-0.5">
                              {typeof price === "number" ? `${price.toLocaleString()} EGP` : price}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Generation History Drawer / Modal */}
        {showHistoryDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-background h-full p-6 shadow-2xl flex flex-col gap-6 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
                <h3 className="font-headline font-bold text-xl text-on-surface flex items-center gap-2">
                  <Icon name="history" size={22} className="text-primary" />
                  Generation History
                </h3>
                <button
                  onClick={() => setShowHistoryDrawer(false)}
                  className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface transition-all"
                >
                  <Icon name="close" size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {generations.map((gen, idx) => {
                  const isActive = selectedGeneration?._id === gen._id;
                  const img = getImageUrl(gen.generatedImage?.url) || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=600&auto=format&fit=crop";

                  return (
                    <div
                      key={gen._id || idx}
                      onClick={() => {
                        setSelectedGeneration(gen);
                        setShowHistoryDrawer(false);
                      }}
                      className={`p-4 rounded-2xl cursor-pointer transition-all ${
                        isActive
                          ? "bg-primary/10 border-2 border-primary neomorph-raised"
                          : "bg-background neomorph-raised hover:scale-[1.01]"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <img src={img} alt="Generation thumbnail" className="w-16 h-16 rounded-xl object-cover" />
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-on-surface">
                              Version #{generations.length - idx}
                            </span>
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-on-surface-variant mt-1 line-clamp-1">
                            {gen.userPrompt || "Custom design prompt"}
                          </p>
                          <p className="text-[10px] text-on-surface-variant/70 mt-1">
                            {gen.createdAt ? new Date(gen.createdAt).toLocaleString() : "Date unknown"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default RoomDetail;
