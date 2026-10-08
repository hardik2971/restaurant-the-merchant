import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-bg px-4">
      <div className="text-center">
        <p className="font-display text-6xl font-semibold text-accent">404</p>
        <h1 className="mt-3 font-display text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-fg-muted">The page you&rsquo;re looking for doesn&rsquo;t exist.</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-deep"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
