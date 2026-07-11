import { Link } from "react-router-dom";

const RoomGeneration = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface">


      <main className="relative flex flex-grow flex-col items-center justify-center overflow-hidden bg-background p-8 md:p-12 lg:p-16">
        <div className="relative z-10 mb-16 text-center">
          <h1 className="mb-6 text-4xl font-bold uppercase tracking-tight text-on-surface md:text-5xl">
            Room Generation
          </h1>
          <p className="mx-auto max-w-lg text-lg text-on-surface-variant">
            Transform your living spaces with AI-powered interior design. Start from a blank canvas or enhance your existing room photos.
          </p>
        </div>
        <div className="relative z-10 grid w-full max-w-5xl grid-cols-1 gap-12 md:grid-cols-2">
          <Link
            className="group relative flex min-h-[22rem] cursor-pointer flex-col items-center justify-center rounded-[2rem] bg-background p-12 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] active:neomorph-inset neomorph-raised"
            to="/projects"
          >
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-background text-primary neomorph-inset">
              <span className="material-symbols-outlined !text-5xl">auto_awesome</span>
            </div>
            <h3 className="mb-4 text-2xl font-bold text-on-surface">Create from Scratch</h3>
            <p className="mb-8 text-center leading-relaxed text-on-surface-variant">
              Generate entirely new room concepts using our advanced AI engine. Input dimensions, style preferences, and mood.
            </p>
            <div className="rounded-xl px-8 py-3 font-bold text-primary transition-all duration-300 group-active:neomorph-inset neomorph-raised">
              Get Started
            </div>
          </Link>

          <Link
            className="group relative flex min-h-[22rem] cursor-pointer flex-col items-center justify-center rounded-[2rem] bg-background p-12 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] active:neomorph-inset neomorph-raised"
            to="/projects"
          >
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-background text-tertiary neomorph-inset">
              <span className="material-symbols-outlined !text-5xl">photo_camera</span>
            </div>
            <h3 className="mb-4 text-2xl font-bold text-on-surface">Enhance Room</h3>
            <p className="mb-8 text-center leading-relaxed text-on-surface-variant">
              Upload a photo of your current space and let SmartSpace AI reimagine the furniture, lighting, and decor seamlessly.
            </p>
            <div className="rounded-xl px-8 py-3 font-bold text-tertiary transition-all duration-300 group-active:neomorph-inset neomorph-raised">
              Upload Photo
            </div>
          </Link>
        </div>

        <div className="pointer-events-none fixed left-0 top-1/4 -z-10 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />
        <div className="pointer-events-none fixed bottom-1/4 right-0 -z-10 h-96 w-96 rounded-full bg-tertiary/5 blur-[120px]" />
      </main>

      <div className="fixed bottom-8 left-1/2 z-40 flex w-[90%] -translate-x-1/2 items-center justify-around rounded-2xl bg-background p-4 neomorph-raised md:hidden">
        <button className="rounded-xl p-3 text-on-surface-variant transition-all active:neomorph-inset" aria-label="Apartments">
          <span className="material-symbols-outlined">domain</span>
        </button>
        <button className="rounded-xl p-3 text-primary transition-all neomorph-inset" aria-label="Room generation">
          <span className="material-symbols-outlined">auto_awesome</span>
        </button>
        <button className="rounded-xl p-3 text-on-surface-variant transition-all active:neomorph-inset" aria-label="Profile">
          <span className="material-symbols-outlined">person</span>
        </button>
      </div>
    </div>
  );
};

export default RoomGeneration;
