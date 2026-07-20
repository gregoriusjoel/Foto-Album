'use client';

import Link from 'next/link';
import { Camera, ArrowRight, QrCode, Users, Download, Star, CheckCircle } from 'lucide-react';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <main>
      {/* ── Nav ── */}
      <nav className="nav-bar">
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-satu-album.png" alt="Logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-primary)' }}>
              FotoAlbum
            </span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link href="/login" className="btn btn-ghost btn-sm">Sign In</Link>
            <Link href="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ padding: '7rem 0 5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Glow background */}
        <div style={{
          position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
          width: '800px', height: '500px',
          background: 'radial-gradient(ellipse, rgba(255,255,255,0.06) 0%, transparent 65%)',
          pointerEvents: 'none'
        }} />

        <div className="container animate-fadeIn">
          <div className="badge badge-brand" style={{ marginBottom: '1.5rem', fontSize: '0.8125rem' }}>
            <CheckCircle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.3rem' }} /> No login required for guests
          </div>

          <h1 style={{ marginBottom: '1.5rem', maxWidth: '780px', margin: '0 auto 1.5rem' }}>
            Every photo,{' '}
            <span className="gradient-text">one shared album</span>
          </h1>

          <p style={{ fontSize: '1.1875rem', maxWidth: '540px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            Guests scan a QR code and contribute photos instantly.
            No app downloads. No sign-ups. Just moments, captured together.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" className="btn btn-primary btn-xl">
              Create Free Event <ArrowRight size={18} />
            </Link>
            <Link href="/login" className="btn btn-secondary btn-xl">
              Organizer Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── Feature Cards ── */}
      <section className="page-section">
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem'
          }}>
            {[
              {
                icon: <QrCode size={28} />,
                title: 'QR Code Magic',
                desc: 'Generate a unique QR code for your event. Guests scan and instantly contribute — zero friction.',
              },
              {
                icon: <Users size={28} />,
                title: 'No Guest Login',
                desc: 'Guests only enter their name. No accounts, no passwords, no apps to download.',
              },
              {
                icon: <Camera size={28} />,
                title: 'Real-Time Gallery',
                desc: 'Photos appear in the shared album instantly. Watch memories build live during your event.',
              },
              {
                icon: <Download size={28} />,
                title: 'Download Everything',
                desc: 'Organizers can download all photos as a ZIP. Full resolution, beautifully organized.',
              },
            ].map((f, i) => (
              <div key={i} className="card" style={{ animationDelay: `${i * 80}ms` }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: 'rgba(168,85,247,0.12)',
                  border: '1px solid rgba(168,85,247,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#d8b4fe', marginBottom: '1rem'
                }}>
                  {f.icon}
                </div>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.0625rem' }}>{f.title}</h3>
                <p style={{ fontSize: '0.9375rem', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="page-section" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '0.75rem' }}>How it works</h2>
          <p style={{ marginBottom: '3.5rem', maxWidth: 480, margin: '0 auto 3.5rem' }}>
            Three simple steps to a shared album everyone contributes to.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2rem',
          }}>
            {[
              { step: '01', title: 'Create Event', desc: 'Set up your event in under 60 seconds.' },
              { step: '02', title: 'Share QR Code', desc: 'Display or share your unique QR code with guests.' },
              { step: '03', title: 'Collect Memories', desc: 'Every guest uploads and sees everyone\'s photos in real-time.' },
            ].map((s, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <div style={{
                  fontSize: '3.5rem', fontWeight: 900, fontFamily: 'var(--font-display)',
                  background: 'var(--gradient-brand)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  marginBottom: '0.75rem', lineHeight: 1,
                }}>
                  {s.step}
                </div>
                <h3 style={{ marginBottom: '0.5rem' }}>{s.title}</h3>
                <p style={{ fontSize: '0.9375rem' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="page-section" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="card-glass" style={{ padding: '4rem 2rem', maxWidth: 600, margin: '0 auto' }}>
            <Star size={40} style={{ color: '#d8b4fe', margin: '0 auto 1.25rem' }} />
            <h2 style={{ marginBottom: '1rem' }}>Ready to capture together?</h2>
            <p style={{ marginBottom: '2rem', maxWidth: 400, margin: '0 auto 2rem' }}>
              Create your first event for free. No credit card required.
            </p>
            <Link href="/register" className="btn btn-primary btn-xl">
              Start for Free <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '2rem 0',
        textAlign: 'center',
      }}>
        <div className="container">
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            © 2026 FotoAlbum. Capture Together. Save Forever.
          </p>
        </div>
      </footer>
    </main>
  );
}
