import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import SectionHeader from "../Shared/SectionHeader";

export default function NotificationsWidget({ items = [] }) {
  const [list, setList] = useState(items);

  const markAllRead = () => {
    setList((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  return (
    <div className="rounded-2xl bg-surface p-5 border border-outline/10 neomorph-raised space-y-4">
      <SectionHeader
        title="Latest Notifications"
        icon={Bell}
        action={
          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <CheckCheck className="size-3.5" />
            <span>Mark all read</span>
          </button>
        }
      />

      <div className="space-y-3">
        {list.map((item) => (
          <div
            key={item.id}
            className={`p-3 rounded-xl border border-outline/10 transition-all ${
              item.read ? "bg-surface-bright/40 opacity-70" : "bg-surface-bright border-l-4 border-l-primary"
            }`}
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-on-surface">{item.title}</h4>
              <span className="text-[10px] text-outline">{item.time}</span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1 leading-snug">{item.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
