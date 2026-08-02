import Drawer from "../Shared/Drawer";
import StatusBadge from "../Shared/StatusBadge";
import { DollarSign, Calendar, FileText, CheckCircle2 } from "lucide-react";

export default function CommissionDetailsDrawer({ item, isOpen, onClose, onMarkPaid }) {
  if (!item) return null;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Commission Details Report">
      <div className="space-y-6">
        <div className="rounded-2xl bg-surface p-5 border border-outline/10 neomorph-raised space-y-3">
          <div className="flex items-center justify-between border-b border-outline/10 pb-3">
            <div>
              <h4 className="font-extrabold text-base text-on-surface">{item.sellerName}</h4>
              <p className="text-xs text-on-surface-variant">Report ID: {item.id}</p>
            </div>
            <StatusBadge status={item.payoutStatus} />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">Period</span>
              <p className="font-bold text-on-surface text-sm">{item.period}</p>
            </div>
            <div>
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">Payout Date</span>
              <p className="font-bold text-on-surface text-sm">{item.payoutDate}</p>
            </div>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="rounded-2xl bg-surface p-5 border border-outline/10 neomorph-raised space-y-3 text-sm">
          <h5 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant border-b border-outline/10 pb-2">
            Financial Summary
          </h5>
          <div className="flex items-center justify-between py-1">
            <span className="text-on-surface-variant">Gross Sales Volume:</span>
            <span className="font-extrabold text-on-surface">{item.grossSales}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-on-surface-variant">Platform Fee Rate:</span>
            <span className="font-bold text-on-surface">{item.commissionRate}</span>
          </div>
          <div className="flex items-center justify-between py-1 text-base border-t border-outline/10 pt-2">
            <span className="font-extrabold text-on-surface">Platform Commission:</span>
            <span className="font-extrabold text-primary">{item.earnedCommission}</span>
          </div>
        </div>

        {item.payoutStatus !== "Paid" && (
          <button
            onClick={() => {
              onMarkPaid(item.id);
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white neo-shadow hover:bg-emerald-700 transition-all"
          >
            <CheckCircle2 className="size-4" />
            <span>Mark Payout as Paid</span>
          </button>
        )}
      </div>
    </Drawer>
  );
}
