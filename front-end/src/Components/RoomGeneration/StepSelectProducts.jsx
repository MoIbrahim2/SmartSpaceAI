import Icon from "../Icon";

const StepSelectProducts = ({
  setStep,
  productData,
  activeCategory,
  setActiveCategory,
  addedProducts,
  toggleProduct,
  currentSpent,
  baseBudget,
  percent,
}) => {
  return (
    <div className="bg-background rounded-[2rem] p-8 lg:p-10 neomorph-raised flex-grow flex flex-col">
      {/* Instructions Panel */}
      <div className="neomorph-inset rounded-2xl p-6 md:p-8 mb-6">
        <h1 className="font-headline text-2xl font-bold mb-2">Step Three: Choose Products</h1>
        <p className="text-on-surface-variant text-sm md:text-base leading-relaxed">
          Review the suggested items for your space based on your prompt and budget. You can add or remove items from different categories to customize the final generation. Ensure you stay within your allocated budget for optimal results.
        </p>
      </div>

      {/* Categories & Budget Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
        {/* Category Tabs */}
        <div className="flex gap-4 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
          {Object.keys(productData).map((category) => {
            const isCatActive = activeCategory === category;
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                  isCatActive ? "neomorph-inset text-primary" : "neomorph-raised text-on-surface-variant hover:text-primary"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Budget Indicator */}
        <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
          <div className="flex justify-between text-xs font-semibold text-on-surface-variant">
            <span>Budget</span>
            <span>${currentSpent.toLocaleString()} / ${baseBudget.toLocaleString()}</span>
          </div>
          <div className="h-3 w-full neomorph-inset rounded-full overflow-hidden relative">
            <div
              className="absolute top-0 left-0 h-full bg-primary rounded-full shadow-[inset_-2px_0px_4px_rgba(0,0,0,0.2)] transition-all duration-300"
              style={{ width: `${percent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow mb-8">
        {productData[activeCategory].map((product) => {
          const isAdded = addedProducts.includes(product.id);
          return (
            <div
              key={product.id}
              className={`neomorph-raised rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 ${
                isAdded ? "ring-2 ring-primary/20 bg-surface-bright/20" : ""
              }`}
            >
              <div className="relative w-full h-48 rounded-xl overflow-hidden neomorph-inset p-2 bg-background">
                <img alt={product.title} className="w-full h-full object-cover rounded-lg" src={product.img} />
                <button
                  onClick={() => toggleProduct(product.id)}
                  className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 z-10 ${
                    isAdded ? "bg-primary text-white shadow-md" : "bg-background text-primary neomorph-raised hover:text-primary-variant"
                  }`}
                >
                  {isAdded ? (
                    <span className="font-bold text-lg leading-none">-</span>
                  ) : (
                    <Icon name="add" size={16} />
                  )}
                </button>
              </div>
              <div className="flex flex-col flex-grow">
                <h3 className="font-headline font-bold text-lg mb-1 text-on-surface">{product.title}</h3>
                <p className="text-sm text-on-surface-variant line-clamp-2 flex-grow">{product.desc}</p>
                <p className="font-bold text-primary mt-2 text-base">{product.price}</p>
              </div>
              <button className="w-full py-2.5 rounded-xl neomorph-raised text-sm font-semibold text-on-surface hover:text-primary active:neomorph-inset transition-all mt-auto">
                View Details
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom Navigation Actions */}
      <div className="flex justify-between items-center mt-auto pt-4 border-t border-outline-variant/20">
        <button
          onClick={() => setStep(2)}
          className="px-6 py-3 rounded-xl font-headline font-semibold text-on-surface-variant bg-background neomorph-raised hover:text-primary active:neomorph-inset transition-all flex items-center gap-2"
        >
          <Icon name="arrow_forward" size={16} className="rotate-180" />
          Go Back
        </button>
        <button
          onClick={() => setStep(4)}
          className="px-8 py-3 rounded-xl font-headline font-semibold text-primary bg-background neomorph-raised hover:text-primary-variant active:neomorph-inset transition-all flex items-center gap-2 group"
        >
          Next Step
          <Icon name="arrow_forward" size={16} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};

export default StepSelectProducts;
