import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://memly.online';

export const viewport: Viewport = {
  themeColor: '#FAF8F4',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    template: '%s | Memly',
    default: 'Memly — Digital Memory Archives & Event Photo Albums',
  },
  description:
    'Memly adalah platform dokumentasi & album foto bersama interaktif untuk acara pernikahan, ulang tahun, wisuda, dan momen spesial. Abadikan dan bagikan kenangan berharga bersama tamu.',
  keywords: [
    'Memly',
    'album foto digital',
    'foto event',
    'foto wedding',
    'shared photo album',
    'album nikahan',
    'QR foto event',
    'galeri foto bersama',
    'memory archives',
    'foto bersama tamu',
  ],
  authors: [{ name: 'Memly Team', url: APP_URL }],
  creator: 'Memly',
  publisher: 'Memly',
  formatDetection: { telephone: false },
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/logo-memly-white.png',
    shortcut: '/logo-memly-white.png',
    apple: '/logo-memly-white.png',
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: APP_URL,
    siteName: 'Memly',
    title: 'Memly — Digital Memory Archives & Event Photo Albums',
    description:
      'Abadikan dan bagikan kenangan berharga di acara pernikahan, ulang tahun, dan momen spesial Anda bersama seluruh tamu.',
    images: [
      {
        url: '/logo-memly.png',
        width: 1200,
        height: 630,
        alt: 'Memly — Digital Memory Archives',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Memly — Digital Memory Archives',
    description:
      'Platform album foto digital bersama untuk acara pernikahan, ulang tahun, dan momen berharga Anda.',
    images: ['/logo-memly.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Memly',
    url: APP_URL,
    description: 'Digital Memory Archives & Event Photo Albums',
    inLanguage: 'id-ID',
  };

  return (
    <html lang="id" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Lora:ital,wght@0,400..700;1,400..700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Fredoka:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a1f',
              color: '#f4f4f5',
              border: '1px solid rgba(255,255,255,0.12)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.875rem',
              borderRadius: '10px',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#1a1a1f' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#1a1a1f' },
            },
          }}
        />
      </body>
    </html>
  );
}
