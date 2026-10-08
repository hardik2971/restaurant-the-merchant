'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

// Error boundary for protected routes (e.g. a DB query throwing).
export default function Error({
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
    <div className="grid min-h-[60vh] place-items-center">
      <div className="card max-w-md p-10 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-danger-soft text-danger">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <h2 className="mt-5 font-display text-xl font-semibold">Something went wrong</h2>
        <p className="mt-2 text-sm text-fg-muted">
          This view couldn&rsquo;t load. If the database is behind an SSH tunnel, make sure it&rsquo;s
          running, then try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-deep"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
