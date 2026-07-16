import { useTranslation } from "react-i18next";
import Icon from "../Icon";
import { API_HOST } from "../../api";

const StepRoomDetails = ({
  form,
  setForm,
  setStep,
  handleFileChange,
  handleDrop,
  validationStatus,
  savedLayout,
  onValidateAndNext,
  validating,
}) => {
  const { t } = useTranslation();

  // Determine if we have a "validated" state to show
  const isValidated = validationStatus === "valid";
  const isRejected = validationStatus === "rejected";

  // Build the saved image preview URL
  const savedImageUrl =
    savedLayout?.room_image_path
      ? `${API_HOST}/${savedLayout.room_image_path}`
      : null;

  return (
    <div className="neomorph-raised rounded-[2rem] p-8 lg:p-10 bg-background flex flex-col h-full relative">
      <h2 className="font-headline font-bold text-2xl mb-2 text-on-surface">{t("dashboard.stepOneTitle")}</h2>
      <p className="text-on-surface-variant text-sm mb-8 neomorph-inset p-4 rounded-xl bg-background leading-relaxed whitespace-pre-line">
        {t("dashboard.stepOneDesc")}
      </p>

      {/* Validated Banner */}
      {isValidated && (
        <div
          className="mb-6 flex items-center gap-3 rounded-xl px-5 py-4 text-sm font-semibold"
          style={{
            background: "linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(16,185,129,0.08) 100%)",
            color: "#16a34a",
            border: "1px solid rgba(34,197,94,0.25)",
          }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 shrink-0">
            <Icon name="check_circle" size={20} className="text-green-600" />
          </div>
          <div>
            <p className="font-bold">{t("dashboard.layoutValidated") || "Layout Validated Successfully"}</p>
            <p className="text-xs font-normal opacity-80 mt-0.5">
              {t("dashboard.layoutValidatedDesc") || "Your room image and dimensions have been verified by AI. You can proceed to the next step."}
            </p>
          </div>
        </div>
      )}

      {/* Rejected Banner */}
      {isRejected && (
        <div
          className="mb-6 flex items-center gap-3 rounded-xl px-5 py-4 text-sm font-semibold bg-error/10 border border-error/25 text-error"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-error/20 shrink-0">
            <Icon name="error" size={20} />
          </div>
          <div>
            <p className="font-bold">{t("dashboard.layoutRejected") || "Image Rejected"}</p>
            <p className="text-xs font-normal opacity-80 mt-0.5">
              {form._rejectionReason || t("dashboard.layoutRejectedDesc") || "Please upload a valid corner-shot photo of an empty room with good lighting."}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-on-surface pl-1 rtl:pl-0 rtl:pr-1">{t("dashboard.lengthCm")}</label>
          <input
            type="number"
            placeholder="e.g. 400"
            className="neomorph-inset rounded-xl p-3 text-sm text-on-surface placeholder:text-outline/50 bg-background border-none focus:outline-none"
            value={form.length}
            onChange={(e) => setForm((p) => ({ ...p, length: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-on-surface pl-1 rtl:pl-0 rtl:pr-1">{t("dashboard.widthCm")}</label>
          <input
            type="number"
            placeholder="e.g. 300"
            className="neomorph-inset rounded-xl p-3 text-sm text-on-surface placeholder:text-outline/50 bg-background border-none focus:outline-none"
            value={form.width}
            onChange={(e) => setForm((p) => ({ ...p, width: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-on-surface pl-1 rtl:pl-0 rtl:pr-1">{t("dashboard.heightCm")}</label>
          <input
            type="number"
            placeholder="e.g. 280"
            className="neomorph-inset rounded-xl p-3 text-sm text-on-surface placeholder:text-outline/50 bg-background border-none focus:outline-none"
            value={form.height}
            onChange={(e) => setForm((p) => ({ ...p, height: e.target.value }))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-8 md:w-1/3">
        <label className="text-sm font-semibold text-on-surface pl-1 rtl:pl-0 rtl:pr-1">{t("dashboard.budget")}</label>
        <input
          type="number"
          placeholder="e.g. 5000"
          className="neomorph-inset rounded-xl p-3 text-sm text-on-surface placeholder:text-outline/50 bg-background border-none focus:outline-none"
          value={form.budget}
          onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value }))}
        />
      </div>

      {/* Upload Area */}
      <div className="flex-grow flex flex-col mb-8">
        <label className="text-sm font-semibold text-on-surface pl-1 rtl:pl-0 rtl:pr-1 mb-2">{t("dashboard.uploadRoomPhoto")}</label>
        <div
          onClick={() => document.getElementById("file-upload-input").click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="neomorph-inset rounded-2xl p-8 flex flex-col items-center justify-center flex-grow border-2 border-dashed border-outline-variant/30 text-center cursor-pointer hover:bg-surface-bright/50 transition-colors min-h-[200px] relative overflow-hidden"
        >
          <input
            type="file"
            id="file-upload-input"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />

          {/* Show saved image thumbnail if validated and no new file selected */}
          {isValidated && savedImageUrl && !form.images ? (
            <>
              <img
                src={savedImageUrl}
                alt="Validated room"
                className="absolute inset-0 w-full h-full object-cover opacity-20 rounded-2xl"
              />
              <div className="relative z-10 flex flex-col items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20 mb-3">
                  <Icon name="check_circle" size={32} className="text-green-600" />
                </div>
                <h4 className="font-semibold text-on-surface mb-1">
                  {t("dashboard.imageValidated") || "Image Validated"}
                </h4>
                <p className="text-xs text-on-surface-variant">
                  {t("dashboard.clickToReplace") || "Click to replace with a new image"}
                </p>
              </div>
            </>
          ) : (
            <>
              <Icon name="photo_camera" size={40} className="text-primary mb-4" />
              <h4 className="font-semibold text-on-surface mb-1">
                {form.images && form.images.length > 0
                  ? t("dashboard.filesSelected", { count: form.images.length })
                  : t("dashboard.dragDropClick")}
              </h4>
              <p className="text-xs text-on-surface-variant">
                {form.images && form.images.length > 0
                  ? Array.from(form.images).map((f) => f.name).join(", ")
                  : t("dashboard.uploadLimits")}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="mt-auto flex justify-between pt-4 border-t border-outline-variant/20">
        <button
          onClick={() => setStep(0)}
          disabled={validating}
          className="px-6 py-3 rounded-xl font-headline font-semibold text-on-surface-variant bg-background neomorph-raised hover:text-primary active:neomorph-inset transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Icon name="arrow_forward" size={16} className="rotate-180 rtl:rotate-0" />
          {t("common.goBack")}
        </button>
        <button
          onClick={onValidateAndNext}
          disabled={validating}
          className="px-8 py-3 rounded-xl font-headline font-semibold text-primary bg-background neomorph-raised hover:text-primary-variant active:neomorph-inset transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {t("common.next")}
          <Icon name="arrow_forward" size={16} className="rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
};

export default StepRoomDetails;
