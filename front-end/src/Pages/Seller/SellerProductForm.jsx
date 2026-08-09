import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Save, Sparkles, Upload, Image as ImageIcon, Trash2, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../Components/Admin/Shared/PageHeader";
import { getSellerProduct, createSellerProduct, updateSellerProduct } from "../../api/SellerApi";
import { useToast } from "../../Components/Admin/Shared/ToastContext";
import { normalizeImageUrl } from "../../utils/productUtils";

export default function SellerProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [aiValidating, setAiValidating] = useState(false);

  // Image file upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

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
            });

            const existingImage = prod.images?.[0]?.url || "";
            if (existingImage) {
              setPreviewUrl(existingImage);
            }
          } else {
            showToast(t("seller.productForm.notFound"), "error");
            navigate("/seller/products");
          }
        } catch (error) {
          console.error("Error loading product:", error);
          showToast(t("seller.productForm.loadError"), "error");
        } finally {
          setLoading(false);
        }
      }
      loadProduct();
    }
  }, [id, isEdit, navigate, showToast, t]);

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

  const validateAndSelectFile = (file) => {
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      showToast(t("seller.productForm.invalidFileType"), "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast(t("seller.productForm.fileSizeExceeded"), "error");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSelectFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSelectFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl("");
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const resolveImageDisplayUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("blob:") || url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
      return url;
    }
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    return `http://localhost:5000${cleanPath}`;
  };

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.price) {
      showToast(t("seller.productForm.fillRequiredWarning"), "warning");
      return;
    }

    if (!selectedFile && !previewUrl) {
      showToast(t("seller.productForm.fillRequiredWarning"), "warning");
      return;
    }

    if ((formData.description || "").trim().length < 10) {
      showToast(t("seller.productForm.descLengthWarning"), "warning");
      return;
    }

    if (!formData.width || !formData.height || !formData.length) {
      showToast(t("seller.productForm.dimensionsWarning"), "warning");
      return;
    }

    const payload = new FormData();
    
    payload.append("basic", JSON.stringify({
      name: formData.name,
      sku: formData.sku || `SEL-${formData.category.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      brand: formData.brand,
      description: formData.description,
    }));

    payload.append("classification", JSON.stringify({
      canonicalCategory: formData.category,
      roomTypes: formData.roomTypes,
      styles: formData.styles,
      materials: formData.materials,
      colors: formData.colors,
    }));

    payload.append("pricing", JSON.stringify({
      currentPrice: parseFloat(formData.price),
      currency: formData.currency,
    }));

    payload.append("dimensions", JSON.stringify({
      width: parseFloat(formData.width) || 0,
      height: parseFloat(formData.height) || 0,
      length: parseFloat(formData.length) || 0,
      dimensionUnit: "cm",
    }));

    payload.append("availability", JSON.stringify({
      inStock: formData.quantity > 0,
      quantity: parseInt(formData.quantity) || 0,
      stockStatus: formData.quantity > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
    }));

    if (selectedFile) {
      payload.append("image", selectedFile);
    }

    try {
      setAiValidating(true);
      if (isEdit) {
        await updateSellerProduct(id, payload);
        showToast(t("seller.productForm.updatedSuccess"), "success");
      } else {
        await createSellerProduct(payload);
        showToast(t("seller.productForm.createdSuccess"), "success");
      }
      navigate("/seller/products");
    } catch (error) {
      console.error("Submit error:", error);
      const errorMessage = error?.response?.data?.message || t("seller.productForm.submitError");
      showToast(errorMessage, "error");
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
        title={isEdit ? t("seller.productForm.titleEdit") : t("seller.productForm.titleCreate")}
        description={isEdit ? t("seller.productForm.descEdit") : t("seller.productForm.descCreate")}
      >
        <Link
          to="/seller/products"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface border border-outline/20 font-bold text-sm transition-all"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
          <span>{t("seller.productForm.backToCatalog")}</span>
        </Link>
      </PageHeader>

      {/* Progress Steps Header */}
      <div className="grid grid-cols-4 gap-2 bg-surface p-3 rounded-2xl border border-outline/10 neo-shadow">
        {[
          { step: 1, label: t("seller.productForm.step1Title") },
          { step: 2, label: t("seller.productForm.step2Title") },
          { step: 3, label: t("seller.productForm.step3Title") },
          { step: 4, label: t("seller.productForm.step4Title") },
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
            <h3 className="text-lg font-bold text-on-surface border-b border-outline/10 pb-2">{t("seller.productForm.step1Heading")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant">{t("seller.productForm.productName")}</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleTextChange}
                  placeholder={t("seller.productForm.productNamePlaceholder")}
                  className="w-full rounded-xl bg-background border border-outline/20 p-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant">{t("seller.productForm.skuLabel")}</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleTextChange}
                  placeholder={t("seller.productForm.skuPlaceholder")}
                  className="w-full rounded-xl bg-background border border-outline/20 p-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant">{t("seller.productForm.brandPartner")}</label>
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
              <label className="text-sm font-bold text-on-surface-variant">{t("seller.productForm.descriptionLabel")}</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleTextChange}
                rows={4}
                required
                minLength={10}
                placeholder={t("seller.productForm.descriptionPlaceholder")}
                className="w-full rounded-xl bg-background border border-outline/20 p-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>
          </div>
        )}

        {/* STEP 2: CLASSIFICATION */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-on-surface border-b border-outline/10 pb-2">{t("seller.productForm.step2Heading")}</h3>
            
            {/* Category Select */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-on-surface-variant">{t("seller.productForm.canonicalCategory")}</label>
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
                    {t(`seller.categories.${cat}`, { defaultValue: cat })}
                  </button>
                ))}
              </div>
            </div>

            {/* Room Types checkboxes */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface-variant block">{t("seller.productForm.compatibleRooms")}</label>
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
                      {t(`seller.rooms.${room}`, { defaultValue: room.replace("_", " ") })}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Attributes Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Styles */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant block">{t("seller.productForm.styles")}</label>
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
                        {t(`seller.styles.${st}`, { defaultValue: st })}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Colors */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant block">{t("seller.productForm.colors")}</label>
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
                        {t(`seller.colors.${cl}`, { defaultValue: cl })}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Materials */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant block">{t("seller.productForm.materials")}</label>
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
                        {t(`seller.materials.${mt}`, { defaultValue: mt })}
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
            <h3 className="text-lg font-bold text-on-surface border-b border-outline/10 pb-2">{t("seller.productForm.step3Heading")}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant">{t("seller.productForm.priceLabel")}</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleTextChange}
                  placeholder={t("seller.productForm.pricePlaceholder")}
                  className="w-full rounded-xl bg-background border border-outline/20 p-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant">{t("seller.productForm.currencyLabel")}</label>
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
                <label className="text-sm font-bold text-on-surface-variant">{t("seller.productForm.stockQuantity")}</label>
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
                <label className="text-sm font-bold text-on-surface-variant">{t("seller.productForm.lengthLabel")}</label>
                <input
                  type="number"
                  name="length"
                  value={formData.length}
                  onChange={handleTextChange}
                  placeholder={t("seller.productForm.lengthPlaceholder")}
                  className="w-full rounded-xl bg-background border border-outline/20 p-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant">{t("seller.productForm.widthLabel")}</label>
                <input
                  type="number"
                  name="width"
                  value={formData.width}
                  onChange={handleTextChange}
                  placeholder={t("seller.productForm.widthPlaceholder")}
                  className="w-full rounded-xl bg-background border border-outline/20 p-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant">{t("seller.productForm.heightLabel")}</label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleTextChange}
                  placeholder={t("seller.productForm.heightPlaceholder")}
                  className="w-full rounded-xl bg-background border border-outline/20 p-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: MEDIA UPLOADS */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-on-surface border-b border-outline/10 pb-2">{t("seller.productForm.step4Heading")}</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface-variant block">
                {t("seller.productForm.imageUploadLabel")}
              </label>

              {/* Drag and Drop Zone */}
              {!previewUrl ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                    isDragOver
                      ? "border-primary bg-primary/5 scale-[1.01]"
                      : "border-outline/30 bg-background hover:border-primary/50 hover:bg-surface"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="p-4 rounded-full bg-primary/10 text-primary mb-3">
                    <Upload className="size-8" />
                  </div>
                  <p className="text-sm font-bold text-on-surface mb-1">
                    {t("seller.productForm.imageUploadHint")}
                  </p>
                  <p className="text-xs text-on-surface-variant/60 font-medium">
                    JPEG, PNG, WebP — Max 5MB
                  </p>
                </div>
              ) : (
                /* Preview Container */
                <div className="relative flex flex-col md:flex-row items-center gap-6 p-5 border border-outline/15 bg-background rounded-2xl neo-inset">
                  <div className="relative shrink-0 overflow-hidden rounded-xl border border-outline/20 bg-surface shadow-sm max-w-[240px]">
                    <img
                      src={normalizeImageUrl(previewUrl)}
                      alt="Product Preview"
                      className="h-48 w-48 object-cover rounded-xl"
                      onError={(e) => {
                        e.target.src = "/img/no-product-image.svg";
                      }}
                    />
                  </div>

                  <div className="flex-1 space-y-3 text-center md:text-start">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold">
                      <CheckCircle2 className="size-4" />
                      <span>Ready for Submission</span>
                    </div>

                    {selectedFile ? (
                      <div className="space-y-1">
                        <p className="text-sm font-extrabold text-on-surface truncate max-w-xs">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-on-surface-variant font-medium">
                          Size: {formatFileSize(selectedFile.size)} • {selectedFile.type}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm font-extrabold text-on-surface">
                          Current Catalog Image
                        </p>
                        <p className="text-xs text-on-surface-variant font-medium">
                          File currently associated with this product
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                      <label className="relative inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-outline/20 text-on-surface font-bold text-xs hover:bg-background cursor-pointer transition-all shadow-sm">
                        <Upload className="size-3.5" />
                        <span>{t("seller.productForm.changeImage")}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-600 border border-red-500/20 font-bold text-xs hover:bg-red-500/20 transition-all"
                      >
                        <Trash2 className="size-3.5" />
                        <span>{t("seller.productForm.removeImage")}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
            <ArrowLeft className="size-4 rtl:rotate-180" />
            <span>{t("seller.productForm.previous")}</span>
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              key="wizard-next"
              onClick={nextStep}
              className="bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-bold neo-shadow hover:bg-primary/95 flex items-center gap-2 transition-all"
            >
              <span>{t("seller.productForm.next")}</span>
              <ArrowRight className="size-4 rtl:rotate-180" />
            </button>
          ) : (
            <button
              type="button"
              key="wizard-submit"
              onClick={handleSubmit}
              className="bg-emerald-600 text-white rounded-xl px-6 py-2.5 text-sm font-bold neo-shadow hover:bg-emerald-700 flex items-center gap-2 transition-all"
            >
              <Save className="size-4" />
              <span>{isEdit ? t("seller.productForm.updateListing") : t("seller.productForm.submitListing")}</span>
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
              <h4 className="text-lg font-extrabold text-on-surface">{t("seller.productForm.aiEngineTitle")}</h4>
              <p className="text-xs text-on-surface-variant font-medium">
                {t("seller.productForm.aiEngineDesc")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
