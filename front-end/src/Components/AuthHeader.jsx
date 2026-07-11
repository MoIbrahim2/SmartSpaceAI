import { Link } from "react-router-dom";

const AuthHeader = () => {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between bg-surface/80 px-6 py-4 shadow-[0px_4px_12px_rgba(0,0,0,0.02)] backdrop-blur-md md:px-12">
      <div className="text-xl font-headline font-extrabold tracking-tight text-primary">
        SmartSpace AI
      </div>
      <div className="hidden items-center gap-8 md:flex">
        <Link
          className="font-body text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
          to="/credits"
        >
          Pricing
        </Link>
        <a
          className="font-body text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
          href="mailto:support@smartspace.ai"
        >
          Contact Us
        </a>
        <Link
          className="font-body text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
          to="/projects"
        >
          Gallery
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <Link
          className="rounded-full px-4 py-2 text-sm font-bold text-on-surface-variant transition-all hover:text-primary"
          to="/login"
        >
          Login
        </Link>
        <Link
          className="rounded-full bg-surface px-6 py-2 text-sm font-bold text-primary transition-all hover:opacity-90 neo-raised neo-button-active"
          to="/register"
        >
          Register
        </Link>
      </div>
    </nav>
  );
};

export default AuthHeader;
