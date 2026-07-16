import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "../../Components/Icon";
import { validateRoomLayout, getRoomLayout } from "../../api";

// Import step sub-components
import Stepper from "../../Components/RoomGeneration/Stepper";
import StepSelectType from "../../Components/RoomGeneration/StepSelectType";
import StepRoomDetails from "../../Components/RoomGeneration/StepRoomDetails";
import StepDesignInstructions from "../../Components/RoomGeneration/StepDesignInstructions";
import StepSelectProducts from "../../Components/RoomGeneration/StepSelectProducts";
import StepRoomGenerationResult from "../../Components/RoomGeneration/StepRoomGenerationResult";
import ValidationOverlay from "../../Components/RoomGeneration/ValidationOverlay";

const RoomGeneration = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read roomId from URL query params (e.g. /room-generation?roomId=xxx&apartmentId=yyy)
  const urlRoomId = searchParams.get("roomId") || "";

  const [step, setStep] = useState(0); // 0 = main choice, 1 = details, 2 = instructions, 3 = products, 4 = generation
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("Electronics");
  const [addedProducts, setAddedProducts] = useState([1]); // ID 1 (Soundbar) is added by default
  const [regenerating, setRegenerating] = useState(false);

  // Validation state
  const [validating, setValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState("none"); // "none" | "valid" | "rejected"
  const [savedLayout, setSavedLayout] = useState(null);

  // Snapshot of the form at last successful validation — used to detect changes
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
    length: "",
    width: "",
    height: "",
    budget: "",
    _rejectionReason: "",
  });

  /**
   * On mount (or when urlRoomId changes), try to load existing validated layout
   */
  useEffect(() => {
    if (!urlRoomId) return;

    const loadExistingLayout = async () => {
      try {
        const { data } = await getRoomLayout(urlRoomId);
        if (data.success && data.data.roomLayout) {
          const layout = data.data.roomLayout;
          setSavedLayout(layout);
          setValidationStatus("valid");

          // Populate the form with saved values
          setForm((prev) => ({
            ...prev,
            roomId: urlRoomId,
            length: String(layout.length_cm),
            width: String(layout.width_cm),
            height: String(layout.height_cm),
            budget: String(layout.budget_egp),
            images: null, // No file selected; image is already saved on server
          }));

          // Save snapshot of the validated state
          validatedSnapshotRef.current = {
            length: String(layout.length_cm),
            width: String(layout.width_cm),
            height: String(layout.height_cm),
            budget: String(layout.budget_egp),
            hasNewImage: false,
          };
        }
      } catch (err) {
        // No layout found — that's fine, user starts fresh
        console.log("No existing layout for room:", urlRoomId);
      }
    };

    loadExistingLayout();
  }, [urlRoomId]);

  /**
   * Determine if the user has changed anything since the last validation
   */
  const hasFormChanged = useCallback(() => {
    if (!validatedSnapshotRef.current) return true; // Never validated

    const snap = validatedSnapshotRef.current;
    if (form.length !== snap.length) return true;
    if (form.width !== snap.width) return true;
    if (form.height !== snap.height) return true;
    if (form.budget !== snap.budget) return true;
    if (form.images) return true; // New file was selected

    return false;
  }, [form]);

  /**
   * Handle "Next" click from Step 1.
   * If already validated and nothing changed → skip to step 2.
   * If changed or not validated → run validation.
   */
  const handleValidateAndNext = async () => {
    // If validated and nothing changed, skip directly
    if (validationStatus === "valid" && !hasFormChanged()) {
      setStep(2);
      return;
    }

    // Basic client-side checks
    if (!form.length || !form.width || !form.height || !form.budget) {
      setError(t("dashboard.fillAllFields") || "Please fill in all dimensions and budget.");
      return;
    }

    // Must have an image: either a new file or an existing saved image
    if (!form.images && !savedLayout?.room_image_path) {
      setError(t("dashboard.imageRequired") || "Please upload a room image.");
      return;
    }

    // If nothing changed but we have a saved image and no new file, skip
    if (!hasFormChanged() && validationStatus === "valid") {
      setStep(2);
      return;
    }

    // If dimensions/budget changed but no new image was uploaded and there's a saved one,
    // we still need to re-validate, but we can't re-upload without a file.
    // In this case, require a new image upload.
    if (!form.images && hasFormChanged()) {
      setError(t("dashboard.reuploadImage") || "Please re-upload a room image since you changed the room details.");
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

      // Append the first image file
      if (form.images && form.images.length > 0) {
        formData.append("image", form.images[0]);
      }

      const { data } = await validateRoomLayout(formData);

      if (data.success) {
        setSavedLayout(data.data.roomLayout);
        setValidationStatus("valid");

        // Save snapshot
        validatedSnapshotRef.current = {
          length: form.length,
          width: form.width,
          height: form.height,
          budget: form.budget,
          hasNewImage: false,
        };

        // Clear the file selection (image is now saved on server)
        setForm((prev) => ({ ...prev, images: null, _rejectionReason: "" }));

        // Move to step 2
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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setForm((p) => ({ ...p, images: e.target.files }));
      // If user picks a new file, reset the validation status
      if (validationStatus === "valid") {
        setValidationStatus("none");
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setForm((p) => ({ ...p, images: e.dataTransfer.files }));
      if (validationStatus === "valid") {
        setValidationStatus("none");
      }
    }
  };

  const toggleProduct = (id) => {
    if (addedProducts.includes(id)) {
      setAddedProducts(addedProducts.filter((pId) => pId !== id));
    } else {
      setAddedProducts([...addedProducts, id]);
    }
  };

  const handleRegenerate = () => {
    setRegenerating(true);
    setTimeout(() => {
      setRegenerating(false);
    }, 2000);
  };

  const productData = {
    Electronics: [
      { id: 0, title: t("dashboard.productTitle_0"), desc: t("dashboard.productDesc_0"), price: "$2,499", numericPrice: 2499, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCZST4vtc7qjDCP3hJI4joyaqPVSMu_uWOw_LswA96enxaECsY7JCmlms6P1rOBg3YWjpao7U-QvYkj1dD2TSU8zaDGqCIaGcZN7YZksoiLDAO7NkhqkTnBVOeIoVaDupk_PXG36JhPDk7VhWhTI5XyqAGthzt6CYWx0T2QeieMVQW4x3NvFlDfdmgUvKN1b_N0XFtdcCQA66rSDmiWMyO3bWb_eQ340yLciuGHyYVf6yFYs2nw_dk-" },
      { id: 1, title: t("dashboard.productTitle_1"), desc: t("dashboard.productDesc_1"), price: "$850", numericPrice: 850, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAJHLqojjkou5nLcqZJZF3y86OwC02MqlnUcKIqraFA0kuM9gOkPAzea_bUOZo2UmHujFy_cdPhVxolVF2X17YH_9NzRwlDkE6M4RRKGlcCmYBrp9B_xjf89oDuaIeAItWJ1NMKM1ko1CHJhN8gRV2hnM9u_gz8vf4YkK2TTbJ1xN6Zxqo-_m_-xKNoHQzpcE8xuKBuJ3PKATm2MUC8y44THYoD2gQFljyoVAzFmZx6wdQjGJyTPP6v" },
      { id: 2, title: t("dashboard.productTitle_2"), desc: t("dashboard.productDesc_2"), price: "$299", numericPrice: 299, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBoyvAfisBcJVgzpL5rd90DHEKRUlEp1khduP_j6nGncDph2lLmB2RcHYC-udSK7eMk67R_l18SB268T4_a7eJY-QLwAR4DM49iapd1wkGSf3-4QHoYsCShcgOfq0bJ_9qIVY55be29G0kyjrJBzU4zBMw1smuFeX5w7zqfKpc66VQDL-6lfTckP_wMZRm67lK7WQf21JoMXqzucdLglah5KxFoeGFoS70LF2sgrT977tEdcCZFE21m" },
    ],
    Decor: [
      { id: 3, title: t("dashboard.productTitle_3"), desc: t("dashboard.productDesc_3"), price: "$120", numericPrice: 120, img: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=600&q=80" },
      { id: 4, title: t("dashboard.productTitle_4"), desc: t("dashboard.productDesc_4"), price: "$350", numericPrice: 350, img: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80" },
      { id: 5, title: t("dashboard.productTitle_5"), desc: t("dashboard.productDesc_5"), price: "$45", numericPrice: 45, img: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80" }
    ],
    Furniture: [
      { id: 6, title: t("dashboard.productTitle_6"), desc: t("dashboard.productDesc_6"), price: "$1,800", numericPrice: 1800, img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80" },
      { id: 7, title: t("dashboard.productTitle_7"), desc: t("dashboard.productDesc_7"), price: "$450", numericPrice: 450, img: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80" },
      { id: 8, title: t("dashboard.productTitle_8"), desc: t("dashboard.productDesc_8"), price: "$650", numericPrice: 650, img: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80" }
    ]
  };

  // Spent calculations for Step 3
  const baseBudget = form.budget ? parseFloat(form.budget) : 70000;
  const baseSpent = 29150;
  const allProducts = Object.values(productData).flat();
  const selectedProductsCost = allProducts
    .filter((p) => addedProducts.includes(p.id))
    .reduce((sum, p) => sum + p.numericPrice, 0);

  // We baseline so if ONLY the default Soundbar (850) is selected, spent is exactly 30000
  const currentSpent = baseSpent + selectedProductsCost;
  const percent = Math.min(100, Math.round((currentSpent / baseBudget) * 100));

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface pb-24 md:pb-0">
      {/* Validation Loading Overlay */}
      {validating && <ValidationOverlay />}

      {step === 0 ? (
        <StepSelectType setForm={setForm} setStep={setStep} error={error} />
      ) : (
        <main className="flex-grow flex flex-col md:flex-row gap-8 max-w-7xl mx-auto w-full p-6 md:p-8 lg:p-10">
          <Stepper currentStep={step} />

          <section className="flex-grow flex flex-col gap-6 w-full md:w-3/4 lg:w-4/5">
            {error && step === 1 && (
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
              />
            )}

            {step === 3 && (
              <StepSelectProducts
                setStep={setStep}
                productData={productData}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                addedProducts={addedProducts}
                toggleProduct={toggleProduct}
                currentSpent={currentSpent}
                baseBudget={baseBudget}
                percent={percent}
              />
            )}

            {step === 4 && (
              <StepRoomGenerationResult
                setStep={setStep}
                regenerating={regenerating}
                handleRegenerate={handleRegenerate}
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
          aria-label={t("dashboard.apartments") || "Apartments"}
        >
          <Icon name="domain" />
        </button>
        <button
          onClick={() => setStep(0)}
          className={`rounded-xl p-3 transition-all active:neomorph-inset ${step === 0 ? "text-primary neomorph-inset" : "text-on-surface-variant"}`}
          aria-label={t("dashboard.roomGeneration") || "Room generation"}
        >
          <Icon name="auto_awesome" />
        </button>
        <button
          onClick={() => navigate("/profile")}
          className="rounded-xl p-3 text-on-surface-variant transition-all active:neomorph-inset"
          aria-label={t("dashboard.profile") || "Profile"}
        >
          <Icon name="person" />
        </button>
      </div>
    </div>
  );
};

export default RoomGeneration;
