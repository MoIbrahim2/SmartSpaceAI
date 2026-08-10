import Drawer from "../Shared/Drawer";
import StatusBadge from "../Shared/StatusBadge";
import { useTranslation } from "react-i18next";
import { DollarSign, Calendar, FileText, CheckCircle2 } from "lucide-react";

export default function CommissionDetailsDrawer({ item, isOpen, onClose, onMarkPaid }) {
  const { t } = useTranslation();
  if (!item) return null;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={t("admin.commissions.drawerTitle")}>
      <div className="space-y-6">
        <div className="rounded-2xl bg-surface p-5 border border-outline/10 neomorph-raised space-y-3">
          <div className="flex items-center justify-between border-b border-outline/10 pb-3">
            <div>
              <h4 className="font-extrabold text-base text-on-surface">{item.sellerName}</h4>
              <p className="text-xs text-on-surface-variant">{t("admin.commissions.reportId")}: {item.id}</p>
            </div>
            <StatusBadge status={item.payoutStatus} />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">{t("admin.commissions.period")}</span>
              <p className="font-bold text-on-surface text-sm">{item.period}</p>
            </div>
            <div>
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">{t("admin.commissions.payoutDate")}</span>
              <p className="font-bold text-on-surface text-sm">{item.payoutDate}</p>
            </div>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="rounded-2xl bg-surface p-5 border border-outline/10 neomorph-raised space-y-3 text-sm">
          <h5 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant border-b border-outline/10 pb-2">
            {t("admin.commissions.financialSummary")}
          </h5>
          <div className="flex items-center justify-between py-1">
            <span className="text-on-surface-variant">{t("admin.commissions.grossSalesVol")}:</span>
            <span className="font-extrabold text-on-surface">{item.grossSales}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-on-surface-variant">{t("admin.commissions.platformFeeRate")}:</span>
            <span className="font-bold text-on-surface">{item.commissionRate}</span>
          </div>
          <div className="flex items-center justify-between py-1 text-base border-t border-outline/10 pt-2">
            <span className="font-extrabold text-on-surface">{t("admin.commissions.platformComm")}:</span>
            <span className="font-extrabold text-primary">{item.earnedCommission}</span>
          </div>
          {item.netSellerAmount !== undefined && (
            <div className="flex items-center justify-between py-1 text-base border-t border-outline/10 pt-2">
              <span className="font-extrabold text-on-surface">{t("admin.commissions.netSellerPayout", "Net Seller Payout")}:</span>
              <span className="font-extrabold text-emerald-600">EGP {item.netSellerAmount?.toLocaleString()}</span>
            </div>
          )}
        </div>

        {item.payoutStatus?.toLowerCase() !== "paid" && (
          <button
            onClick={() => {
              onMarkPaid(item);
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white neo-shadow hover:bg-emerald-700 transition-all"
          >
            <CheckCircle2 className="size-4" />
            <span>{t("admin.commissions.markPaidBtn")}</span>
          </button>
        )}
      </div>
    </Drawer>
  );
}
