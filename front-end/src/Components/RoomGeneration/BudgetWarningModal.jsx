import { useTranslation } from "react-i18next";
import Icon from "../Icon";

const BudgetWarningModal = ({ isOpen, onClose, onProceed, currentSpent, baseBudget, formatCurrency }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const difference = currentSpent - baseBudget;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-background rounded-3xl p-6 md:p-8 max-w-lg w-full neomorph-raised shadow-2xl relative border border-amber-500/40 flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Icon */}
        <div className="flex items-center gap-4 text-amber-500">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center neomorph-raised shrink-0">
            <Icon name="warning" size={32} />
          </div>
          <div>
            <h2 className="font-headline text-xl font-bold text-on-surface">Budget Limit Exceeded</h2>
            <p className="text-xs text-on-surface-variant">Warning: Selected products exceed target budget</p>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="neomorph-inset rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-on-surface-variant">Target Room Budget:</span>
            <span className="font-bold text-on-surface">{formatCurrency(baseBudget)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-on-surface-variant">Total Selected Items:</span>
            <span className="font-bold text-amber-500">{formatCurrency(currentSpent)}</span>
          </div>
          <div className="h-px bg-outline-variant/30 my-1"></div>
          <div className="flex justify-between items-center text-sm font-bold">
            <span className="text-amber-500">Exceeded Amount:</span>
            <span className="text-amber-500">+{formatCurrency(difference)}</span>
          </div>
        </div>

        <p className="text-sm text-on-surface-variant leading-relaxed">
          You can return to review your selections and swap for more budget-friendly alternatives, or proceed to room generation anyway.
        </p>

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl font-semibold text-on-surface bg-background neomorph-raised hover:text-primary active:neomorph-inset transition-all text-sm"
          >
            Review & Edit Products
          </button>
          <button
            onClick={onProceed}
            className="flex-1 py-3 px-4 rounded-xl font-headline font-semibold text-stone-950 bg-amber-500 hover:bg-amber-400 shadow-lg active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
          >
            Proceed Anyway
            <Icon name="arrow_forward" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetWarningModal;
