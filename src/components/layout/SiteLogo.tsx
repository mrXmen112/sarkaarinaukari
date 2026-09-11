/**
 * Original site mark. Deliberately NOT the Ashoka Emblem or any official
 * government insignia (Section 1 constraint) — this is an abstract document +
 * checkmark motif with a tricolour accent bar.
 */
export function SiteLogo({
  className = "",
  size = 38,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="SarkaariNaukari.online logo"
      className={className}
    >
      {/* Document body */}
      <rect x="9" y="4" width="27" height="36" rx="2" fill="#FFFFFF" />
      <rect
        x="9"
        y="4"
        width="27"
        height="36"
        rx="2"
        stroke="#0B3D6E"
        strokeWidth="2.5"
      />
      {/* Tricolour accent bar */}
      <rect x="13" y="10" width="19" height="2.6" rx="1.3" fill="#FF9933" />
      <rect x="13" y="15" width="19" height="2.6" rx="1.3" fill="#CBD5E1" />
      <rect x="13" y="20" width="12" height="2.6" rx="1.3" fill="#138808" />
      {/* Verification badge */}
      <circle cx="33" cy="33" r="10.5" fill="#138808" stroke="#FFFFFF" strokeWidth="2.5" />
      <path
        d="M28.5 33.2l3.1 3.1 6-6.3"
        stroke="#FFFFFF"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
