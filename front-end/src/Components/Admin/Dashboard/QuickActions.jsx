import { UserPlus, ShieldAlert, PieChart, Settings } from "lucide-react";
import { Link } from "react-router-dom";

export default function QuickActions({ onCreateSeller }) {
  return (
    <div className="rounded-2xl bg-surface p-5 border border-outline/10 neomorph-raised space-y-3">
      <h3 className="font-extrabold text-base text-on-surface tracking-tight">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onCreateSeller}
          className="flex items-center gap-2.5 rounded-xl bg-surface-bright p-3 text-xs font-bold text-on-surface hover:text-primary border border-outline/20 hover:neomorph-inset transition-all"
        >
          <UserPlus className="size-4 text-primary shrink-0" />
          <span>Add New Seller</span>
        </button>

        <Link
          to="/admin/moderation"
          className="flex items-center gap-2.5 rounded-xl bg-surface-bright p-3 text-xs font-bold text-on-surface hover:text-primary border border-outline/20 hover:neomorph-inset transition-all"
        >
          <ShieldAlert className="size-4 text-primary shrink-0" />
          <span>Review Moderation</span>
        </Link>

        <Link
          to="/admin/commissions"
          className="flex items-center gap-2.5 rounded-xl bg-surface-bright p-3 text-xs font-bold text-on-surface hover:text-primary border border-outline/20 hover:neomorph-inset transition-all"
        >
          <PieChart className="size-4 text-primary shrink-0" />
          <span>View Reports</span>
        </Link>

        <Link
          to="/admin/settings"
          className="flex items-center gap-2.5 rounded-xl bg-surface-bright p-3 text-xs font-bold text-on-surface hover:text-primary border border-outline/20 hover:neomorph-inset transition-all"
        >
          <Settings className="size-4 text-primary shrink-0" />
          <span>System Settings</span>
        </Link>
      </div>
    </div>
  );
}
