import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthFooter from "../../Components/AuthFooter";
import AuthHeader from "../../Components/AuthHeader";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden text-on-surface selection:bg-primary selection:text-white">
      <AuthHeader />
      <main className="flex min-h-screen w-full flex-col pt-20 md:flex-row">
        <section className="relative flex h-64 w-full items-center justify-center overflow-hidden md:h-screen md:w-1/2">
          <div
            className="absolute inset-0 z-0 scale-105 bg-cover"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCHp4ZIqIomzFkHSjBBx14sVRUI7ZV5UQ2xYqSnT3TciafPr8JbngCQYkI9sjc7MNjDCoCOfVjAIzaz31KBUS1HAjI09UC6p5d-Kfaf-WBOiq5xLx9kT2lA5-UCViGPC45P6upgRaSSQleuHUmXKVTlbB6yd12GNfR4YENrCcjBsq5FnrHisUnpQV9hRwMQ0dF3q9EMCvJGtxRV1-gKlylmQZdPkco6kgTQH7iWAkE-1InA5ZadwwzI')",
            }}
          >
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
          </div>
          <div className="relative z-10 px-6 text-center">
            <h1 className="text-4xl font-headline font-extrabold tracking-tight text-white drop-shadow-2xl md:text-6xl">
              SmartSpace AI
            </h1>
            <p className="mx-auto mt-4 max-w-md text-lg font-medium text-white/90 drop-shadow-lg">
              Experience the future of interior design with intelligent spatial awareness.
            </p>
          </div>
        </section>

        <section className="flex w-full flex-col items-center justify-center overflow-y-auto bg-surface p-8 md:w-1/2 md:p-16 lg:p-24">
          <div className="w-full max-w-md">
            <header className="mb-10 pb-2 text-center md:text-left">
              <h3 className="text-3xl font-headline font-semibold text-on-surface">Welcome back</h3>
              <p className="mt-2 font-medium text-on-surface-variant">
                Access your AI-powered design studio
              </p>
            </header>
            <form
              className="space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                navigate("/room-generation");
              }}
            >
              <div className="flex flex-col gap-2">
                <label className="px-2 text-sm font-semibold text-on-surface-variant" htmlFor="login-email">Email Address</label>
                <div className="group relative flex items-center">
                  <span className="material-symbols-outlined absolute left-5 text-outline transition-colors group-focus-within:text-primary">
                    mail
                  </span>
                  <input
                    className="h-12 w-full rounded-full border-none bg-surface pl-14 pr-5 text-on-surface outline-none transition-all placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 neo-inset"
                    placeholder="name@company.com"
                    type="email"
                    autoComplete="email"
                    name="email"
                    id="login-email"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-2">
                  <label className="text-sm font-semibold text-on-surface-variant" htmlFor="login-password">Password</label>
                  <Link className="text-xs font-bold text-primary hover:underline" to="/login">
                    Forgot?
                  </Link>
                </div>
                <div className="group relative flex items-center">
                  <span className="material-symbols-outlined absolute left-5 text-outline transition-colors group-focus-within:text-primary">
                    lock
                  </span>
                  <input
                    className="h-12 w-full rounded-full border-none bg-surface pl-14 pr-12 text-on-surface outline-none transition-all placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 neo-inset"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    name="password"
                    id="login-password"
                  />
                  <button
                    className="absolute right-5 text-outline hover:text-on-surface focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:rounded"
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 px-2">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={remember}
                  onChange={() => setRemember((value) => !value)}
                />
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-surface neo-inset peer-checked:bg-primary/10">
                  <span className={`material-symbols-outlined text-[16px] font-bold text-primary ${remember ? "" : "hidden"}`}>
                    check
                  </span>
                </div>
                <span className="select-none text-sm font-medium text-on-surface-variant">
                  Remember this device
                </span>
              </label>

              <button
                className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-surface text-lg font-bold text-primary transition-all neo-raised neo-button-active"
                type="submit"
              >
                Sign In
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </form>

            <div className="mt-12 flex w-full max-w-md items-center gap-4">
              <div className="h-[2px] flex-1 bg-surface-container neo-inset" />
              <span className="px-2 text-xs font-semibold uppercase tracking-wider text-outline">
                Or continue with
              </span>
              <div className="h-[2px] flex-1 bg-surface-container neo-inset" />
            </div>

            <div className="mt-8 grid w-full max-w-md grid-cols-2 gap-6">
              <button className="group flex h-12 items-center justify-center gap-3 rounded-full bg-surface transition-all neo-raised neo-button-active">
                <img
                  alt="Google"
                  className="size-5 grayscale transition-all group-hover:grayscale-0"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1WHxP0IAmCNaoD_IGsba1bIXc0RaxQiF4cLTRC0OG21TTxTF4eGE_HARWI0oQHTnaE6W4A-vMoy35pKciHtWx8yaxdwD2UBkCfI3B_0XdRza7nwkmfacFmfXrEDX7eZl1ifM70OQOV9JihyK1Usm7c2_OYqkY2JMgPgkZl5pDT6yJQJqH-jL19Wqn_y6ph5LUSpuppDHVUV1cIVhBOplULNcDMJT7SzCTYn_zA3J-P2pkLhtuhUic"
                />
                <span className="text-sm font-semibold text-on-surface">Google</span>
              </button>
              <button className="group flex h-12 items-center justify-center gap-3 rounded-full bg-surface transition-all neo-raised neo-button-active">
                <span className="material-symbols-outlined text-on-surface grayscale transition-all group-hover:grayscale-0">
                  laptop_mac
                </span>
                <span className="text-sm font-semibold text-on-surface">Apple</span>
              </button>
            </div>

            <p className="mt-12 text-center text-sm font-medium text-on-surface-variant">
              New to SmartSpace?
              <Link className="ml-1 font-bold text-primary transition-all hover:underline" to="/register">
                Create an account
              </Link>
            </p>
          </div>
        </section>
      </main>
      <AuthFooter />
    </div>
  );
};

export default Login;
