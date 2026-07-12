import Icon from "./Icon";

const StudioFooter = () => {
  return (

      <footer className="mt-auto w-full rounded-t-3xl bg-background px-6 py-16 neomorph-raised md:px-12 lg:px-16">
        <div className="mx-auto mb-16 grid max-w-7xl grid-cols-1 gap-16 md:grid-cols-3">
          <div className="flex flex-col gap-6">
            <span className="text-2xl font-bold tracking-tight text-primary">SmartSpace AI</span>
            <p className="leading-relaxed text-on-surface-variant">
              Revolutionizing interior design through the power of intelligent spatial awareness and AI-driven creativity.
            </p>
          </div>
          <div className="flex flex-col gap-6">
            <h4 className="text-lg font-bold text-on-surface">Company</h4>
            <div className="flex flex-col gap-4">
              <a className="inline-block w-fit font-medium text-on-surface-variant transition-colors hover:text-primary" href="#">
                About Us
              </a>
              <a className="inline-block w-fit font-medium text-on-surface-variant transition-colors hover:text-primary" href="#">
                Contact Support
              </a>
              <a className="inline-block w-fit font-medium text-on-surface-variant transition-colors hover:text-primary" href="#">
                Careers
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <h4 className="text-lg font-bold text-on-surface">Legal</h4>
            <div className="flex flex-col gap-4">
              <a className="inline-block w-fit font-medium text-on-surface-variant transition-colors hover:text-primary" href="#">
                Privacy Policy
              </a>
              <a className="inline-block w-fit font-medium text-on-surface-variant transition-colors hover:text-primary" href="#">
                Terms of Service
              </a>
              <a className="inline-block w-fit font-medium text-on-surface-variant transition-colors hover:text-primary" href="#">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 border-t-2 border-outline-variant/30 pt-8 md:flex-row">
          <div className="text-sm font-medium text-on-surface-variant">© 2024 SmartSpace AI. All rights reserved.</div>
          <div className="flex items-center gap-6">
            {["language", "share", "mail"].map((icon) => (
              <button
                key={icon}
                className="rounded-xl p-3 text-on-surface-variant transition-all hover:text-primary active:neomorph-inset neomorph-raised"
                aria-label={icon === "language" ? "Language" : icon === "share" ? "Share" : "Contact"}
              >
                <Icon name={icon} size={22} />
              </button>
            ))}
          </div>
        </div>
      </footer>

  );
};

export default StudioFooter;
