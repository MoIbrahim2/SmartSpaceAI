import { useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "../Icon";
import { API_HOST } from "../../api";
import { parseProductDetails } from "../../utils/productUtils";

const StepRoomGenerationResult = ({
  setStep,
  generatedImage,
  selectedProducts = [],
  isGenerating = false,
  handleRegenerate,
  onFinish
}) => {
  const { t, i18n } = useTranslation();
  const [showProductSummary, setShowProductSummary] = useState(false);

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    return `${API_HOST}/${url.replace(/^\//, "")}`;
  };

  const finalImgUrl = getImageUrl(generatedImage?.url) || null;

  return (
    <div className="bg-background rounded-[2rem] p-6 lg:p-10 neomorph-raised flex-grow flex flex-col relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            {t("dashboard.stepFourTitle", "Your AI Room Design Rendering")}
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Generated with smart alignment based on your room dimensions & selected products.
          </p>
        </div>

        <button
          onClick={() => setShowProductSummary(!showProductSummary)}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-primary bg-background neomorph-raised hover:text-primary-variant transition-all flex items-center gap-2"
        >
          <Icon name={showProductSummary ? "expand_less" : "chair"} size={16} />
          {showProductSummary ? "Hide Selected Products" : `View Products (${selectedProducts.length})`}
        </button>
      </div>

      {/* Selected Products Breakdown Bar (Collapsible) */}
      {showProductSummary && selectedProducts.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl neomorph-inset bg-surface-bright/20 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
          {selectedProducts.map((p, idx) => {
            const parsed = parseProductDetails(p, p.category);
            const img = parsed.img;
            const title = parsed.title;
            return (
              <div key={idx} className="flex items-center gap-3 p-2 rounded-xl bg-background neomorph-raised">
                <img 
                  src={getImageUrl(img)} 
                  alt={title} 
                  className="w-12 h-12 rounded-lg object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = parsed.fallbackImg;
                  }}
                />
                <div className="overflow-hidden">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                    {p.category || "Item"}
                  </span>
                  <span className="text-xs font-semibold text-on-surface line-clamp-1">
                    {title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Generated Image Preview */}
      <div className="flex-grow bg-background rounded-2xl neomorph-inset overflow-hidden flex items-center justify-center min-h-[420px] mb-6 relative group">
        {isGenerating ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 z-20 p-6 text-center">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping"></div>
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-primary">
                <Icon name="auto_awesome" size={28} />
              </div>
            </div>
            <h3 className="font-headline font-bold text-xl text-on-surface mb-2">
              Generating High-Resolution Room Composite...
            </h3>
            <p className="text-xs text-on-surface-variant max-w-md">
              Gemini Imagen is synthesizing your room layout, furniture dimensions, materials, and soft lighting for maximum spatial accuracy.
            </p>
          </div>
        ) : finalImgUrl ? (
          <>
            <img
              alt="Generated Room Render"
              className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
              src={finalImgUrl}
            />

            {/* AI Watermark Badge */}
            <div className="absolute bottom-4 left-4 rtl:left-auto rtl:right-4 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-2 border border-white/20">
              <Icon name="auto_awesome" size={14} className="text-amber-400" />
              <span>SmartSpace AI Imagen Render</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-full bg-surface-variant/30 flex items-center justify-center mb-4">
              <Icon name="image" size={36} className="text-on-surface-variant/50" />
            </div>
            <h3 className="font-headline font-bold text-lg text-on-surface mb-1">
              No Rendered Image Yet
            </h3>
            <p className="text-sm text-on-surface-variant max-w-sm">
              Click "Regenerate Image" to create an AI-rendered visualization of your room with the selected furniture.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="flex flex-wrap justify-between items-center gap-4 mt-auto pt-4 border-t border-outline-variant/20">
        <button
          onClick={() => setStep(3)}
          className="px-6 py-3 rounded-xl bg-background text-on-surface-variant font-semibold text-sm transition-all neomorph-raised hover:text-on-surface active:neomorph-inset flex items-center gap-2"
        >
          <Icon name="arrow_forward" size={16} className="rotate-180 rtl:rotate-0" />
          {t("common.goBack", "Back to Selection")}
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRegenerate}
            disabled={isGenerating}
            className="px-6 py-3 rounded-xl bg-background text-on-surface font-semibold text-sm transition-all neomorph-raised hover:text-primary active:neomorph-inset disabled:opacity-50 flex items-center gap-2"
          >
            <Icon name="refresh" size={18} className={isGenerating ? "animate-spin text-primary" : ""} />
            {t("dashboard.regenerate", "Regenerate Image")}
          </button>

          <button
            onClick={onFinish}
            disabled={isGenerating}
            className="px-8 py-3 rounded-xl bg-primary text-on-primary font-headline font-semibold text-sm shadow-lg hover:bg-primary-variant active:scale-95 transition-all flex items-center gap-2"
          >
            {t("common.finish", "Finish & Save Room")}
            <Icon name="check_circle" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepRoomGenerationResult;
