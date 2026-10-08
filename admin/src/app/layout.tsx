import type { Metadata, Viewport } from 'next';
import { Manrope, Fraunces } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

// Body grotesque + display serif — shared visual language with the public site.
const sans = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans-src',
  display: 'swap',
});

const display = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display-src',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Admin · The Merchant Boston',
    template: '%s · Admin',
  },
  description: 'Restaurant management & POS dashboard.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f1ea' },
    { media: '(prefers-color-scheme: dark)', color: '#141210' },
  ],
  width: 'device-width',
  initialScale: 1,
};

// Applied before paint to avoid a light/dark flash: stored preference wins,
// otherwise follow the OS setting.
const THEME_INIT = `(function(){try{var t=localStorage.getItem('admin-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
