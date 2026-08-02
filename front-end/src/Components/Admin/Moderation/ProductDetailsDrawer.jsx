import { useState } from "react";
import Drawer from "../Shared/Drawer";
import StatusBadge from "../Shared/StatusBadge";
import { Sparkles, Check, X, Tag, Ruler, Box } from "lucide-react";

export default function ProductDetailsDrawer({ product, isOpen, onClose, onApprove, onReject }) {
  const [selectedImg, setSelectedImg] = useState(0);

  if (!product) return null;

  const images = product.images || [product.imageUrl];

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Product Inspection Details">
      <div className="space-y-6">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="h-64 w-full rounded-2xl overflow-hidden bg-surface border border-outline/10 neo-shadow">
            <img
              src={images[selectedImg] || product.imageUrl}
              alt={product.productTitle}
              className="h-full w-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImg(idx)}
                  className={`size-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    selectedImg === idx ? "border-primary ring-2 ring-primary/40" : "border-outline/20"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Basic Info */}
        <div className="rounded-2xl bg-surface p-5 border border-outline/10 neomorph-raised space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary uppercase">{product.category}</span>
            <StatusBadge status={product.status} />
          </div>
          <h4 className="font-extrabold text-lg text-on-surface">{product.productTitle}</h4>
          <p className="text-sm font-bold text-primary">{product.price}</p>
          <p className="text-xs text-on-surface-variant leading-relaxed pt-2 border-t border-outline/10">
            {product.description || "No description provided."}
          </p>
        </div>

        {/* AI Metrics Card */}
        <div className="rounded-2xl bg-surface p-5 border border-outline/10 neomorph-raised space-y-3">
          <h5 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant border-b border-outline/10 pb-2">
            AI Classification Analysis
          </h5>
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-on-surface-variant flex items-center gap-1.5 font-semibold">
              <Sparkles className="size-3.5 text-primary" /> AI Confidence Score:
            </span>
            <span className="font-extrabold text-emerald-600">{product.aiConfidence}</span>
          </div>
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-on-surface-variant font-semibold">Quality Index:</span>
            <span className="font-extrabold text-on-surface">{product.qualityScore}</span>
          </div>
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-on-surface-variant font-semibold">Seller Origin:</span>
            <span className="font-bold text-on-surface">{product.sellerName}</span>
          </div>
        </div>

        {/* Product Attributes */}
        <div className="rounded-2xl bg-surface p-5 border border-outline/10 neomorph-raised space-y-2 text-xs">
          <h5 className="font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline/10 pb-2">
            Specifications
          </h5>
          <div className="flex items-center gap-2 text-on-surface py-1">
            <Ruler className="size-3.5 text-primary shrink-0" />
            <span>Dimensions: {product.dimensions || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface py-1">
            <Box className="size-3.5 text-primary shrink-0" />
            <span>Material: {product.material || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface py-1">
            <Tag className="size-3.5 text-primary shrink-0" />
            <span>Style: {product.style || "Modern"}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => {
              onApprove(product.id);
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white neo-shadow hover:bg-emerald-700 transition-all"
          >
            <Check className="size-4" />
            <span>Approve Product</span>
          </button>
          <button
            onClick={() => {
              onReject(product.id);
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-error/10 px-4 py-3 text-xs font-bold text-error border border-error/20 hover:bg-error hover:text-white transition-all"
          >
            <X className="size-4" />
            <span>Reject Product</span>
          </button>
        </div>
      </div>
    </Drawer>
  );
}
