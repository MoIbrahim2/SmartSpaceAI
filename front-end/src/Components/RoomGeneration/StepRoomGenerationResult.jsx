import Icon from "../Icon";

const StepRoomGenerationResult = ({ setStep, regenerating, handleRegenerate }) => {
  return (
    <div className="bg-background rounded-[2rem] p-8 lg:p-10 neomorph-raised flex-grow flex flex-col">
      <h1 className="text-2xl font-headline font-bold text-on-surface mb-6">Step Four: Room Generation</h1>

      {/* Generated Image Display */}
      <div className="flex-grow bg-background rounded-2xl neomorph-inset overflow-hidden flex items-center justify-center min-h-[400px] mb-6 relative">
        {regenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
            <p className="text-sm font-semibold text-on-surface-variant">Generating room design...</p>
          </div>
        )}
        <img
          alt="Generated Room Design"
          className="absolute inset-0 w-full h-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBctRhrGBR_YHequ3s9nUysqcgrZlNApIAluJfWha4tajWObXOU8iSUVDlGw5qh21v0e1I1jGar8UvIZSkCRe7KB4YJJTmqC3unTNFhsbLNOE8B7WJqMf6tn9nieR6Tl8eie8BIW1Rfq_hvm3PD3nPUSZAnnxQ7cezaC3EGat4h8ieXshouNQXtlAxpRDtHCwMjsFh72CJNethK7Fjvh-rSRaOzLZLz4GoiviZDOKNNI-CafJDEcMETIE2Kl5ryORvfOQ"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 mt-auto pt-4 border-t border-outline-variant/20">
        <button
          onClick={() => setStep(3)}
          className="px-6 py-2.5 rounded-xl bg-background text-on-surface-variant font-semibold text-sm transition-all neomorph-raised hover:text-on-surface active:neomorph-inset"
        >
          Go Back
        </button>
        <button
          onClick={handleRegenerate}
          className="px-6 py-2.5 rounded-xl bg-background text-on-surface-variant font-semibold text-sm transition-all neomorph-raised hover:text-on-surface active:neomorph-inset"
        >
          Regenerate
        </button>
        <button
          onClick={() => alert("Process Finished!")}
          className="px-6 py-2.5 rounded-xl bg-background text-primary font-bold text-sm transition-all neomorph-raised hover:text-primary-variant active:neomorph-inset flex items-center gap-2"
        >
          Finish
          <Icon name="check" size={18} className="text-primary" />
        </button>
      </div>
    </div>
  );
};

export default StepRoomGenerationResult;
