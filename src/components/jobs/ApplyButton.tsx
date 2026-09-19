import Link from "next/link";

interface ApplyButtonProps {
  href: string;
  title: string;
}

/**
 * Reusable Apply Online button with mandatory target="_blank" rel="noopener noreferrer".
 * All external government apply links use this component.
 */
export function ApplyButton({ href, title }: ApplyButtonProps) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="gov-btn whitespace-nowrap"
      aria-label={`Apply online for ${title} on official website (opens in new tab)`}
    >
      Apply Online
    </Link>
  );
}
