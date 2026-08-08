import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Icon from "../Icon";
import ProductDetailModal from "./ProductDetailModal";
import BudgetWarningModal from "./BudgetWarningModal";
import { parseProductDetails, getProductId, getExternalStoreUrl } from "../../utils/productUtils";
import { useCart } from "../../context/CartContext";

const StepSelectProducts = ({
  setStep,
  productData = {},
  categoryCounts = {},
  activeCategory,
  setActiveCategory,
  addedProducts = [],
  toggleProduct,
  incrementProduct,
  decrementProduct,
  currentSpent = 0,
  baseBudget = 0,
  percent = 0,
  onProceedToStep4
}) => {
  const { t, i18n } = useTranslation();
  const { addToCart } = useCart();
  const [selectedModalProduct, setSelectedModalProduct] = useState(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL"); // "ALL" | "LOCAL" | "EXTERNAL"
  const [sellerFilter, setSellerFilter] = useState("ALL"); // "ALL" | brand string

  const categories = Object.keys(productData);

  useEffect(() => {
    if (categories.length > 0 && (!activeCategory || !categories.includes(activeCategory))) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory, setActiveCategory]);

  // Reset seller filter when category changes
  useEffect(() => {
    setSellerFilter("ALL");
  }, [activeCategory]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat(i18n.language, {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 0
    }).format(val || 0);
  };
  const currentCategoryProducts = productData[activeCategory] || [];

  // Available sellers/brands for the active category
  const availableSellers = currentCategoryProducts.reduce((acc, p) => {
    const parsed = parseProductDetails(p, activeCategory);
    if (parsed.brand && !acc.includes(parsed.brand)) {
      acc.push(parsed.brand);
    }
    return acc;
  }, []);

  const localCount = currentCategoryProducts.filter((p) => parseProductDetails(p, activeCategory).isInternal).length;
  const externalCount = currentCategoryProducts.length - localCount;

  const filteredProducts = currentCategoryProducts.filter((p) => {
    const parsed = parseProductDetails(p, activeCategory);
    if (sourceFilter === "LOCAL" && !parsed.isInternal) return false;
    if (sourceFilter === "EXTERNAL" && parsed.isInternal) return false;
    if (sellerFilter !== "ALL" && parsed.brand !== sellerFilter) return false;
    return true;
  });
  const requiredCountForCategory = categoryCounts[activeCategory] ?? 0;
  const isOptionalActiveCategory = requiredCountForCategory === 0;

  // Count total selected items in the active category (accounting for multi-quantity)
  const activeCatProductIds = new Set(currentCategoryProducts.map((p) => getProductId(p)));
  const selectedInActiveCategoryCount = addedProducts.filter((id) => activeCatProductIds.has(id)).length;

  // Validate category selections: ONLY categories explicitly requested in prompt (reqCount > 0) are required!
  const validateCategorySelections = () => {
    for (const cat of categories) {
      const reqCount = categoryCounts[cat] ?? 0;
      if (reqCount === 0) continue; // Optional categories never block progress!

      const catProducts = productData[cat] || [];
      const catProductIds = new Set(catProducts.map((p) => getProductId(p)));
      const selCount = addedProducts.filter((id) => catProductIds.has(id)).length;

      if (selCount < reqCount) {
        return {
          valid: false,
          categoryName: cat,
          required: reqCount,
          selected: selCount
        };
      }
    }
    return { valid: true };
  };

  const handleNextStepClick = () => {
    console.log("[StepSelectProducts] 'Generate Room Design' button clicked.");
    console.log("[StepSelectProducts] Currently added product IDs:", addedProducts);

    const validation = validateCategorySelections();
    if (!validation.valid) {
      console.warn("[StepSelectProducts] ⚠️ Category selection incomplete:", validation);
      setValidationError(
        `Please select at least ${validation.required} item(s) for ${validation.categoryName.replace("_", " ")} before proceeding (currently selected: ${validation.selected}).`
      );
      setActiveCategory(validation.categoryName);
      return;
    }

    setValidationError("");

    // Check budget limit
    if (currentSpent > baseBudget && baseBudget > 0) {
      console.log("[StepSelectProducts] ⚠️ Budget exceeded. Opening budget warning modal.");
      setIsBudgetModalOpen(true);
    } else {
      console.log("[StepSelectProducts] ✅ Validation passed. Calling onProceedToStep4()...");
      if (onProceedToStep4) {
        onProceedToStep4();
      } else {
        console.warn("[StepSelectProducts] onProceedToStep4 prop is missing! Falling back to setStep(4).");
        setStep(4);
      }
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
            Active Category Status
          </span>
          <span className="font-headline font-bold text-lg text-primary">
            {isOptionalActiveCategory
              ? `${selectedInActiveCategoryCount} Selected (Optional)`
              : `${selectedInActiveCategoryCount} / ${requiredCountForCategory} Selected`}
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
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
              isOptionalActiveCategory
                ? "bg-stone-500/10 text-stone-500 dark:text-stone-400"
                : "bg-primary/10 text-primary"
            }`}>
              {isOptionalActiveCategory
                ? "Optional"
                : `${requiredCountForCategory} ${requiredCountForCategory === 1 ? "item required" : "items required"}`}
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
              const reqCount = categoryCounts[cat] ?? 0;
              const catProductIds = new Set(catProds.map((p) => getProductId(p)));
              const selCount = addedProducts.filter((id) => catProductIds.has(id)).length;
              return (
                <option key={cat} value={cat}>
                  {cat.replace("_", " ")} ({reqCount === 0 ? `${selCount} selected • Optional` : `${selCount}/${reqCount} selected`})
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
            const reqCount = categoryCounts[category] ?? 0;
            const catProductIds = new Set(catProds.map((p) => getProductId(p)));
            const selCount = addedProducts.filter((id) => catProductIds.has(id)).length;
            const isComplete = reqCount > 0 ? selCount >= reqCount : selCount > 0;
            const isOptional = reqCount === 0;

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
                      : isOptional
                      ? "bg-stone-500/10 text-stone-500 dark:text-stone-400"
                      : "bg-surface-variant text-on-surface-variant"
                  }`}
                >
                  {isOptional ? (selCount > 0 ? `${selCount} Selected` : "Optional") : `${selCount}/${reqCount}`}
                </span>
                {isComplete && <Icon name="check_circle" size={16} className="text-emerald-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Toolbar (Marketplace & Seller Filter) */}
      <div className="mb-6 p-4 rounded-2xl neomorph-raised bg-background flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-outline-variant/20">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Icon name="filter_list" size={16} className="text-primary" />
            Filter Source:
          </span>

          <button
            type="button"
            onClick={() => setSourceFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              sourceFilter === "ALL"
                ? "bg-primary text-white shadow-md"
                : "bg-background text-on-surface-variant neomorph-raised hover:text-on-surface"
            }`}
          >
            All Items ({currentCategoryProducts.length})
          </button>

          <button
            type="button"
            onClick={() => setSourceFilter("LOCAL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              sourceFilter === "LOCAL"
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-background text-on-surface-variant neomorph-raised hover:text-emerald-600"
            }`}
          >
            <Icon name="store" size={14} />
            SmartSpace Sellers ({localCount})
          </button>

          <button
            type="button"
            onClick={() => setSourceFilter("EXTERNAL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              sourceFilter === "EXTERNAL"
                ? "bg-amber-600 text-white shadow-md"
                : "bg-background text-on-surface-variant neomorph-raised hover:text-amber-600"
            }`}
          >
            <Icon name="public" size={14} />
            External Retailers ({externalCount})
          </button>
        </div>

        {/* Specific Seller / Brand Dropdown */}
        {availableSellers.length > 0 && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-on-surface-variant whitespace-nowrap">
              Store / Seller:
            </span>
            <select
              value={sellerFilter}
              onChange={(e) => setSellerFilter(e.target.value)}
              className="p-2 rounded-xl neomorph-raised bg-background text-xs font-bold text-on-surface border border-outline-variant focus:outline-none focus:border-primary shrink-0"
            >
              <option value="ALL">All Stores & Brands</option>
              {availableSellers.map((seller) => (
                <option key={seller} value={seller}>
                  {seller}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Active Category Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="neomorph-inset rounded-2xl p-10 text-center my-6 flex flex-col items-center justify-center">
          <Icon name="filter_alt_off" size={40} className="text-on-surface-variant/40 mb-2" />
          <h4 className="font-headline font-bold text-on-surface text-base">No products match your filter</h4>
          <p className="text-xs text-on-surface-variant mt-1 mb-4">Try clearing your source or seller filters to see available options.</p>
          <button
            onClick={() => { setSourceFilter("ALL"); setSellerFilter("ALL"); }}
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow mb-8">
          {filteredProducts.map((product, idx) => {
          const parsed = parseProductDetails(product, activeCategory);
          const productId = parsed.id;
          const selectedQty = addedProducts.filter((id) => id === productId).length;
          const isAdded = selectedQty > 0;
          const isGolden = product.isRecommended || (requiredCountForCategory > 0 && idx < requiredCountForCategory);

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

                {/* Multi-Selection Quantity Controls / Add Button */}
                <div className="absolute top-3 right-3 rtl:right-auto rtl:left-3 z-10">
                  {selectedQty > 0 ? (
                    <div className="flex items-center gap-1.5 bg-background/95 backdrop-blur-md p-1 rounded-full border border-primary/30 shadow-xl neomorph-raised">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          decrementProduct ? decrementProduct(productId) : toggleProduct(productId, activeCategory, requiredCountForCategory);
                        }}
                        className="w-7 h-7 rounded-full bg-surface-variant hover:bg-red-500 hover:text-white text-on-surface flex items-center justify-center transition-all font-bold text-sm"
                        title="Decrease quantity"
                      >
                        <Icon name="remove" size={14} />
                      </button>

                      <span className="px-2 font-headline font-black text-sm text-primary">
                        {selectedQty}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          incrementProduct ? incrementProduct(productId) : toggleProduct(productId, activeCategory, requiredCountForCategory);
                        }}
                        className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center transition-all font-bold text-sm hover:scale-110 shadow-md"
                        title="Add another instance"
                      >
                        <Icon name="add" size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => incrementProduct ? incrementProduct(productId) : toggleProduct(productId, activeCategory, requiredCountForCategory)}
                      className="w-9 h-9 rounded-full bg-background text-on-surface hover:text-primary neomorph-raised flex items-center justify-center transition-all duration-200 shadow-lg hover:scale-105"
                      title="Add product"
                    >
                      <Icon name="add" size={18} />
                    </button>
                  )}
                </div>
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
                  {selectedQty > 0 && (
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                      <Icon name="check_circle" size={14} /> {selectedQty > 1 ? `${selectedQty} Selected` : "Selected"}
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
      )}

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
        selectedQty={selectedModalProduct ? addedProducts.filter((id) => id === getProductId(selectedModalProduct)).length : 0}
        isSelected={selectedModalProduct && addedProducts.includes(getProductId(selectedModalProduct))}
        onToggleSelect={(id) => toggleProduct(id, activeCategory, requiredCountForCategory)}
        onIncrement={(id) => incrementProduct ? incrementProduct(id) : toggleProduct(id, activeCategory, requiredCountForCategory)}
        onDecrement={(id) => decrementProduct ? decrementProduct(id) : toggleProduct(id, activeCategory, requiredCountForCategory)}
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
