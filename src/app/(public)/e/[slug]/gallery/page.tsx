'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Camera, Images, Users, X, ChevronLeft, ChevronRight, ZoomIn, Heart
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useParticipantStore } from '@/store';
import { formatDate } from '@/lib/utils';
import type { Event, Photo } from '@/types';
import { CustomAudioPlayer } from '@/components/ui/CustomAudioPlayer';

interface Wish {
  id: number;
  uuid: string;
  text_message: string | null;
  audio_url: string | null;
  audio_duration_seconds: number | null;
  created_at: string;
  participant?: {
    name: string;
  };
}

export default function GalleryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { name, isJoined } = useParticipantStore();

  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoCount, setPhotoCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ photo: Photo; index: number } | null>(null);
  const [page, setPage] = useState(1);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Tab and Wishes states
  const [tab, setTab] = useState<'photos' | 'wishes'>('photos');
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [wishesLoading, setWishesLoading] = useState(false);
  const [wishesPage, setWishesPage] = useState(1);
  const [wishesHasMore, setWishesHasMore] = useState(false);
  const [wishesLoadingMore, setWishesLoadingMore] = useState(false);

  const [mounted, setMounted] = useState(false);

  // Banner slideshow state
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const photos = event?.banner_photos;
    if (!photos || photos.length === 0) return;
    const interval = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % photos.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [event?.banner_photos]);

  useEffect(() => {
    if (!mounted) return;
    if (!isJoined(slug)) {
      router.replace(`/e/${slug}`);
      return;
    }
    loadEvent();
    loadPhotos(1);

    // Poll for new photos every 15s to keep gallery fresh
    pollingRef.current = setInterval(() => loadLatest(), 15000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [slug, mounted]);

  const loadEvent = async () => {
    try {
      const res = await api.get<{ data: Event }>(`/public/events/${slug}`);
      const eventData = res.data.data;
      setEvent(eventData);
      setPhotoCount(eventData.total_photos ?? 0);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        router.replace(`/e/${slug}`);
      }
    }
  };

  const loadPhotos = async (p: number, cursor?: string | null) => {
    if (p === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const url = `/public/events/${slug}/gallery?per_page=30` + (cursor ? `&cursor=${cursor}` : '');
      const res = await api.get<{ data: Photo[]; meta: { next_cursor: string | null; has_more: boolean } }>(url);
      const data = res.data.data || [];
      const meta = (res.data as any).meta || {};

      setPhotos((prev) => p === 1 ? data : [...prev, ...data]);
      setNextCursor(meta.next_cursor);
      setHasMore(meta.has_more);
      setPage(p);
    } catch (err) {
      console.error("Error loading photos:", err);
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        router.replace(`/e/${slug}`);
        return;
      }
      toast.error('Failed to load gallery.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadLatest = async () => {
    try {
      const res = await api.get<{ data: Photo[] }>(`/public/events/${slug}/gallery/latest?limit=10`);
      const latest = res.data.data;
      if (latest.length > 0) {
        setPhotos((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newPhotos = latest.filter((p) => !existingIds.has(p.id));
          if (newPhotos.length > 0) {
            setPhotoCount((c) => c + newPhotos.length);
            return [...newPhotos, ...prev];
          }
          return prev;
        });
      }
    } catch {}
  };

  const loadWishes = async (p: number) => {
    if (p === 1) setWishesLoading(true);
    else setWishesLoadingMore(true);
    try {
      const res = await api.get<{ data: { data: Wish[], next_page_url: string | null } }>(`/public/events/${slug}/wishes?page=${p}`);
      const data = res.data.data.data || [];
      const hasNext = !!res.data.data.next_page_url;

      setWishes((prev) => p === 1 ? data : [...prev, ...data]);
      setWishesHasMore(hasNext);
      setWishesPage(p);
    } catch (err) {
      console.error("Error loading wishes:", err);
      toast.error('Failed to load wishes.');
    } finally {
      setWishesLoading(false);
      setWishesLoadingMore(false);
    }
  };

  const handleLike = async (photo: Photo, index: number, isLightbox: boolean = false) => {
    const newLiked = !photo.liked;
    const newCount = newLiked ? photo.like_count + 1 : Math.max(0, photo.like_count - 1);

    const updatedPhoto = { ...photo, liked: newLiked, like_count: newCount };

    // Update photos state
    setPhotos((prev) => {
      const copy = [...prev];
      const matchIdx = copy.findIndex((p) => p.id === photo.id);
      if (matchIdx !== -1) {
        copy[matchIdx] = updatedPhoto;
      }
      return copy;
    });

    // Update lightbox state if active
    if (isLightbox && lightbox && lightbox.photo.id === photo.id) {
      setLightbox({ photo: updatedPhoto, index: lightbox.index });
    }

    try {
      if (newLiked) {
        await api.post(`/public/photos/${photo.id}/like`);
      } else {
        await api.delete(`/public/photos/${photo.id}/like`);
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
      toast.error("Failed to update like status.");
      // Rollback on failure
      setPhotos((prev) => {
        const copy = [...prev];
        const matchIdx = copy.findIndex((p) => p.id === photo.id);
        if (matchIdx !== -1) {
          copy[matchIdx] = photo;
        }
        return copy;
      });
      if (isLightbox && lightbox && lightbox.photo.id === photo.id) {
        setLightbox({ photo, index: lightbox.index });
      }
    }
  };

  // Lightbox navigation
  const lightboxNav = (dir: 1 | -1) => {
    if (!lightbox) return;
    const newIdx = lightbox.index + dir;
    if (newIdx < 0 || newIdx >= photos.length) return;
    setLightbox({ photo: photos[newIdx], index: newIdx });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!lightbox) return;
      if (e.key === 'ArrowLeft')  lightboxNav(-1);
      if (e.key === 'ArrowRight') lightboxNav(1);
      if (e.key === 'Escape')     setLightbox(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox, photos]);

  if (!mounted || !isJoined(slug)) return null;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-page)' }}>
      {/* ── Nav ── */}
      <nav className="nav-bar" style={{ borderBottom: '1px solid var(--border-color-medium)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: 'var(--bg-page)',
              border: '1.5px solid var(--text-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Camera size={14} color="var(--text-primary)" strokeWidth={2.5} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '0.9375rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {event?.title ?? '…'}
              </div>
              <div style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                HI, {name} // ROLL #01 // {photoCount} EXP
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link
              href={`/e/${slug}/camera`}
              className="btn btn-primary btn-sm"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em',
                fontWeight: 700,
              }}
            >
              <Camera size={15} /> Take Photo
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Banner Slideshow — full-bleed, outside container ── */}
      {event?.banner_photos && event.banner_photos.length > 0 && (
        <div style={{
          position: 'relative',
          width: '100%',
          height: 'clamp(320px, 55vw, 580px)',
          overflow: 'hidden',
          marginBottom: 0,
        }}>
          {/* Slides */}
          {event.banner_photos.map((url: string, index: number) => (
            <div
              key={index}
              style={{
                position: 'absolute', inset: 0,
                opacity: activeBannerIndex === index ? 1 : 0,
                transition: 'opacity 0.9s ease-in-out',
                zIndex: 1,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}
              />
            </div>
          ))}

          {/* Top vignette */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(9,9,11,0.3) 0%, transparent 30%)',
            zIndex: 2,
            pointerEvents: 'none',
          }} />

          {/* Bottom fade — bleeds into page background */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '55%',
            background: 'linear-gradient(to bottom, transparent 0%, rgba(9,9,11,0.7) 55%, #09090b 100%)',
            zIndex: 2,
            pointerEvents: 'none',
          }} />

          {/* Event title overlaid at bottom */}
          <div style={{
            position: 'absolute',
            bottom: '2rem',
            left: '1.5rem',
            right: '1.5rem',
            zIndex: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.375rem',
          }}>
            <h1 style={{
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: '#fff',
              textShadow: '0 2px 8px rgba(0,0,0,0.6)',
              margin: 0,
              letterSpacing: '0.03em',
              lineHeight: 1.1,
            }}>
              {event.title}
            </h1>
            <p style={{
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              color: 'rgba(255,255,255,0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin: 0,
            }}>
              {formatDate(event.event_date)} &nbsp;·&nbsp; {event.venue || 'Event Venue'}
            </p>
          </div>

          {/* Slide indicators */}
          <div style={{
            position: 'absolute',
            bottom: '2rem',
            right: '1.5rem',
            zIndex: 3,
            display: 'flex',
            gap: '0.4rem',
            alignItems: 'center',
          }}>
            {event.banner_photos.map((_: any, index: number) => (
              <div
                key={index}
                onClick={() => setActiveBannerIndex(index)}
                style={{
                  width: activeBannerIndex === index ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: activeBannerIndex === index ? '#fff' : 'rgba(255,255,255,0.35)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="container" style={{ paddingTop: '0', paddingBottom: '4rem' }}>
        
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '1rem',
          marginBottom: '2rem', borderBottom: '1px solid var(--border-color-medium)',
          paddingBottom: '1rem'
        }}>
          <button
            onClick={() => setTab('photos')}
            className={`btn ${tab === 'photos' ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontSize: '0.75rem',
              padding: '0.4rem 0.875rem'
            }}
          >
            <Images size={14} /> Photos
          </button>
          <button
            onClick={() => {
              setTab('wishes');
              if (wishes.length === 0) {
                loadWishes(1);
              }
            }}
            className={`btn ${tab === 'wishes' ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontSize: '0.75rem',
              padding: '0.4rem 0.875rem'
            }}
          >
            <Users size={14} /> Wishes & Voice
          </button>
        </div>

        {tab === 'photos' ? (
          <>
            {/* ── Gallery Grid ── */}
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ aspectRatio: '1', borderRadius: 10 }} />
                ))}
              </div>
            ) : photos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                <Camera size={56} style={{ color: 'var(--text-muted)', margin: '0 auto 1.25rem' }} />
                <h2 style={{ marginBottom: '0.75rem' }}>No photos yet</h2>
                <p style={{ marginBottom: '1.5rem' }}>Be the first to share a moment!</p>
                {event?.allow_upload && (
                  <Link href={`/e/${slug}/camera`} className="btn btn-primary">
                    <Camera size={16} /> Open Camera
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="photo-grid">
                  {photos.map((photo, idx) => (
                    <div
                      key={photo.id}
                      className="photo-grid-item film-card"
                      onClick={() => setLightbox({ photo, index: idx })}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.thumbnail_url}
                        alt={`Photo by ${photo.photographer ?? 'Guest'}`}
                        loading="lazy"
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                      />

                      {/* Floating Like Badge (Always visible, great for mobile) */}
                      {event?.allow_likes && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(photo, idx);
                          }}
                          style={{
                            position: 'absolute', top: '2.25rem', right: '1rem',
                            background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
                            border: 'none', borderRadius: '99px', padding: '0.25rem 0.5rem',
                            display: 'flex', alignItems: 'center', gap: '0.25rem',
                            cursor: 'pointer', zIndex: 10,
                            color: photo.liked ? '#f43f5e' : '#fff',
                            transition: 'transform 0.1s, background-color 0.2s',
                          }}
                          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <Heart size={12} fill={photo.liked ? '#f43f5e' : 'none'} strokeWidth={2} />
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                            {photo.like_count}
                          </span>
                        </button>
                      )}
                      <div style={{
                        position: 'absolute', bottom: '1.75rem', left: '0.5rem', right: '0.5rem',
                        padding: '0.5rem 0.625rem',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}
                        className="photo-caption"
                      >
                        <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                          {photo.photographer ?? 'Guest'}
                        </span>
                        <ZoomIn size={14} color="rgba(255,255,255,0.8)" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load more */}
                {hasMore && (
                  <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => loadPhotos(page + 1, nextCursor)}
                      disabled={loadingMore}
                    >
                      {loadingMore ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <>
            {/* ── Wishes Grid ── */}
            {wishesLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 140, borderRadius: 8 }} />
                ))}
              </div>
            ) : wishes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                <Users size={56} style={{ color: 'var(--text-muted)', margin: '0 auto 1.25rem' }} />
                <h2 style={{ marginBottom: '0.75rem' }}>No wishes yet</h2>
                <p style={{ marginBottom: '1.5rem' }}>Be the first to record a voice note or write wishes!</p>
                <Link href={`/e/${slug}/camera`} className="btn btn-primary">
                  Record wishes
                </Link>
              </div>
            ) : (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '1rem'
                }}>
                  {wishes.map((wish) => (
                    <div
                      key={wish.id}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 8,
                        padding: '1.25rem',
                        display: 'flex', flexDirection: 'column', gap: '0.75rem',
                        boxShadow: 'var(--shadow-md)',
                        animation: 'fadeIn 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#fff', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                          {wish.participant?.name ?? 'Guest'}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                          {formatDate(wish.created_at)}
                        </span>
                      </div>

                      {wish.text_message && (
                        <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, fontStyle: 'italic', wordBreak: 'break-word' }}>
                          &ldquo;{wish.text_message}&rdquo;
                        </p>
                      )}

                      {wish.audio_url && (
                        <div style={{ marginTop: '0.25rem' }}>
                          <CustomAudioPlayer src={wish.audio_url} duration={wish.audio_duration_seconds || undefined} />
                          {wish.audio_duration_seconds && (
                            <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginTop: '0.25rem', textAlign: 'right' }}>
                              Voice Note • {wish.audio_duration_seconds}s
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {wishesHasMore && (
                  <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => loadWishes(wishesPage + 1)}
                      disabled={wishesLoadingMore}
                    >
                      {wishesLoadingMore ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          className="modal-overlay"
          style={{ alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setLightbox(null)}
        >
          <button
            style={{
              position: 'fixed', top: '1rem', right: '1rem',
              background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
              width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', cursor: 'pointer', zIndex: 10,
            }}
            onClick={() => setLightbox(null)}
          >
            <X size={20} />
          </button>

          {/* Prev */}
          {lightbox.index > 0 && (
            <button
              style={{
                position: 'fixed', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', cursor: 'pointer', zIndex: 10,
              }}
              onClick={(e) => { e.stopPropagation(); lightboxNav(-1); }}
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Image */}
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90dvh', position: 'relative' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.photo.optimized_url}
              alt=""
              style={{ maxWidth: '90vw', maxHeight: '85dvh', objectFit: 'contain', borderRadius: 12 }}
            />
            <div style={{
              marginTop: '0.875rem', 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '0 0.25rem',
              color: '#fff', fontSize: '0.875rem',
            }}>
              <div style={{ textAlign: 'left', color: 'rgba(255,255,255,0.8)' }}>
                <span style={{ fontWeight: 600 }}>{lightbox.photo.photographer ?? 'Guest'}</span>
                <span style={{ margin: '0 0.5rem', opacity: 0.5 }}>·</span>
                <span>{lightbox.index + 1} of {photos.length}</span>
              </div>

              {event?.allow_likes && (
                <button
                  onClick={() => handleLike(lightbox.photo, lightbox.index, true)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                    border: 'none', borderRadius: '99px', padding: '0.4rem 0.875rem',
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    cursor: 'pointer', color: lightbox.photo.liked ? '#f43f5e' : '#fff',
                    transition: 'transform 0.1s, background-color 0.2s',
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Heart size={14} fill={lightbox.photo.liked ? '#f43f5e' : 'none'} strokeWidth={2} />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#fff' }}>
                    {lightbox.photo.like_count}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Next */}
          {lightbox.index < photos.length - 1 && (
            <button
              style={{
                position: 'fixed', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', cursor: 'pointer', zIndex: 10,
              }}
              onClick={(e) => { e.stopPropagation(); lightboxNav(1); }}
            >
              <ChevronRight size={22} />
            </button>
          )}
        </div>
      )}

      <style>{`
        .photo-grid-item:hover .photo-caption { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
