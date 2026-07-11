import { Link } from "react-router-dom";
import RoomCard from "../../Components/RoomCard";
const rooms = [
  {
    name: "Living Room",
    style: "Modern Scandinavian",
    desc: "High-key lighting with a focus on tactile fabrics and minimalist layouts.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCqC5-6ikiK8h0bA7gUZM6hEYdvzHmRJx6PexmdhDlw8H3kE2ElDNuHZKRGcpTEBU2qNmANkgyxMmB-r79jNIs4ICDyaPFYzRhSwd1rWS-HJiwj9PNDM5eqhO02jnpYMn2eIDCRRiN4vuxcMIH9icVNcWQc9v-G-ybp1-JG-7yKKw0sQOBviRZjkus_NQXDaf6eFLBGozqHrvRc_wrlnlkcnT_-pyCWAhSdYNJTxRknXlGTSpUnrGaU",
  },
  {
    name: "Primary Bedroom",
    style: "Zen Minimalist",
    desc: "A calm, uncluttered sanctuary utilizing muted indigo accents and soft textures.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBz1oE3IEGSjpELuW-Uv4fJOAddONdl8UKcOhDk83277Jqe9wgy_Ba8ORkkrwgGWM1lWrjb4XbVcJuXwMPCaTkt8OvP5X9acAYWvqF2YSZVKeP2dRuK1mB4Cmk_R6PSaugKWV1_1QKaRUn06ARu-pYi8C71Gbh2xV_PXQ5J71Q-J3I3hR3rxV7AMacMKjzEKYBwKVCUmAhOGJraraOxSuGqDRd8KKv4-MmjJdsxH8ajM880gckLBPAM",
  },
  {
    name: "Modern Kitchen",
    style: "Industrial Chic",
    desc: "Sleek surfaces and functional layout with bold, violet-tinted accent lighting.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCY_oFPBhvtxjljuJcoHpvnQf-ruHohAOoFJeK2FpgXlcpH5j8mI42bT8ydRi8ghoKYI2DkSnsdQB1JBDxgMvlTB3aZil1jTfpH6W2JrOLUaRuNTGohhglISZLZ9hLpjLo2ovkV5zeieGDYAb0IE15DIYCrINhrdj4MRK-tH90BYTwIWLnbp0XP9Ulios6mXdCXZqIJud-BVi3EL9lWJ7IP27G5vhS7vjLP2bzrh6M_7BQruqipD_rb",
  },
];

const MyRooms = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface font-body">
      <main className="mx-auto w-full max-w-7xl flex-grow px-6 py-12">
        <div className="mb-16 text-center">
          <h2 className="mb-8 text-3xl font-extrabold tracking-tight text-on-surface">
            MY APARTMENT'S ROOMS
          </h2>
          <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-6 md:flex-row">
            <div className="max-w-xl flex-1">
              <div className="relative flex h-14 items-center rounded-full bg-background px-6 neomorph-inset">
                <span className="material-symbols-outlined text-outline">
                  search
                </span>
                <input
                  className="ml-3 w-full bg-transparent text-base text-on-surface placeholder:text-outline outline-none border-none focus:outline-none focus:border-none focus:ring-0 focus:ring-transparent"
                  placeholder="Search your rooms..."
                  type="text"
                  aria-label="Search rooms"
                  autoComplete="off"
                  name="search"
                />
              </div>
            </div>

            <Link
              to="/room-generation"
              className="flex h-14 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-8 font-bold text-white transition-all hover:bg-on-primary-fixed-variant neomorph-active neomorph-raised"
            >
              <span className="material-symbols-outlined">add</span>
              Create New Room
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard key={room.name} room={room} />
          ))}
        </div>
      </main>

      <div className="sticky bottom-0 left-0 z-50 flex w-full items-center justify-around bg-background p-4 shadow-[0_-6px_12px_rgba(0,0,0,0.05),0_-6px_12px_rgba(255,255,255,0.6)] md:hidden">
        <button
          className="flex flex-col items-center font-bold text-primary"
          aria-label="Apartments"
        >
          <span className="material-symbols-outlined">domain</span>
          <span className="mt-1 text-xs">Apartments</span>
        </button>
        <button
          className="flex flex-col items-center font-medium text-on-surface-variant"
          aria-label="Alerts"
        >
          <span className="material-symbols-outlined">notifications</span>
          <span className="mt-1 text-xs">Alerts</span>
        </button>
        <button
          className="flex flex-col items-center font-medium text-on-surface-variant"
          aria-label="Profile"
        >
          <span className="material-symbols-outlined">person</span>
          <span className="mt-1 text-xs">Profile</span>
        </button>
      </div>
    </div>
  );
};

export default MyRooms;
