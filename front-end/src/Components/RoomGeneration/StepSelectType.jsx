import Icon from "../Icon";

const StepSelectType = ({ setForm, setStep, error }) => {
  return (
    <main className="relative flex flex-grow flex-col items-center justify-center overflow-hidden bg-background p-8 md:p-12 lg:p-16">
      <div className="relative z-10 mb-16 text-center">
        <h1 className="mb-6 text-4xl font-bold uppercase tracking-tight text-on-surface md:text-5xl">
          Room Generation
        </h1>
        <p className="mx-auto max-w-lg text-lg text-on-surface-variant">
          Transform your living spaces with AI-powered interior design. Start from a blank canvas or enhance your existing room photos.
        </p>
      </div>

      {error && (
        <div className="relative z-10 mb-6 w-full max-w-md rounded-xl bg-error/10 px-5 py-3 text-sm font-medium text-error">
          {error}
        </div>
      )}

      <div className="relative z-10 grid w-full max-w-5xl grid-cols-1 gap-12 md:grid-cols-2">
        <button
          onClick={() => {
            setForm((p) => ({ ...p, generationType: "CREATE_FROM_SCRATCH" }));
            setStep(1);
          }}
          className="group relative flex min-h-[22rem] cursor-pointer flex-col items-center justify-center rounded-[2rem] bg-background p-12 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] active:neomorph-inset neomorph-raised"
        >
          <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-background text-primary neomorph-inset">
            <Icon name="auto_awesome" size={48} />
          </div>
          <h3 className="mb-4 text-2xl font-bold text-on-surface">Create from Scratch</h3>
          <p className="mb-8 text-center leading-relaxed text-on-surface-variant">
            Generate entirely new room concepts using our advanced AI engine. Input dimensions, style preferences, and mood.
          </p>
          <div className="rounded-xl px-8 py-3 font-bold text-primary transition-all duration-300 group-active:neomorph-inset neomorph-raised">
            Get Started
          </div>
        </button>

        <button
          onClick={() => {
            setForm((p) => ({ ...p, generationType: "ENHANCE_ROOM" }));
            setStep(1);
          }}
          className="group relative flex min-h-[22rem] cursor-pointer flex-col items-center justify-center rounded-[2rem] bg-background p-12 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] active:neomorph-inset neomorph-raised"
        >
          <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-background text-tertiary neomorph-inset">
            <Icon name="photo_camera" size={48} />
          </div>
          <h3 className="mb-4 text-2xl font-bold text-on-surface">Enhance Room</h3>
          <p className="mb-8 text-center leading-relaxed text-on-surface-variant">
            Upload a photo of your current space and let SmartSpace AI reimagine the furniture, lighting, and decor seamlessly.
          </p>
          <div className="rounded-xl px-8 py-3 font-bold text-tertiary transition-all duration-300 group-active:neomorph-inset neomorph-raised">
            Upload Photo
          </div>
        </button>
      </div>

      <div className="pointer-events-none fixed left-0 top-1/4 -z-10 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />
      <div className="pointer-events-none fixed bottom-1/4 right-0 -z-10 h-96 w-96 rounded-full bg-tertiary/5 blur-[120px]" />
    </main>
  );
};

export default StepSelectType;
