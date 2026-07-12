const icons = import.meta.glob("../assets/icons/*.svg", { eager: true, query: "?raw", import: "default" });

export default function Icon({ name, size = 24, className = "" }) {
  const svgContent = icons[`../assets/icons/${name}.svg`];
  if (!svgContent) return null;

  const cleaned = svgContent
    .replace(/\s*(width|height)="[^"]*"/g, "")
    .replace("<svg", `<svg width="${size}" height="${size}"`);

  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
      dangerouslySetInnerHTML={{ __html: cleaned }}
    />
  );
}
