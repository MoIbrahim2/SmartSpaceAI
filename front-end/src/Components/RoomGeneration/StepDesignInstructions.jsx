import Icon from "../Icon";

const StepDesignInstructions = ({ form, setForm, setStep }) => {
  return (
    <div className="bg-background rounded-[2rem] p-8 lg:p-10 neomorph-raised flex-grow flex flex-col">
      <header className="mb-8">
        <h1 className="font-headline text-2xl font-bold text-on-surface mb-2">Step Two: Design Instructions</h1>
      </header>

      {/* Instructions Panel */}
      <div className="bg-background rounded-2xl p-6 neomorph-inset mb-8 border border-surface-container-low">
        <div className="flex gap-4">
          <div className="text-primary mt-1 shrink-0">
            <Icon name="auto_awesome" size={28} />
          </div>
          <div>
            <h3 className="font-headline font-semibold text-lg text-on-surface mb-2">How to write a prompt for designing the room</h3>
            <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-4">
              Be as descriptive as possible. Mention specific styles (e.g., Mid-Century Modern, Industrial, Minimalist), color palettes, and the overall mood you want to achieve. Include any specific functional requirements or focal points you desire.
            </p>
            <div className="bg-background rounded-xl p-4 neomorph-raised inline-block text-left">
              <span className="text-xs font-bold text-primary uppercase tracking-wider mb-1 block">Example Prompt</span>
              <p className="font-body text-sm text-on-surface-variant italic leading-relaxed">
                "A cozy, minimalist living room with large windows letting in natural light. A neutral color palette focusing on warm beiges and soft whites, with a statement olive green velvet sofa. Include plenty of indoor plants and a light oak coffee table."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Prompt Input Area */}
      <div className="flex-grow flex flex-col gap-2 mb-8">
        <label className="font-headline font-semibold text-on-surface ml-2" htmlFor="prompt-input">Your Design Instructions</label>
        <textarea
          className="w-full flex-grow min-h-[200px] bg-background border-none rounded-xl p-6 font-body text-on-surface placeholder:text-on-surface-variant/50 focus:ring-0 focus:outline-none neomorph-inset resize-none transition-shadow"
          id="prompt-input"
          placeholder="Describe your dream room here..."
          value={form.prompt}
          onChange={(e) => setForm((p) => ({ ...p, prompt: e.target.value }))}
        ></textarea>
      </div>

      {/* Navigation Action Buttons */}
      <div className="flex justify-between items-center mt-auto pt-4 border-t border-outline-variant/20">
        <button
          onClick={() => setStep(1)}
          className="px-6 py-3 rounded-xl font-headline font-semibold text-on-surface-variant bg-background neomorph-raised hover:text-primary active:neomorph-inset transition-all flex items-center gap-2"
        >
          <Icon name="arrow_forward" size={16} className="rotate-180" />
          Go Back
        </button>
        <button
          onClick={() => setStep(3)}
          className="px-8 py-3 rounded-xl font-headline font-semibold text-primary bg-background neomorph-raised hover:text-primary-variant active:neomorph-inset transition-all flex items-center gap-2 group"
        >
          Next
          <Icon name="arrow_forward" size={16} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};

export default StepDesignInstructions;
