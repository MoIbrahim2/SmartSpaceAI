export default function LoadingState({ type = "table" }) {
  if (type === "cards") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 rounded-2xl bg-surface p-5 animate-pulse border border-outline/10 neomorph-raised"
          >
            <div className="h-4 w-24 bg-outline/20 rounded mb-4" />
            <div className="h-8 w-32 bg-outline/20 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-surface p-6 border border-outline/10 neomorph-raised animate-pulse space-y-4">
      <div className="h-10 bg-outline/20 rounded-xl w-full" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-12 bg-outline/15 rounded-xl w-full" />
      ))}
    </div>
  );
}
