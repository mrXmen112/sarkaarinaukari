import { affiliateUrl, AFFILIATE_DISCLOSURE, AFFILIATE_ENABLED } from "@/lib/affiliate";
import type { RecommendedBook } from "@/types/database";

/**
 * W5.7 — Recommended books, as affiliate links.
 *
 * Renders nothing at all when AMAZON_AFFILIATE_TAG is unset (AFFILIATE_ENABLED
 * false): no links, no disclosure, and no empty panel. When it IS set, every
 * link is rewritten to carry the env tag and the Associates disclosure sits
 * directly above the list, where it is visible before any link — not in a
 * footer nobody reads.
 *
 * Outbound links are noopener/noreferrer/nofollow, matching every other
 * official/outbound link on the site.
 */
export function RecommendedBooks({ books }: { books: RecommendedBook[] | null }) {
  if (!AFFILIATE_ENABLED) return null;

  const items = (books ?? [])
    .map((book) => ({ book, href: affiliateUrl(book.affiliate_link) }))
    .filter((x): x is { book: RecommendedBook; href: string } => x.href !== null);

  if (items.length === 0) return null;

  return (
    <section className="gov-panel mb-4">
      <div className="gov-panel-title">Recommended Books</div>
      <div className="p-3">
        <p className="mb-2 text-xs text-ink-faint">{AFFILIATE_DISCLOSURE}</p>
        <ul className="space-y-1.5 text-sm">
          {items.map(({ book, href }) => (
            <li key={href}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer nofollow sponsored"
                className="font-semibold text-navy underline decoration-navy/30 underline-offset-2 hover:decoration-navy"
              >
                {book.title}
              </a>
              {book.author ? (
                <span className="text-ink-muted"> — {book.author}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
