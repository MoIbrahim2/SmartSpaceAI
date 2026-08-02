export default function SectionHeader({ title, subtitle, icon: IconComponent, action }) {
  return (
    <div className="flex items-center justify-between border-b border-outline/10 pb-3 mb-4">
      <div className="flex items-center gap-2.5">
        {IconComponent && <IconComponent className="size-5 text-primary shrink-0" />}
        <div>
          <h3 className="font-extrabold text-base text-on-surface tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-on-surface-variant">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
