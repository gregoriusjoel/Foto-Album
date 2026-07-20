'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Camera, Heart, Image as ImageIcon, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Event } from '@/types';

export default function EventClosedPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    api.get<{ data: Event }>(`/public/events/${slug}`)
      .then((res) => setEvent(res.data.data))
      .catch(() => {});
  }, [slug]);

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-page)',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Meta labels */}
      <div style={{ position: 'fixed', top: '1.5rem', left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', opacity: 0.4, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        [ END OF ROLL · FILM DEVELOPED ]
      </div>
      <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', opacity: 0.4, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        [ {new Date().getFullYear()} · MEMORIES CAPTURED ]
      </div>

      {/* Viewfinder corner brackets */}
      <div style={{ position: 'fixed', top: '2rem', left: '2rem', width: 20, height: 20, borderTop: '2px solid rgba(255,255,255,0.15)', borderLeft: '2px solid rgba(255,255,255,0.15)' }} />
      <div style={{ position: 'fixed', top: '2rem', right: '2rem', width: 20, height: 20, borderTop: '2px solid rgba(255,255,255,0.15)', borderRight: '2px solid rgba(255,255,255,0.15)' }} />
      <div style={{ position: 'fixed', bottom: '2rem', left: '2rem', width: 20, height: 20, borderBottom: '2px solid rgba(255,255,255,0.15)', borderLeft: '2px solid rgba(255,255,255,0.15)' }} />
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', width: 20, height: 20, borderBottom: '2px solid rgba(255,255,255,0.15)', borderRight: '2px solid rgba(255,255,255,0.15)' }} />

      {/* Main content */}
      <div style={{
        width: '100%', maxWidth: 480,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '2rem',
        animation: 'slideUp 0.5s var(--ease-smooth) both',
      }}>
        {/* Camera icon with orbit dots */}
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            border: '2px solid var(--text-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Camera size={36} color="var(--text-primary)" strokeWidth={1.5} />
          </div>
          <div style={{
            position: 'absolute', bottom: -4, right: -4,
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--bg-page)',
            border: '2px solid var(--text-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Heart size={12} color="var(--text-primary)" fill="var(--text-primary)" />
          </div>
        </div>

        {/* Text block */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
            color: 'var(--text-muted)', letterSpacing: '0.15em',
            textTransform: 'uppercase', marginBottom: '1rem', opacity: 0.7,
          }}>
            // event · concluded
          </p>
          <h1 style={{
            fontSize: 'clamp(1.75rem, 5vw, 2.75rem)',
            fontFamily: 'var(--font-display)', fontWeight: 900,
            lineHeight: 1.15, letterSpacing: '-0.03em',
            marginBottom: '0.875rem',
          }}>
            {event ? (
              <>Terima kasih telah hadir di <br /><span style={{ color: 'var(--text-secondary)' }}>{event.title}</span></>
            ) : (
              'Terima kasih sudah hadir!'
            )}
          </h1>
          <p style={{
            fontSize: '1rem', color: 'var(--text-secondary)',
            lineHeight: 1.65, maxWidth: 360, margin: '0 auto',
          }}>
            {event
              ? `Acara pada ${formatDate(event.event_date)} ini telah berakhir. Semua momen indah kalian telah berhasil diabadikan bersama.`
              : 'Acara ini telah berakhir. Semua momen indah telah berhasil diabadikan bersama.'}
          </p>
        </div>

        {/* Stats strip */}
        {event && (
          <div style={{
            display: 'flex', gap: '2rem', justifyContent: 'center',
            padding: '1.125rem 2.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>
                <ImageIcon size={11} /> FOTO
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', lineHeight: 1 }}>
                {event.total_photos}
              </div>
            </div>
            <div style={{ width: 1, background: 'var(--border-color)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>
                <Users size={11} /> TAMU
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', lineHeight: 1 }}>
                {event.total_participants}
              </div>
            </div>
          </div>
        )}

        {/* View gallery button */}
        {event?.allow_gallery && (
          <Link
            href={`/e/${slug}/gallery`}
            className="btn btn-secondary"
            style={{
              fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
              letterSpacing: '0.05em', fontSize: '0.8rem',
              padding: '0.625rem 1.5rem',
            }}
          >
            <ImageIcon size={14} />
            Lihat Galeri Kenangan
          </Link>
        )}

        {/* Film strip decoration */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.15 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--text-primary)' }} />
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: 2, border: '1px solid var(--text-primary)' }} />
          ))}
          <div style={{ flex: 1, height: 1, background: 'var(--text-primary)' }} />
        </div>

        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
          color: 'var(--text-muted)', opacity: 0.45,
          letterSpacing: '0.08em', textAlign: 'center',
        }}>
          Powered by FotoAlbum · dibuat dengan <Heart size={11} style={{ display: 'inline', verticalAlign: 'middle' }} fill="currentColor" />
        </p>
      </div>
    </div>
  );
}
