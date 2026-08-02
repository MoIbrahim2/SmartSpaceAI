import { Clock } from "lucide-react";
import SectionHeader from "../Shared/SectionHeader";

export default function ActivityFeed({ activities = [] }) {
  return (
    <div className="rounded-2xl bg-surface p-5 border border-outline/10 neomorph-raised space-y-4">
      <SectionHeader title="Recent Platform Activity" icon={Clock} />
      <div className="space-y-4">
        {activities.map((act) => (
          <div key={act.id} className="flex gap-3 text-sm">
            <div className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
            <div>
              <p className="font-semibold text-on-surface">{act.title}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{act.desc}</p>
              <span className="text-[11px] text-outline mt-1 block">{act.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
