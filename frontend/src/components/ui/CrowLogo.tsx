/**
 * KaamCrow — professional geometric crow logo
 *
 * Main silhouette uses currentColor so it reads on both light (#111) and dark (#f0f0f0) backgrounds.
 * Gold wing stripe + eye are always #C9A227 / #D4AF37.
 * Crow faces RIGHT in a proud, upright profile.
 */
export function CrowLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 180 100"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="KaamCrow"
    >
      {/* ── Body ── large angular central mass */}
      <path d="M18 52 L26 28 L54 16 L88 14 L106 26 L100 54 L78 70 L46 76 L28 68 Z" />

      {/* ── Head ── angular, proud crown, facing right */}
      <path d="M100 26 L120 14 L138 20 L150 36 L136 52 L116 58 L100 50 Z" />

      {/* ── Beak ── sharp triangle */}
      <path d="M150 34 L172 40 L150 48 Z" />

      {/* ── Tail ── forked angular feathers on the left */}
      <path d="M28 54 L6 42 L4 58 L14 68 L2 73 L8 86 L24 78 L36 68 Z" />

      {/* ── Gold wing stripe ── diagonal metallic band */}
      <path d="M34 36 L96 28 L100 42 L36 50 Z" fill="#C9A227" />

      {/* ── Gold wing highlight ── thinner upper accent */}
      <path d="M48 24 L86 18 L90 26 L50 32 Z" fill="#D4AF37" />

      {/* ── Gold eye ── diamond facet */}
      <path d="M120 20 L130 28 L120 36 L110 28 Z" fill="#C9A227" />
    </svg>
  );
}

/** Small square badge version — used in favicon / tiny header icon */
export function CrowBadge({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Dark background square */}
      <rect width="36" height="36" rx="8" fill="currentColor" />
      {/* Crow silhouette in inverted color — always white inside badge */}
      <path
        d="M5 19 L7 10 L16 6 L26 6 L30 10 L29 20 L22 25 L13 27 L8 24 Z"
        fill="white"
        opacity="0.92"
      />
      <path
        d="M29 10 L34 12 L33 16 L29 18 L28 14 Z"
        fill="white"
        opacity="0.92"
      />
      <path
        d="M33 13 L36 14 L33 16 Z"
        fill="white"
        opacity="0.92"
      />
      {/* Gold wing stripe */}
      <path d="M9 14 L27 11 L28 15 L10 18 Z" fill="#C9A227" />
      {/* Gold eye */}
      <path d="M31 11 L33.5 13 L31 15 L28.5 13 Z" fill="#C9A227" />
    </svg>
  );
}
