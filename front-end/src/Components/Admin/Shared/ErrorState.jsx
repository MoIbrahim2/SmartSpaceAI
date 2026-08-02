import { AlertCircle, RefreshCcw } from "lucide-react";

export default function ErrorState({
  title = "Failed to load data",
  description = "An unexpected error occurred while fetching information.",
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-surface p-10 text-center border border-error/20 neomorph-raised">
      <div className="rounded-full bg-error/10 p-4 text-error mb-4 neo-shadow">
        <AlertCircle className="size-8" />
      </div>
      <h4 className="text-lg font-extrabold text-on-surface tracking-tight">{title}</h4>
      <p className="mt-1 max-w-sm text-sm text-on-surface-variant leading-relaxed">
        {description}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 flex items-center gap-2 rounded-xl bg-error px-5 py-2.5 text-sm font-semibold text-white neo-shadow hover:bg-error/90 transition-all"
        >
          <RefreshCcw className="size-4" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}
