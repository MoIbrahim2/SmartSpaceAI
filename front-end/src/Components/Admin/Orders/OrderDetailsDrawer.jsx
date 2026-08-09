import Drawer from "../Shared/Drawer";
import StatusBadge from "../Shared/StatusBadge";
import { useTranslation } from "react-i18next";
import { User, Store, MapPin, CreditCard, Clock, CheckCircle2 } from "lucide-react";

export default function OrderDetailsDrawer({ order, isOpen, onClose }) {
  const { t } = useTranslation();
  if (!order) return null;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={t("admin.orders.drawerTitle")}>
      <div className="space-y-6">
        {/* Header Card */}
        <div className="rounded-2xl bg-surface p-5 border border-outline/10 neomorph-raised space-y-3">
          <div className="flex items-center justify-between border-b border-outline/10 pb-3">
            <div>
              <span className="font-mono font-extrabold text-primary text-base">{order.id}</span>
              <p className="text-xs text-on-surface-variant">{t("admin.orders.placedOn", { date: order.date })}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-on-surface-variant font-medium">{t("admin.orders.totalPaid")}</span>
            <span className="font-extrabold text-on-surface text-base">{order.totalAmount}</span>
          </div>
        </div>

        {/* Timeline Track */}
        {order.timeline && (
          <div className="rounded-2xl bg-surface p-5 border border-outline/10 neomorph-raised space-y-3">
            <h5 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant border-b border-outline/10 pb-2">
              {t("admin.orders.timelineHeading")}
            </h5>
            <div className="space-y-3 relative pl-4 rtl:pr-4 rtl:pl-0 border-l-2 rtl:border-r-2 rtl:border-l-0 border-primary/20">
              {order.timeline.map((step, idx) => (
                <div key={idx} className="relative flex items-center justify-between text-xs">
                  <div
                    className={`absolute -left-[21px] rtl:-right-[21px] rtl:left-auto size-3 rounded-full border-2 border-surface ${
                      step.done ? "bg-primary" : "bg-outline/40"
                    }`}
                  />
                  <div>
                    <p className={`font-bold ${step.done ? "text-on-surface" : "text-on-surface-variant"}`}>
                      {step.status}
                    </p>
                    <p className="text-[10px] text-outline">{step.date}</p>
                  </div>
                  {step.done && <CheckCircle2 className="size-3.5 text-emerald-600" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Buyer & Seller Info */}
        <div className="rounded-2xl bg-surface p-5 border border-outline/10 neomorph-raised space-y-3 text-xs">
          <h5 className="font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline/10 pb-2">
            {t("admin.orders.buyerStoreHeading")}
          </h5>
          <div className="space-y-2">
            <div className="flex items-start gap-2.5">
              <User className="size-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-on-surface">{order.customerName}</p>
                <p className="text-on-surface-variant">{order.customerEmail}</p>
                <p className="text-on-surface-variant">{order.customerPhone}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 border-t border-outline/10 pt-2">
              <Store className="size-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-on-surface">{t("admin.orders.storeLabel")} {order.sellerName}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 border-t border-outline/10 pt-2">
              <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-on-surface">{t("admin.orders.shippingAddress")}</p>
                <p className="text-on-surface-variant leading-relaxed">{order.shippingAddress}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Itemized Purchased Products */}
        {order.items && (
          <div className="rounded-2xl bg-surface p-5 border border-outline/10 neomorph-raised space-y-2 text-xs">
            <h5 className="font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline/10 pb-2">
              {t("admin.orders.purchasedItemsHeading", { count: order.itemsCount })}
            </h5>
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-1 border-b border-outline/10 last:border-none">
                <div>
                  <p className="font-bold text-on-surface">{item.name}</p>
                  <p className="text-on-surface-variant text-[11px]">{t("admin.orders.qtyLabel")} {item.qty}</p>
                </div>
                <span className="font-extrabold text-on-surface">{item.price}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
}
