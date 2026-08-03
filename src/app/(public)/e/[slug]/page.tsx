'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, ArrowRight, Loader2, Calendar, MapPin, Users, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useParticipantStore } from '@/store';
import { formatDate } from '@/lib/utils';
import type { Event } from '@/types';
import { ApertureLoader } from '@/components/ui/ApertureLoader';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  join_code: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function Countdown({ eventDate, startTime, timezone }: { eventDate: string; startTime: string; timezone: string }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      try {
        const targetStr = `${eventDate}T${startTime}`;
        const targetLocal = new Date(targetStr);
        const now = new Date();
        const difference = targetLocal.getTime() - now.getTime();

        if (difference <= 0) {
          setTimeLeft(null);
          window.location.reload();
          return;
        }

        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } catch (e) {
        setTimeLeft(null);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [eventDate, startTime, timezone]);

  if (!timeLeft) {
    return <span style={{ fontFamily: 'var(--font-mono)' }}>00:00:00:00</span>;
  }

  const formatNum = (n: number) => n.toString().padStart(2, '0');

  return (
    <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', margin: '2rem 0' }}>
      {[
        { val: timeLeft.days, label: 'days' },
        { val: timeLeft.hours, label: 'hours' },
        { val: timeLeft.minutes, label: 'mins' },
        { val: timeLeft.seconds, label: 'secs' },
      ].map((item, idx) => (
        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            fontSize: 'var(--font-display-m)',
            fontFamily: 'var(--font-display)',
            color: 'var(--text-primary)',
            lineHeight: 1
          }}>
            {formatNum(item.val)}
          </div>
          <span style={{ fontSize: 'var(--font-caption)', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function JoinPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { setParticipant, isJoined } = useParticipantStore();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  const banners = event?.banner_photos ?? [];

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => { setMounted(true); }, []);

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
      }).catch(() => {
        router.replace(`/e/${slug}/camera`);
      });
      return;
    }

    api.get<{ data: Event }>(`/public/events/${slug}`).then((res) => {
      setEvent(res.data.data);
    }).catch((err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) { router.replace(`/e/${slug}/closed`); return; }
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
      } catch (e) { console.warn('Auto-fullscreen failed:', e); }
      router.push(`/e/${slug}/camera`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Failed to join. Check the code and try again.';
      toast.error(msg);
    }
  };

  if (!mounted) return null;

  if (loading) {
    return <ApertureLoader fullscreen text="Menyiapkan Album..." />;
  }

  if (notFound || !event) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', background: 'var(--bg-page)' }}>
        <h1 style={{ fontSize: 'var(--font-display-l)', marginBottom: '1.5rem', fontFamily: 'var(--font-display)' }}>Exhibition Not Found</h1>
        <p style={{ marginBottom: '2.5rem', color: 'var(--text-secondary)', maxWidth: '360px', fontWeight: 300 }}>This memory archive may have been closed or is temporarily unavailable.</p>
        <Link href="/" style={{
          padding: '0.75rem 2rem', border: 'var(--border-strong)', color: 'var(--text-primary)',
          borderRadius: 'var(--radius-pill)', textDecoration: 'none', fontSize: 'var(--font-body)', fontWeight: 500
        }}>Go Home</Link>
      </div>
    );
  }

  if (event.status === 'closed' || event.status === 'archived') {
    router.replace(`/e/${slug}/closed`);
    return null;
  }

  const bannersList = event.banner_photos ?? [];
  const photosToSlide = bannersList.length > 0 ? bannersList : (event.thumbnail_url ? [event.thumbnail_url] : []);

  return (
    <div className="event-landing-outer" style={{
      minHeight: '100dvh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-32) var(--space-24)'
    }}>
      <style>{`
        @media (max-width: 640px) {
          .event-landing-grid {
            gap: 1.5rem !important;
            padding-top: 0 !important;
          }
          .event-landing-outer {
            align-items: flex-start !important;
            padding: 1.25rem 1rem !important;
          }
          .event-landing-title {
            margin-bottom: 0.75rem !important;
          }
          .event-landing-right {
            gap: 1.25rem !important;
          }
          .event-landing-photo-frame {
            max-height: 200px !important;
          }
          .event-landing-photo-frame img {
            object-position: center top !important;
          }
          .event-landing-caption {
            display: none !important;
          }
        }
      `}</style>
      <div style={{
        width: '100%', maxWidth: '1080px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 'var(--space-64)', alignItems: 'center'
      }} className="event-landing-grid">
        
        {/* Left Column: Asymmetric Editorial Cover Framed Portrait (Automatic Crossfade Slideshow) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
          {photosToSlide.length > 0 ? (
            <div className="event-landing-photo-frame" style={{
              width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden',
              border: 'var(--border-hairline)', background: 'var(--bg-surface)',
              boxShadow: 'var(--shadow-sm)', position: 'relative', aspectRatio: '16/9'
            }}>
              {photosToSlide.map((photoUrl, idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={photoUrl}
                  src={photoUrl}
                  alt=""
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    filter: 'sepia(0.12) contrast(0.96)',
                    opacity: idx === activeBannerIndex ? 1 : 0,
                    transition: 'opacity 1s ease-in-out',
                    zIndex: idx === activeBannerIndex ? 2 : 1,
                  }}
                />
              ))}

              {/* Dot slide indicators */}
              {photosToSlide.length > 1 && (
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: '6px',
                  zIndex: 10,
                }}>
                  {photosToSlide.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveBannerIndex(idx)}
                      aria-label={`Slide ${idx + 1}`}
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: idx === activeBannerIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        transition: 'background-color 0.3s',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              aspectRatio: '16/9', width: '100%', borderRadius: 'var(--radius-md)',
              border: 'var(--border-hairline)', background: 'var(--bg-surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'
            }}>
              <Camera size={36} style={{ strokeWidth: 1 }} />
            </div>
          )}
          
          <div className="event-landing-caption" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-caption)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Exhibition Frame
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-caption)', color: 'var(--text-muted)' }}>
              © {new Date().getFullYear()}
            </span>
          </div>
        </div>

        {/* Right Column: Dynamic Form Block */}
        <div className="event-landing-right" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-32)' }}>
          <div>
            <h1 className="event-landing-title" style={{ fontSize: 'var(--font-display-l)', lineHeight: 1.1, marginBottom: 'var(--space-16)', letterSpacing: '-0.02em' }}>
              {event.title}
            </h1>
            
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={14} /> {formatDate(event.event_date)}
              </span>
              {event.venue && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={14} /> {event.venue}
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Users size={14} /> {event.total_participants} Preserved
              </span>
            </div>
          </div>

          <div style={{ borderTop: 'var(--border-hairline)', paddingTop: 'var(--space-24)' }}>
            {event.has_started === false ? (
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: 'var(--font-heading-s)', fontFamily: 'var(--font-sans)', fontWeight: 600, marginBottom: 'var(--space-8)' }}>
                  Scheduled Opening
                </h3>
                <p style={{ fontSize: 'var(--font-small)', color: 'var(--text-secondary)', marginBottom: 'var(--space-24)', fontWeight: 300 }}>
                  This digital archive has not unlocked yet. Join us in:
                </p>

                <Countdown eventDate={event.event_date} startTime={event.start_time} timezone={event.timezone} />
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--font-heading-s)', fontFamily: 'var(--font-sans)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
                    Enter the Exhibition
                  </h3>
                  <p style={{ fontSize: 'var(--font-small)', color: 'var(--text-secondary)', fontWeight: 300 }}>
                    Sign your name to view the gallery and contribute your photo memoirs.
                  </p>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
                  <label htmlFor="join-name" style={{ fontSize: 'var(--font-caption)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Your Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={14} style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input
                      id="join-name"
                      type="text"
                      className={errors.name ? 'error' : ''}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: 'var(--border-strong)',
                        padding: '0.625rem 0.5rem 0.625rem 1.5rem',
                        fontSize: 'var(--font-body)',
                        fontFamily: 'var(--font-sans)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        transition: 'border var(--dur-hover) var(--ease-glide)'
                      }}
                      placeholder=" Sarah Johnson"
                      autoFocus
                      autoComplete="name"
                      {...register('name')}
                    />
                  </div>
                  {errors.name && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-caption)', color: 'var(--color-burnt-orange)', marginTop: '0.25rem', display: 'block' }}>{errors.name.message}</span>}
                </div>

                {event.requires_password && (
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
                    <label htmlFor="join-code" style={{ fontSize: 'var(--font-caption)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      Access Key
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={14} style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                      <input
                        id="join-code"
                        type="text"
                        className={errors.join_code ? 'error' : ''}
                        placeholder=" KEY"
                        style={{
                          width: '100%',
                          background: 'transparent',
                          border: 'none',
                          borderBottom: 'var(--border-strong)',
                          padding: '0.625rem 0.5rem 0.625rem 1.5rem',
                          fontSize: 'var(--font-body)',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          transition: 'border var(--dur-hover) var(--ease-glide)'
                        }}
                        {...register('join_code')}
                      />
                    </div>
                    {errors.join_code && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-caption)', color: 'var(--color-burnt-orange)', marginTop: '0.25rem', display: 'block' }}>{errors.join_code.message}</span>}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    background: 'var(--color-charcoal)',
                    color: 'var(--color-paper-white)',
                    width: '100%',
                    padding: '0.875rem',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: 'var(--font-body)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    border: 'none',
                    transition: 'opacity var(--dur-hover) var(--ease-glide)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  {isSubmitting ? (
                    <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Entering...</>
                  ) : (
                    <>Enter Archive <ArrowRight size={16} /></>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
