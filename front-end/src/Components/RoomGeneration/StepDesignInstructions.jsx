import { useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "../Icon";

const ROOM_STYLES = [
  {
    id: "modern",
    name: "Modern",
    nameAr: "مودرن (حديث)",
    description: "Corner perspective view of an empty modern room with sleek furniture, clean lines, and ambient lighting.",
    descriptionAr: "منظور واسع من زاوية الغرفة لغرفة مودرن خالية تحتوي على أثاث عصري أنيق وإضاءة خافتة.",
    promptSnippet: "Design this room in a Modern style featuring sleek furniture, clean architectural lines, neutral tones, and ambient LED lighting.",
    images: [
      "/img/styles/modern_1.png",
      "/img/styles/modern_2.png",
      "/img/styles/modern_3.png",
      "/img/styles/modern_4.png",
    ],
    roomLabels: ["Modern Corner Living Room", "Modern Master Bedroom", "Modern Corner Dining Room", "Modern Kitchen Room", "Modern Corner Home Office", "Modern Interior Lounge"],
    roomLabelsAr: ["غرفة معيشة مودرن من الزاوية", "غرفة نوم رئيسية مودرن", "غرفة طعام مودرن من الزاوية", "مطبخ مودرن أنيق", "مكتب منزلي مودرن من الزاوية", "صالون داخلي مودرن"],
  },
  {
    id: "scandinavian",
    name: "Scandinavian",
    nameAr: "اسكندنافي",
    description: "Corner view of an empty Nordic room showing light oak furniture, crisp linen, and bright natural light.",
    descriptionAr: "رؤية من زاوية الغرفة لغرفة اسكندنافية خالية بأثاث البلوط الفاتح وضوء طبيعي ناصع.",
    promptSnippet: "Design this room in a Scandinavian style featuring light oak wooden furniture, crisp white linen textiles, woven rugs, and bright cozy decor.",
    images: [
      "/img/styles/scandinavian_1.png",
      "/img/styles/scandinavian_2.png",
      "/img/styles/scandinavian_3.png",
      "/img/styles/scandinavian_4.png",
    ],
    roomLabels: ["Scandi Corner Living Room", "Scandi Light Bedroom", "Scandi Bright Kitchen Room", "Scandi Corner Study Room", "Scandi Sunlit Lounge", "Scandi Workspace Room"],
    roomLabelsAr: ["غرفة معيشة اسكندنافية من الزاوية", "غرفة نوم اسكندنافية دافئة", "مطبخ اسكندنافي ناصع", "مكتب دراسة اسكندنافي من الزاوية", "صالون اسكندنافي مشرق", "مساحة عمل اسكندنافية"],
  },
  {
    id: "bohemian",
    name: "Bohemian",
    nameAr: "بوهيمي (بوهو)",
    description: "Corner perspective view of an empty Boho room with rattan furniture, woven textiles, and leafy plants.",
    descriptionAr: "منظور زاوية لغرفة بوهيمية خالية تحتوي على أثاث الرتان وخيزران ونباتات حية دافئة.",
    promptSnippet: "Design this room in a Bohemian style featuring rattan and macrame furniture, rich woven textiles, warm earthy colors, and lush indoor plants.",
    images: [
      "/img/styles/bohemian_1.png",
      "/img/styles/bohemian_2.jpg",
      "/img/styles/bohemian_3.jpg",
      "/img/styles/bohemian_4.jpg",
    ],
    roomLabels: ["Boho Corner Master Bedroom", "Boho Indoor Living Lounge", "Boho Rattan Room", "Boho Corner Reading Nook", "Boho Sunroom Interior", "Boho Relaxation Lounge"],
    roomLabelsAr: ["غرفة نوم بوهيمية من الزاوية", "صالون معيشة بوهيمي هادئ", "غرفة بوهيمية بأثاث رتان", "ركن قراءة بوهيمي من الزاوية", "صالون استراحة بوهيمي", "غرفة استرخاء بوهيمية"],
  },
  {
    id: "industrial",
    name: "Industrial",
    nameAr: "صناعي (إندستريال)",
    description: "Corner perspective shot of an empty industrial loft room with exposed brick, metal iron, and leather furniture.",
    descriptionAr: "لقطة زاوية لغرفة لوفت صناعية خالية بها طوب أحمر، أثاث معدني وسوداء وجلد فاخر.",
    promptSnippet: "Design this room in an Industrial style featuring exposed brick walls, dark iron frame furniture, distressed leather seating, and Edison bulb lighting.",
    images: [
      "/img/styles/industrial_1.jpg",
      "/img/styles/industrial_2.jpg",
      "/img/styles/industrial_3.jpg",
      "/img/styles/industrial_4.jpg",
    ],
    roomLabels: ["Industrial Loft Living Room", "Industrial Brick Bedroom", "Industrial Kitchen Room", "Industrial Dining Room", "Industrial Loft Salon", "Industrial Study Lounge"],
    roomLabelsAr: ["غرفة معيشة صناعية من الزاوية", "غرفة نوم بطوب صناعي", "مطبخ إندستريال مفتوح", "غرفة طعام صناعية من الزاوية", "صالون لوفت صناعي", "ركن دراسة صناعي"],
  },
  {
    id: "minimalist",
    name: "Minimalist",
    nameAr: "مينيماليست (بسيط)",
    description: "Corner perspective view of an empty minimalist room with functional low-profile furniture and tranquil space.",
    descriptionAr: "رؤية واسعة من زاوية غرفة بسيطة خالية تماماً من الازدحام وأثاث مونوكروم هادئ.",
    promptSnippet: "Design this room in a Minimalist style featuring low-profile functional furniture, neutral monochromatic colors, zero clutter, and serene open space.",
    images: [
      "/img/styles/minimalist_1.jpg",
      "/img/styles/minimalist_2.jpg",
      "/img/styles/minimalist_3.jpg",
      "/img/styles/minimalist_4.jpg",
    ],
    roomLabels: ["Minimalist Corner Living Space", "Minimalist Tatami Bedroom", "Minimalist Kitchen Room", "Minimalist Bathroom Space", "Minimalist Corner Desk Room", "Minimalist Open Interior Lounge"],
    roomLabelsAr: ["غرفة معيشة بسيطة من الزاوية", "غرفة نوم يابانية بسيطة", "مطبخ بسيط ناصع", "حمام هادئ مينيماليست", "مكتب بسيط من الزاوية", "صالون مفتوح بسيط"],
  },
  {
    id: "luxury",
    name: "Luxury / Art Deco",
    nameAr: "فاخر (لكشري / آرت ديكو)",
    description: "Corner perspective view of an empty luxury room with velvet sofas, marble tables, and brass details.",
    descriptionAr: "رؤية فخمة من زاوية غرفة فاخرة خالية تحتوي على كنبات قطيفة وأسطح رخام ولمسات ذهبية.",
    promptSnippet: "Design this room in a Luxury Art Deco style featuring velvet furniture, polished marble tables, brass metallic accents, and elegant chandelier lighting.",
    images: [
      "/img/styles/luxury_1.jpg",
      "/img/styles/luxury_2.jpg",
      "/img/styles/luxury_3.jpg",
      "/img/styles/luxury_4.jpg",
    ],
    roomLabels: ["Luxury Corner Velvet Living Room", "Luxury Master Suite Bedroom", "Luxury Grand Marble Dining Room", "Luxury Gourmet Kitchen Room", "Luxury Penthouse Interior Salon", "Luxury Executive Office Room"],
    roomLabelsAr: ["صالون قطيفة فاخر من الزاوية", "جناح نوم رئيسي ملكي", "غرفة طعام رخامية من الزاوية", "مطبخ فاخر بلمسات ذهبية", "صالون بنتهاوس فخم", "مكتب تنفيذي راقي"],
  },
  {
    id: "contemporary",
    name: "Contemporary",
    nameAr: "كونتمبراري (معاصر)",
    description: "Corner perspective view of an empty contemporary room showing soft curved furniture silhouettes.",
    descriptionAr: "رؤية واسعة من زاوية غرفة معاصرة خالية تحتوي على أثاث ناعم وإضاءة فنية متميزة.",
    promptSnippet: "Design this room in a Contemporary style featuring soft curved furniture, statement lighting, plush textured fabrics, and modern artistic accents.",
    images: [
      "/img/styles/contemporary_1.jpg",
      "/img/styles/contemporary_2.jpg",
      "/img/styles/contemporary_3.jpg",
      "/img/styles/contemporary_4.jpg",
    ],
    roomLabels: ["Contemporary Curved Sofa Room", "Contemporary Bedroom", "Contemporary Dining Room", "Contemporary Lounge Room", "Contemporary Kitchen Room", "Contemporary Study Lounge"],
    roomLabelsAr: ["غرفة معيشة معاصرة من الزاوية", "غرفة نوم معاصرة", "غرفة طعام معاصرة من الزاوية", "صالون معاصر هادئ", "مطبخ معاصر واسع", "مكتب دراسة معاصر"],
  },
];

const StepDesignInstructions = ({ form, setForm, setStep, onExtractPreferences, extracting }) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith("ar");

  const [selectedStyleId, setSelectedStyleId] = useState("modern");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [modalImage, setModalImage] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const currentStyle = ROOM_STYLES.find((s) => s.id === selectedStyleId) || ROOM_STYLES[0];
  const totalImages = currentStyle.images.length; // Always 6

  const handleStyleChange = (styleId) => {
    setSelectedStyleId(styleId);
    setCurrentImageIndex(0); // Reset index on style change
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % totalImages);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const handleNext = () => {
    if (onExtractPreferences) {
      onExtractPreferences();
    } else {
      setStep(3);
    }
  };

  const handleApplyStyle = (styleToApply = currentStyle) => {
    const snippet = styleToApply.promptSnippet;
    setForm((prev) => {
      const currentPrompt = prev.prompt ? prev.prompt.trim() : "";
      if (!currentPrompt) {
        return { ...prev, prompt: snippet };
      }
      if (currentPrompt.includes(snippet)) {
        return prev;
      }
      return { ...prev, prompt: `${currentPrompt}\n\n${snippet}` };
    });

    setToastMessage(t("dashboard.styleAppliedToast") || "Style applied to your design instructions!");
    setTimeout(() => setToastMessage(""), 2500);
  };

  const currentLabel = isArabic
    ? currentStyle.roomLabelsAr[currentImageIndex]
    : currentStyle.roomLabels[currentImageIndex];

  return (
    <div className="bg-background rounded-[2rem] p-8 lg:p-10 neomorph-raised flex-grow flex flex-col relative">
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-primary text-on-primary px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <Icon name="check_circle" size={20} />
          <span className="font-headline font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      <header className="mb-8">
        <h1 className="font-headline text-2xl font-bold text-on-surface mb-2">{t("dashboard.stepTwoTitle")}</h1>
      </header>

      {/* Instructions Panel */}
      <div className="bg-background rounded-2xl p-6 neomorph-inset mb-8 border border-surface-container-low">
        <div className="flex gap-4">
          <div className="text-primary mt-1 shrink-0">
            <Icon name="auto_awesome" size={28} />
          </div>
          <div>
            <h3 className="font-headline font-semibold text-lg text-on-surface mb-2">{t("dashboard.howToWritePrompt")}</h3>
            <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-4">
              {t("dashboard.howToWritePromptDesc")}
            </p>
            <div className="bg-background rounded-xl p-4 neomorph-raised inline-block text-left rtl:text-right">
              <span className="text-xs font-bold text-primary uppercase tracking-wider mb-1 block">{t("dashboard.examplePromptTitle")}</span>
              <p className="font-body text-sm text-on-surface-variant italic leading-relaxed">
                {t("dashboard.examplePromptText")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Room Style Selector & 16:9 Corner-Perspective Widescreen Slider */}
      <div className="bg-background rounded-2xl p-6 neomorph-raised mb-8 border border-surface-container-low transition-all overflow-hidden">
        {/* Top Control Bar: Title, Description, Dropdown List & Non-Overflowing Apply Button */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="palette" className="text-primary" size={24} />
              <h3 className="font-headline font-bold text-lg text-on-surface">
                {t("dashboard.selectRoomStyle") || "Room Style Palette"}
              </h3>
            </div>
            <p className="text-xs text-on-surface-variant font-body leading-relaxed">
              {isArabic ? currentStyle.descriptionAr : currentStyle.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Styled Dropdown List */}
            <div className="relative min-w-[180px] sm:min-w-[210px] flex-grow sm:flex-grow-0">
              <select
                value={selectedStyleId}
                onChange={(e) => handleStyleChange(e.target.value)}
                className="w-full bg-background text-on-surface font-headline font-semibold py-3 px-4 pr-10 rtl:pr-4 rtl:pl-10 rounded-xl neomorph-inset appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer text-sm transition-all"
              >
                {ROOM_STYLES.map((style) => (
                  <option key={style.id} value={style.id} className="bg-background text-on-surface py-2">
                    {isArabic ? style.nameAr : style.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                <Icon name="expand_more" size={20} />
              </div>
            </div>

            {/* Apply Style to Prompt Button - Non-overflowing flex item */}
            <button
              type="button"
              onClick={() => handleApplyStyle(currentStyle)}
              className="px-4 py-3 rounded-xl text-xs font-headline font-semibold text-primary bg-background neomorph-raised hover:text-primary-variant active:neomorph-inset transition-all whitespace-nowrap flex items-center justify-center gap-2 shrink-0"
            >
              <Icon name="auto_fix_high" size={16} />
              <span>{t("dashboard.applyToPrompt") || "Apply Style to Prompt"}</span>
            </button>
          </div>
        </div>

        {/* Single 16:9 Image Widescreen Corner-Perspective Circular Slider */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden neomorph-inset border border-outline-variant/15 group shadow-inner">
          <img
            src={currentStyle.images[currentImageIndex]}
            alt={`${currentStyle.name} - ${currentLabel}`}
            className="w-full h-full object-cover transition-opacity duration-500"
            loading="lazy"
          />

          {/* Dark Gradient Overlay for Badges */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30 pointer-events-none" />

          {/* Top Left Badge */}
          <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl text-white flex items-center gap-2 border border-white/10 max-w-[70%]">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shrink-0" />
            <span className="font-headline font-bold text-xs sm:text-sm tracking-wide shrink-0">
              {isArabic ? currentStyle.nameAr : currentStyle.name}
            </span>
            <span className="text-white/40 text-xs shrink-0">|</span>
            <span className="font-body text-xs text-white/90 truncate">
              {currentLabel}
            </span>
          </div>

          {/* Top Right Counter Badge */}
          <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-white font-headline text-xs font-bold border border-white/10">
            {currentImageIndex + 1} / {totalImages}
          </div>

          {/* Circular Left Arrow Button (<) */}
          <button
            type="button"
            onClick={handlePrevImage}
            className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg border border-white/20"
            aria-label="Previous room image"
          >
            <Icon name="chevron_left" size={30} className="rtl:rotate-180" />
          </button>

          {/* Circular Right Arrow Button (>) */}
          <button
            type="button"
            onClick={handleNextImage}
            className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg border border-white/20"
            aria-label="Next room image"
          >
            <Icon name="chevron_right" size={30} className="rtl:rotate-180" />
          </button>

          {/* Bottom Bar: Indicators & Expand Action */}
          <div className="absolute bottom-4 inset-x-4 flex items-center justify-between z-20">
            {/* Dots Navigation */}
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
              {currentStyle.images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`transition-all duration-300 rounded-full ${
                    idx === currentImageIndex
                      ? "w-6 h-2 bg-primary"
                      : "w-2 h-2 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>

            {/* Click to Expand Button */}
            <button
              type="button"
              onClick={() =>
                setModalImage({
                  url: currentStyle.images[currentImageIndex],
                  index: currentImageIndex,
                  style: currentStyle,
                  label: currentLabel,
                })
              }
              className="bg-black/60 hover:bg-black/80 text-white backdrop-blur-md px-4 py-2 rounded-xl text-xs font-headline font-semibold flex items-center gap-1.5 border border-white/20 transition-all"
            >
              <Icon name="zoom_in" size={16} />
              {t("dashboard.viewEnlarged") || "Click to enlarge"}
            </button>
          </div>
        </div>
      </div>

      {/* Prompt Input Area */}
      <div className="flex-grow flex flex-col gap-2 mb-8">
        <div className="flex items-center justify-between ml-2 rtl:mr-2 rtl:ml-0 mb-1">
          <label className="font-headline font-semibold text-on-surface" htmlFor="prompt-input">
            {t("dashboard.yourDesignInstructions")}
          </label>
        </div>
        <textarea
          className="w-full flex-grow min-h-[200px] bg-background border-none rounded-xl p-6 font-body text-on-surface placeholder:text-on-surface-variant/50 focus:ring-0 focus:outline-none neomorph-inset resize-none transition-shadow"
          id="prompt-input"
          placeholder={t("dashboard.describeDreamRoom")}
          value={form.prompt}
          onChange={(e) => setForm((p) => ({ ...p, prompt: e.target.value }))}
        ></textarea>
      </div>

      {/* Navigation Action Buttons */}
      <div className="flex justify-between items-center mt-auto pt-4 border-t border-outline-variant/20">
        <button
          onClick={() => setStep(1)}
          disabled={extracting}
          className="px-6 py-3 rounded-xl font-headline font-semibold text-on-surface-variant bg-background neomorph-raised hover:text-primary active:neomorph-inset transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Icon name="arrow_forward" size={16} className="rotate-180 rtl:rotate-0" />
          {t("common.goBack")}
        </button>
        <button
          onClick={handleNext}
          disabled={extracting}
          className="px-8 py-3 rounded-xl font-headline font-semibold text-primary bg-background neomorph-raised hover:text-primary-variant active:neomorph-inset transition-all flex items-center gap-2 group disabled:opacity-50"
        >
          {t("common.next")}
          <Icon name="arrow_forward" size={16} className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
        </button>
      </div>

      {/* Lightbox Image Preview Modal */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn"
          onClick={() => setModalImage(null)}
        >
          <div
            className="relative max-w-5xl w-full bg-background rounded-3xl p-6 neomorph-raised border border-outline-variant/20 flex flex-col items-center gap-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <Icon name="palette" className="text-primary" size={20} />
                <h4 className="font-headline font-bold text-on-surface">
                  {isArabic ? modalImage.style.nameAr : modalImage.style.name} — {modalImage.label} ({modalImage.index + 1}/{totalImages})
                </h4>
              </div>
              <button
                onClick={() => setModalImage(null)}
                className="p-2 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                aria-label="Close modal"
              >
                <Icon name="close" size={24} />
              </button>
            </div>

            <div className="relative aspect-video w-full flex items-center justify-center overflow-hidden rounded-2xl bg-black/40">
              <img
                src={modalImage.url}
                alt="Enlarged room style"
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>

            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-outline-variant/20">
              <p className="text-xs text-on-surface-variant font-body">
                {isArabic ? modalImage.style.descriptionAr : modalImage.style.description}
              </p>
              <button
                type="button"
                onClick={() => {
                  handleApplyStyle(modalImage.style);
                  setModalImage(null);
                }}
                className="px-6 py-2.5 rounded-xl font-headline font-semibold text-on-primary bg-primary hover:bg-primary-variant transition-all flex items-center gap-2 shrink-0 text-sm shadow-md"
              >
                <Icon name="auto_fix_high" size={18} />
                {t("dashboard.applyToPrompt") || "Apply Style to Prompt"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepDesignInstructions;
