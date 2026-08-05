'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Lottie from 'lottie-react';
import { Home } from 'lucide-react';
import pictogram404 from '../../public/Pitctogram 404.json';

export default function NotFound() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-page)',
      padding: '2rem 1.5rem',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}>
      {/* Editorial Viewfinder Corner Brackets */}
      <div style={{ position: 'fixed', top: '1.5rem', left: '1.5rem', width: 24, height: 24, borderTop: 'var(--border-hairline)', borderLeft: 'var(--border-hairline)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', width: 24, height: 24, borderTop: 'var(--border-hairline)', borderRight: 'var(--border-hairline)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '1.5rem', left: '1.5rem', width: 24, height: 24, borderBottom: 'var(--border-hairline)', borderLeft: 'var(--border-hairline)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', width: 24, height: 24, borderBottom: 'var(--border-hairline)', borderRight: 'var(--border-hairline)', pointerEvents: 'none' }} />

      {/* Top Header Mono Badge */}
      <div style={{
        position: 'fixed',
        top: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--font-caption)',
        color: 'var(--text-muted)',
        opacity: 0.6,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}>
        [ PAGE NOT FOUND · OUT OF FRAME ]
      </div>

      {/* Main Content Container */}
      <div style={{
        width: '100%',
        maxWidth: 520,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '1.25rem',
        zIndex: 1,
      }}>
        {/* Lottie Pictogram 404 Animation */}
        <div style={{
          width: 'min(440px, 90vw)',
          height: 'min(280px, 55vw)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'visible',
          margin: '-1rem 0 -0.5rem 0',
        }}>
          {mounted && (
            <Lottie
              animationData={pictogram404}
              loop={true}
              autoplay={true}
              style={{
                width: '100%',
                height: '100%',
                transform: 'scale(1.5)',
                transformOrigin: 'center',
              }}
            />
          )}
        </div>

        {/* Heading & Description */}
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.5rem, 5vw, 2.25rem)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.2,
            marginBottom: '0.75rem',
          }}>
            Page Out of Frame
          </h1>
          <p style={{
            fontSize: 'var(--font-body)',
            color: 'var(--text-secondary)',
            fontWeight: 300,
            lineHeight: 1.6,
            maxWidth: 420,
            margin: '0 auto',
          }}>
            Halaman atau link album yang Anda tuju tidak ditemukan, telah dihapus, atau tautan sudah tidak berlaku.
          </p>
        </div>

        {/* Action Button: Ke Beranda */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          marginTop: '0.5rem',
        }}>
          <Link
            href="/"
            className="btn btn-primary"
            style={{
              borderRadius: 'var(--radius-pill)',
              padding: '0.75rem 2rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9375rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <Home size={16} /> Ke Beranda
          </Link>
        </div>
      </div>

      {/* Footer Mono Note */}
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--font-caption)',
        color: 'var(--text-muted)',
        opacity: 0.5,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}>
        [ MEMLY · PRESERVING MEMORIES ]
      </div>
    </div>
  );
}
