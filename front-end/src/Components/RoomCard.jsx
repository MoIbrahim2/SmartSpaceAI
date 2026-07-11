export default function RoomCard({ room }) {
  return (
    <div
      className="group flex flex-col rounded-3xl bg-background p-6 transition-shadow duration-300 hover:shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] neomorph-raised"
    >
      <div className="mb-6 aspect-[4/3] rounded-2xl bg-background p-2 neomorph-inset">
        <img
          className="h-full w-full rounded-xl object-cover"
          src={room.image}
          alt={room.name}
          width={400}
          height={300}
          loading="lazy"
        />
      </div>

      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-2xl font-bold text-on-surface">
          {room.name}
        </h3>
      </div>

      <p className="mb-6 flex-grow text-sm leading-relaxed text-on-surface-variant">
        Current Style:
        <span className="font-semibold text-primary">
          {" "}
          {room.style}
        </span>
        . {room.desc}
      </p>

      <div className="flex gap-4">
        <button className="flex-1 rounded-xl bg-background py-3 text-sm font-bold text-primary transition-shadow neomorph-active neomorph-raised">
          View Details
        </button>

        <button
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-background text-on-surface-variant transition-shadow neomorph-active neomorph-raised"
          aria-label="Edit room"
        >
          <span className="material-symbols-outlined">edit</span>
        </button>
      </div>
    </div>
  );
}