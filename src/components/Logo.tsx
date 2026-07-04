/**
 * UdyamAI mark — official brand SVG (score ring + U).
 * Kept in sync with /src/app/icon.svg and /public/udyamai.svg
 * so the favicon, apple-icon, and in-app mark are identical.
 */
export function Logo({
  size = 32,
  variant = "chip",
  className,
}: {
  size?: number;
  /** "chip" = lime rounded square. "glyph-dark" = transparent bg, dark ink. "glyph" = transparent bg, lime ink. */
  variant?: "chip" | "glyph" | "glyph-dark";
  className?: string;
}) {
  const showBg = variant === "chip";
  const ink = variant === "glyph" ? "#CCFF5E" : "#111111";
  const gapHighlight = variant === "glyph" ? "#111111" : "#CCFF5E";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="UdyamAI"
    >
      {showBg && <rect x="24" y="24" width="464" height="464" rx="96" fill="#CCFF5E" />}
      <circle
        cx="256"
        cy="256"
        r="128"
        stroke={ink}
        strokeWidth="42"
        strokeLinecap="round"
        strokeDasharray="610 150"
        transform="rotate(40 256 256)"
      />
      <circle
        cx="256"
        cy="256"
        r="128"
        stroke={gapHighlight}
        strokeWidth="46"
        strokeLinecap="round"
        strokeDasharray="90 700"
        transform="rotate(305 256 256)"
      />
      <path
        d="M212 194V282 C212 318 231 340 256 340 C281 340 300 318 300 282 V194"
        stroke={ink}
        strokeWidth="30"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Full brand lockup: logo + wordmark. */
export function Wordmark({
  size = 32,
  variant = "dark",
  className,
}: {
  size?: number;
  /** "dark" = on dark bg (white text). "light" = on light bg (black text). */
  variant?: "dark" | "light";
  className?: string;
}) {
  const isDark = variant === "dark";
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <Logo size={size} variant="chip" />
      <span
        className={`text-[17px] font-semibold tracking-tight ${
          isDark ? "text-white" : "text-black"
        }`}
      >
        Udyam
        <span
          className={`ml-0.5 font-serif italic ${
            isDark ? "text-rh-lime" : "text-black/60"
          }`}
        >
          AI
        </span>
      </span>
    </span>
  );
}
