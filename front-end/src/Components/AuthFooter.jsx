import Icon from "./Icon";

const AuthFooter = () => {
  return (
    <footer className="w-full border-t border-surface-container bg-surface px-6 py-12 shadow-[0_-4px_12px_rgba(0,0,0,0.02)] md:px-12">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 md:grid-cols-4">
        <div className="col-span-1 md:col-span-2">
          <div className="mb-4 text-2xl font-headline font-extrabold text-primary">
            SmartSpace AI
          </div>
          <p className="max-w-xs text-sm font-medium text-on-surface-variant">
            Revolutionizing interior design through the power of intelligent spatial awareness and AI-driven creativity.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <h4 className="font-headline font-bold text-on-surface">Company</h4>
          <a className="text-sm text-on-surface-variant transition-colors hover:text-primary" href="#">
            About Us
          </a>
          <a className="text-sm text-on-surface-variant transition-colors hover:text-primary" href="#">
            Contact Support
          </a>
          <a className="text-sm text-on-surface-variant transition-colors hover:text-primary" href="#">
            Careers
          </a>
        </div>
        <div className="flex flex-col gap-4">
          <h4 className="font-headline font-bold text-on-surface">Legal</h4>
          <a className="text-sm text-on-surface-variant transition-colors hover:text-primary" href="#">
            Privacy Policy
          </a>
          <a className="text-sm text-on-surface-variant transition-colors hover:text-primary" href="#">
            Terms of Service
          </a>
          <a className="text-sm text-on-surface-variant transition-colors hover:text-primary" href="#">
            Cookie Policy
          </a>
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-surface-container pt-8 md:flex-row">
        <p className="text-sm font-medium text-on-surface-variant">
          © 2024 SmartSpace AI. All rights reserved.
        </p>
        <div className="flex gap-6">
          <Icon name="public" className="cursor-pointer text-on-surface-variant hover:text-primary" aria-label="Language" />
          <Icon name="share" className="cursor-pointer text-on-surface-variant hover:text-primary" aria-label="Share" />
          <Icon name="mail" className="cursor-pointer text-on-surface-variant hover:text-primary" aria-label="Email" />
        </div>
      </div>
    </footer>
  );
};

export default AuthFooter;
