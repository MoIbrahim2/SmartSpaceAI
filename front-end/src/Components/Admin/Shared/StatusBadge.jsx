import { useTranslation } from "react-i18next";
import {
  CheckCircle2,
  Clock,
  Ban,
  AlertTriangle,
  PackageCheck,
  Truck,
  XCircle,
  Sparkles,
  ShieldAlert,
} from "lucide-react";

export default function StatusBadge({ status }) {
  const { t } = useTranslation();
  if (!status) return null;

  const upperStatus = String(status).toUpperCase().trim();
  let badgeClass = "bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20";
  let IconComp = Clock;

  switch (upperStatus) {
    case "ACTIVE":
    case "VERIFIED":
    case "APPROVED":
    case "COMPLETED":
    case "PAID":
    case "ACCEPTED":
    case "DELIVERED":
      badgeClass = "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/20 shadow-sm";
      IconComp = upperStatus === "DELIVERED" ? Truck : CheckCircle2;
      break;

    case "PENDING_ACTIVATION":
    case "PENDING VERIFICATION":
    case "PENDING REVIEW":
    case "PENDING":
    case "UNPAID":
      badgeClass = "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/20 shadow-sm";
      IconComp = upperStatus.includes("ACTIVATION") ? ShieldAlert : Clock;
      break;

    case "PENDING_AI_VALIDATION":
    case "MANUAL_REVIEW_REQUIRED":
    case "FLAGGED ISSUES":
      badgeClass = "bg-indigo-500/15 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-500/20 shadow-sm";
      IconComp = upperStatus.includes("AI") ? Sparkles : AlertTriangle;
      break;

    case "PROCESSING":
    case "SHIPPED":
      badgeClass = "bg-sky-500/15 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 border border-sky-500/20 shadow-sm";
      IconComp = upperStatus === "SHIPPED" ? Truck : PackageCheck;
      break;

    case "SUSPENDED":
    case "REJECTED":
    case "CANCELLED":
      badgeClass = "bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-500/20 shadow-sm";
      IconComp = upperStatus === "SUSPENDED" ? Ban : XCircle;
      break;

    default:
      break;
  }

  const fallbackLabel = formatStatusLabel(status);
  const label = t(`status.${upperStatus}`, { defaultValue: fallbackLabel });

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition-all ${badgeClass}`}
    >
      <IconComp className="size-3.5 shrink-0" />
      <span>{label}</span>
    </span>
  );
}

function formatStatusLabel(rawStatus) {
  if (!rawStatus) return "";
  const stringStatus = String(rawStatus);
  if (stringStatus === "PENDING_ACTIVATION") return "Pending Activation";
  if (stringStatus === "PENDING_AI_VALIDATION") return "Pending AI Validation";
  if (stringStatus === "MANUAL_REVIEW_REQUIRED") return "Manual Review Required";
  if (stringStatus === "ACTIVE") return "Active";
  if (stringStatus === "UNPAID") return "Unpaid";
  if (stringStatus === "PAID") return "Paid";
  if (stringStatus === "DELIVERED") return "Delivered";
  if (stringStatus === "REJECTED") return "Rejected";
  if (stringStatus === "ACCEPTED") return "Accepted";
  if (stringStatus === "PROCESSING") return "Processing";

  if (stringStatus.includes("_") || stringStatus === stringStatus.toUpperCase()) {
    return stringStatus
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return stringStatus;
}
