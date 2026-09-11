"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-6xl px-3 py-6">
      <div className="rounded border border-rule p-6 text-center">
        <h2 className="text-xl font-bold text-navy">Something went wrong</h2>
        <p className="mt-2 text-sm text-ink-muted">
          An unexpected error occurred. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
