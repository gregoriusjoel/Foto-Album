import type { Metadata } from 'next';

import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | FotoAlbum',
    default: 'FotoAlbum — Capture Together. Save Forever.',
  },
  description:
    'FotoAlbum is a collaborative event photo platform where every guest contributes photos into one shared album, simply by scanning a QR code.',
  keywords: ['photo album', 'event photos', 'collaborative album', 'QR code photos', 'wedding photos'],
  icons: {
    icon: '/logo-satu-album.png',
    shortcut: '/logo-satu-album.png',
    apple: '/logo-satu-album.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'FotoAlbum',
    title: 'FotoAlbum — Capture Together. Save Forever.',
    description: 'Collaborative event photo albums.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
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
