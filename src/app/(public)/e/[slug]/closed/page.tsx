'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { Camera, Heart, Image as ImageIcon, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Event } from '@/types';
import { ApertureLoader } from '@/components/ui/ApertureLoader';

export default function EventClosedPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    api.get<{ data: Event }>(`/public/events/${slug}`)
      .then((res) => {
        const ev = res.data.data;
        if (ev.status === 'published') {
          // If event is actually published and not closed, it should be in public view
          setEvent(ev);
        } else {
          setEvent(ev);
        }
      })
      .catch(() => {
        setIsNotFound(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return <ApertureLoader fullscreen text="Memuat..." />;
  }

  if (isNotFound || !event) {
    notFound();
  }

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
      <div style={{ position: 'fixed', top: '2rem', left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--font-mono)', fontSize: 'var(--font-caption)', color: 'var(--text-muted)', opacity: 0.5, letterSpacing: '0.15em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        [ END OF ROLL · MEMORIES ARCHIVED ]
      </div>
      <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--font-mono)', fontSize: 'var(--font-caption)', color: 'var(--text-muted)', opacity: 0.5, letterSpacing: '0.15em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        [ {new Date().getFullYear()} · RELIVE FOREVER ]
      </div>

      {/* Viewfinder corner brackets */}
      <div style={{ position: 'fixed', top: '2rem', left: '2rem', width: 24, height: 24, borderTop: 'var(--border-hairline)', borderLeft: 'var(--border-hairline)' }} />
      <div style={{ position: 'fixed', top: '2rem', right: '2rem', width: 24, height: 24, borderTop: 'var(--border-hairline)', borderRight: 'var(--border-hairline)' }} />
      <div style={{ position: 'fixed', bottom: '2rem', left: '2rem', width: 24, height: 24, borderBottom: 'var(--border-hairline)', borderLeft: 'var(--border-hairline)' }} />
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', width: 24, height: 24, borderBottom: 'var(--border-hairline)', borderRight: 'var(--border-hairline)' }} />

      {/* Main content */}
      <div style={{
        width: '100%', maxWidth: 480,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 'var(--space-32)',
        textAlign: 'center'
      }}>
        {/* Camera icon frame */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          border: 'var(--border-strong)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-primary)',
          background: 'var(--bg-surface)'
        }}>
          <Camera size={30} style={{ strokeWidth: 1.25 }} />
        </div>

        {/* Text block */}
        <div>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 'var(--font-caption)',
            color: 'var(--color-vintage-mustard)', letterSpacing: '0.15em',
            textTransform: 'uppercase', marginBottom: 'var(--space-12)', fontWeight: 600
          }}>
            Concluded
          </p>
          <h1 style={{
            fontSize: 'var(--font-display-l)',
            fontFamily: 'var(--font-display)',
            lineHeight: 1.15, letterSpacing: '-0.02em',
            marginBottom: 'var(--space-16)',
            color: 'var(--text-primary)'
          }}>
            {event ? (
              <>Thank you for attending<br /><span style={{ fontStyle: 'italic', color: 'var(--color-burnt-orange)' }}>{event.title}</span></>
            ) : (
              'Thank you for attending!'
            )}
          </h1>
          <p style={{
            fontSize: 'var(--font-body)', color: 'var(--text-secondary)',
            lineHeight: 1.7, maxWidth: 380, margin: '0 auto', fontWeight: 300
          }}>
            {event
              ? `This gathering on ${formatDate(event.event_date)} has ended. Every beautiful moment captured by you and the guests has been permanently archived.`
              : 'This gathering has ended. Every beautiful moment has been permanently archived.'}
          </p>
        </div>

        {/* Stats strip */}
        {event && (
          <div style={{
            display: 'flex', gap: '3rem', justifyContent: 'center',
            padding: 'var(--space-16) var(--space-32)',
            border: 'var(--border-hairline)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: 'var(--font-caption)', fontFamily: 'var(--font-mono)', letterSpacing: '0.15em', marginBottom: 'var(--space-4)', textTransform: 'uppercase' }}>
                <ImageIcon size={10} /> Photos
              </div>
              <div style={{ fontSize: 'var(--font-display-m)', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', lineHeight: 1 }}>
                {event.total_photos}
              </div>
            </div>
            <div style={{ width: 1, background: 'var(--border-color)', alignSelf: 'stretch' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: 'var(--font-caption)', fontFamily: 'var(--font-mono)', letterSpacing: '0.15em', marginBottom: 'var(--space-4)', textTransform: 'uppercase' }}>
                <Users size={10} /> Guests
              </div>
              <div style={{ fontSize: 'var(--font-display-m)', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', lineHeight: 1 }}>
                {event.total_participants}
              </div>
            </div>
          </div>
        )}

        {/* View gallery button */}
        {event?.allow_gallery && (
          <Link
            href={`/e/${slug}/gallery`}
            style={{
              background: 'var(--color-charcoal)',
              color: 'var(--color-paper-white)',
              padding: '0.75rem 2rem',
              borderRadius: 'var(--radius-pill)',
              fontSize: 'var(--font-body)',
              textDecoration: 'none',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'opacity var(--dur-hover) var(--ease-glide)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <ImageIcon size={14} /> Relive Memories
          </Link>
        )}

        {/* Film strip decoration */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.08 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--text-primary)' }} />
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: 1, border: '1px solid var(--text-primary)' }} />
          ))}
          <div style={{ flex: 1, height: 1, background: 'var(--text-primary)' }} />
        </div>

        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 'var(--font-caption)',
          color: 'var(--text-muted)', opacity: 0.5,
          letterSpacing: '0.08em', textAlign: 'center',
        }}>
          Powered by Memly
        </p>
      </div>
    </div>
  );
}
