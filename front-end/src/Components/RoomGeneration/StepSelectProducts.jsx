import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Icon from "../Icon";
import ProductDetailModal from "./ProductDetailModal";
import BudgetWarningModal from "./BudgetWarningModal";
import { parseProductDetails } from "../../utils/productUtils";

const StepSelectProducts = ({
  setStep,
  productData = {},
  categoryCounts = {},
  activeCategory,
  setActiveCategory,
  addedProducts = [],
  toggleProduct,
  currentSpent = 0,
  baseBudget = 0,
  percent = 0,
  onProceedToStep4
}) => {
  const { t, i18n } = useTranslation();
  const [selectedModalProduct, setSelectedModalProduct] = useState(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [validationError, setValidationError] = useState("");

  const categories = Object.keys(productData);

  useEffect(() => {
    if (categories.length > 0 && (!activeCategory || !categories.includes(activeCategory))) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory, setActiveCategory]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat(i18n.language, {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 0
    }).format(val || 0);
  };
  const currentCategoryProducts = productData[activeCategory] || [];
  const requiredCountForCategory = categoryCounts[activeCategory] || 1;

  // Count how many products are selected in the active category
  const selectedInActiveCategory = currentCategoryProducts.filter((p) =>
    addedProducts.map(String).includes(String(p._id || p.id || p.productData?._id || p.productData?.id))
  );

  // Check if ALL categories meet exact required counts
  const validateCategorySelections = () => {
    for (const cat of categories) {
      const catProducts = productData[cat] || [];
      const reqCount = categoryCounts[cat] || 1;
      const selectedCount = catProducts.filter((p) =>
        addedProducts.map(String).includes(String(p._id || p.id || p.productData?._id || p.productData?.id))
      ).length;

      if (selectedCount !== reqCount) {
        return {
          valid: false,
          categoryName: cat,
          required: reqCount,
          selected: selectedCount
        };
      }
    }
    return { valid: true };
  };

  const handleNextStepClick = () => {
    const validation = validateCategorySelections();
    if (!validation.valid) {
      setValidationError(
        `Please select exactly ${validation.required} item(s) for ${validation.categoryName.replace("_", " ")} before proceeding (currently selected: ${validation.selected}).`
      );
      setActiveCategory(validation.categoryName);
      return;
    }

    setValidationError("");

    // Check budget limit
    if (currentSpent > baseBudget && baseBudget > 0) {
      setIsBudgetModalOpen(true);
    } else {
      onProceedToStep4 ? onProceedToStep4() : setStep(4);
    }
  };

  return (
    <div className="bg-background rounded-[2rem] p-6 lg:p-10 neomorph-raised flex-grow flex flex-col relative">
      {/* Category Instructions Banner */}
      <div className="neomorph-inset rounded-2xl p-6 mb-6 border border-primary/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm neomorph-raised">
              3
            </span>
            <h1 className="font-headline text-2xl font-bold text-on-surface">
              {t("dashboard.stepThreeTitle", "Select Your Recommended Furniture")}
            </h1>
          </div>
          <p className="text-on-surface-variant text-sm md:text-base leading-relaxed">
            Choose furniture items for each category. Items marked with a <strong className="text-amber-500 font-bold">Golden Card</strong> are recommended by us and pre-selected automatically.
          </p>
        </div>

        <div className="bg-background p-4 rounded-xl neomorph-raised border border-outline-variant/30 shrink-0 text-right rtl:text-left">
          <span className="text-xs text-on-surface-variant block font-semibold uppercase tracking-wider">
            Active Category Requirement
          </span>
          <span className="font-headline font-bold text-lg text-primary">
            {selectedInActiveCategory.length} / {requiredCountForCategory} Selected
          </span>
        </div>
      </div>

      {/* Validation Error Alert */}
      {validationError && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-semibold flex items-center justify-between animate-shake">
          <div className="flex items-center gap-3">
            <Icon name="error" size={20} />
            <span>{validationError}</span>
          </div>
          <button onClick={() => setValidationError("")} className="hover:opacity-80">
            <Icon name="close" size={18} />
          </button>
        </div>
      )}

      {/* Categories Bar & Budget Meter */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="font-headline font-bold text-lg text-on-surface flex items-center gap-2 capitalize">
            <Icon name="category" className="text-primary" size={20} />
            <span>Category: {activeCategory.replace("_", " ")}</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold">
              {requiredCountForCategory} {requiredCountForCategory === 1 ? "item required" : "items required"}
            </span>
          </h2>

          {/* Budget Meter */}
          <div className="w-full sm:w-80 flex flex-col gap-2 shrink-0 bg-background p-3.5 rounded-2xl neomorph-raised">
            <div className="flex justify-between text-xs font-semibold text-on-surface-variant">
              <span>{t("dashboard.budget", "Room Budget")}</span>
              <span className={currentSpent > baseBudget && baseBudget > 0 ? "text-red-500 font-bold" : "text-primary font-bold"}>
                {formatCurrency(currentSpent)} / {formatCurrency(baseBudget)}
              </span>
            </div>
            <div className="h-2.5 w-full neomorph-inset rounded-full overflow-hidden relative">
              <div
                className={`absolute top-0 left-0 rtl:right-0 rtl:left-auto h-full rounded-full transition-all duration-300 ${
                  currentSpent > baseBudget && baseBudget > 0 ? "bg-red-500" : "bg-primary"
                }`}
                style={{ width: `${Math.min(percent, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Category Selector */}
        <div className="sm:hidden w-full">
          <select
            value={activeCategory}
            onChange={(e) => {
              setActiveCategory(e.target.value);
              setValidationError("");
            }}
            className="w-full p-3.5 rounded-xl neomorph-raised bg-background text-on-surface font-semibold capitalize border border-outline-variant focus:outline-none focus:border-primary"
          >
            {categories.map((cat) => {
              const catProds = productData[cat] || [];
              const reqCount = categoryCounts[cat] || 1;
              const selCount = catProds.filter((p) =>
                addedProducts.map(String).includes(String(p._id || p.id || p.productData?._id || p.productData?.id))
              ).length;
              return (
                <option key={cat} value={cat}>
                  {cat.replace("_", " ")} ({selCount}/{reqCount} selected)
                </option>
              );
            })}
          </select>
        </div>

        {/* Desktop/Tablet Flex-Wrap Category Pills (Shows ALL categories clearly without cutting) */}
        <div className="hidden sm:flex flex-wrap items-center gap-2.5 pb-2 pt-1 w-full">
          {categories.map((category) => {
            const isCatActive = activeCategory === category;
            const catProds = productData[category] || [];
            const reqCount = categoryCounts[category] || 1;
            const selCount = catProds.filter((p) =>
              addedProducts.map(String).includes(String(p._id || p.id || p.productData?._id || p.productData?.id))
            ).length;
            const isComplete = selCount === reqCount;

            return (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  setValidationError("");
                }}
                className={`px-4.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  isCatActive
                    ? "neomorph-inset text-primary border border-primary/40 shadow-inner bg-primary/5"
                    : "neomorph-raised text-on-surface-variant hover:text-primary hover:scale-[1.02]"
                }`}
              >
                <span className="capitalize">{category.replace("_", " ")}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isComplete
                      ? "bg-emerald-500/20 text-emerald-500"
                      : "bg-surface-variant text-on-surface-variant"
                  }`}
                >
                  {selCount}/{reqCount}
                </span>
                {isComplete && <Icon name="check_circle" size={16} className="text-emerald-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Category Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow mb-8">
        {currentCategoryProducts.map((product, idx) => {
          const parsed = parseProductDetails(product, activeCategory);
          const productId = parsed.id;
          const isAdded = addedProducts.map(String).includes(productId);
          const isGolden = product.isRecommended || idx < requiredCountForCategory;

          const title = parsed.title;
          const brand = parsed.brand;
          const price = parsed.price;
          const img = parsed.img;
          const desc = parsed.description;

          return (
            <div
              key={productId}
              className={`rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 relative ${
                isGolden
                  ? "border-2 border-amber-400/80 dark:border-amber-500/80 bg-gradient-to-b from-amber-500/10 via-background to-background shadow-[0_0_25px_rgba(245,158,11,0.2)] neomorph-raised"
                  : isAdded
                  ? "neomorph-raised ring-2 ring-primary/40 bg-primary/5"
                  : "neomorph-raised hover:border-outline-variant"
              }`}
            >
              {/* Image Container with Badges */}
              <div className="relative w-full h-52 rounded-xl overflow-hidden neomorph-inset p-2 bg-background">
                <img
                  alt={title}
                  className="w-full h-full object-cover rounded-lg"
                  src={img}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = parsed.fallbackImg;
                  }}
                />

                {/* Golden Card Badges */}
                {isGolden && (
                  <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3 flex flex-col gap-1.5 z-10">
                    <span className="px-3 py-1 rounded-full bg-amber-500 text-stone-950 text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-lg">
                      <Icon name="star" size={14} />
                      Recommended by Us
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold tracking-wide shadow-md">
                      Chosen Automatically
                    </span>
                  </div>
                )}

                {/* Toggle Selection Button */}
                <button
                  onClick={() => toggleProduct(productId, activeCategory, requiredCountForCategory)}
                  className={`absolute top-3 right-3 rtl:right-auto rtl:left-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 z-10 shadow-lg ${
                    isAdded
                      ? "bg-primary text-white scale-110"
                      : "bg-background text-on-surface hover:text-primary neomorph-raised"
                  }`}
                >
                  <Icon name={isAdded ? "check" : "add"} size={18} />
                </button>
              </div>

              {/* Product Info */}
              <div className="flex flex-col flex-grow">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h3 className="font-headline font-bold text-lg text-on-surface line-clamp-1">
                    {title}
                  </h3>
                </div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                  {brand}
                </span>
                <p className="text-xs text-on-surface-variant line-clamp-2 flex-grow mb-3">
                  {desc}
                </p>

                <div className="flex justify-between items-center mt-auto pt-2 border-t border-outline-variant/20">
                  <span className="font-headline font-bold text-lg text-primary">
                    {formatCurrency(price)}
                  </span>
                  {isAdded && (
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                      <Icon name="check_circle" size={14} /> Selected
                    </span>
                  )}
                </div>
              </div>

              {/* View Details Modal Action */}
              <button
                onClick={() => setSelectedModalProduct({ ...product, category: activeCategory, isRecommended: isGolden })}
                className="w-full py-2.5 rounded-xl neomorph-raised text-xs font-bold text-on-surface hover:text-primary active:neomorph-inset transition-all flex items-center justify-center gap-1.5 mt-auto"
              >
                <Icon name="visibility" size={16} />
                {t("dashboard.viewDetails", "View Details & Specs")}
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-between items-center mt-auto pt-6 border-t border-outline-variant/20">
        <button
          onClick={() => setStep(2)}
          className="px-6 py-3 rounded-xl font-headline font-semibold text-on-surface-variant bg-background neomorph-raised hover:text-primary active:neomorph-inset transition-all flex items-center gap-2"
        >
          <Icon name="arrow_forward" size={16} className="rotate-180 rtl:rotate-0" />
          {t("common.goBack", "Back")}
        </button>

        <button
          onClick={handleNextStepClick}
          className="px-8 py-3.5 rounded-xl font-headline font-semibold text-white bg-primary hover:bg-primary-variant shadow-lg active:scale-95 transition-all flex items-center gap-2 group"
        >
          {t("common.nextStep", "Generate Room Design")}
          <Icon name="arrow_forward" size={18} className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
        </button>
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedModalProduct}
        isOpen={!!selectedModalProduct}
        onClose={() => setSelectedModalProduct(null)}
        isSelected={selectedModalProduct && addedProducts.includes(selectedModalProduct.id || selectedModalProduct._id)}
        onToggleSelect={(id) => toggleProduct(id, activeCategory, requiredCountForCategory)}
        formatCurrency={formatCurrency}
      />

      {/* Budget Warning Modal */}
      <BudgetWarningModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        onProceed={() => {
          setIsBudgetModalOpen(false);
          onProceedToStep4 ? onProceedToStep4() : setStep(4);
        }}
        currentSpent={currentSpent}
        baseBudget={baseBudget}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};

export default StepSelectProducts;
