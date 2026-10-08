// Shown while a protected route's server data is fetching (Suspense fallback).
export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card h-24 animate-pulse bg-surface-2" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="card h-72 animate-pulse bg-surface-2 lg:col-span-7" />
        <div className="card h-72 animate-pulse bg-surface-2 lg:col-span-5" />
      </div>
    </div>
  );
}
