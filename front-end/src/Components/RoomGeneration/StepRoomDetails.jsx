import { useTranslation } from "react-i18next";
import Icon from "../Icon";

const StepRoomDetails = ({ form, setForm, setStep, handleFileChange, handleDrop }) => {
  const { t } = useTranslation();

  return (
    <div className="neomorph-raised rounded-[2rem] p-8 lg:p-10 bg-background flex flex-col h-full relative">
      <h2 className="font-headline font-bold text-2xl mb-2 text-on-surface">{t("dashboard.stepOneTitle")}</h2>
      <p className="text-on-surface-variant text-sm mb-8 neomorph-inset p-4 rounded-xl bg-background leading-relaxed">
        {t("dashboard.stepOneDesc")}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-on-surface pl-1 rtl:pl-0 rtl:pr-1">{t("dashboard.lengthFt")}</label>
          <input
            type="number"
            placeholder="e.g. 12"
            className="neomorph-inset rounded-xl p-3 text-sm text-on-surface placeholder:text-outline/50 bg-background border-none focus:outline-none"
            value={form.length}
            onChange={(e) => setForm((p) => ({ ...p, length: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-on-surface pl-1 rtl:pl-0 rtl:pr-1">{t("dashboard.widthFt")}</label>
          <input
            type="number"
            placeholder="e.g. 10"
            className="neomorph-inset rounded-xl p-3 text-sm text-on-surface placeholder:text-outline/50 bg-background border-none focus:outline-none"
            value={form.width}
            onChange={(e) => setForm((p) => ({ ...p, width: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-on-surface pl-1 rtl:pl-0 rtl:pr-1">{t("dashboard.heightFt")}</label>
          <input
            type="number"
            placeholder="e.g. 9"
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
          className="neomorph-inset rounded-2xl p-8 flex flex-col items-center justify-center flex-grow border-2 border-dashed border-outline-variant/30 text-center cursor-pointer hover:bg-surface-bright/50 transition-colors min-h-[200px]"
        >
          <input
            type="file"
            id="file-upload-input"
            className="hidden"
            multiple
            accept="image/*"
            onChange={handleFileChange}
          />
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
        </div>
      </div>

      {/* Action Bar */}
      <div className="mt-auto flex justify-between pt-4 border-t border-outline-variant/20">
        <button
          onClick={() => setStep(0)}
          className="px-6 py-3 rounded-xl font-headline font-semibold text-on-surface-variant bg-background neomorph-raised hover:text-primary active:neomorph-inset transition-all flex items-center gap-2"
        >
          <Icon name="arrow_forward" size={16} className="rotate-180 rtl:rotate-0" />
          {t("common.goBack")}
        </button>
        <button
          onClick={() => setStep(2)}
          className="px-8 py-3 rounded-xl font-headline font-semibold text-primary bg-background neomorph-raised hover:text-primary-variant active:neomorph-inset transition-all flex items-center gap-2"
        >
          {t("common.next")}
          <Icon name="arrow_forward" size={16} className="rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
};

export default StepRoomDetails;
