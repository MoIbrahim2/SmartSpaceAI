import Icon from "../Icon";

export default function EmptyState({ icon = "inbox", title = "No data found", description = "There are no items to display right now." }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-surface neo-inset">
        <Icon name={icon} size={48} className="text-outline" />
      </div>
      <h3 className="mb-2 text-2xl font-bold text-on-surface">{title}</h3>
      <p className="max-w-md text-on-surface-variant">{description}</p>
    </div>
  );
}
