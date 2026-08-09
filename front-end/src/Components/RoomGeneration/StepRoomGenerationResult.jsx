import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Icon from "../Icon";
import { API_HOST } from "../../api";
import { refineRoomImage } from "../../api/GenerationApi";
import { parseProductDetails, getExternalStoreUrl, formatCategoryName } from "../../utils/productUtils";

import { useCart } from "../../context/CartContext";

const RESOLUTION_CREDIT_COSTS = {
  "720p": 9,
  "1080p": 12,
  "1440p": 17,
  "4k": 26,
};

const RESOLUTION_OPTIONS = [
  { id: "720p", label: "720p (HD)", desc: "Fast generation" },
  { id: "1080p", label: "1080p (FHD)", desc: "Balanced quality & speed", default: true },
  { id: "1440p", label: "1440p (QHD)", desc: "High detail render" },
  { id: "4k", label: "4K (Ultra HD)", desc: "Maximum realistic fidelity" },
];

const StepRoomGenerationResult = ({
  setStep,
  generatedImage,
  selectedProducts = [],
  isGenerating = false,
  handleRegenerate,
  handleRefine,
  onFinish,
  resolution = "1080p",
  setResolution,
  userCredits = 0,
  onCreditsError,
  roomData = null,
  spatialResult = null,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addToCart, setIsDrawerOpen } = useCart();
  const [showProductSummary, setShowProductSummary] = useState(true);
  const [addedNotice, setAddedNotice] = useState("");
  const [creditError, setCreditError] = useState("");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [viewMode, setViewMode] = useState("rendered"); // "rendered" | "mask" | "widened" | "original"

  // Refinement prompt state
  const [refinementPrompt, setRefinementPrompt] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState("");

  // Zoom & Pan state for 2D Layout Mask view

  const [zoomScale, setZoomScale] = useState(1);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  const safeResString = typeof resolution === "string" 
    ? resolution 
    : (resolution && typeof resolution === "object" && resolution.resolution ? resolution.resolution : "1080p");

  const [selectedRes, setSelectedRes] = useState(safeResString);

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    return `${API_HOST}/${url.replace(/^\//, "")}`;
  };

  const finalImgUrl = getImageUrl(generatedImage?.url) || null;
  const widenedImgUrl = getImageUrl(roomData?.widenedImageUrl) || null;
  const originalImgUrl = getImageUrl(roomData?.sourceImages?.[0]?.url) || null;
  const maskImgUrl = 
    spatialResult?.maskDataBase64 || 
    roomData?.spatialGuardrail?.maskDataBase64 || 
    generatedImage?.spatialGuardrail?.maskDataBase64 || 
    getImageUrl(
      spatialResult?.maskImageUrl || 
      roomData?.spatialGuardrail?.maskImageUrl || 
      generatedImage?.spatialGuardrail?.maskImageUrl
    ) || null;

  // Determine active image URL to render based on viewMode
  let activeDisplayUrl = finalImgUrl;
  let activeBadgeLabel = t("dashboard.smartspaceAIRenderBadge", "SmartSpace AI Render");
  if (viewMode === "mask" && maskImgUrl) {
    activeDisplayUrl = maskImgUrl;
    activeBadgeLabel = t("dashboard.semantic2DMaskBadge", "2D Layout Semantic Mask");
  } else if (viewMode === "widened" && widenedImgUrl) {
    activeDisplayUrl = widenedImgUrl;
    activeBadgeLabel = t("dashboard.widenedEmptyRoomBadge", "Widened Empty Room (AI Lens)");
  } else if (viewMode === "original" && originalImgUrl) {
    activeDisplayUrl = originalImgUrl;
    activeBadgeLabel = t("dashboard.originalUploadedBadge", "Original Uploaded Empty Room");
  }

  // Zoom / Pan handlers for Mask View
  const handleZoomIn = () => setZoomScale((prev) => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => {
    setZoomScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPanPos({ x: 0, y: 0 });
      return next;
    });
  };
  const handleResetZoom = () => {
    setZoomScale(1);
    setPanPos({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (viewMode === "mask") {
      e.preventDefault();
      setIsPanning(true);
      setStartPan({ x: e.clientX - panPos.x, y: e.clientY - panPos.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning && viewMode === "mask") {
      e.preventDefault();
      setPanPos({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleWheel = (e) => {
    if (viewMode === "mask") {
      if (e.deltaY < 0) {
        setZoomScale((prev) => Math.min(prev + 0.25, 4));
      } else {
        setZoomScale((prev) => {
          const next = Math.max(prev - 0.25, 1);
          if (next === 1) setPanPos({ x: 0, y: 0 });
          return next;
        });
      }
    }
  };

  const currentCost = RESOLUTION_CREDIT_COSTS[selectedRes] || 12;
  const hasEnoughCredits = userCredits >= currentCost;

  const handleResChange = (resId) => {
    setSelectedRes(resId);
    setCreditError("");
    if (setResolution) setResolution(resId);
  };

  const onGenerateClick = () => {
    if (!hasEnoughCredits) {
      setCreditError(
        t("dashboard.insufficientCreditsMsg", {
          cost: currentCost,
          userCredits,
          defaultValue: `Insufficient credits! You need ${currentCost} credits but only have ${userCredits}. Please top up.`
        })
      );
      if (onCreditsError) onCreditsError();
      return;
    }
    setCreditError("");
    if (handleRegenerate) {
      setViewMode("rendered");
      handleRegenerate(selectedRes);
    }
  };

  const handleRefineClick = async () => {
    if (!refinementPrompt.trim()) return;
    if (!hasEnoughCredits) {
      setRefineError(
        t("dashboard.insufficientCreditsMsg", {
          cost: currentCost,
          userCredits,
          defaultValue: `Insufficient credits! You need ${currentCost} credits but only have ${userCredits}. Please top up.`
        })
      );
      if (onCreditsError) onCreditsError();
      return;
    }
    setRefineError("");
    setIsRefining(true);
    try {
      if (handleRefine) {
        await handleRefine(refinementPrompt.trim(), selectedRes);
      } else {
        const targetGenId = generatedImage?._id || generatedImage?.generationId || roomData?._id;
        if (targetGenId) {
          await refineRoomImage(targetGenId, { prompt: refinementPrompt.trim(), resolution: selectedRes });
        }
      }
      setViewMode("rendered");
      setAddedNotice(t("dashboard.refineSuccessNotice", "Room layout refined successfully!"));
      setTimeout(() => setAddedNotice(""), 3500);
    } catch (err) {
      console.error("Refinement failed:", err);
      setRefineError(err.response?.data?.message || err.message || "Failed to refine room layout.");
    } finally {
      setIsRefining(false);
    }
  };

  const displayRes = (typeof selectedRes === "string" ? selectedRes : "1080p").toUpperCase();


  const handleAddToCart = (prod) => {
    addToCart(prod);
    setIsDrawerOpen(true);
    const parsed = parseProductDetails(prod, prod.category);
    setAddedNotice(t("dashboard.addedToCartNotice", { title: parsed.title, defaultValue: `Added "${parsed.title}" to cart!` }));
    setTimeout(() => setAddedNotice(""), 3000);
  };

  return (
    <div className="bg-background rounded-[2rem] p-6 lg:p-10 neomorph-raised flex-grow flex flex-col relative overflow-hidden">
      {/* Toast Notification */}
      {addedNotice && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-600 text-white font-semibold text-sm shadow-2xl flex items-center gap-2 animate-bounce">
          <Icon name="check_circle" size={20} />
          <span>{addedNotice}</span>
        </div>
      )}

      {/* ─── Credits Indicator Bar ─────────────────────────────── */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-400/5 to-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative overflow-hidden">
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
        
        <div className="flex items-center gap-3 z-10">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Icon name="toll" size={22} className="text-white" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
              {t("dashboard.creditsAvailable", "Credits Available")}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-on-surface tabular-nums">
                {userCredits}
              </span>
              <span className="text-xs text-on-surface-variant font-medium">{t("dashboard.credits", "credits")}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10">
          <div className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
            hasEnoughCredits 
              ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/20" 
              : "bg-red-500/15 text-red-600 border border-red-500/20"
          }`}>
            <Icon name={hasEnoughCredits ? "check_circle" : "warning"} size={14} />
            <span>
              {hasEnoughCredits 
                ? t("dashboard.creditsForRes", { cost: currentCost, res: displayRes, defaultValue: `${currentCost} credits for ${displayRes}` })
                : t("dashboard.needCredits", { cost: currentCost, defaultValue: `Need ${currentCost} credits` })}
            </span>
          </div>
          <button
            onClick={() => navigate("/credits")}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg hover:from-amber-600 hover:to-yellow-700 transition-all active:scale-95"
          >
            <Icon name="add_circle" size={14} />
            <span>{t("dashboard.topUp", "Top Up")}</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            {t("dashboard.stepFourTitle", "Your AI Room Design Rendering")}
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            {t("dashboard.stepFourSub", "Generated with smart spatial alignment based on your room dimensions & selected products.")}
          </p>
        </div>

        <button
          onClick={() => setShowProductSummary(!showProductSummary)}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-primary bg-background neomorph-raised hover:text-primary-variant transition-all flex items-center gap-2"
        >
          <Icon name={showProductSummary ? "expand_less" : "chair"} size={16} />
          {showProductSummary ? t("dashboard.hideSelectedProducts", "Hide Selected Products") : t("dashboard.viewSelectedProducts", { count: selectedProducts.length, defaultValue: `View Selected Products (${selectedProducts.length})` })}
        </button>
      </div>

      {/* Selected Products Breakdown Bar (Visible by default) */}
      {showProductSummary && selectedProducts.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl neomorph-inset bg-surface-bright/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {selectedProducts.map((p, idx) => {
            const parsed = parseProductDetails(p, p.category);
            const img = parsed.img;
            const title = parsed.title;
            const externalUrl = getExternalStoreUrl(p);

            return (
              <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-background neomorph-raised border border-outline-variant/20">
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={getImageUrl(img)}
                    alt={title}
                    className="w-14 h-14 rounded-lg object-cover shrink-0"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = parsed.fallbackImg;
                    }}
                  />
                  <div className="overflow-hidden">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                      {formatCategoryName(p.category || "Item", t)}
                    </span>
                    <span className="text-xs font-bold text-on-surface line-clamp-1">
                      {title}
                    </span>
                    <span className="text-xs font-black text-primary block mt-0.5">
                      {parsed.price} EGP
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  {externalUrl ? (
                    <a
                      href={externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                      title="Open product page on retailer store (Amazon, Noon, etc.)"
                    >
                      <Icon name="open_in_new" size={15} />
                      <span>{t("dashboard.buyStoreShort", "Buy Store")}</span>
                    </a>
                  ) : (
                    <button
                      onClick={() => handleAddToCart(p)}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                      title="Add to SmartSpace Cart"
                    >
                      <Icon name="add_shopping_cart" size={15} />
                      <span>{t("dashboard.addCartShort", "Add Cart")}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resolution Selector Toolbar with Credit Costs */}
      <div className="mb-6 p-4 rounded-2xl neomorph-raised bg-background flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Icon name="hd" className="text-primary" size={22} />
          <div>
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider block">
              {t("dashboard.renderQualityHeader", "Render Quality & Resolution")}
            </span>
            <span className="text-[11px] text-on-surface-variant">
              {t("dashboard.selectOutputRes", "Select output resolution — credit cost shown per tier")}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {RESOLUTION_OPTIONS.map((opt) => {
            const active = selectedRes === opt.id;
            const cost = RESOLUTION_CREDIT_COSTS[opt.id];
            const canAfford = userCredits >= cost;
            const optDesc = opt.id === "720p" ? t("dashboard.res720pDesc", opt.desc)
                          : opt.id === "1080p" ? t("dashboard.res1080pDesc", opt.desc)
                          : opt.id === "1440p" ? t("dashboard.res1440pDesc", opt.desc)
                          : t("dashboard.res4kDesc", opt.desc);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleResChange(opt.id)}
                disabled={isGenerating}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex flex-col items-center gap-0.5 min-w-[80px] ${
                  active
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25 border border-amber-400/30"
                    : "bg-background text-on-surface-variant neomorph-raised hover:text-on-surface active:neomorph-inset"
                }`}
                title={optDesc}
              >
                <span>{opt.label}</span>
                <span className={`text-[10px] font-black flex items-center gap-0.5 ${
                  active 
                    ? "text-amber-100" 
                    : canAfford ? "text-amber-600" : "text-red-500"
                }`}>
                  <Icon name="toll" size={10} />
                  {cost} {t("dashboard.credits", "credits")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* View Switcher Tabs (Furnished Render vs 2D Mask vs Widened Empty Room) */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-2xl bg-surface-bright/30 neomorph-inset">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setViewMode("rendered");
              handleResetZoom();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              viewMode === "rendered"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Icon name="auto_awesome" size={16} />
            <span>{t("dashboard.furnishedDesignRender", "Furnished Design Render")}</span>
          </button>

          {widenedImgUrl && (
            <button
              type="button"
              onClick={() => {
                setViewMode("widened");
                handleResetZoom();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                viewMode === "widened"
                  ? "bg-amber-600 text-white shadow-md"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Icon name="aspect_ratio" size={16} />
              <span>{t("dashboard.widenedEmptyRoom", "Widened Empty Room (AI Lens)")}</span>
            </button>
          )}

          {originalImgUrl && (
            <button
              type="button"
              onClick={() => {
                setViewMode("original");
                handleResetZoom();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                viewMode === "original"
                  ? "bg-gray-700 text-white shadow-md"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Icon name="image" size={16} />
              <span>{t("dashboard.originalUpload", "Original Upload")}</span>
            </button>
          )}
        </div>

        {activeDisplayUrl && (
          <button
            onClick={() => setIsLightboxOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-background text-on-surface text-xs font-bold flex items-center gap-1.5 neomorph-raised hover:text-primary transition-all"
            title="Expand Fullscreen"
          >
            <Icon name="zoom_in" size={16} />
            <span>{t("dashboard.fullResolution", "Full Resolution")}</span>
          </button>
        )}
      </div>

      {/* Credit Error Alert */}
      {creditError && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
              <Icon name="credit_card_off" size={20} className="text-red-500" />
            </div>
            <div>
              <span className="text-sm font-bold text-red-600 block">{t("dashboard.insufficientCredits", "Insufficient Credits")}</span>
              <span className="text-xs text-red-500/80">{creditError}</span>
            </div>
          </div>
          <button
            onClick={() => navigate("/credits")}
            className="px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:bg-red-600 transition-all active:scale-95 shrink-0"
          >
            <Icon name="add_circle" size={14} />
            {t("dashboard.topUpNow", "Top Up Now")}
          </button>
        </div>
      )}

      {/* Main Generated Image Preview - Uses object-contain so it NEVER crops! */}
      <div className="flex-grow bg-white rounded-2xl overflow-hidden flex items-center justify-center min-h-[460px] max-h-[75vh] p-4 mb-4 relative group border border-outline-variant/20 shadow-sm select-none">
        {isGenerating ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 z-20 p-6 text-center">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping"></div>
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-primary">
                <Icon name="auto_awesome" size={28} />
              </div>
            </div>
            <h3 className="font-headline font-bold text-xl text-on-surface mb-2">
              {t("dashboard.generatingRoomRender", { res: displayRes, defaultValue: `Generating ${displayRes} Room Render...` })}
            </h3>
            <p className="text-xs text-on-surface-variant max-w-md mb-3">
              {t("dashboard.generatingRoomRenderSub", "Expanding architectural perspective & synthesizing furniture layout with soft lighting.")}
            </p>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 text-xs font-bold">
              <Icon name="toll" size={14} />
              <span>{t("dashboard.creditsWillBeDeducted", { cost: currentCost, defaultValue: `${currentCost} credits will be deducted` })}</span>
            </div>
          </div>
        ) : activeDisplayUrl ? (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* Mask Mode Controls Overlay */}
            {viewMode === "mask" && (
              <>
                <div className="absolute top-4 left-4 z-30 px-3 py-1.5 rounded-xl bg-purple-900/80 backdrop-blur-md text-white text-[11px] font-medium flex items-center gap-1.5 border border-purple-400/30 shadow-lg">
                  <Icon name="drag_pan" size={14} className="text-purple-300" />
                  <span>{t("dashboard.panMaskHint", "Scroll to zoom • Click & drag to pan")}</span>
                </div>

                <div className="absolute top-4 right-4 z-30 flex items-center gap-1 bg-black/80 backdrop-blur-md p-1.5 rounded-xl border border-white/20 shadow-xl pointer-events-auto">
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                    title="Zoom In"
                  >
                    <Icon name="add" size={16} />
                  </button>
                  <span className="text-[11px] font-bold text-white px-1.5 min-w-[36px] text-center">
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                    title="Zoom Out"
                  >
                    <Icon name="remove" size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all ml-1"
                    title="Reset Zoom & Pan"
                  >
                    <Icon name="fit_screen" size={16} />
                  </button>
                </div>
              </>
            )}

            <img
              alt={activeBadgeLabel}
              className={`max-w-full max-h-[70vh] w-auto h-auto object-contain rounded-xl shadow-2xl transition-transform ${
                viewMode === "mask" ? (isPanning ? "cursor-grabbing" : "cursor-grab") : "cursor-pointer group-hover:scale-[1.01]"
              }`}
              style={
                viewMode === "mask"
                  ? {
                      transform: `scale(${zoomScale}) translate(${panPos.x / zoomScale}px, ${panPos.y / zoomScale}px)`,
                      transition: isPanning ? "none" : "transform 0.15s ease-out"
                    }
                  : {}
              }
              src={activeDisplayUrl}
              onClick={() => {
                if (viewMode !== "mask") setIsLightboxOpen(true);
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            />

            {/* Badge & Quick Action Toolbar */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
              <div className="px-3.5 py-2 rounded-xl bg-black/75 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-2 border border-white/20 shadow-lg pointer-events-auto">
                <Icon name={viewMode === "mask" ? "grid_view" : "auto_awesome"} size={14} className={viewMode === "mask" ? "text-purple-400" : "text-amber-400"} />
                <span>{activeBadgeLabel} ({displayRes})</span>
              </div>

              <button
                onClick={() => setIsLightboxOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-black/75 hover:bg-black/90 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 border border-white/20 shadow-lg pointer-events-auto transition-all active:scale-95"
              >
                <Icon name="fullscreen" size={16} />
                <span>{t("dashboard.expand", "Expand")}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 text-amber-500">
              <Icon name="auto_awesome" size={40} />
            </div>
            <h3 className="font-headline font-bold text-xl text-on-surface mb-2">
              {t("dashboard.readyToRenderTitle", "Ready to Render Your Room")}
            </h3>
            <p className="text-sm text-on-surface-variant max-w-md mb-4">
              {t("dashboard.readyToRenderDesc", "Your room specifications and furniture selections are saved. Choose your target resolution above and click Start Generation to produce the final AI visualization.")}
            </p>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-600 text-xs font-bold mb-6">
              <Icon name="toll" size={14} />
              <span>{t("dashboard.thisWillCostCredits", { cost: currentCost, defaultValue: `This will cost ${currentCost} credits` })}</span>
            </div>
            <button
              onClick={onGenerateClick}
              disabled={isGenerating}
              className={`px-8 py-3.5 rounded-2xl font-headline font-bold text-base shadow-xl transition-all flex items-center gap-3 ${
                hasEnoughCredits
                  ? "bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white hover:from-amber-600 hover:to-yellow-700 shadow-amber-500/30 hover:shadow-2xl hover:scale-[1.02] active:scale-95 animate-pulse"
                  : "bg-gray-400 text-white cursor-not-allowed"
              }`}
            >
              <Icon name="auto_awesome" size={20} />
              <span>{t("dashboard.startGenerationBtn", { res: displayRes, defaultValue: `Start Generation (${displayRes})` })}</span>
              <span className="text-xs opacity-90">• {currentCost} {t("dashboard.credits", "credits")}</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── Spatial Refinement & Prompt Manipulation Box ─── */}
      {finalImgUrl && (
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-surface-bright/40 to-background neomorph-raised border border-amber-500/30 animate-fade-in">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
                <Icon name="auto_awesome" size={18} />
              </div>
              <div>
                <h4 className="font-headline font-bold text-sm text-on-surface">
                  {t("dashboard.refineLayoutTitle", "Refine Furniture Placement & Spatial Layout")}
                </h4>
                <p className="text-[11px] text-on-surface-variant">
                  {t("dashboard.refineLayoutDesc", "Type spatial prompt instructions to relocate, adjust, or shift furniture in the generated image.")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
              <Icon name="toll" size={14} />
              <span>{currentCost} {t("dashboard.credits", "credits")}</span>
            </div>
          </div>

          <div className="relative mb-3">
            <textarea
              rows={2}
              value={refinementPrompt}
              onChange={(e) => setRefinementPrompt(e.target.value)}
              disabled={isGenerating || isRefining}
              placeholder={t(
                "dashboard.refinePlaceholder",
                "e.g., Move the sofa closer to the left wall, shift nightstand beside the bed, rotate coffee table 90 degrees..."
              )}
              className="w-full px-4 py-3 rounded-xl bg-background border border-outline-variant/30 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none transition-all disabled:opacity-50 shadow-inner"
            />
          </div>

          {refineError && (
            <div className="mb-3 px-4 py-2 rounded-xl bg-error/10 text-error text-xs font-semibold flex items-center gap-2 border border-error/20">
              <Icon name="error" size={16} />
              <span>{refineError}</span>
            </div>
          )}

          <div className="flex justify-end items-center gap-3">
            <button
              type="button"
              onClick={handleRefineClick}
              disabled={isGenerating || isRefining || !refinementPrompt.trim()}
              className={`px-6 py-2.5 rounded-xl font-headline font-bold text-xs shadow-md transition-all flex items-center gap-2 ${
                hasEnoughCredits && refinementPrompt.trim()
                  ? "bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white hover:from-amber-600 hover:to-yellow-700 shadow-amber-500/25 active:scale-95 cursor-pointer"
                  : "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isRefining ? (
                <>
                  <Icon name="sync" size={16} className="animate-spin" />
                  <span>{t("dashboard.refiningImage", "Refining Layout...")}</span>
                </>
              ) : (
                <>
                  <Icon name="auto_awesome" size={16} />
                  <span>{t("dashboard.regenerateWithPrompt", "Regenerate with Spatial Refinement")}</span>
                  <span className="opacity-90">• ({currentCost} cr)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}


      {/* 2D Layout Semantic Legend (Visible in Mask Mode) */}
      {viewMode === "mask" && (
        <div className="mb-6 p-4 rounded-2xl bg-surface-bright/20 neomorph-inset border border-purple-500/20 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="palette" size={18} className="text-purple-500" />
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
              {t("dashboard.semanticLegendTitle", "2D Semantic Segmentation Color Map")}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background border border-outline-variant/20">
              <span className="w-3 h-3 rounded-full bg-[#805AD5]" />
              <span className="font-semibold text-on-surface">Bed</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background border border-outline-variant/20">
              <span className="w-3 h-3 rounded-full bg-[#2B6CB0]" />
              <span className="font-semibold text-on-surface">Sofa / Seating</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background border border-outline-variant/20">
              <span className="w-3 h-3 rounded-full bg-[#C53030]" />
              <span className="font-semibold text-on-surface">TV Console</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background border border-outline-variant/20">
              <span className="w-3 h-3 rounded-full bg-[#2F855A]" />
              <span className="font-semibold text-on-surface">Table</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background border border-outline-variant/20">
              <span className="w-3 h-3 rounded-full bg-[#319795]" />
              <span className="font-semibold text-on-surface">Coffee Table</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background border border-outline-variant/20">
              <span className="w-3 h-3 rounded-full bg-[#ED8936]" />
              <span className="font-semibold text-on-surface">Nightstand</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background border border-outline-variant/20">
              <span className="w-3 h-3 rounded-full bg-[#D69E2E]" />
              <span className="font-semibold text-on-surface">Wardrobe</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background border border-outline-variant/20">
              <span className="w-3 h-3 rounded-full bg-[#38A169]" />
              <span className="font-semibold text-on-surface">Desk</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background border border-outline-variant/20">
              <span className="w-3 h-3 rounded-full bg-[#DD6B20]" />
              <span className="font-semibold text-on-surface">Chair</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background border border-white/40">
              <span className="w-3 h-3 rounded-full bg-[#FFFFFF] border border-gray-400" />
              <span className="font-semibold text-on-surface">Door Clearance Zone</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background border border-outline-variant/20">
              <span className="w-3 h-3 rounded-full bg-[#00FFFF]" />
              <span className="font-semibold text-on-surface">Window Clearance Zone</span>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && activeDisplayUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-6 animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="w-full flex items-center justify-between text-white z-10">
            <div className="flex items-center gap-2">
              <Icon name="auto_awesome" className="text-amber-400" size={20} />
              <span className="font-bold text-base">{t("dashboard.fullResolutionTitle", { res: displayRes, defaultValue: `${activeBadgeLabel} — Full Resolution (${displayRes})` })}</span>
            </div>

            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              <Icon name="close" size={24} />
            </button>
          </div>

          <div
            className="flex-grow flex items-center justify-center w-full my-4 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeDisplayUrl}
              alt="Full Resolution Render"
              className="max-w-none max-h-none min-w-[50vw] object-contain rounded-lg shadow-2xl"
            />
          </div>

          <div className="flex items-center gap-4 text-white text-xs font-medium z-10 bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10">
            <span>{t("dashboard.lightboxTip", "Tip: Right click or long press to save high-resolution render")}</span>
            <a
              href={activeDisplayUrl}
              target="_blank"
              rel="noopener noreferrer"
              download="smartspace_room_render.jpg"
              className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md hover:from-amber-600 hover:to-amber-700 transition-all"
            >
              <Icon name="download" size={16} />
              <span>{t("dashboard.downloadImage", "Download Image")}</span>
            </a>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="flex flex-wrap justify-between items-center gap-4 mt-auto pt-4 border-t border-outline-variant/20">
        <button
          onClick={() => setStep(3)}
          className="px-6 py-3 rounded-xl bg-background text-on-surface-variant font-semibold text-sm transition-all neomorph-raised hover:text-on-surface active:neomorph-inset flex items-center gap-2"
        >
          <Icon name="arrow_forward" size={16} className="rotate-180 rtl:rotate-0" />
          {t("dashboard.backToSelection", "Back to Selection")}
        </button>

        <div className="flex items-center gap-3">
          {finalImgUrl && (
            <button
              onClick={onGenerateClick}
              disabled={isGenerating}
              className={`px-6 py-3 rounded-xl bg-background font-semibold text-sm transition-all neomorph-raised active:neomorph-inset disabled:opacity-50 flex items-center gap-2 ${
                hasEnoughCredits ? "text-on-surface hover:text-amber-600" : "text-red-500"
              }`}
            >
              <Icon name="refresh" size={18} className={isGenerating ? "animate-spin text-amber-500" : ""} />
              {t("dashboard.regenerate", "Regenerate")}
              <span className="text-[10px] font-bold text-amber-600">({currentCost} cr)</span>
            </button>
          )}

          <button
            onClick={onFinish}
            disabled={isGenerating}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-headline font-bold text-sm shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-yellow-700 active:scale-95 transition-all flex items-center gap-2"
          >
            {t("dashboard.finishSaveRoom", "Finish & Save Room")}
            <Icon name="check_circle" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepRoomGenerationResult;
