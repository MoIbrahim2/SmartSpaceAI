import { useTranslation } from "react-i18next";
import Icon from "../Icon";

const Stepper = ({ currentStep }) => {
  const { t } = useTranslation();

  const steps = [
    { num: 1, label: t("dashboard.stepOneTitleStepper") || "Room Details" },
    { num: 2, label: t("dashboard.stepTwoTitleStepper") || "Design Instructions" },
    { num: 3, label: t("dashboard.stepThreeTitleStepper") || "Select Products" },
    { num: 4, label: t("dashboard.stepFourTitleStepper") || "Room Generation" },
  ];

  return (
    <aside className="w-full md:w-64 lg:w-72 shrink-0">
      <div className="neomorph-raised rounded-[2rem] p-8 bg-background h-full min-h-[400px] flex flex-col relative">
        <h2 className="font-headline font-bold text-xl mb-8 text-on-surface">{t("dashboard.steps")}</h2>
        <div className="flex flex-col gap-8 relative flex-grow">
          {steps.map((step) => {
            const isActive = currentStep === step.num;
            const isCompleted = currentStep > step.num;

            return (
              <div key={step.num} className="flex items-center gap-4 relative z-10">
                {/* Connecting line segment under the circle */}
                {step.num < steps.length && (
                  <div className="absolute left-[15px] rtl:left-auto rtl:right-[15px] top-8 h-8 w-[2px] bg-primary/30 z-0"></div>
                )}

                {isCompleted ? (
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center neomorph-raised shrink-0 z-10">
                    <Icon name="check" size={16} />
                  </div>
                ) : isActive ? (
                  <div className="w-8 h-8 rounded-full bg-background border-2 border-primary text-primary flex items-center justify-center neomorph-inset shrink-0 z-10">
                    <span className="font-headline font-bold text-sm">{step.num}</span>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-background text-on-surface-variant flex items-center justify-center neomorph-raised shrink-0 z-10">
                    <span className="font-headline font-semibold text-sm">{step.num}</span>
                  </div>
                )}

                <span className={`font-headline text-sm font-semibold transition-colors duration-200 ${isActive ? 'text-primary' : 'text-on-surface-variant'
                  } ${!isActive && !isCompleted ? 'opacity-60' : ''}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default Stepper;
