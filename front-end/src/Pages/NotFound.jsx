import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 text-on-surface">
      <div className="w-full max-w-xl rounded-[2rem] bg-background p-10 text-center neo-raised">
        <span className="inline-flex rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-tertiary neo-inset">
          404
        </span>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight">This room does not exist</h1>
        <p className="mt-4 text-base leading-7 text-on-surface-variant">
          The page you requested is missing, moved, or still waiting for its next design concept.
        </p>
        <Link
          className="mt-8 inline-flex rounded-2xl px-6 py-4 text-sm font-bold text-primary neo-raised active:neo-inset"
          to="/"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
