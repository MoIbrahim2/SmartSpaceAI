import { Link } from "react-router-dom";
import Icon from "./Icon";
import { API_HOST } from "../api";
import { useTranslation } from "react-i18next";

export default function ApartmentCard({ apartment }) {
  const { t } = useTranslation();

  const locationStr = apartment.location
    ? [apartment.location.city, apartment.location.district, apartment.location.street]
      .filter(Boolean)
      .join(", ") || "Location not specified"
    : "Location not specified";

  return (
    <div className="group overflow-hidden rounded-[1.75rem] bg-surface dark:bg-[#12100e] border border-outline/15 dark:border-white/10 shadow-md transition-all duration-300 hover:shadow-2xl hover:scale-[1.015] text-on-surface dark:text-white flex flex-col">
      <div className="relative m-3 aspect-[16/10] overflow-hidden rounded-2xl bg-surface-variant dark:bg-white/5">
        <img
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          src={
            apartment.coverImage?.url
              ? (apartment.coverImage.url.startsWith("http")
                ? apartment.coverImage.url
                : `${API_HOST}/${apartment.coverImage.url.startsWith("/") ? apartment.coverImage.url.slice(1) : apartment.coverImage.url}`)
              : apartment.image ||
              "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80"
          }
          alt={apartment.name}
          width={400}
          height={250}
          loading="lazy"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between p-6 pt-2">
        <div>
          <h3 className="mb-2 text-xl font-headline font-extrabold text-on-surface dark:text-white line-clamp-1 leading-snug">
            {apartment.name}
          </h3>

          <p className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant dark:text-white/70">
            <Icon name="location_on" size={18} className="text-[#a67443] dark:text-amber-400 shrink-0" />
            <span className="truncate">{locationStr}</span>
          </p>
        </div>

        <Link
          to={`/apartments/${apartment._id}`}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#a67443] hover:bg-[#946334] text-white font-bold text-base shadow-md shadow-[#a67443]/20 transition-all active:scale-[0.99]"
        >
          <span>{t("common.viewDetails") || "View Details"}</span>
          <Icon name="arrow_forward" size={18} className="rtl:rotate-180" />
        </Link>
      </div>
    </div>
  );
}
