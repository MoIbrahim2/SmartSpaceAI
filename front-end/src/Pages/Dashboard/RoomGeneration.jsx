import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "../../Components/Icon";
import {
  validateRoomLayout,
  getRoomLayout,
  getRoomById,
  extractPreferences,
  saveSelectedProducts,
  generateRoomImage,
  getLatestGenerationForRoom,
  saveResolution
} from "../../api";
import { getProductId } from "../../utils/productUtils";

// Import step sub-components
import Stepper from "../../Components/RoomGeneration/Stepper";
import StepSelectType from "../../Components/RoomGeneration/StepSelectType";
import StepRoomDetails from "../../Components/RoomGeneration/StepRoomDetails";
import StepDesignInstructions from "../../Components/RoomGeneration/StepDesignInstructions";
import StepSelectProducts from "../../Components/RoomGeneration/StepSelectProducts";
import StepRoomGenerationResult from "../../Components/RoomGeneration/StepRoomGenerationResult";
import ValidationOverlay from "../../Components/RoomGeneration/ValidationOverlay";

const preferenceMessages = [
  "Analyzing your design description…",
  "Identifying style preferences…",
  "Extracting color and material choices…",
  "Understanding furniture preferences…",
  "Finalizing your design profile…",
];

const RoomGeneration = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const urlRoomId = searchParams.get("roomId") || "";

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [productData, setProductData] = useState({});
  const [categoryCounts, setCategoryCounts] = useState({});
  const [activeCategory, setActiveCategory] = useState("");
  const [addedProducts, setAddedProducts] = useState([]);

  // AI Generation state
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageResult, setGeneratedImageResult] = useState(null);
  const [resolution, setResolution] = useState("1080p");

  // Validation state
  const [validating, setValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState("none");
  const [savedLayout, setSavedLayout] = useState(null);

  // Preference extraction state
  const [extracting, setExtracting] = useState(false);
  const [extractedPreferences, setExtractedPreferences] = useState(null);
  const [generationId, setGenerationId] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const validatedSnapshotRef = useRef(null);

  const [form, setForm] = useState({
    roomId: urlRoomId,
    generationType: "CREATE_FROM_SCRATCH",
    prompt: "",
    settings: JSON.stringify({
      creativity: 80,
      preserveLayout: true,
      colorPalette: "light-wood-white-grey",
      lighting: "bright-natural",
      quality: "high",
      aspectRatio: "16:9",
    }),
    images: null,
    length: "400",
    width: "350",
    height: "280",
    budget: "75000",
    _rejectionReason: "",
  });

  useEffect(() => {
    if (!urlRoomId) return;

    const loadExistingLayout = async () => {
      try {
        const { data } = await getRoomLayout(urlRoomId);
        if (data.success && data.data.roomLayout) {
          const layout = data.data.roomLayout;
          setSavedLayout(layout);
          setValidationStatus("valid");

          setForm((prev) => ({
            ...prev,
            roomId: urlRoomId,
            length: String(layout.length_cm),
            width: String(layout.width_cm),
            height: String(layout.height_cm),
            budget: String(layout.budget_egp),
            images: null,
          }));

          validatedSnapshotRef.current = {
            length: String(layout.length_cm),
            width: String(layout.width_cm),
            height: String(layout.height_cm),
            budget: String(layout.budget_egp),
            hasNewImage: false,
          };
        }
      } catch (err) {
        console.log("No existing layout for room:", urlRoomId);
      }
    };

    const loadRoomData = async () => {
      try {
        const { data } = await getRoomById(urlRoomId);
        if (data.success && data.data.room) {
          setRoomData(data.data.room);
        }
      } catch (err) {
        console.log("Could not load room data:", urlRoomId);
      }
    };

    const loadExistingGeneration = async () => {
      try {
        const { data } = await getLatestGenerationForRoom(urlRoomId);
        if (data.success && data.data.generation) {
          const gen = data.data.generation;
          setGenerationId(gen._id);
          if (gen.resolution) {
            setResolution(typeof gen.resolution === "string" ? gen.resolution : (gen.resolution.resolution || "1080p"));
          }
          if (gen.userPrompt) {
            setForm((prev) => ({ ...prev, prompt: gen.userPrompt }));
          }
          if (gen.generatedImage) {
            setGeneratedImageResult(gen.generatedImage);
          }
          if (gen.extractedPreferences) {
            setExtractedPreferences(gen.extractedPreferences);
          }

          // Restore products if saved
          if (gen.selectedProducts && gen.selectedProducts.length > 0) {
            const restoredProductIds = [];
            const restoredProductData = {};
            const restoredCounts = {};

            gen.selectedProducts.forEach((sp) => {
              const cat = sp.category || "Furniture";
              const pData = sp.productData || sp;
              const pId = getProductId(pData) || String(sp.productId);

              if (!restoredProductData[cat]) restoredProductData[cat] = [];
              restoredProductData[cat].push(pData);

              const qty = sp.quantity || 1;
              for (let i = 0; i < qty; i++) {
                restoredProductIds.push(pId);
              }
              restoredCounts[cat] = (restoredCounts[cat] || 0) + qty;
            });

            setProductData(restoredProductData);
            setCategoryCounts(restoredCounts);
            setAddedProducts(restoredProductIds);
            const firstCat = Object.keys(restoredCounts)[0] || "sofa";
            setActiveCategory(firstCat);
          }
        }
      } catch (err) {
        console.log("No existing generation for room:", urlRoomId);
      }
    };

    loadExistingLayout();
    loadRoomData();
    loadExistingGeneration();
  }, [urlRoomId]);

  const hasFormChanged = useCallback(() => {
    if (!validatedSnapshotRef.current) return true;
    const snap = validatedSnapshotRef.current;
    if (form.length !== snap.length) return true;
    if (form.width !== snap.width) return true;
    if (form.height !== snap.height) return true;
    if (form.budget !== snap.budget) return true;
    if (form.images) return true;
    return false;
  }, [form]);

  const handleValidateAndNext = async () => {
    if (validationStatus === "valid" && !hasFormChanged()) {
      setStep(2);
      return;
    }

    if (!form.length || !form.width || !form.height || !form.budget) {
      setError(t("dashboard.fillAllFields") || "Please fill in all dimensions and budget.");
      return;
    }

    if (!form.images && !savedLayout?.room_image_path) {
      setError(t("dashboard.imageRequired") || "Please upload a room image.");
      return;
    }

    if (!hasFormChanged() && validationStatus === "valid") {
      setStep(2);
      return;
    }

    if (!form.images && hasFormChanged()) {
      setError(t("dashboard.reuploadImage") || "Please re-upload a room image since you changed details.");
      return;
    }

    setError("");
    setValidating(true);
    setValidationStatus("none");

    try {
      const formData = new FormData();
      formData.append("roomId", form.roomId || urlRoomId);
      formData.append("length_cm", form.length);
      formData.append("width_cm", form.width);
      formData.append("height_cm", form.height);
      formData.append("budget_egp", form.budget);
      formData.append("generationType", form.generationType);

      if (form.images && form.images.length > 0) {
        formData.append("image", form.images[0]);
      }

      const { data } = await validateRoomLayout(formData);

      if (data.success) {
        setSavedLayout(data.data.roomLayout);
        setValidationStatus("valid");

        validatedSnapshotRef.current = {
          length: form.length,
          width: form.width,
          height: form.height,
          budget: form.budget,
          hasNewImage: false,
        };

        setForm((prev) => ({ ...prev, images: null, _rejectionReason: "" }));
        setStep(2);
      }
    } catch (err) {
      console.error("Validation error:", err);
      const response = err.response?.data;
      if (response && response.success === false) {
        const reason =
          response.message ||
          response.errors?.[0]?.rejection_reason ||
          "Image validation failed.";
        setValidationStatus("rejected");
        setForm((prev) => ({ ...prev, _rejectionReason: reason }));
      } else {
        setError(
          `${t("dashboard.validationError") || "Validation failed. Please try again."} (${err.message})`
        );
      }
    } finally {
      setValidating(false);
    }
  };

  const handleExtractPreferences = async () => {
    if (!form.prompt || form.prompt.trim().length < 10) {
      setError(t("dashboard.promptRequired") || "Please describe your design preferences (at least 10 characters).");
      return;
    }

    const roomType = roomData?.roomType || "living_room";

    setError("");
    setExtracting(true);

    try {
      const payload = {
        roomType,
        budget: parseFloat(form.budget) || 75000,
        length: parseFloat(form.length) || 400,
        width: parseFloat(form.width) || 350,
        height: parseFloat(form.height) || 280,
        prompt: form.prompt.trim(),
        generationType: form.generationType || "CREATE_FROM_SCRATCH",
      };

      if (form.roomId || urlRoomId) payload.roomId = form.roomId || urlRoomId;
      if (generationId) payload.generationId = generationId;

      const { data } = await extractPreferences(payload);

      if (data.success) {
        const generation = data.data.generation;
        setExtractedPreferences(generation.extractedPreferences);
        setGenerationId(generation._id);

        const newProductData = {};
        const counts = {};

        // Parse extracted category preferences array or object for category counts
        const catPrefs = generation.extractedPreferences?.categoryPreferences;
        if (Array.isArray(catPrefs)) {
          catPrefs.forEach((item) => {
            if (item.category && item.included !== false && item.excluded !== true) {
              counts[item.category] = item.quantity || 1;
            }
          });
        } else if (catPrefs && typeof catPrefs === "object") {
          Object.keys(catPrefs).forEach((cat) => {
            counts[cat] = catPrefs[cat].quantity || 1;
          });
        }

        // Process real recommendation engine results if returned
        const recResult = generation.recommendationResult || data.data.recommendationResult;
        const goldenIds = [];

        if (recResult && Array.isArray(recResult.categories) && recResult.categories.length > 0) {
          recResult.categories.forEach((catObj) => {
            const catName = catObj.category;
            const recs = (catObj.recommendations || (catObj.recommendation ? [catObj.recommendation] : [])).filter(Boolean);

            // Mark top recommendations explicitly
            recs.forEach((r) => {
              r.isRecommended = true;
            });

            const alts = [
              ...(catObj.alternatives?.cheaper || []),
              ...(catObj.alternatives?.balanced || []),
              ...(catObj.alternatives?.premium || []),
            ];

            const combined = [...recs];
            alts.forEach((alt) => {
              const altId = getProductId(alt);
              if (altId && !combined.some((item) => getProductId(item) === altId)) {
                combined.push(alt);
              }
            });

            newProductData[catName] = combined;

            // Only categories explicitly requested in prompt are required (reqCount > 0)
            const isRequired = catObj.isUserRequested === true || (catObj.role && catObj.role !== 'OPTIONAL');
            const reqCount = isRequired ? (catObj.quantity || counts[catName] || 1) : 0;
            counts[catName] = reqCount;

            // Auto-select Golden Cards (top recommended items matching category requirement)
            if (reqCount > 0) {
              const pool = recs.length > 0 ? recs : combined;
              for (let i = 0; i < reqCount; i++) {
                if (pool.length > 0) {
                  const item = pool[i % pool.length];
                  const pId = getProductId(item);
                  if (pId) goldenIds.push(pId);
                }
              }
            }
          });

          setProductData(newProductData);
          setCategoryCounts(counts);
          setAddedProducts(goldenIds);

          const firstCat = Object.keys(counts).find((c) => counts[c] > 0) || recResult.categories[0]?.category || Object.keys(newProductData)[0] || "sofa";
          setActiveCategory(firstCat);
        } else {
          throw new Error("The recommendation engine did not return any products for your request. Please try refining your prompt.");
        }

        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setStep(3);
        }, 1200);
      }
    } catch (err) {
      console.error("Preference extraction error:", err);
      setError(err.response?.data?.message || "Failed to extract preferences.");
    } finally {
      setExtracting(false);
    }
  };

  const incrementProduct = (id) => {
    const strId = String(id);
    setAddedProducts((prev) => [...prev, strId]);
  };

  const decrementProduct = (id) => {
    const strId = String(id);
    setAddedProducts((prev) => {
      const idx = prev.indexOf(strId);
      if (idx > -1) {
        const copy = [...prev];
        copy.splice(idx, 1);
        return copy;
      }
      return prev;
    });
  };

  const toggleProduct = (id, category, reqCount = 1) => {
    const strId = String(id);
    const count = addedProducts.filter((pId) => pId === strId).length;

    if (count > 0) {
      setAddedProducts((prev) => prev.filter((pId) => pId !== strId));
    } else {
      setAddedProducts((prev) => [...prev, strId]);
    }
  };

  /**
   * Move from Step 3 to Step 4: Persist selected products to MongoDB
   */
  const handleProceedToStep4 = async () => {
    if (!generationId) {
      setStep(4);
      return;
    }

    try {
      setLoading(true);
      // Format selected products list for API payload with quantities
      const allProdsList = Object.values(productData).flat();
      const countsMap = {};
      addedProducts.forEach((id) => {
        countsMap[id] = (countsMap[id] || 0) + 1;
      });

      const selectedProductObjects = [];
      const seenIds = new Set();
      allProdsList.forEach((p) => {
        const pId = getProductId(p);
        if (countsMap[pId] && !seenIds.has(pId)) {
          seenIds.add(pId);
          selectedProductObjects.push({
            category: p.category || p.categoryName || activeCategory || "Furniture",
            productId: pId,
            productData: p,
            isRecommended: !!p.isRecommended,
            price: p.pricing?.currentPrice || p.price || p.numericPrice || 0,
            quantity: countsMap[pId],
          });
        }
      });

      await saveSelectedProducts(generationId, {
        selectedProducts: selectedProductObjects,
        roomLayoutData: {
          length_cm: parseFloat(form.length),
          width_cm: parseFloat(form.width),
          height_cm: parseFloat(form.height),
          budget_egp: parseFloat(form.budget),
          room_image_path: savedLayout?.room_image_path || savedLayout?.imagePath,
        },
      });

      setStep(4);
    } catch (err) {
      console.error("Save selected products error:", err);
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Trigger AI room composite rendering
   */
  const triggerImageGeneration = async (targetResolution) => {
    if (!generationId) return;

    const resToUse = targetResolution || resolution;
    setIsGeneratingImage(true);
    try {
      await saveResolution(generationId, { resolution: resToUse });
      const { data } = await generateRoomImage(generationId, { resolution: resToUse });
      if (data.success && data.data.generation?.generatedImage) {
        setGeneratedImageResult(data.data.generation.generatedImage);
      }
    } catch (err) {
      console.error("Image generation API error:", err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleFinishRoomGeneration = () => {
    if (urlRoomId) {
      navigate(`/dashboard/rooms/${urlRoomId}`);
    } else {
      navigate("/dashboard");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setForm((p) => ({ ...p, images: e.target.files }));
      if (validationStatus === "valid") setValidationStatus("none");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setForm((p) => ({ ...p, images: e.dataTransfer.files }));
      if (validationStatus === "valid") setValidationStatus("none");
    }
  };

  // Spent calculations for Step 3
  const baseBudget = form.budget ? parseFloat(form.budget) : 75000;
  const allProductsList = Object.values(productData).flat();
  const currentSpent = addedProducts.reduce((sum, pId) => {
    const foundProduct = allProductsList.find((p) => getProductId(p) === pId);
    if (!foundProduct) return sum;
    const price = foundProduct.pricing?.currentPrice || foundProduct.price || foundProduct.numericPrice || 0;
    return sum + price;
  }, 0);

  const percent = baseBudget > 0 ? Math.round((currentSpent / baseBudget) * 100) : 0;

  // Gather list of selected product objects for step 4 summary
  const addedSet = new Set(addedProducts);
  const selectedProductObjs = allProductsList.filter((p) => addedSet.has(getProductId(p)));

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface pb-24 md:pb-0">
      {/* Validation Loading Overlay */}
      {validating && <ValidationOverlay />}

      {/* Preference Extraction Loading Overlay */}
      {extracting && (
        <ValidationOverlay
          title={t("dashboard.extractingPreferences") || "Understanding your design preferences"}
          messages={preferenceMessages}
          fallbackMessages={preferenceMessages}
          subTextKey="dashboard.extractionHint"
          subTextFallback="SmartSpaceAI is analyzing your request and matching furniture recommendations."
        />
      )}

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="flex flex-col items-center gap-4 rounded-[2rem] bg-background p-10 neomorph-raised max-w-sm w-[85%] mx-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
              <Icon name="check_circle" size={40} />
            </div>
            <h3 className="font-headline text-xl font-bold text-on-surface">
              {t("dashboard.preferencesExtracted") || "Recommendations Ready!"}
            </h3>
            <p className="text-sm text-on-surface-variant">
              We generated top recommended products for your room. Proceeding to product selection.
            </p>
          </div>
        </div>
      )}

      {step === 0 ? (
        <StepSelectType setForm={setForm} setStep={setStep} error={error} />
      ) : (
        <main className="flex-grow flex flex-col md:flex-row gap-8 max-w-7xl mx-auto w-full p-6 md:p-8 lg:p-10">
          <Stepper currentStep={step} />

          <section className="flex-grow flex flex-col gap-6 w-full md:w-3/4 lg:w-4/5">
            {error && (step === 1 || step === 2) && (
              <div className="rounded-xl bg-error/10 px-5 py-3 text-sm font-medium text-error">
                {error}
              </div>
            )}

            {step === 1 && (
              <StepRoomDetails
                form={form}
                setForm={setForm}
                setStep={setStep}
                handleFileChange={handleFileChange}
                handleDrop={handleDrop}
                validationStatus={validationStatus}
                savedLayout={savedLayout}
                onValidateAndNext={handleValidateAndNext}
                validating={validating}
              />
            )}

            {step === 2 && (
              <StepDesignInstructions
                form={form}
                setForm={setForm}
                setStep={setStep}
                onExtractPreferences={handleExtractPreferences}
                extracting={extracting}
              />
            )}

            {step === 3 && (
              <StepSelectProducts
                setStep={setStep}
                productData={productData}
                categoryCounts={categoryCounts}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                addedProducts={addedProducts}
                toggleProduct={toggleProduct}
                incrementProduct={incrementProduct}
                decrementProduct={decrementProduct}
                currentSpent={currentSpent}
                baseBudget={baseBudget}
                percent={percent}
                onProceedToStep4={handleProceedToStep4}
              />
            )}

            {step === 4 && (
              <StepRoomGenerationResult
                setStep={setStep}
                generatedImage={generatedImageResult}
                selectedProducts={selectedProductObjs}
                isGenerating={isGeneratingImage}
                handleRegenerate={triggerImageGeneration}
                onFinish={handleFinishRoomGeneration}
                resolution={resolution}
                setResolution={setResolution}
              />
            )}
          </section>
        </main>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-8 left-1/2 z-40 flex w-[90%] -translate-x-1/2 items-center justify-around rounded-2xl bg-background p-4 neomorph-raised md:hidden">
        <button
          onClick={() => navigate("/dashboard")}
          className="rounded-xl p-3 text-on-surface-variant transition-all active:neomorph-inset"
        >
          <Icon name="domain" />
        </button>
        <button
          onClick={() => setStep(0)}
          className={`rounded-xl p-3 transition-all active:neomorph-inset ${step === 0 ? "text-primary neomorph-inset" : "text-on-surface-variant"}`}
        >
          <Icon name="auto_awesome" />
        </button>
        <button
          onClick={() => navigate("/profile")}
          className="rounded-xl p-3 text-on-surface-variant transition-all active:neomorph-inset"
        >
          <Icon name="person" />
        </button>
      </div>
    </div>
  );
};

export default RoomGeneration;
