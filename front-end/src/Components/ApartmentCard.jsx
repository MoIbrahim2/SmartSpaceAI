import { Link } from "react-router-dom";
import Icon from "./Icon";

export default function ApartmentCard({ apartment }) {
  const locationStr = apartment.location
    ? [apartment.location.city, apartment.location.district, apartment.location.street]
        .filter(Boolean)
        .join(", ") || "Location not specified"
    : "Location not specified";

  return (
    <div className="group overflow-hidden rounded-3xl bg-surface-bright transition-transform duration-300 hover:scale-[1.02] neo-shadow">
      <div className="relative m-2 aspect-video overflow-hidden rounded-2xl">
        <img
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          src={
            apartment.coverImage?.url
              ? (apartment.coverImage.url.startsWith("http")
                  ? apartment.coverImage.url
                  : `http://localhost:3000/${apartment.coverImage.url}`)
              : apartment.image ||
                "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80"
          }
          alt={apartment.name}
          width={400}
          height={225}
          loading="lazy"
        />
      </div>

      <div className="p-6">
        <h3 className="mb-1 text-xl font-bold text-on-surface">
          {apartment.name}
        </h3>

        <p className="flex items-center gap-1 text-on-surface-variant">
          <Icon name="location_on" size={16} />
          {locationStr}
        </p>

        <Link
          to={`/apartments/${apartment._id}`}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-surface-bright px-4 py-2 text-sm font-bold text-primary transition-all hover:scale-[1.02] neo-shadow neo-button"
        >
          View Details
          <Icon name="arrow_forward" size={14} />
        </Link>
      </div>
    </div>
  );
}
