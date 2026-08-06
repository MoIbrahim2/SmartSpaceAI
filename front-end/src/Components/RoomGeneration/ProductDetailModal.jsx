import { useTranslation } from "react-i18next";
import Icon from "../Icon";
import { parseProductDetails, getProductId, getExternalStoreUrl } from "../../utils/productUtils";
import { useCart } from "../../context/CartContext";

const ProductDetailModal = ({ product, isOpen, onClose, selectedQty = 0, isSelected, onToggleSelect, onIncrement, onDecrement, formatCurrency }) => {
  const { t } = useTranslation();
  const { addToCart } = useCart();

  if (!isOpen || !product) return null;

  const parsed = parseProductDetails(product, product.category);
  const title = parsed.title;
  const brand = parsed.brand;
  const price = parsed.price;
  const desc = parsed.description;
  const img = parsed.img;
  const externalUrl = getExternalStoreUrl(product);
  const isInternal = parsed.isInternal;

  const dimensions = parsed.dimensions;
  const attributes = parsed.attributes;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-background rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto neomorph-raised shadow-2xl relative border border-outline-variant/30 flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rtl:right-auto rtl:left-5 w-10 h-10 rounded-full neomorph-raised flex items-center justify-center text-on-surface-variant hover:text-primary transition-all z-10"
        >
          <Icon name="close" size={20} />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-full md:w-1/2 h-64 rounded-2xl overflow-hidden neomorph-inset p-3 bg-surface relative">
            <img
              src={img}
              alt={title}
              className="w-full h-full object-cover rounded-xl"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = parsed.fallbackImg;
              }}
            />
            {product.isRecommended && (
              <span className="absolute top-5 left-5 rtl:left-auto rtl:right-5 px-3 py-1 rounded-full bg-amber-500 text-stone-950 text-xs font-bold flex items-center gap-1 shadow-md">
                <Icon name="star" size={14} />
                Recommended
              </span>
            )}
          </div>

          <div className="w-full md:w-1/2 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-1 rounded-lg bg-surface-variant text-primary text-xs font-semibold uppercase tracking-wider">
                  {brand}
                </span>
                {isInternal ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                    SmartSpace Seller Product
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-bold border border-sky-500/30">
                    Live Scraped
                  </span>
                )}
              </div>
              <h2 className="font-headline text-2xl font-bold text-on-surface mt-2 leading-tight">
                {title}
              </h2>
              <p className="font-bold text-2xl text-primary mt-2">
                {formatCurrency ? formatCurrency(price) : `${price} EGP`}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/20">
              <div className="flex justify-between text-xs text-on-surface-variant">
                <span>Category</span>
                <span className="font-semibold text-on-surface capitalize">{product.category || "Furniture"}</span>
              </div>
              <div className="flex justify-between text-xs text-on-surface-variant">
                <span>Style</span>
                <span className="font-semibold text-on-surface">{attributes.style}</span>
              </div>
              <div className="flex justify-between text-xs text-on-surface-variant">
                <span>Material</span>
                <span className="font-semibold text-on-surface">{attributes.material}</span>
              </div>
              <div className="flex justify-between text-xs text-on-surface-variant">
                <span>Color</span>
                <span className="font-semibold text-on-surface">{attributes.color}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications & Dimensions */}
        <div className="neomorph-inset rounded-2xl p-5 flex flex-col gap-3">
          <h3 className="font-headline font-bold text-sm text-on-surface flex items-center gap-2">
            <Icon name="square_foot" size={18} className="text-primary" />
            Dimensions & Spatial Fit
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-background rounded-xl p-3 neomorph-raised">
              <span className="text-xs text-on-surface-variant block">Width</span>
              <span className="font-bold text-sm text-primary">{dimensions.width || 120} cm</span>
            </div>
            <div className="bg-background rounded-xl p-3 neomorph-raised">
              <span className="text-xs text-on-surface-variant block">Length / Depth</span>
              <span className="font-bold text-sm text-primary">{dimensions.length || dimensions.depth || 200} cm</span>
            </div>
            <div className="bg-background rounded-xl p-3 neomorph-raised">
              <span className="text-xs text-on-surface-variant block">Height</span>
              <span className="font-bold text-sm text-primary">{dimensions.height || 85} cm</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="font-headline font-bold text-sm text-on-surface mb-1">Description</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">{desc}</p>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-outline-variant/20">
          {externalUrl ? (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3.5 px-5 rounded-xl font-headline font-bold text-white bg-amber-600 hover:bg-amber-700 transition-all flex items-center justify-center gap-2 text-sm shadow-md"
            >
              <Icon name="open_in_new" size={18} />
              Buy from Store ({brand})
            </a>
          ) : isInternal && (
            <button
              onClick={() => {
                addToCart(product);
              }}
              className="flex-1 py-3.5 px-5 rounded-xl font-headline font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 text-sm shadow-md"
            >
              <Icon name="shopping_cart" size={18} />
              Add to SmartSpace Cart
            </button>
          )}

          {selectedQty > 0 ? (
            <div className="flex-1 flex items-center justify-between gap-3 p-2 rounded-xl bg-background border border-primary/30 neomorph-raised">
              <button
                onClick={() => onDecrement(parsed.id)}
                className="w-9 h-9 rounded-lg bg-surface-variant hover:bg-red-500 hover:text-white text-on-surface flex items-center justify-center font-bold transition-all"
                title="Decrease Quantity"
              >
                <Icon name="remove" size={16} />
              </button>

              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant">Quantity</span>
                <span className="font-headline font-black text-base text-primary">{selectedQty} Selected</span>
              </div>

              <button
                onClick={() => onIncrement(parsed.id)}
                className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center font-bold transition-all shadow-md hover:scale-105"
                title="Increase Quantity"
              >
                <Icon name="add" size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onToggleSelect(parsed.id);
              }}
              className="flex-1 py-3 px-6 rounded-xl font-headline font-semibold text-sm transition-all flex items-center justify-center gap-2 bg-primary text-white shadow-lg hover:bg-primary-variant"
            >
              <Icon name="check_circle" size={18} />
              Select for AI Render
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
