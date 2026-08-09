import Drawer from "../Shared/Drawer";
import StatusBadge from "../Shared/StatusBadge";
import { useTranslation } from "react-i18next";
import { Store, Mail, Phone, MapPin, Calendar, CreditCard, Building } from "lucide-react";

export default function SellerDetailsDrawer({ seller, isOpen, onClose }) {
  const { t } = useTranslation();
  if (!seller) return null;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={t("admin.sellers.drawerTitle")}>
      <div className="space-y-6">
        {/* Profile Card Header */}
        <div className="rounded-2xl bg-surface p-5 border border-outline/10 neomorph-raised flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-primary text-white flex items-center justify-center font-extrabold text-xl neo-shadow shrink-0">
            {seller.name?.[0] || "S"}
          </div>
          <div>
            <h4 className="font-extrabold text-base text-on-surface">{seller.name}</h4>
            <p className="text-xs text-on-surface-variant mb-2">{t("admin.sellers.id")}: {seller.id}</p>
            <StatusBadge status={seller.status} />
          </div>
        </div>

        {/* Financial & Performance Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface p-3.5 border border-outline/10 text-center">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase">{t("admin.sellers.colTotalSales")}</span>
            <p className="text-lg font-extrabold text-primary mt-1">{seller.totalSales}</p>
          </div>
          <div className="rounded-xl bg-surface p-3.5 border border-outline/10 text-center">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase">{t("admin.sellers.colCommission")}</span>
            <p className="text-lg font-extrabold text-on-surface mt-1">{seller.commissionRate}%</p>
          </div>
        </div>

        {/* Info Items List */}
        <div className="rounded-2xl bg-surface p-5 border border-outline/10 neomorph-raised space-y-3.5 text-sm">
          <h5 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant border-b border-outline/10 pb-2">
            {t("admin.sellers.contactDetails")}
          </h5>

          <div className="flex items-center gap-3 text-on-surface font-medium">
            <Mail className="size-4 text-primary shrink-0" />
            <span>{seller.email}</span>
          </div>

          <div className="flex items-center gap-3 text-on-surface font-medium">
            <Phone className="size-4 text-primary shrink-0" />
            <span>{seller.phone || "+20 100 000 0000"}</span>
          </div>

          <div className="flex items-center gap-3 text-on-surface font-medium">
            <Store className="size-4 text-primary shrink-0" />
            <a href={seller.storeUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
              {seller.storeUrl || t("admin.sellers.visitStore")}
            </a>
          </div>

          <div className="flex items-center gap-3 text-on-surface font-medium">
            <MapPin className="size-4 text-primary shrink-0" />
            <span>{seller.address || "Cairo, Egypt"}</span>
          </div>

          <div className="flex items-center gap-3 text-on-surface font-medium">
            <Calendar className="size-4 text-primary shrink-0" />
            <span>{t("admin.sellers.joined")}: {seller.joinedDate}</span>
          </div>
        </div>

        {/* Banking Info */}
        <div className="rounded-2xl bg-surface p-5 border border-outline/10 neomorph-raised space-y-2 text-sm">
          <h5 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant border-b border-outline/10 pb-2">
            {t("admin.sellers.taxPayout")}
          </h5>
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-on-surface-variant">{t("admin.sellers.taxId")}:</span>
            <span className="font-mono font-bold text-on-surface">{seller.taxId || "TAX-10293"}</span>
          </div>
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-on-surface-variant">{t("admin.sellers.bankAccount")}:</span>
            <span className="font-medium text-on-surface">{seller.bankAccount || "**** **** 4819"}</span>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
