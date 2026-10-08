import { Hammer } from 'lucide-react';

export function ComingSoon({ phase, title }: { phase: string; title: string }) {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="card max-w-md p-10 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-accent">
          <Hammer className="h-6 w-6" />
        </span>
        <h2 className="mt-5 font-display text-xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-fg-muted">
          This module ships in <span className="font-medium text-fg">{phase}</span> of the
          implementation plan.
        </p>
      </div>
    </div>
  );
}
