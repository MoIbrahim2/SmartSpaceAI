import Icon from "./Icon";
import { API_HOST } from "../api";
import { useTranslation } from "react-i18next";

export default function RoomCard({ room }) {
  const { t } = useTranslation();

  const firstImage = room.sourceImages?.[0]?.url
    ? (room.sourceImages[0].url.startsWith("http")
      ? room.sourceImages[0].url
      : `${API_HOST}/${room.sourceImages[0].url.startsWith("/") ? room.sourceImages[0].url.slice(1) : room.sourceImages[0].url}`)
    : room.image ||
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80";

  return (
    <div className="group flex flex-col overflow-hidden rounded-[1.75rem] bg-surface dark:bg-[#12100e] border border-outline/15 dark:border-white/10 shadow-md transition-all duration-300 hover:shadow-2xl hover:scale-[1.015] text-on-surface dark:text-white h-full">
      <div className="relative m-3 aspect-[16/10] overflow-hidden rounded-2xl bg-surface-variant dark:bg-white/5">
        <img
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          src={firstImage}
          alt={room.name}
          width={400}
          height={250}
          loading="lazy"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between p-6 pt-2">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-xl font-headline font-extrabold text-on-surface dark:text-white line-clamp-1 leading-snug">
              {room.name}
            </h3>
            {room.roomType && (
              <span className="shrink-0 rounded-full border border-[#a67443]/30 bg-[#a67443]/10 px-3 py-0.5 text-xs font-extrabold uppercase tracking-wider text-[#a67443] dark:text-amber-400">
                {room.roomType}
              </span>
            )}
          </div>

          <p className="mb-6 text-sm font-medium leading-relaxed text-on-surface-variant dark:text-white/70 line-clamp-2">
            {room.description || "No description provided."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#a67443] hover:bg-[#946334] text-white font-bold text-base shadow-md shadow-[#a67443]/20 transition-all active:scale-[0.99]">
            <span>{t("common.viewDetails") || "View Details"}</span>
            <Icon name="arrow_forward" size={18} className="rtl:rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}
