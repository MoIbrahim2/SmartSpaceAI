import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Icon from "../Icon";

const defaultMessages = [
  "dashboard.validationMsg1",
  "dashboard.validationMsg2",
  "dashboard.validationMsg3",
  "dashboard.validationMsg4",
  "dashboard.validationMsg5",
];

const defaultFallbackMessages = [
  "Analyzing room corners & angles…",
  "Checking lighting quality…",
  "Ensuring the room is clear…",
  "Almost there! Finalizing…",
  "Polishing the results…",
];

const ValidationOverlay = ({
  title,
  titleKey = "dashboard.validatingRoom",
  titleFallback = "Validating Your Room",
  messages,
  fallbackMessages,
  subTextKey = "dashboard.validationHint",
  subTextFallback = "This usually takes 10–20 seconds",
}) => {
  const { t } = useTranslation();
  const [msgIndex, setMsgIndex] = useState(0);
  const [dots, setDots] = useState("");

  const activeMessages = messages || defaultMessages;
  const activeFallbacks = fallbackMessages || defaultFallbackMessages;

  // Rotate through fun messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % activeMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeMessages.length]);

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const translated = t(activeMessages[msgIndex]);
  const message = translated === activeMessages[msgIndex] ? activeFallbacks[msgIndex] : translated;

  const displayTitle = title || t(titleKey) || titleFallback;
  const displaySubText = t(subTextKey) || subTextFallback;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative flex flex-col items-center gap-8 rounded-[2rem] bg-background p-12 neomorph-raised max-w-md w-[90%] mx-4 overflow-hidden">
        {/* Animated background gradient orbs */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-40 w-40 rounded-full bg-primary/20 blur-[80px] animate-pulse" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-tertiary/20 blur-[80px] animate-pulse" style={{ animationDelay: "1s" }} />

        {/* Spinner container */}
        <div className="relative flex h-28 w-28 items-center justify-center">
          {/* Outer ring */}
          <div
            className="absolute inset-0 rounded-full border-4 border-primary/20"
            style={{
              borderTopColor: "var(--md-sys-color-primary, #6750A4)",
              animation: "spin 1.2s linear infinite",
            }}
          />
          {/* Inner ring (reverse) */}
          <div
            className="absolute inset-3 rounded-full border-4 border-tertiary/20"
            style={{
              borderBottomColor: "var(--md-sys-color-tertiary, #7D5260)",
              animation: "spin 1.8s linear infinite reverse",
            }}
          />
          {/* Center icon */}
          <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-background neomorph-inset">
            <Icon name="auto_awesome" size={28} className="text-primary animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h3 className="mb-2 font-headline text-xl font-bold text-on-surface">
            {displayTitle}
            <span className="inline-block w-6 text-left">{dots}</span>
          </h3>
          <p
            className="text-sm text-on-surface-variant transition-opacity duration-500"
            key={msgIndex}
            style={{ animation: "fadeInUp 0.5s ease-out" }}
          >
            {message}
          </p>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-bright neomorph-inset">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-tertiary to-primary"
            style={{
              animation: "shimmer 2s ease-in-out infinite",
              backgroundSize: "200% 100%",
              width: "100%",
            }}
          />
        </div>

        <p className="text-xs text-on-surface-variant/60">
          {displaySubText}
        </p>

        {/* Keyframe styles */}
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default ValidationOverlay;
