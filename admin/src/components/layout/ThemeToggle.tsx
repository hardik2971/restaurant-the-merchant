'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

// Light/dark toggle. The initial class is set pre-paint by the inline script in
// the root layout; this syncs React state to it and persists the choice.
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('admin-theme', next ? 'dark' : 'light');
    } catch {
      /* ignore storage errors */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className="grid h-10 w-10 place-items-center rounded-xl text-fg-muted transition-colors hover:bg-surface hover:text-fg"
    >
      {/* Render nothing until mounted to avoid an icon flash mismatch. */}
      {mounted ? dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" /> : <span className="h-5 w-5" />}
    </button>
  );
}
