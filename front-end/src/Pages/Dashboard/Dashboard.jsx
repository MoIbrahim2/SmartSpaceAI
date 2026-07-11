import { Link } from "react-router-dom";
import ApartmentCard from "../../Components/ApartmentCard";
const apartments = [
  {
    name: "Skyline Penthouse",
    location: "Downtown District, Level 42",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBRsRfcEqvTefZ-N7JpxKqpj5aV7KAgI5g1cZYGbD6U49RbsIGdQfV1SeyZF2mCGvjuY6aBRlMlCJa6OGnVrQ4A_0kvKeAgK4YQUm-z6s-wiA9pAmhkCUf4KzbEqLlBPyBfdwNK_uwcIVFw-T9gr3JTEA_5SLinXl3yMZKe0boO99e2JKbOsWRNr7upjdDVfGGwaOPVk8Cyl_MgzF3ZJrAkJxX40qRmDTzFYDzbz4aayqTXYio9CNu3",
  },
  {
    name: "Willow Creek Studio",
    location: "North Greenbelt, Garden St.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCu1ndOA6On1Z16xKyNZcJ4TELzr37m25LqMXCEXPhZQcJD-zfiGnW8W_3YUv4XPfC8z2YZhXMwUJjVeyJJ_kxZCqd2e9TRmaCbd88-XsLCGXA6eem2k7N07YpYoYq7zBwdAbrJ0as6k7QG70wpjpwDODLtKiQoGlgA02Y8N2RqdK2b6Y6OGVCBtJjCLSKNboMI53riRU9Iye9-l5OzZ3wNMO38zdn0mgDmc3v5Gg0YOjNFlmv_GRp9",
  },
  {
    name: "Sunset Garden Unit",
    location: "South Park, Terrace Way",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCQGk9gyLoNGEaa1HxKwIWwd7heGFIKU7OfWUYeOlEt0AswSxGV4t5UGDBC4SAROA2ZzkoA_HWQUDiHyLgpbSnBRDuPRagJwT_NV9MP2c1BJ4jm6Dbcud-5vyRl_t7Snxv91dF8B4nwUM3INUkYvB1yGZGbvDzO41Wq7S7OXzI7RN7Em1zTSybC7fsDY6a6ws2faFB6fwD5T-XiejJYOtYsux4uFh8EsMa5IyE9D0srtjOgpqvWRhQt",
  },
];

const Dashboard = () => {
  return (
    <div className="flex min-h-screen flex-col bg-surface-bright text-on-surface font-body">
      <main className="mx-auto w-full max-w-[1200px] flex-grow px-6 py-10 md:px-20">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl flex-1">
            <div className="relative flex h-14 items-center rounded-full bg-surface-bright px-6 neo-inset">
              <span className="material-symbols-outlined text-outline">
                search
              </span>
              <input
                className="ml-3 w-full bg-transparent text-base text-on-surface placeholder:text-outline outline-none border-none focus:outline-none focus:border-none focus:ring-0 focus:ring-transparent"
                placeholder="Search your apartments..."
                type="text"
                aria-label="Search apartments"
                autoComplete="off"
                name="search"
              />
            </div>
          </div>
          <Link
            className="flex h-14 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-8 font-bold text-white transition-all hover:bg-on-primary-fixed-variant neo-shadow neo-button"
            to="/room-generation"
          >
            <span className="material-symbols-outlined">add</span>
            Create New Apartment
          </Link>
        </div>

        <h2 className="mb-8 text-3xl font-extrabold tracking-tight text-on-surface">
          My Apartments
        </h2>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {apartments.map((apartment) => (
            <ApartmentCard key={apartment.name} apartment={apartment} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
