interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
  tone?: 'default' | 'onDark';
}

/**
 * Manos brandmark — a warm clay tile with an "M" formed as two
 * cupped shapes (hands). Paired with the Fraunces wordmark.
 */
export default function Logo({ size = 30, showWordmark = true, className = '', tone = 'default' }: LogoProps) {
  const word = tone === 'onDark' ? 'text-canvas' : 'text-ink';
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden className="flex-shrink-0">
        <rect width="40" height="40" rx="12" fill="#C0532B" />
        <rect width="40" height="40" rx="12" fill="url(#manos-g)" fillOpacity="0.35" />
        {/* two cupped hands forming an M */}
        <path
          d="M10 27c0-5 2.6-9 6-9 2.3 0 4 2 4 5 0-3 1.7-5 4-5 3.4 0 6 4 6 9"
          stroke="#FBF6EE" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"
        />
        <circle cx="20" cy="14.5" r="2.3" fill="#F0C35F" />
        <defs>
          <linearGradient id="manos-g" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E4A32B" />
            <stop offset="1" stopColor="#C0532B" />
          </linearGradient>
        </defs>
      </svg>
      {showWordmark && (
        <span className={`font-display font-semibold tracking-tight leading-none ${word}`} style={{ fontSize: size * 0.7 }}>
          Manos
        </span>
      )}
    </span>
  );
}
