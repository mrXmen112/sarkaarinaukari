/**
 * Renders a schema.org JSON-LD block. `data` is serialised by
 * JSON.stringify inside a strict script tag — no user content is injected
 * into the script body.
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}