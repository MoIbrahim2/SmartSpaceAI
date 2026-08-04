import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Save, Sparkles } from "lucide-react";
import PageHeader from "../../Components/Admin/Shared/PageHeader";
import { getSellerProduct, createSellerProduct, updateSellerProduct } from "../../api/SellerApi";
import { useToast } from "../../Components/Admin/Shared/ToastContext";

export default function SellerProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [aiValidating, setAiValidating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    brand: "SmartSpace Seller",
    description: "",
    category: "Armchair",
    roomTypes: ["LIVING_ROOM"],
    styles: ["Modern"],
    materials: ["Wood"],
    colors: ["Teal"],
    price: "",
    currency: "EGP",
    width: "",
    height: "",
    length: "",
    quantity: 10,
    inStock: true,
    imageUrl: "",
  });

  useEffect(() => {
    if (isEdit) {
      async function loadProduct() {
        try {
          setLoading(true);
          const res = await getSellerProduct(id);
          const prod = res.data;
          if (prod) {
            setFormData({
              name: prod.basic?.name || "",
              sku: prod.basic?.sku || "",
              brand: prod.basic?.brand || "SmartSpace Seller",
              description: prod.basic?.description || "",
              category: prod.classification?.canonicalCategory || "Armchair",
              roomTypes: prod.classification?.roomTypes || ["LIVING_ROOM"],
              styles: prod.classification?.styles || ["Modern"],
              materials: prod.classification?.materials || ["Wood"],
              colors: prod.classification?.colors || ["Teal"],
              price: prod.pricing?.currentPrice || "",
              currency: prod.pricing?.currency || "EGP",
              width: prod.dimensions?.width || "",
              height: prod.dimensions?.height || "",
              length: prod.dimensions?.length || "",
              quantity: prod.availability?.quantity || 10,
              inStock: prod.availability?.inStock ?? true,
              imageUrl: prod.images?.[0]?.url || "",
            });
          } else {
            showToast("Product not found", "error");
            navigate("/seller/products");
          }
        } catch (error) {
          console.error("Error loading product:", error);
          showToast("Failed to load product details", "error");
        } finally {
          setLoading(false);
        }
      }
      loadProduct();
    }
  }, [id, isEdit, navigate, showToast]);

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name, value) => {
    setFormData((prev) => {
      const currentArr = prev[name];
      if (currentArr.includes(value)) {
        return { ...prev, [name]: currentArr.filter((item) => item !== value) };
      } else {
        return { ...prev, [name]: [...currentArr, value] };
      }
    });
  };

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simple validation (mirrors backend createProductSchema)
    if (!formData.name || !formData.price || !formData.imageUrl) {
      showToast("Please fill in name, price, and image URL", "warning");
      return;
    }
    if ((formData.description || "").trim().length < 10) {
      showToast("Please provide a product description (at least 10 characters)", "warning");
      return;
    }
    if (!formData.width || !formData.height || !formData.length) {
      showToast("Please provide length, width, and height (cm)", "warning");
      return;
    }

    const payload = {
      basic: {
        name: formData.name,
        sku: formData.sku || `SEL-${formData.category.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        brand: formData.brand,
        description: formData.description,
      },
      classification: {
        canonicalCategory: formData.category,
        roomTypes: formData.roomTypes,
        styles: formData.styles,
        materials: formData.materials,
        colors: formData.colors,
      },
      pricing: {
        currentPrice: parseFloat(formData.price),
        currency: formData.currency,
      },
      dimensions: {
        width: parseFloat(formData.width) || 0,
        height: parseFloat(formData.height) || 0,
        length: parseFloat(formData.length) || 0,
        dimensionUnit: "cm",
      },
      images: [
        { url: formData.imageUrl, isPrimary: true }
      ],
      availability: {
        inStock: formData.quantity > 0,
        quantity: parseInt(formData.quantity) || 0,
        stockStatus: formData.quantity > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
      }
    };

    try {
      setAiValidating(true);
      if (isEdit) {
        await updateSellerProduct(id, payload);
        showToast("Product listing updated successfully", "success");
      } else {
        await createSellerProduct(payload);
        showToast("New product created and queued for AI validation", "success");
      }
      navigate("/seller/products");
    } catch (error) {
      console.error("Submit error:", error);
      showToast("Error processing listing", "error");
    } finally {
      setAiValidating(false);
    }
  };

  const categories = [
    "Sofa", "Armchair", "Coffee Table", "Dining Table", "Chair", "Bookcase", "Bed", "Wardrobe", "Desk", "Cabinet"
  ];
  const roomOptions = ["LIVING_ROOM", "BEDROOM", "DINING_ROOM", "KITCHEN", "OFFICE"];
  const styleOptions = ["Modern", "Minimalist", "Scandinavian", "Mid-Century", "Industrial", "Bohemian", "Traditional"];
  const colorOptions = ["Black", "White", "Grey", "Natural Wood", "Teal", "Navy Blue", "Beige", "Brown"];
  const materialOptions = ["Wood", "Metal", "Glass", "Marble", "Velvet", "Fabric", "Leather"];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Page Header */}
      <PageHeader
        title={isEdit ? "Edit Product Listing" : "Add New Product"}
        description={isEdit ? "Update your product specification." : "Add a new product to your inventory."}
      >
        <Link
          to="/seller/products"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface border border-outline/20 font-bold text-sm transition-all"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Catalog</span>
        </Link>
      </PageHeader>

      {/* Progress Steps Header */}
      <div className="grid grid-cols-4 gap-2 bg-surface p-3 rounded-2xl border border-outline/10 neo-shadow">
        {[
          { step: 1, label: "Basic Details" },
          { step: 2, label: "Classification" },
          { step: 3, label: "Pricing & Size" },
          { step: 4, label: "Media Upload" },
        ].map((s) => (
          <div
            key={s.step}
            className={`flex flex-col items-center py-2.5 rounded-xl transition-all ${
              currentStep === s.step
                ? "bg-primary text-white neo-shadow font-bold"
                : currentStep > s.step
                ? "text-primary font-bold"
                : "text-on-surface-variant/40"
            }`}
          >
            <span className="text-xs md:text-sm">Step {s.step}</span>
            <span className="text-[10px] md:text-xs hidden sm:inline">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-surface p-6 rounded-2xl border border-outline/10 neo-shadow space-y-6">
        
        {/* STEP 1: BASIC DETAILS */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-on-surface border-b border-outline/10 pb-2">Step 1: Product Basics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleTextChange}
                  placeholder="e.g. Velvet Armchair"
                  className="w-full rounded-xl bg-background border border-outline/20 p-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant">SKU (Stock Keeping Unit)</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleTextChange}
                  placeholder="e.g. SEL-ARM-012"
                  className="w-full rounded-xl bg-background border border-outline/20 p-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant">Brand Partner</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleTextChange}
                  className="w-full rounded-xl bg-background border border-outline/20 p-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-on-surface-variant">Product Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleTextChange}
                rows={4}
                required
                minLength={10}
                placeholder="Write a descriptive summary of this product including features and quality details..."
                className="w-full rounded-xl bg-background border border-outline/20 p-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>
          </div>
        )}

        {/* STEP 2: CLASSIFICATION */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-on-surface border-b border-outline/10 pb-2">Step 2: Taxonomy & Tags</h3>
            
            {/* Category Select */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-on-surface-variant">Canonical Category *</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, category: cat }))}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all text-center ${
                      formData.category === cat
                        ? "bg-primary text-white border-primary neo-shadow"
                        : "bg-background text-on-surface-variant border-outline/20 hover:text-primary hover:bg-surface"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Room Types checkboxes */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface-variant block">Compatible Rooms *</label>
              <div className="flex flex-wrap gap-2">
                {roomOptions.map((room) => {
                  const isChecked = formData.roomTypes.includes(room);
                  return (
                    <button
                      key={room}
                      type="button"
                      onClick={() => handleCheckboxChange("roomTypes", room)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                        isChecked
                          ? "bg-primary/10 text-primary border-primary neo-shadow"
                          : "bg-background text-on-surface-variant border-outline/20"
                      }`}
                    >
                      {room.replace("_", " ")}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Attributes Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Styles */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant block">Styles</label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {styleOptions.map((st) => {
                    const isChecked = formData.styles.includes(st);
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleCheckboxChange("styles", st)}
                        className={`py-1.5 px-2.5 text-xs font-semibold rounded-lg border transition-all ${
                          isChecked
                            ? "bg-primary/20 text-primary border-primary"
                            : "bg-background text-on-surface-variant border-outline/10"
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Colors */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant block">Colors</label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {colorOptions.map((cl) => {
                    const isChecked = formData.colors.includes(cl);
                    return (
                      <button
                        key={cl}
                        type="button"
                        onClick={() => handleCheckboxChange("colors", cl)}
                        className={`py-1.5 px-2.5 text-xs font-semibold rounded-lg border transition-all ${
                          isChecked
                            ? "bg-primary/20 text-primary border-primary"
                            : "bg-background text-on-surface-variant border-outline/10"
                        }`}
                      >
                        {cl}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Materials */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant block">Materials</label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {materialOptions.map((mt) => {
                    const isChecked = formData.materials.includes(mt);
                    return (
                      <button
                        key={mt}
                        type="button"
                        onClick={() => handleCheckboxChange("materials", mt)}
                        className={`py-1.5 px-2.5 text-xs font-semibold rounded-lg border transition-all ${
                          isChecked
                            ? "bg-primary/20 text-primary border-primary"
                            : "bg-background text-on-surface-variant border-outline/10"
                        }`}
                      >
                        {mt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PRICING & DIMENSIONS */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-on-surface border-b border-outline/10 pb-2">Step 3: Price & Geometry</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant">Price *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleTextChange}
                  placeholder="e.g. 4500"
                  className="w-full rounded-xl bg-background border border-outline/20 p-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant">Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleTextChange}
                  className="w-full rounded-xl bg-background border border-outline/20 p-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                >
                  <option value="EGP">EGP - Egyptian Pound</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant">Stock Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleTextChange}
                  className="w-full rounded-xl bg-background border border-outline/20 p-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant">Length (cm) *</label>
                <input
                  type="number"
                  name="length"
                  value={formData.length}
                  onChange={handleTextChange}
                  placeholder="e.g. 90"
                  className="w-full rounded-xl bg-background border border-outline/20 p-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant">Width (cm) *</label>
                <input
                  type="number"
                  name="width"
                  value={formData.width}
                  onChange={handleTextChange}
                  placeholder="e.g. 80"
                  className="w-full rounded-xl bg-background border border-outline/20 p-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant">Height (cm) *</label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleTextChange}
                  placeholder="e.g. 75"
                  className="w-full rounded-xl bg-background border border-outline/20 p-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: MEDIA UPLOADS */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-on-surface border-b border-outline/10 pb-2">Step 4: Product Image</h3>
            
            <div className="space-y-1">
              <label className="text-sm font-bold text-on-surface-variant">Image URL *</label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleTextChange}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full rounded-xl bg-background border border-outline/20 p-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                required
              />
            </div>

            {formData.imageUrl && (
              <div className="mt-4 flex flex-col items-center justify-center p-4 border border-outline/10 bg-background rounded-2xl neo-inset max-w-md mx-auto">
                <p className="text-xs text-on-surface-variant mb-2 font-bold">Image Preview</p>
                <img
                  src={formData.imageUrl}
                  alt="Product preview"
                  className="max-h-60 rounded-xl object-contain border border-outline/25 bg-surface"
                  onError={(e) => {
                    e.target.src = "/img/no-product-image.svg";
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Navigations Buttons */}
        <div className="flex items-center justify-between border-t border-outline/10 pt-4">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border border-outline/20 text-sm font-bold transition-all ${
              currentStep === 1
                ? "opacity-40 cursor-not-allowed"
                : "text-on-surface hover:bg-background"
            }`}
          >
            <ArrowLeft className="size-4" />
            <span>Previous</span>
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              key="wizard-next"
              onClick={nextStep}
              className="bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-bold neo-shadow hover:bg-primary/95 flex items-center gap-2 transition-all"
            >
              <span>Next</span>
              <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              key="wizard-submit"
              onClick={handleSubmit}
              className="bg-emerald-600 text-white rounded-xl px-6 py-2.5 text-sm font-bold neo-shadow hover:bg-emerald-700 flex items-center gap-2 transition-all"
            >
              <Save className="size-4" />
              <span>{isEdit ? "Update Listing" : "Submit Listing"}</span>
            </button>
          )}
        </div>
      </form>

      {/* AI Validation Progress Modal */}
      {aiValidating && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-bright rounded-3xl p-8 max-w-md w-full neo-shadow border border-outline/10 text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent flex items-center justify-center" />
                <Sparkles className="size-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-lg font-extrabold text-on-surface">SmartSpace AI Engine</h4>
              <p className="text-xs text-on-surface-variant font-medium">
                Submitting your listing for AI validation against catalog design systems...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
