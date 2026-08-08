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
  saveResolution,
  validateSpatial
} from "../../api";
import { getProductId } from "../../utils/productUtils";
import { useAuth } from "../../context/AuthContext";

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
  const { user, refreshCredits } = useAuth();
  const [userCredits, setUserCredits] = useState(user?.credits ?? 0);

  // Keep userCredits in sync with auth context
  useEffect(() => {
    setUserCredits(user?.credits ?? 0);
  }, [user?.credits]);

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

  // Spatial Guardrail state
  const [spatialValidating, setSpatialValidating] = useState(false);
  const [spatialResult, setSpatialResult] = useState(null);
  const [spatialViolationModalOpen, setSpatialViolationModalOpen] = useState(false);

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
      // 0. Hydrate immediately from localStorage if present
      try {
        const cached = localStorage.getItem(`smartspace_products_${urlRoomId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.selectedProducts && parsed.selectedProducts.length > 0) {
            const restoredProductIds = [];
            const restoredProductData = {};
            const restoredCounts = {};
            parsed.selectedProducts.forEach((sp) => {
              const cat = sp.category || "Furniture";
              const pData = sp.productData || sp;
              const pId = getProductId(pData) || String(sp.productId || pData._id || pData.id);
              if (!restoredProductData[cat]) restoredProductData[cat] = [];
              if (!restoredProductData[cat].some((item) => (getProductId(item) || String(item._id || item.id)) === pId)) {
                restoredProductData[cat].push(pData);
              }
              const qty = sp.quantity || 1;
              for (let i = 0; i < qty; i++) {
                restoredProductIds.push(pId);
              }
              restoredCounts[cat] = (restoredCounts[cat] || 0) + qty;
            });
            setProductData((prev) => {
              const merged = { ...prev };
              Object.keys(restoredProductData).forEach((cat) => {
                const existingList = merged[cat] || [];
                const newList = [...existingList];
                restoredProductData[cat].forEach((p) => {
                  const pId = getProductId(p) || String(p._id || p.id);
                  if (!newList.some((item) => (getProductId(item) || String(item._id || item.id)) === pId)) {
                    newList.unshift(p);
                  }
                });
                merged[cat] = newList;
              });
              return merged;
            });
            setCategoryCounts((prev) => ({ ...prev, ...restoredCounts }));
            setAddedProducts(restoredProductIds);
            const firstCat = Object.keys(restoredCounts)[0] || "sofa";
            setActiveCategory(firstCat);
          }
        }
      } catch (e) {
        console.warn("Error hydrating products from local cache:", e);
      }

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
              const pId = String(sp.productId || getProductId(pData) || getProductId(sp));

              if (!restoredProductData[cat]) restoredProductData[cat] = [];
              if (!restoredProductData[cat].some((item) => (getProductId(item) || String(item._id || item.id)) === pId)) {
                restoredProductData[cat].push(pData);
              }

              const qty = sp.quantity || 1;
              for (let i = 0; i < qty; i++) {
                restoredProductIds.push(pId);
              }
              restoredCounts[cat] = (restoredCounts[cat] || 0) + qty;
            });

            setProductData((prev) => {
              const merged = { ...prev };
              Object.keys(restoredProductData).forEach((cat) => {
                const existingList = merged[cat] || [];
                const newList = [...existingList];
                restoredProductData[cat].forEach((p) => {
                  const pId = getProductId(p) || String(p._id || p.id);
                  if (!newList.some((item) => (getProductId(item) || String(item._id || item.id)) === pId)) {
                    newList.unshift(p);
                  }
                });
                merged[cat] = newList;
              });
              return merged;
            });
            setCategoryCounts((prev) => ({ ...prev, ...restoredCounts }));
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
          setAddedProducts((prev) => (prev && prev.length > 0 ? prev : goldenIds));

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
   * Move from Step 3 to Step 4: Persist selected products, then run spatial validation
   */
  const handleProceedToStep4 = async () => {
    console.log("[Spatial Guardrail UI] Step 3 Next clicked -> handleProceedToStep4 triggered.");
    if (!generationId) {
      console.warn("[Spatial Guardrail UI] No generationId present. Skipping to Step 4 directly.");
      setStep(4);
      return;
    }

    // Reset previous image render result so updated product selections (e.g. adding a Rug) generate fresh output
    setGeneratedImageResult(null);

    // Show spatial overlay immediately
    console.log("[Spatial Guardrail UI] Setting spatialValidating = true overlay.");
    setSpatialValidating(true);
    setSpatialResult(null);

    try {
      // Format selected products list for API payload with quantities
      const countsMap = {};
      addedProducts.forEach((id) => {
        countsMap[id] = (countsMap[id] || 0) + 1;
      });

      const allKnownProducts = Object.values(productData).flat();
      const selectedProductObjects = [];
      const seenIds = new Set();

      addedProducts.forEach((pId) => {
        if (!pId || seenIds.has(pId)) return;
        seenIds.add(pId);

        const foundProd = allKnownProducts.find((p) => getProductId(p) === pId);

        let cat = "";
        for (const [categoryKey, prodsList] of Object.entries(productData)) {
          if ((prodsList || []).some((p) => getProductId(p) === pId)) {
            cat = categoryKey;
            break;
          }
        }
        if (!cat) {
          cat = foundProd?.category || foundProd?.categoryName || foundProd?.classification?.canonicalCategory || "Furniture";
        }
        const formattedCat = cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : "Furniture";
        const price = foundProd?.pricing?.currentPrice || foundProd?.price || foundProd?.numericPrice || 0;

        let safeProdData = null;
        if (foundProd) {
          try {
            const rawObj = JSON.parse(JSON.stringify(foundProd));
            safeProdData = {
              _id: String(pId),
              title: rawObj.basic?.name || rawObj.title || rawObj.name || "Furniture Item",
              category: formattedCat,
              brand: rawObj.basic?.brand || rawObj.brand || "Partner Store",
              pricing: rawObj.pricing || { currentPrice: Number(price) || 0 },
              price: Number(price) || 0,
              dimensions: rawObj.dimensions || { width: 100, length: 100, height: 100 },
              primaryImage: rawObj.primaryImage || rawObj.imageUrl || rawObj.img || "",
              classification: rawObj.classification || {},
              isRecommended: !!rawObj.isRecommended,
            };
          } catch (e) {
            safeProdData = { _id: String(pId), title: foundProd.title || "Selected Item" };
          }
        } else {
          safeProdData = { _id: String(pId), title: "Selected Furniture Item" };
        }

        selectedProductObjects.push({
          category: formattedCat || "Furniture",
          productId: String(pId),
          productData: safeProdData,
          isRecommended: !!foundProd?.isRecommended,
          price: Number(price) || 0,
          quantity: Number(countsMap[pId] || 1),
        });
      });

      const layoutPayload = {
        length_cm: parseFloat(form.length),
        width_cm: parseFloat(form.width),
        height_cm: parseFloat(form.height),
        budget_egp: parseFloat(form.budget),
        room_image_path: savedLayout?.room_image_path || savedLayout?.imagePath,
      };

      console.log(`[Spatial Guardrail UI] 1. Saving ${selectedProductObjects.length} selected products to backend generation ${generationId}...`);
      await saveSelectedProducts(generationId, {
        selectedProducts: selectedProductObjects,
        roomLayoutData: layoutPayload,
      });

      // ── Spatial Guardrail Validation ───────────────────────────────
      try {
        console.log(`[Spatial Guardrail UI] 2. Calling POST /validate-spatial with updated products...`);
        const { data: spatialData } = await validateSpatial({
          generationId,
          selectedProducts: selectedProductObjects,
          roomLayoutData: layoutPayload,
        });
        console.log("[Spatial Guardrail UI] Response received from /validate-spatial:", spatialData);

        if (spatialData.success) {
          const guardrail = spatialData.data.spatialGuardrail;
          setSpatialResult(guardrail);

          if (guardrail.isApplicable) {
            console.log("[Spatial Guardrail UI] ✅ Spatial Layout is Applicable! Locking products in DB & Proceeding to Step 4.");
            
            // Persist approved products immediately
            await saveSelectedProducts(generationId, {
              selectedProducts: selectedProductObjects,
              roomLayoutData: layoutPayload,
            });

            if (urlRoomId) {
              try {
                localStorage.setItem(`smartspace_products_${urlRoomId}`, JSON.stringify({
                  selectedProducts: selectedProductObjects,
                  timestamp: Date.now()
                }));
              } catch (e) {
                console.warn("localStorage save failed:", e);
              }
            }

            setSpatialValidating(false);
            setStep(4);
          } else {
            console.warn("[Spatial Guardrail UI] ❌ Spatial Layout Violations Found! Opening Violation Modal.", guardrail.spatialViolations);
            setSpatialValidating(false);
            setSpatialViolationModalOpen(true);
          }
        } else {
          console.error("[Spatial Guardrail UI] Spatial validation returned success = false:", spatialData);
          setSpatialValidating(false);
          setError("Spatial validation failed. Please try again.");
        }
      } catch (spatialErr) {
        console.error("[Spatial Guardrail UI] Exception during spatial validation call:", spatialErr);
        const errMsg = spatialErr.response?.data?.message || spatialErr.message || "";

        if (spatialErr.response?.status === 422) {
          console.warn("[Spatial Guardrail UI] Received 422 Unprocessable Entity for spatial violations.");
          setSpatialResult({
            isApplicable: false,
            spatialViolations: [{ type: 'DIMENSION_OVERFLOW', description: errMsg, conflictingProductIds: [] }],
            suggestedRemovals: []
          });
          setSpatialValidating(false);
          setSpatialViolationModalOpen(true);
        } else {
          console.error("[Spatial Guardrail UI] Non-422 error encountered during spatial validation:", errMsg);
          setSpatialValidating(false);
          setError(`Spatial validation error: ${errMsg || "Failed to analyze room layout"}. Please try again.`);
        }
      }
      // ── End Spatial Guardrail ──────────────────────────────────────

    } catch (err) {
      console.error("[Spatial Guardrail UI] Save selected products failed:", err);
      const detail = err.response?.data?.message || err.message || "";
      setSpatialValidating(false);
      setError(`Failed to save selected products: ${detail}. Please try again.`);
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
        if (data.data.generation.roomId?.widenedImageUrl) {
          setRoomData((prev) => ({
            ...prev,
            widenedImageUrl: data.data.generation.roomId.widenedImageUrl,
          }));
        }
      }
      // Update credits from response or refresh from server
      if (data.data?.remainingCredits !== undefined) {
        setUserCredits(data.data.remainingCredits);
      }
      // Always refresh credits from server to stay in sync
      const freshCredits = await refreshCredits();
      if (freshCredits !== null) {
        setUserCredits(freshCredits);
      }
    } catch (err) {
      console.error("Image generation API error:", err);
      // If it was a credit error (402), show in the error state
      if (err.response?.status === 402) {
        setError(err.response?.data?.message || "Insufficient credits. Please top up to continue.");
      } else {
        setError(err.response?.data?.message || "Image generation failed. Please try again.");
      }
      // Refresh credits even on error (they may have been deducted on a different path)
      const freshCredits = await refreshCredits();
      if (freshCredits !== null) {
        setUserCredits(freshCredits);
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleFinishRoomGeneration = () => {
    const targetApartmentId = searchParams.get("apartmentId") || roomData?.apartmentId || roomData?.apartment;
    if (urlRoomId && targetApartmentId) {
      navigate(`/apartments/${targetApartmentId}/rooms/${urlRoomId}`);
    } else if (urlRoomId) {
      navigate(`/rooms`);
    } else {
      navigate("/home");
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

      {/* Spatial Guardrail Loading Overlay */}
      {spatialValidating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="flex flex-col items-center gap-5 rounded-[2rem] bg-background p-10 neomorph-raised max-w-md w-[90%] mx-4 text-center">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-amber-500/30 animate-ping"></div>
              <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-amber-500">
                <Icon name="grid_view" size={28} />
              </div>
            </div>
            <h3 className="font-headline text-xl font-bold text-on-surface">
              Calculating 2D Room Floorplan & Clearances...
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed max-w-sm">
              SmartSpaceAI is evaluating furniture dimensions, walkway clearances, and ergonomic spacing rules to ensure everything fits perfectly in your room.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-500 font-semibold">
              <Icon name="architecture" size={16} />
              <span>Spatial Analysis Engine Active</span>
            </div>
          </div>
        </div>
      )}

      {/* Spatial Violation Modal */}
      {spatialViolationModalOpen && spatialResult && !spatialResult.isApplicable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="rounded-[2rem] bg-background p-8 neomorph-raised max-w-lg w-[92%] mx-4 max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500/15 text-red-500 flex items-center justify-center shrink-0">
                <Icon name="warning" size={28} />
              </div>
              <div>
                <h3 className="font-headline text-xl font-bold text-on-surface">
                  Spatial Layout Conflict
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Some selected products cannot fit within your room dimensions.
                </p>
              </div>
            </div>

            {/* Violations List */}
            <div className="space-y-3 mb-6">
              {(spatialResult.spatialViolations || []).map((violation, idx) => {
                const typeIcons = {
                  DIMENSION_OVERFLOW: "fullscreen_exit",
                  WALKWAY_BLOCKAGE: "directions_walk",
                  DOOR_IMPACT: "door_front",
                  WINDOW_BLOCKAGE: "window"
                };
                const typeColors = {
                  DIMENSION_OVERFLOW: "text-red-500 bg-red-500/10",
                  WALKWAY_BLOCKAGE: "text-amber-500 bg-amber-500/10",
                  DOOR_IMPACT: "text-orange-500 bg-orange-500/10",
                  WINDOW_BLOCKAGE: "text-blue-500 bg-blue-500/10"
                };

                return (
                  <div key={idx} className="p-4 rounded-xl neomorph-inset border border-red-500/20">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${typeColors[violation.type] || "text-red-500 bg-red-500/10"}`}>
                        <Icon name={typeIcons[violation.type] || "error"} size={18} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                          {(violation.type || "").replace(/_/g, " ")}
                        </span>
                        <p className="text-sm text-on-surface mt-1 leading-relaxed">
                          {violation.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Suggested Removals */}
            {spatialResult.suggestedRemovals && spatialResult.suggestedRemovals.length > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Icon name="lightbulb" size={14} />
                  Suggested Removals
                </h4>
                <p className="text-xs text-on-surface-variant mb-3">
                  Remove the following items to make the layout fit:
                </p>
                <div className="flex flex-wrap gap-2">
                  {spatialResult.suggestedRemovals.map((productId) => {
                    const product = allProductsList.find((p) => getProductId(p) === productId);
                    const title = product?.basic?.name || product?.name || product?.title || productId;
                    return (
                      <button
                        key={productId}
                        onClick={() => {
                          // Remove all instances of this product
                          setAddedProducts((prev) => prev.filter((id) => id !== productId));
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 text-xs font-bold hover:bg-red-500/20 transition-all flex items-center gap-1.5 active:scale-95"
                      >
                        <Icon name="remove_circle" size={14} />
                        Remove "{title}"
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end items-center gap-3">
              <button
                onClick={() => {
                  setSpatialViolationModalOpen(false);
                  // Stay on Step 3 for user to adjust products
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-variant transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
              >
                <Icon name="edit" size={16} />
                Adjust Products to Fix Layout
              </button>
            </div>
          </div>
        </div>
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
            {error && (
              <div className="rounded-xl bg-error/10 px-5 py-3 text-sm font-medium text-error flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => setError(null)} className="text-xs underline font-bold ml-4">Dismiss</button>
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
                userCredits={userCredits}
                roomData={roomData}
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
