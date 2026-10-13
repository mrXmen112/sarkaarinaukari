interface ApplyButtonProps {
  href: string;
  title: string;
}

/**
 * Primary Apply button (Phase 4E). Always an outbound link to the verified
 * official apply URL, opening in a new tab with noopener/noreferrer/nofollow
 * so no user or ranking signal is attributed to us.
 */
export function ApplyButton({ href, title }: ApplyButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="gov-btn whitespace-nowrap"
      aria-label={`Apply online for ${title} on the official website (opens in a new tab)`}
    >
      Apply Online (Official Website)
    </a>
  );
}