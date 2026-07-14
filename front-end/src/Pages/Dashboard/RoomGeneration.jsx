import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "../../Components/Icon";

// Import step sub-components
import Stepper from "../../Components/RoomGeneration/Stepper";
import StepSelectType from "../../Components/RoomGeneration/StepSelectType";
import StepRoomDetails from "../../Components/RoomGeneration/StepRoomDetails";
import StepDesignInstructions from "../../Components/RoomGeneration/StepDesignInstructions";
import StepSelectProducts from "../../Components/RoomGeneration/StepSelectProducts";
import StepRoomGenerationResult from "../../Components/RoomGeneration/StepRoomGenerationResult";

const RoomGeneration = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0 = main choice, 1 = details, 2 = instructions, 3 = products, 4 = generation
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("Electronics");
  const [addedProducts, setAddedProducts] = useState([1]); // ID 1 (Soundbar) is added by default
  const [regenerating, setRegenerating] = useState(false);

  const [form, setForm] = useState({
    roomId: "",
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
  });

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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setForm((p) => ({ ...p, images: e.target.files }));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setForm((p) => ({ ...p, images: e.dataTransfer.files }));
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
      {step === 0 ? (
        <StepSelectType setForm={setForm} setStep={setStep} error={error} />
      ) : (
        <main className="flex-grow flex flex-col md:flex-row gap-8 max-w-7xl mx-auto w-full p-6 md:p-8 lg:p-10">
          <Stepper currentStep={step} />

          <section className="flex-grow flex flex-col gap-6 w-full md:w-3/4 lg:w-4/5">
            {step === 1 && (
              <StepRoomDetails
                form={form}
                setForm={setForm}
                setStep={setStep}
                handleFileChange={handleFileChange}
                handleDrop={handleDrop}
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
