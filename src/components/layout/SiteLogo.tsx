/**
 * Site mark — briefcase with tricolour clasp, original artwork (not the Ashoka
 * Emblem or any official government insignia). Matches /public/icon.svg.
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
      viewBox="0 0 512 512"
      fill="none"
      role="img"
      aria-label="SarkaariNaukri.online logo"
      className={className}
    >
      <rect width="512" height="512" rx="112" fill="#0B3D6E" />
      <rect x="198" y="132" width="116" height="78" rx="26" fill="none" stroke="#FFFFFF" strokeWidth="26" />
      <rect x="106" y="196" width="300" height="212" rx="34" fill="#FFFFFF" />
      <rect x="106" y="276" width="300" height="26" fill="#FF9933" />
      <rect x="216" y="250" width="80" height="78" rx="18" fill="#138808" stroke="#FFFFFF" strokeWidth="8" />
      <path
        d="M236 290 L252 306 L280 270"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
