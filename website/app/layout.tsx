import type { Metadata, Viewport } from 'next';
import { Fraunces, Manrope, Julius_Sans_One, Forum } from 'next/font/google';
import './globals.css';
import { siteUrl, ogImage } from '@/lib/site';

// Display serif for headings, modern grotesque for body (Typography §7)
const display = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display-src',
  display: 'swap',
});

const sans = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans-src',
  display: 'swap',
});

// Elegant geometric sans for the hero headline
const julius = Julius_Sans_One({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-julius-src',
  display: 'swap',
});

// Refined serif used across the hero section
const forum = Forum({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-forum-src',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'The Merchant Boston — Modern Fine Dining & Table Reservations',
    template: '%s · The Merchant Boston',
  },
  description:
    'The Merchant Boston is a seasonal fine-dining restaurant serving wood-fired plates and curated wine. Reserve your table for an unforgettable evening.',
  keywords: ['restaurant', 'fine dining', 'book a table', 'reservations', 'wood-fired', 'seasonal menu'],
  authors: [{ name: 'The Merchant Boston' }],
  openGraph: {
    type: 'website',
    url: siteUrl,
    locale: 'en_US',
    title: 'The Merchant Boston — Modern Fine Dining',
    description: 'Seasonal plates, curated wine, and a table waiting for you.',
    siteName: 'The Merchant Boston',
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'The Merchant Boston dining room',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Merchant Boston — Modern Fine Dining',
    description: 'Seasonal plates, curated wine, and a table waiting for you.',
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: 'The Merchant Boston dining room',
      },
    ],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: siteUrl },
};

export const viewport: Viewport = {
  themeColor: '#141210',
  width: 'device-width',
  initialScale: 1,
};

// Structured data for rich results (§10 SEO)
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  name: 'The Merchant Boston',
  servesCuisine: 'Seasonal / Wood-fired',
  priceRange: '$$$',
  acceptsReservations: 'True',
  url: siteUrl,
  telephone: '+1-617-482-6060',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '60 Franklin Street',
    addressLocality: 'Boston',
    addressRegion: 'MA',
    postalCode: '02110',
    addressCountry: 'US',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${julius.variable} ${forum.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-pill focus:bg-gold focus:px-5 focus:py-2 focus:text-ink"
        >
          Skip to content
        </a>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
