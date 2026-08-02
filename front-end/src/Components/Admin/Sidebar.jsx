import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  PieChart,
  ShieldCheck,
  ShoppingBag,
  Settings as SettingsIcon,
  X,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Sellers", path: "/admin/sellers", icon: Users },
  { label: "Commissions", path: "/admin/commissions", icon: PieChart },
  { label: "Moderation Queue", path: "/admin/moderation", icon: ShieldCheck },
  { label: "Orders", path: "/admin/orders", icon: ShoppingBag },
  { label: "Settings", path: "/admin/settings", icon: SettingsIcon },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-surface-bright p-5 neo-shadow transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col justify-between`}
      >
        <div>
          {/* Logo & Mobile Close */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-outline/10">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-xl bg-primary p-2.5 text-white neo-shadow">
                <ShieldCheck className="size-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-on-surface">
                  SmartSpace
                </h2>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Admin Portal
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-xl text-on-surface-variant hover:text-primary transition-all neo-shadow neo-button"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive =
                item.path === "/admin"
                  ? location.pathname === "/admin"
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-primary text-white neo-shadow"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container"
                  }`}
                >
                  <IconComponent className="size-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-outline/10 text-center">
          <div className="rounded-xl p-3 bg-surface text-xs text-on-surface-variant font-medium">
            <p>SmartSpace AI v2.4</p>
            <p className="text-[11px] text-outline mt-0.5">Admin Control Center</p>
          </div>
        </div>
      </aside>
    </>
  );
}
