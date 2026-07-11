import { Link } from "react-router-dom";

const dobFormat = (date) =>
  new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);

const Profile = () => {
  return (
    <div className="flex min-h-screen flex-col bg-surface-bright text-on-surface font-body">
      
      <main className="mx-auto w-full max-w-[1200px] flex-grow px-6 py-10 md:px-20">
        <div className="flex flex-col gap-12 md:flex-row">
          <aside className="w-full space-y-6 md:w-64">
            <div className="flex flex-col gap-2 rounded-3xl bg-surface-bright p-6 neo-shadow">
              <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-bold text-primary neo-inset">
                <span className="material-symbols-outlined">person</span>
                <span>Profile</span>
              </button>
              <Link
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-on-surface-variant transition-all hover:text-primary neo-button"
                to="/credits"
              >
                <span className="material-symbols-outlined">payments</span>
                <span>Billing</span>
              </Link>
            </div>

            <div className="mt-6 rounded-3xl bg-surface-bright p-6 neo-shadow">
              <p className="mb-2 text-sm font-semibold text-on-surface-variant">Available Credits</p>
              <div className="mb-4 text-3xl font-extrabold text-primary">
                420 <span className="text-sm font-semibold text-on-surface-variant">/ 500</span>
              </div>
              <div className="mb-3 h-3 w-full overflow-hidden rounded-full neo-inset">
                <div className="h-full w-[84%] rounded-full bg-primary neo-shadow" />
              </div>
              <p className="text-[10px] font-semibold text-on-surface-variant opacity-70">Next reset on Jan 12, 2025</p>
            </div>
          </aside>

          <section className="flex-grow">
            <div className="rounded-3xl bg-surface-bright p-8 neo-shadow md:p-12">
              <form className="space-y-8">
                <div className="flex flex-col items-start gap-4">
                  <label className="px-1 text-sm font-semibold text-on-surface-variant">Profile Photo</label>
                  <div className="flex items-center gap-8">
                    <div className="group relative">
                      <div className="h-32 w-32 rounded-full p-2 neo-inset">
                        <div className="relative h-full w-full overflow-hidden rounded-full neo-shadow">
                          <img
                            className="h-full w-full object-cover"
                            alt="Profile"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDiLUchOQJez1yJGaA_8LNiL93_YXiYpDBZqIm0Lp7dFkEKnSfb1CYDyV_3bENypNDic3lxNErAWmlHwLssd4YjVxFta4M83i720zSao8f07KmA1-x_H0DKBmhBZlVLRNP987IISxMs8FiUJ_lzfsoHe9Kyzs9GG7axLBBZjyiIgVSoYOrtH9gKbaf9LSh7_Y5BkbqmaC7Hb6TrXvWmpDgzm8lU3Kg7CBxMzV_GTrIaNm2siMP1aDRa"
                          />
                        </div>
                      </div>
                      <button className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white neo-shadow neo-button" type="button" aria-label="Edit profile photo">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                    </div>
                    <div className="space-y-4">
                      <button className="rounded-full bg-surface-bright px-6 py-2 text-sm font-bold text-primary neo-shadow neo-button" type="button">
                        Upload New Photo
                      </button>
                      <p className="text-xs font-medium text-on-surface-variant">JPG, GIF or PNG. Max size 2MB</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="px-1 text-sm font-semibold text-on-surface-variant" htmlFor="first_name">
                      First Name
                    </label>
                    <input
                      className="w-full rounded-2xl border-none bg-surface-bright px-6 py-4 text-on-surface placeholder-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 neo-inset"
                      id="first_name"
                      type="text"
                      defaultValue="Alexander"
                      autoComplete="given-name"
                      name="firstName"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="px-1 text-sm font-semibold text-on-surface-variant" htmlFor="last_name">
                      Last Name
                    </label>
                    <input
                      className="w-full rounded-2xl border-none bg-surface-bright px-6 py-4 text-on-surface placeholder-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 neo-inset"
                      id="last_name"
                      type="text"
                      defaultValue="Hamilton"
                      autoComplete="family-name"
                      name="lastName"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="px-1 text-sm font-semibold text-on-surface-variant" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    className="w-full rounded-2xl border-none bg-surface-bright px-6 py-4 text-on-surface placeholder-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 neo-inset"
                    id="email"
                    type="email"
                    defaultValue="alex.hamilton@smartspace.ai"
                    autoComplete="email"
                    name="email"
                  />
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="px-1 text-sm font-semibold text-on-surface-variant" htmlFor="dob">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <input
                        className="w-full rounded-2xl border-none bg-surface-bright px-6 py-4 text-on-surface placeholder-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 neo-inset"
                        id="dob"
                        type="text"
                        defaultValue={dobFormat(new Date("1992-11-01"))}
                        autoComplete="bday"
                        name="dateOfBirth"
                      />
                      <span className="material-symbols-outlined pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-on-surface-variant">
                        calendar_today
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-8">
                  <button className="text-sm font-bold text-error transition-colors hover:text-error/80" type="button">
                    Discard changes
                  </button>
                  <button className="rounded-full bg-surface-bright px-10 py-3 font-bold tracking-wide text-primary neo-shadow neo-button" type="submit">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Profile;
