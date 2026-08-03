import type { Metadata } from 'next';

import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | Memly',
    default: 'Memly — A Home for Every Memory.',
  },
  description:
    'Memly is a collaborative memory-preservation platform designed to help you capture, organize, and relive life\'s most meaningful moments.',
  keywords: ['photo album', 'event photos', 'collaborative album', 'QR code photos', 'wedding photos', 'memory preservation', 'Memly'],
  icons: {
    icon: '/logo-memly.png',
    shortcut: '/logo-memly.png',
    apple: '/logo-memly.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'Memly',
    title: 'Memly — A Home for Every Memory.',
    description: 'A living archive of life\'s most meaningful moments.',
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
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Lora:ital,wght@0,400..700;1,400..700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Fredoka:wght@400;500;600;700&display=swap" rel="stylesheet" />
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
