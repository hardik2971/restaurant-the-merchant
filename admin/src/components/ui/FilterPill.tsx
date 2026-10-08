import { Calendar, ChevronDown } from 'lucide-react';

// Static header filter chip (matches the "Weekly" / "Today's" dropdowns in the
// mockup). Wired to real filtering in later phases.
export function FilterPill({ label, icon = true }: { label: string; icon?: boolean }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:border-accent/40"
    >
      {icon && <Calendar className="h-3.5 w-3.5" />}
      {label}
      <ChevronDown className="h-3.5 w-3.5" />
    </button>
  );
}
