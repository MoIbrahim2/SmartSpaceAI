import { Inbox } from "lucide-react";

export default function EmptyState({
  title = "No data found",
  description = "There are no records matching your current filter criteria.",
  icon: IconComponent = Inbox,
  actionText,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-surface p-12 text-center border border-outline/10 neomorph-raised">
      <div className="rounded-full bg-primary/10 p-4 text-primary mb-4 neo-shadow">
        <IconComponent className="size-8" />
      </div>
      <h4 className="text-lg font-bold text-on-surface tracking-tight">{title}</h4>
      <p className="mt-1 max-w-sm text-sm text-on-surface-variant">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white neo-shadow hover:bg-primary/90 transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
