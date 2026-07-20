'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, User, Lock, ArrowRight, Loader2, Calendar, MapPin, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useParticipantStore } from '@/store';
import { formatDate } from '@/lib/utils';
import type { Event } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  join_code: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function JoinPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { setParticipant, isJoined } = useParticipantStore();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => { setMounted(true); }, []);

  // Auto-rotate background banner
  useEffect(() => {
    if (!event?.banner_photos?.length) return;
    const total = event.banner_photos.length;
    const id = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % total);
    }, 4000);
    return () => clearInterval(id);
  }, [event?.banner_photos]);

  useEffect(() => {
    if (!mounted) return;
    if (isJoined(slug)) {
      api.get<{ data: Event }>(`/public/events/${slug}`).then((res) => {
        const ev = res.data.data;
        if (ev.status === 'closed' || ev.status === 'archived') {
          router.replace(`/e/${slug}/closed`);
        } else {
          router.replace(`/e/${slug}/camera`);
        }
      }).catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) router.replace(`/e/${slug}/closed`);
        else router.replace(`/e/${slug}/camera`);
      });
      return;
    }

    api.get<{ data: Event }>(`/public/events/${slug}`).then((res) => {
      setEvent(res.data.data);
    }).catch((err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) { router.replace(`/e/${slug}/closed`); return; }
      console.error('Error loading public event:', err);
      setNotFound(true);
    }).finally(() => { setLoading(false); });
  }, [slug, mounted]);

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post<{ data: { participant_token: string; participant: { name: string } } }>(
        `/public/events/${slug}/join`, data
      );
      const { participant_token, participant } = res.data.data;
      const name = participant.name;
      setParticipant(name, participant_token, slug);
      toast.success(`Welcome, ${name}!`);
      try {
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) await docEl.requestFullscreen();
        else if ((docEl as any).webkitRequestFullscreen) await (docEl as any).webkitRequestFullscreen();
      } catch (e) { console.warn('Auto-fullscreen on join failed:', e); }
      router.push(`/e/${slug}/camera`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Failed to join. Check the code and try again.';
      toast.error(msg);
    }
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
        <Camera size={56} style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }} />
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Event Not Found</h1>
        <p style={{ marginBottom: '1.5rem' }}>This event may have been closed or doesn&apos;t exist.</p>
        <Link href="/" className="btn btn-secondary">Go Home</Link>
      </div>
    );
  }

  if (event.status === 'closed' || event.status === 'archived') {
    router.replace(`/e/${slug}/closed`);
    return null;
  }

  const banners: string[] = event.banner_photos ?? [];
  const hasBanners = banners.length > 0;

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'var(--bg-page)', position: 'relative', overflow: 'hidden' }}>

      {/* ── Background banner slideshow (blurred, dimmed) ── */}
      {hasBanners && banners.map((url, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={url}
          alt=""
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
            opacity: activeBannerIndex === i ? 0.2 : 0,
            transition: 'opacity 1.2s ease-in-out',
            zIndex: 0,
            filter: 'blur(8px) saturate(0.5)',
            transform: 'scale(1.06)',
          }}
        />
      ))}

      {/* Dark overlay over background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(9,9,11,0.85)',
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      {/* Viewfinder crosshair */}
      <div className="camera-viewfinder-container" style={{ opacity: 0.06, zIndex: 2 }}>
        <div className="viewfinder-corner viewfinder-corner-tl" />
        <div className="viewfinder-corner viewfinder-corner-tr" />
        <div className="viewfinder-corner viewfinder-corner-bl" />
        <div className="viewfinder-corner viewfinder-corner-br" />
        <div className="viewfinder-center" />
      </div>

      {/* Corner meta labels */}
      <div className="camera-meta-label" style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', opacity: 0.25, zIndex: 3 }}>
        [ MODE: ANA_B&W ]
      </div>
      <div className="camera-meta-label" style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem', opacity: 0.25, zIndex: 3 }}>
        [ ISO 400 · EXP 24/36 ]
      </div>

      {/* Main content */}
      <div style={{ width: '100%', maxWidth: 440, animation: 'slideUp 0.35s var(--ease-smooth) both', zIndex: 5 }}>

        {/* ── Event header card ── */}
        <div className="card-glass" style={{ padding: '1.75rem', marginBottom: '1rem', textAlign: 'center', border: '1px solid var(--border-color-strong)' }}>

          {hasBanners ? (
            /* Polaroid photo collage */
            <div style={{ position: 'relative', height: 126, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

              {/* Left polaroid */}
              <div style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-104px) rotate(-8deg)',
                width: 92, height: 80,
                background: '#f8f8f8',
                padding: '5px 5px 18px 5px',
                boxShadow: '0 6px 24px rgba(0,0,0,0.55)',
                zIndex: 1,
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={banners[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>

              {/* Right polaroid */}
              {banners.length >= 3 && (
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(12px) rotate(7deg)',
                  width: 92, height: 80,
                  background: '#f8f8f8',
                  padding: '5px 5px 18px 5px',
                  boxShadow: '0 6px 24px rgba(0,0,0,0.55)',
                  zIndex: 1,
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={banners[2]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              )}

              {/* Center polaroid — front, larger */}
              {banners.length >= 2 && (
                <div style={{
                  position: 'relative',
                  width: 108, height: 96,
                  background: '#fff',
                  padding: '6px 6px 22px 6px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.65)',
                  zIndex: 2,
                  transform: 'rotate(-1.5deg)',
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={banners[1]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', bottom: 5, left: 0, right: 0, textAlign: 'center', fontSize: '0.48rem', fontFamily: 'var(--font-mono)', color: '#666', letterSpacing: '0.04em' }}>
                    {new Date(event.event_date).getFullYear()}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Fallback logo image */
            <img src="/logo-satu-album.png" alt="Logo" style={{ width: 56, height: 56, objectFit: 'contain', margin: '0 auto 1.25rem', display: 'block' }} />
          )}

          <h1 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: '0.625rem' }}>
            {event.title}
          </h1>
          <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Calendar size={12} /> {formatDate(event.event_date)}
            </span>
            {event.venue && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <MapPin size={12} /> {event.venue}
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Users size={12} /> {event.total_participants} JOINED
            </span>
          </div>
        </div>

        {/* ── Join form ── */}
        <div className="card" style={{ padding: '1.75rem', border: '1px solid var(--border-color-strong)', borderRadius: 'var(--radius-lg)' }}>
          <h2 style={{ fontSize: '1.125rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem', textAlign: 'center' }}>
            Join the Album
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1.5rem' }}>
            Enter your name to contribute photos and view the gallery.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label camera-meta-label" htmlFor="join-name" style={{ marginBottom: '0.5rem', display: 'block' }}>Your Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  id="join-name"
                  type="text"
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  style={{ paddingLeft: '2.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color-strong)', fontFamily: 'var(--font-sans)' }}
                  placeholder="e.g. Sarah Johnson"
                  autoFocus
                  autoComplete="name"
                  {...register('name')}
                />
              </div>
              {errors.name && <span className="form-error" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>{errors.name.message}</span>}
            </div>

            {event.requires_password && (
              <div className="form-group">
                <label className="form-label camera-meta-label" htmlFor="join-code" style={{ marginBottom: '0.5rem', display: 'block' }}>
                  <Lock size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                  Join Code
                </label>
                <input
                  id="join-code"
                  type="text"
                  className={`form-input ${errors.join_code ? 'error' : ''}`}
                  placeholder="Enter the event code"
                  style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color-strong)', fontFamily: 'var(--font-mono)' }}
                  {...register('join_code')}
                />
                {errors.join_code && <span className="form-error" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>{errors.join_code.message}</span>}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ width: '100%', height: 48, marginTop: '0.25rem', borderRadius: 'var(--radius-sm)', fontWeight: 800, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'transform 0.1s, box-shadow 0.2s' }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {isSubmitting
                ? <><Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> Entering...</>
                : <>Join Album <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
