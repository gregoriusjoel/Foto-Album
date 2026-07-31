'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Lottie from 'lottie-react';
import likeHeartAnimation from '@/app/like-heart.json';
import Link from 'next/link';
import {
  Camera, Images, Users, X, ChevronLeft, ChevronRight, ZoomIn, Heart,
  Download, Share2, Info, Copy, CheckSquare, Check, RefreshCw, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useParticipantStore } from '@/store';
import { formatDate } from '@/lib/utils';
import type { Event, Photo, DownloadJob } from '@/types';
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

  // Selection & Mode States
  const [mode, setMode] = useState<'normal' | 'selection'>('normal');
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  
  // Context Menu & Info modal
  const [activeActionSheetPhoto, setActiveActionSheetPhoto] = useState<{ photo: Photo; index: number } | null>(null);
  const [showInfoPhoto, setShowInfoPhoto] = useState<Photo | null>(null);
  
  // ZIP Download Job State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [zipError, setZipError] = useState<string | null>(null);
  const [zipPreparing, setZipPreparing] = useState(false);
  
  // Long press timer refs
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isMovingRef = useRef(false);
  const longPressedRef = useRef(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const lastClickTimeRef = useRef<{ [key: string]: number }>({});
  const [activeHearts, setActiveHearts] = useState<string[]>([]);

  // Toggle photo selection
  const toggleSelectPhoto = (uuid: string) => {
    setSelectedPhotoIds((prev) => {
      if (prev.includes(uuid)) {
        return prev.filter((id) => id !== uuid);
      } else {
        return [...prev, uuid];
      }
    });
  };

  // Touch Long-Press & Selection Gestures
  const startLongPress = (photo: Photo, idx: number) => (e: React.MouseEvent | React.TouchEvent) => {
    const touch = 'touches' in e ? e.touches[0] : null;
    touchStartRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
    isMovingRef.current = false;

    if (mode === 'selection') {
      // In selection mode, we don't set long-press timer or scaling effect
      return;
    }

    // Apply scale micro-interaction (Normal Mode only)
    const card = e.currentTarget as HTMLElement;
    card.style.transform = 'scale(1.05)';
    card.style.transition = 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)';
    card.style.boxShadow = '0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5)';
    card.style.zIndex = '10';

    longPressedRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(15);
      }
      longPressedRef.current = true;
      setActiveActionSheetPhoto({ photo, index: idx });
      
      // Reset card style
      card.style.transform = '';
      card.style.boxShadow = '';
      card.style.zIndex = '';
      longPressTimerRef.current = null;
    }, 600);
  };

  const moveLongPress = (e: React.MouseEvent | React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = 'touches' in e ? e.touches[0] : null;
    if (!touch) return;
    const diffX = Math.abs(touch.clientX - touchStartRef.current.x);
    const diffY = Math.abs(touch.clientY - touchStartRef.current.y);
    
    // If user scrolls/moves, cancel selection/long press
    if (diffX > 10 || diffY > 10) {
      isMovingRef.current = true;
      cancelLongPress(e);
    }
  };

  const endLongPress = (photo: Photo, idx: number) => (e: React.MouseEvent | React.TouchEvent) => {
    const card = e.currentTarget as HTMLElement;
    card.style.transform = '';
    card.style.boxShadow = '';
    card.style.zIndex = '';

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const cancelLongPress = (e: React.MouseEvent | React.TouchEvent) => {
    const card = e.currentTarget as HTMLElement;
    card.style.transform = '';
    card.style.boxShadow = '';
    card.style.zIndex = '';
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    isMovingRef.current = true;
  };

  // Trigger double tap like logic
  const handleDoubleLike = (photo: Photo, index: number, isLightbox = false) => {
    if (!photo.liked) {
      handleLike(photo, index, isLightbox);
    }
    triggerFloatingHeart(photo.id);
  };

  const triggerFloatingHeart = (photoId: string) => {
    const heartId = `${photoId}_${Date.now()}`;
    setActiveHearts((prev) => [...prev, heartId]);
    setTimeout(() => {
      setActiveHearts((prev) => prev.filter((id) => id !== heartId));
    }, 1400);
  };

  // Handle standard click/tap events
  const handleItemClick = (photo: Photo, index: number) => (e: React.MouseEvent) => {
    if (longPressedRef.current) {
      // If action sheet was opened by long press, skip click action
      longPressedRef.current = false;
      return;
    }

    if (mode === 'selection') {
      toggleSelectPhoto(photo.id);
      return;
    }

    // Double tap/click detection
    const now = Date.now();
    const lastClick = lastClickTimeRef.current[photo.id] || 0;
    if (now - lastClick < 300) {
      handleDoubleLike(photo, index);
      lastClickTimeRef.current[photo.id] = 0;
      return;
    }
    lastClickTimeRef.current[photo.id] = now;

    setLightbox({ photo, index });
  };

  // Handle click events on Lightbox fullscreen image
  const handleLightboxClick = (photo: Photo, index: number) => (e: React.MouseEvent) => {
    const now = Date.now();
    const lastClick = lastClickTimeRef.current[photo.id] || 0;
    if (now - lastClick < 300) {
      handleDoubleLike(photo, index, true);
      lastClickTimeRef.current[photo.id] = 0;
      return;
    }
    lastClickTimeRef.current[photo.id] = now;
  };

  // Swipe Gestures for Lightbox
  const handleLightboxTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  };

  const handleLightboxTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartXRef.current;
    const diffY = touch.clientY - touchStartYRef.current;
    
    // Swipe left (diffX < -50) -> next
    // Swipe right (diffX > 50) -> prev
    if (Math.abs(diffX) > Math.abs(diffY) * 1.5 && Math.abs(diffX) > 60) {
      if (diffX < 0) {
        if (lightbox && lightbox.index < photos.length - 1) {
          lightboxNav(1);
        }
      } else {
        if (lightbox && lightbox.index > 0) {
          lightboxNav(-1);
        }
      }
    }
    
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Download Single Photo (Blob creation fallback for desktop/safari force-download)
  const downloadSinglePhoto = async (photo: Photo) => {
    try {
      toast.loading('Downloading photo...', { id: 'single-dl' });
      const response = await fetch(photo.original_url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Photo_${photo.id}.webp`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Download complete!', { id: 'single-dl' });
    } catch (err) {
      console.error(err);
      toast.error('Opening original photo for download...', { id: 'single-dl' });
      window.open(photo.original_url, '_blank');
    }
  };

  // Native Web Share API
  const sharePhoto = async (photo: Photo) => {
    const shareUrl = `${window.location.origin}/e/${slug}/gallery?photo=${photo.id}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Photo from ${event?.title || 'FotoAlbum'}`,
          text: `Check out this photo uploaded by ${photo.photographer ?? 'Guest'}!`,
          url: shareUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      copyLink(photo);
    }
  };

  // Copy shareable link to clipboard
  const copyLink = (photo: Photo) => {
    const shareUrl = `${window.location.origin}/e/${slug}/gallery?photo=${photo.id}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => toast.success('Link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy link.'));
  };

  // Trigger public bulk ZIP download API
  const triggerBulkDownload = async () => {
    try {
      setShowConfirmModal(false);
      setZipPreparing(true);
      setZipProgress(5);
      setZipError(null);
      
      const res = await api.post<{ data: { job_id: string } }>(
        `/public/events/${slug}/downloads`,
        { photo_uuids: selectedPhotoIds }
      );
      pollZipJob(res.data.data.job_id);
    } catch (err: any) {
      console.error(err);
      setZipPreparing(false);
      const msg = err.response?.data?.message || 'Gagal memulai penyiapan ZIP.';
      setZipError(msg);
    }
  };

  // Poll bulk download status from backend
  const pollZipJob = (jobId: string) => {
    let progress = 5;
    setZipProgress(progress);
    
    const interval = setInterval(async () => {
      try {
        // Visual indicator increments smoothly
        progress = Math.min(progress + (100 - progress) * 0.15, 92);
        setZipProgress(Math.round(progress));

        const res = await api.get<{ data: { status: string; download_url?: string; error?: string } }>(`/public/downloads/${jobId}`);
        const job = res.data.data;
        
        if (job.status === 'ready' || job.status === 'completed') {
          clearInterval(interval);
          setZipProgress(100);
          setZipPreparing(false);
          setMode('normal');
          setSelectedPhotoIds([]);
          
          const url = job.download_url;
          if (url) {
            toast.success('ZIP ready! Starting download...', { id: 'zip-dl' });
            window.open(url, '_blank');
          } else {
            toast.error('Download link not found.');
          }
        } else if (job.status === 'failed') {
          clearInterval(interval);
          setZipPreparing(false);
          setZipError(job.error || 'Failed to compress ZIP.');
          toast.error('Failed to generate ZIP.', { id: 'zip-dl' });
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 1800);
  };

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
      <nav className="nav-bar" style={{ borderBottom: '1px solid var(--border-color-medium)', position: 'sticky', top: 0, zIndex: 80, background: 'var(--bg-page)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', height: '54px' }}>
          {mode === 'selection' ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  onClick={() => {
                    setMode('normal');
                    setSelectedPhotoIds([]);
                  }}
                  style={{
                    background: 'transparent', border: 'none', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', padding: '0.25rem'
                  }}
                >
                  <X size={20} />
                </button>
                <span style={{ fontWeight: 700, fontSize: '1.0625rem', color: '#fff' }}>
                  {selectedPhotoIds.length} Dipilih
                </span>
              </div>
              <div>
                <button
                  onClick={() => setSelectedPhotoIds(photos.map(p => p.id))}
                  style={{
                    background: 'transparent', border: 'none', color: 'var(--text-muted)',
                    fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', marginRight: '1rem'
                  }}
                >
                  Pilih Semua
                </button>
                <button
                  onClick={() => {
                    setMode('normal');
                    setSelectedPhotoIds([]);
                  }}
                  style={{
                    background: 'transparent', border: 'none', color: 'var(--text-muted)',
                    fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
              </div>
            </>
          ) : (
            <>
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {tab === 'photos' && photos.length > 0 && (
                  <button
                    onClick={() => setMode('selection')}
                    style={{
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.875rem',
                      color: '#fff', fontSize: '0.75rem', fontFamily: 'var(--font-mono)',
                      fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase'
                    }}
                  >
                    Pilih
                  </button>
                )}
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
            </>
          )}
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
                  {photos.map((photo, idx) => {
                    const isSelected = selectedPhotoIds.includes(photo.id);
                    return (
                      <div
                        key={photo.id}
                        className={`photo-grid-item film-card ${mode === 'selection' ? 'in-selection-mode' : ''} ${isSelected ? 'is-selected' : ''}`}
                        onTouchStart={startLongPress(photo, idx)}
                        onTouchMove={moveLongPress}
                        onTouchEnd={endLongPress(photo, idx)}
                        onTouchCancel={cancelLongPress}
                        onMouseDown={startLongPress(photo, idx)}
                        onMouseMove={moveLongPress}
                        onMouseUp={endLongPress(photo, idx)}
                        onMouseLeave={cancelLongPress}
                        onClick={handleItemClick(photo, idx)}
                        style={{ position: 'relative' }}
                      >
                        {/* Checkbox overlay in Selection Mode */}
                        {mode === 'selection' && (
                          <div className={`grid-item-checkbox ${isSelected ? 'checked' : ''}`}>
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                        )}

                        {/* Floating Double Tap Heart Indicator */}
                        {activeHearts.some((hId) => hId.startsWith(photo.id)) && (
                          <div className="heart-overlay-container">
                            <div className="heart-wrapper">
                              <Lottie 
                                animationData={likeHeartAnimation} 
                                loop={false} 
                                style={{ width: 100, height: 100 }} 
                              />
                            </div>
                          </div>
                        )}

                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.thumbnail_url}
                          alt={`Photo by ${photo.photographer ?? 'Guest'}`}
                          loading="lazy"
                          style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }}
                        />

                        {/* Floating Like Badge (Always visible, great for mobile) */}
                        {event?.allow_likes && mode !== 'selection' && (
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
                            <Heart 
                              key={photo.liked ? 'liked' : 'unliked'}
                              size={12} 
                              className={photo.liked ? 'heart-bounce-anim' : ''}
                              fill={photo.liked ? '#f43f5e' : 'none'} 
                              strokeWidth={2} 
                            />
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
                    );
                  })}
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

          {/* Image & Bottom Actions (iOS Style) */}
          <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100dvh', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            
            {/* Fullscreen Image Container */}
            <div 
              onTouchStart={handleLightboxTouchStart}
              onTouchEnd={handleLightboxTouchEnd}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', padding: '1rem', position: 'relative' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={lightbox.photo.id}
                src={lightbox.photo.optimized_url}
                alt=""
                className="lightbox-image-anim"
                draggable="false"
                onClick={handleLightboxClick(lightbox.photo, lightbox.index)}
                style={{ maxWidth: '100%', maxHeight: 'calc(100dvh - 160px)', objectFit: 'contain', borderRadius: '8px', userSelect: 'none', WebkitUserSelect: 'none' }}
              />

              {/* Floating Double Tap Heart Indicator inside Lightbox */}
              {activeHearts.some((hId) => hId.startsWith(lightbox.photo.id)) && (
                <div className="heart-overlay-container">
                  <div className="heart-wrapper">
                    <Lottie 
                      animationData={likeHeartAnimation} 
                      loop={false} 
                      style={{ width: 220, height: 220 }} 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Info Caption (Centered above bottom toolbar) */}
            <div style={{
              position: 'absolute',
              bottom: '4.85rem',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.8125rem',
              fontFamily: 'var(--font-mono)',
              textAlign: 'center',
              zIndex: 10,
              width: '100%',
              pointerEvents: 'none',
            }}>
              <span style={{ fontWeight: 600 }}>{lightbox.photo.photographer ?? 'Guest'}</span>
              <span style={{ margin: '0 0.5rem', opacity: 0.4 }}>·</span>
              <span>{lightbox.index + 1} of {photos.length}</span>
            </div>

            {/* iOS-Style Bottom Toolbar (Rounded & Floating) */}
            <div style={{
              position: 'absolute',
              bottom: '1.25rem',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'calc(100% - 2.5rem)',
              maxWidth: '360px',
              background: 'rgba(20, 20, 25, 0.75)',
              backdropFilter: 'blur(25px)',
              WebkitBackdropFilter: 'blur(25px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '99px',
              padding: '0.625rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
              zIndex: 10,
            }}>
              {/* Action 1: Share */}
              <button
                onClick={() => sharePhoto(lightbox.photo)}
                style={{ background: 'transparent', border: 'none', color: '#fff', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Share2 size={20} />
              </button>

              {/* Action 2: Like */}
              {event?.allow_likes && (
                <button
                  onClick={() => handleLike(lightbox.photo, lightbox.index, true)}
                  style={{
                    background: 'transparent', border: 'none',
                    color: lightbox.photo.liked ? '#f43f5e' : '#fff',
                    padding: '0.5rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    transition: 'transform 0.1s'
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.85)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Heart 
                    key={lightbox.photo.liked ? 'liked' : 'unliked'}
                    size={20} 
                    className={lightbox.photo.liked ? 'heart-bounce-anim' : ''}
                    fill={lightbox.photo.liked ? '#f43f5e' : 'none'} 
                    strokeWidth={2} 
                  />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#fff' }}>
                    {lightbox.photo.like_count}
                  </span>
                </button>
              )}

              {/* Action 3: Info */}
              <button
                onClick={() => setShowInfoPhoto(lightbox.photo)}
                style={{ background: 'transparent', border: 'none', color: '#fff', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Info size={20} />
              </button>

              {/* Action 4: Download */}
              <button
                onClick={() => downloadSinglePhoto(lightbox.photo)}
                style={{ background: 'transparent', border: 'none', color: '#fff', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Download size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Action Sheet Overlay (iOS Haptic Touch Context Menu style) ── */}
      {activeActionSheetPhoto && (
        <div className="action-sheet-overlay" onClick={() => setActiveActionSheetPhoto(null)}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              maxWidth: '320px',
              padding: '1.25rem',
              animation: 'zoomIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Floating Image Preview */}
            <img
              src={activeActionSheetPhoto.photo.optimized_url}
              alt=""
              style={{
                width: '100%',
                maxHeight: '340px',
                objectFit: 'cover',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
                display: 'block',
              }}
            />

            {/* Context Menu Card */}
            <div
              style={{
                width: '100%',
                marginTop: '12px',
                background: 'rgba(28, 28, 30, 0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
              }}
            >
              <button
                className="context-menu-item"
                onClick={() => {
                  downloadSinglePhoto(activeActionSheetPhoto.photo);
                  setActiveActionSheetPhoto(null);
                }}
              >
                <span>Download</span>
                <Download size={18} />
              </button>
              
              <button
                className="context-menu-item"
                onClick={() => {
                  setMode('selection');
                  setSelectedPhotoIds([activeActionSheetPhoto.photo.id]);
                  setActiveActionSheetPhoto(null);
                }}
              >
                <span>Pilih Foto</span>
                <CheckSquare size={18} />
              </button>

              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  className="context-menu-item"
                  onClick={() => {
                    sharePhoto(activeActionSheetPhoto.photo);
                    setActiveActionSheetPhoto(null);
                  }}
                >
                  <span>Bagikan</span>
                  <Share2 size={18} />
                </button>
              )}

              <button
                className="context-menu-item"
                onClick={() => {
                  copyLink(activeActionSheetPhoto.photo);
                  setActiveActionSheetPhoto(null);
                }}
              >
                <span>Salin Link</span>
                <Copy size={18} />
              </button>

              <button
                className="context-menu-item"
                onClick={() => {
                  setShowInfoPhoto(activeActionSheetPhoto.photo);
                  setActiveActionSheetPhoto(null);
                }}
              >
                <span>Informasi Foto</span>
                <Info size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Photo Information Modal ── */}
      {showInfoPhoto && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }} onClick={() => setShowInfoPhoto(null)}>
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '90%', maxWidth: '400px', background: 'rgba(20,20,25,0.95)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
              padding: '1.5rem', position: 'relative'
            }}
          >
            <button
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              onClick={() => setShowInfoPhoto(null)}
            >
              <X size={18} />
            </button>
            
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#fff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Info size={18} color="var(--text-primary)" /> Detail Foto
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.8125rem', fontFamily: 'var(--font-mono)' }}>
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Nama File</span>
                <span style={{ color: '#fff', wordBreak: 'break-all' }}>
                  {(() => {
                    const photoIdx = photos.findIndex(p => p.id === showInfoPhoto.id);
                    return photoIdx !== -1 ? `IMG_${String(photoIdx + 1).padStart(4, '0')}.webp` : 'IMG_0001.webp';
                  })()}
                </span>
              </div>
              
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Pengunggah</span>
                <span style={{ color: '#fff' }}>{showInfoPhoto.photographer ?? 'Guest'}</span>
              </div>

              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Tanggal Unggah</span>
                <span style={{ color: '#fff' }}>{formatDate(showInfoPhoto.uploaded_at)}</span>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Dimensi & Ukuran</span>
                <span style={{ color: '#fff' }}>
                  {showInfoPhoto.width && showInfoPhoto.height ? `${showInfoPhoto.width} × ${showInfoPhoto.height}` : ''}
                  {showInfoPhoto.width && showInfoPhoto.height && showInfoPhoto.size_bytes ? ' · ' : ''}
                  {showInfoPhoto.size_bytes ? (
                    (() => {
                      const bytes = showInfoPhoto.size_bytes;
                      if (bytes < 1024) return `${bytes} B`;
                      const kb = bytes / 1024;
                      if (kb < 1024) return `${kb.toFixed(1)} KB`;
                      return `${(kb / 1024).toFixed(1)} MB`;
                    })()
                  ) : (
                    'Tinggi Kualitas WebP'
                  )}
                </span>
              </div>
            </div>
            
            <button
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '1.5rem', borderRadius: 'var(--radius-sm)' }}
              onClick={() => setShowInfoPhoto(null)}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* ── Confirm Zip Download Modal ── */}
      {showConfirmModal && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }} onClick={() => setShowConfirmModal(false)}>
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '90%', maxWidth: '380px', background: 'rgba(20,20,25,0.95)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
              padding: '1.5rem', textAlign: 'center'
            }}
          >
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#3b82f6'
            }}>
              <Download size={22} />
            </div>

            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
              Unduh {selectedPhotoIds.length} Foto?
            </h3>
            
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Foto pilihan Anda akan dikompresi menjadi berkas ZIP tunggal.<br />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', display: 'block', marginTop: '0.5rem', color: 'var(--text-primary)' }}>
                Estimasi ukuran berkas: ~{(selectedPhotoIds.length * 2.2).toFixed(1)} MB
              </span>
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn btn-ghost"
                style={{ flex: 1, borderRadius: 'var(--radius-sm)' }}
                onClick={() => setShowConfirmModal(false)}
              >
                Batal
              </button>
              
              <button
                className="btn btn-primary"
                style={{ flex: 1, borderRadius: 'var(--radius-sm)' }}
                onClick={triggerBulkDownload}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ZIP Preparing Progress Modal ── */}
      {zipPreparing && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
          <div
            className="card"
            style={{
              width: '90%', maxWidth: '380px', background: 'rgba(20,20,25,0.98)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
              padding: '1.75rem', textAlign: 'center'
            }}
          >
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: '#3b82f6'
            }}>
              <RefreshCw size={22} className="spinning" />
            </div>

            <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
              Menyiapkan Unduhan...
            </h3>
            
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Sedang mengompresi foto pilihan Anda di server. Jangan tutup halaman ini.
            </p>

            <div style={{ width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', height: '8px', marginBottom: '0.75rem', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${zipProgress}%`, height: '100%', background: '#3b82f6',
                  borderRadius: '99px', transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              <span>PROG: COMPRESSING</span>
              <span style={{ fontWeight: 700, color: '#fff' }}>{zipProgress}%</span>
            </div>
          </div>
        </div>
      )}

      {/* ── ZIP Error Modal ── */}
      {zipError && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }} onClick={() => setZipError(null)}>
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '90%', maxWidth: '380px', background: 'rgba(20,20,25,0.95)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
              padding: '1.5rem', textAlign: 'center'
            }}
          >
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#ef4444'
            }}>
              <AlertTriangle size={22} />
            </div>

            <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
              Gagal Mengunduh
            </h3>
            
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              {zipError}
            </p>

            <button
              className="btn btn-secondary"
              style={{ width: '100%', borderRadius: 'var(--radius-sm)' }}
              onClick={() => setZipError(null)}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* ── Bottom Action Toolbar ── */}
      {mode === 'selection' && selectedPhotoIds.length > 0 && (
        <div className="bottom-toolbar">
          <button
            style={{
              background: 'transparent', border: 'none', color: '#ef4444',
              fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
              fontFamily: 'var(--font-mono)', textTransform: 'uppercase'
            }}
            onClick={() => {
              setMode('normal');
              setSelectedPhotoIds([]);
            }}
          >
            Batal
          </button>
          
          <button
            className="btn btn-primary"
            style={{
              borderRadius: 'var(--radius-sm)', padding: '0.5rem 1.25rem',
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
              fontWeight: 700, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
            onClick={() => {
              if (selectedPhotoIds.length === 1) {
                const photo = photos.find(p => p.id === selectedPhotoIds[0]);
                if (photo) {
                  downloadSinglePhoto(photo);
                  setMode('normal');
                  setSelectedPhotoIds([]);
                }
              } else {
                setShowConfirmModal(true);
              }
            }}
          >
            <Download size={14} /> Download ({selectedPhotoIds.length})
          </button>
        </div>
      )}

      <style>{`
        .photo-grid-item:hover .photo-caption { opacity: 1 !important; }
        
        .photo-grid-item {
          position: relative;
          cursor: pointer;
          overflow: hidden;
          border-radius: 12px;
          user-select: none;
          -webkit-user-select: none;
          touch-action: pan-y;
          -webkit-tap-highlight-color: transparent;
        }
        
        @keyframes slideUp {
          from { transform: translate(-50%, 120%); }
          to { transform: translate(-50%, 0); }
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .lightbox-image-anim {
          animation: lightboxFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes lightboxFadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
         }
        
        .heart-bounce-anim {
          animation: heartBounce 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes heartBounce {
          0% { transform: scale(0.6); }
          50% { transform: scale(1.35); }
          100% { transform: scale(1); }
        }
        
        .heart-overlay-container {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 30;
          pointer-events: none;
          animation: heartOverlayFadeOut 1.4s ease-out forwards;
        }

        @keyframes heartOverlayFadeOut {
          0% { opacity: 1; }
          75% { opacity: 1; }
          100% { opacity: 0; }
        }

        .heart-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .heart-overlay-icon {
          animation: heartPopWiggle 0.9s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          filter: drop-shadow(0 4px 20px rgba(244, 63, 94, 0.7));
        }
        
        @keyframes heartPopWiggle {
          0% { opacity: 0; transform: scale(0.3) rotate(0deg); }
          12% { opacity: 0.95; transform: scale(1.35) rotate(-18deg); }
          24% { opacity: 1; transform: scale(1.1) rotate(18deg); }
          36% { opacity: 1; transform: scale(1.2) rotate(-12deg); }
          48% { opacity: 1; transform: scale(1.1) rotate(12deg); }
          60% { opacity: 1; transform: scale(1.1) rotate(0deg); }
          75% { opacity: 1; transform: scale(1.1) translateY(0); }
          100% { opacity: 0; transform: scale(0.7) translateY(-35px); }
        }

        .sparks-container {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: -1;
        }

        .spark-dot {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #f43f5e;
          box-shadow: 0 0 8px #f43f5e;
          opacity: 0;
        }

        .spark-0 { --angle: 0deg; animation: sparkOutward 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards; }
        .spark-1 { --angle: 45deg; animation: sparkOutward 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards; }
        .spark-2 { --angle: 90deg; animation: sparkOutward 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards; }
        .spark-3 { --angle: 135deg; animation: sparkOutward 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards; }
        .spark-4 { --angle: 180deg; animation: sparkOutward 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards; }
        .spark-5 { --angle: 225deg; animation: sparkOutward 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards; }
        .spark-6 { --angle: 270deg; animation: sparkOutward 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards; }
        .spark-7 { --angle: 315deg; animation: sparkOutward 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards; }

        @keyframes sparkOutward {
          0% {
            opacity: 0;
            transform: rotate(var(--angle)) translateY(0) scale(0.3);
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: rotate(var(--angle)) translateY(-65px) scale(0.8);
          }
        }
        
        .action-sheet-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        .context-menu-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0.8125rem 1rem;
          background: transparent;
          border: none;
          color: #fff;
          font-size: 0.9375rem;
          font-weight: 400;
          cursor: pointer;
          transition: background 0.15s;
          font-family: inherit;
        }
        
        .context-menu-item:not(:last-child) {
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .context-menu-item:active {
          background: rgba(255, 255, 255, 0.08);
        }
        
        .bottom-toolbar {
          position: fixed;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 2rem);
          max-width: 450px;
          background: rgba(20, 20, 25, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 0.75rem 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          z-index: 90;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        .grid-item-checkbox {
          position: absolute;
          top: 0.75rem;
          left: 0.75rem;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid #fff;
          background: rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          z-index: 20;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .grid-item-checkbox.checked {
          background: #3b82f6;
          border-color: #3b82f6;
        }
        
        .photo-grid-item.in-selection-mode::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.3);
          transition: background 0.2s;
          pointer-events: none;
          z-index: 5;
        }
        
        .photo-grid-item.in-selection-mode.is-selected::after {
          background: transparent;
          border-radius: 12px;
        }

        .spinning {
          animation: spin 1.2s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
