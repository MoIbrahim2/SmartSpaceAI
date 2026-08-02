import { CheckCircle2, Clock, Ban, AlertTriangle, PackageCheck, Truck, XCircle } from "lucide-react";

export default function StatusBadge({ status }) {
  let badgeClass = "bg-surface-bright text-on-surface-variant";
  let IconComp = Clock;

  switch (status) {
    case "Verified":
    case "Approved":
    case "Completed":
    case "Paid":
      badgeClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
      IconComp = CheckCircle2;
      break;
    case "Pending Verification":
    case "Pending Review":
    case "Pending":
      badgeClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      IconComp = Clock;
      break;
    case "Processing":
    case "Shipped":
      badgeClass = "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      IconComp = status === "Shipped" ? Truck : PackageCheck;
      break;
    case "Suspended":
    case "Rejected":
    case "Cancelled":
      badgeClass = "bg-error/10 text-error";
      IconComp = status === "Suspended" ? Ban : XCircle;
      break;
    case "Flagged Issues":
      badgeClass = "bg-amber-500/10 text-amber-600";
      IconComp = AlertTriangle;
      break;
    default:
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${badgeClass}`}
    >
      <IconComp className="size-3.5 shrink-0" />
      <span>{status}</span>
    </span>
  );
}
