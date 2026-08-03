'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Camera, Users, Image, Download, Share2,
  CheckCircle, XCircle, Archive, Edit, Trash2, Copy,
  Loader2, ExternalLink, MapPin, Calendar, Globe, Lock, Play, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import { formatDate, getEventStatusBadge, formatMb } from '@/lib/utils';
import type { Event, Photo, DownloadJob } from '@/types';
import { ApertureLoader } from '@/components/ui/ApertureLoader';

export default function EventDetailPage() {
  const params = useParams();
  const uuid = params.uuid as string;
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [downloadJob, setDownloadJob] = useState<DownloadJob | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [evRes, phRes] = await Promise.all([
          adminApi.get<{ data: Event }>(`/admin/events/${uuid}`),
          adminApi.get<{ data: Photo[]; meta: { total: number } }>(`/admin/events/${uuid}/photos?per_page=12`),
        ]);
        setEvent(evRes.data.data);
        setPhotos(Array.isArray(phRes.data.data) ? phRes.data.data : []);
        setTotalPhotos(phRes.data.meta?.total ?? 0);
      } catch {
        toast.error('Event not found.');
        router.push('/events');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [uuid]);

  const changeStatus = async (action: 'publish' | 'close' | 'archive') => {
    setActionLoading(action);
    try {
      await adminApi.post(`/admin/events/${uuid}/${action}`);
      const res = await adminApi.get<{ data: Event }>(`/admin/events/${uuid}`);
      setEvent(res.data.data);
      toast.success(`Event ${action}d.`);
    } catch {
      toast.error(`Failed to ${action} event.`);
    } finally {
      setActionLoading(null);
    }
  };

  const startEvent = async () => {
    setActionLoading('start');
    try {
      await adminApi.post(`/admin/events/${uuid}/start`);
      const res = await adminApi.get<{ data: Event }>(`/admin/events/${uuid}`);
      setEvent(res.data.data);
      toast.success('Event started! It is now live.');
    } catch {
      toast.error('Failed to start event.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteConfirm = async () => {
    setActionLoading('delete');
    try {
      await adminApi.delete(`/admin/events/${uuid}`);
      toast.success('Event permanently deleted.');
      setShowDeleteModal(false);
      router.push('/events');
    } catch {
      toast.error('Failed to delete event.');
      setActionLoading(null);
    }
  };

  const downloadQrCode = () => {
    const svg = document.querySelector('.qr-wrapper svg');
    if (!svg) return;

    // Load the logo first
    const logoImg = new window.Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.src = "/logo-memly.png";

    logoImg.onload = () => {
      const svgData = new XMLSerializer().serializeToString(svg);
      const qrImg = new window.Image();

      qrImg.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set dimensions (Poster/Card style: 600 width, 850 height)
        canvas.width = 600;
        canvas.height = 850;

        // 1. Draw Background (Warm paper-white / light ivory gradient)
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#FAF8F4');
        gradient.addColorStop(1, '#F3EFE6');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // ─── BACKGROUND ORNAMENTS ───
        // A. Faint dot grid matrix in the background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.025)';
        const dotSpacing = 30;
        for (let x = 40; x < canvas.width - 40; x += dotSpacing) {
          for (let y = 40; y < canvas.height - 40; y += dotSpacing) {
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // B. Faint circular aperture rings
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.025)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 380, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 220, 0, Math.PI * 2);
        ctx.stroke();

        // C. Camera status info labels (top left / top right)
        ctx.fillStyle = 'rgba(31, 31, 31, 0.45)';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('[ ISO 400 ]', 35, 45);
        ctx.textAlign = 'right';
        ctx.fillText('[ MODE: ANA_COLOR ]', canvas.width - 35, 45);

        // 2. Draw modern border (thin elegant border in light black opacity)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

        // Add camera viewfinder style corner accents (dark charcoal)
        ctx.strokeStyle = '#1f1f1f';
        ctx.lineWidth = 3;
        const offset = 20;
        const len = 15;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(offset, offset + len);
        ctx.lineTo(offset, offset);
        ctx.lineTo(offset + len, offset);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(canvas.width - offset, offset + len);
        ctx.lineTo(canvas.width - offset, offset);
        ctx.lineTo(canvas.width - offset - len, offset);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(offset, canvas.height - offset - len);
        ctx.lineTo(offset, canvas.height - offset);
        ctx.lineTo(offset + len, canvas.height - offset);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(canvas.width - offset, canvas.height - offset - len);
        ctx.lineTo(canvas.width - offset, canvas.height - offset);
        ctx.lineTo(canvas.width - offset - len, canvas.height - offset);
        ctx.stroke();

        // 3. Draw Logo at the top (centered)
        const logoWidth = 90;
        const logoHeight = 90;
        const logoX = (canvas.width - logoWidth) / 2;
        const logoY = 65;
        ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

        // 4. Draw Website Name / Branding (dark charcoal)
        ctx.fillStyle = '#1f1f1f';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('F O T O A L B U M', canvas.width / 2, logoY + logoHeight + 15);

        ctx.fillStyle = 'rgba(31, 31, 31, 0.5)';
        ctx.font = '11px monospace';
        ctx.fillText('SHARE YOUR MOMENTS LIVE', canvas.width / 2, logoY + logoHeight + 48);

        // 5. Draw QR Code in the middle (with a solid white card for scan compatibility)
        const qrSize = 280;
        const qrX = (canvas.width - qrSize) / 2;
        const qrY = 250;

        // Draw solid white container box
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.lineWidth = 1;
        ctx.strokeRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);

        // Draw QR Code image
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

        // 6. Draw Event Info in Footer (Shifted down for better balance without join code)
        const footerY = 620;

        // Event Title (Bold & Elegant Burnt Orange)
        ctx.fillStyle = '#b86a3c';
        ctx.font = '800 32px sans-serif';
        const titleText = (event?.title || 'OUR EVENT').toUpperCase();
        ctx.fillText(titleText, canvas.width / 2, footerY);

        // Subtitle instructions
        ctx.fillStyle = 'rgba(31, 31, 31, 0.6)';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('SCAN QR CODE TO JOIN & SHARE PHOTOS', canvas.width / 2, footerY + 50);

        // Trigger Download
        try {
          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `QR_Card_${event?.slug || 'event'}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        } catch (err) {
          toast.error('Failed to generate PNG.');
        }
      };

      qrImg.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    // If logo fails to load (fallback to only drawing QR code card)
    logoImg.onerror = () => {
      const svgData = new XMLSerializer().serializeToString(svg);
      const qrImg = new window.Image();
      qrImg.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = 600;
        canvas.height = 800;

        ctx.fillStyle = '#FAF8F4';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.lineWidth = 4;
        ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

        // Draw solid white container box
        ctx.fillStyle = '#ffffff';
        ctx.fillRect((canvas.width - 320) / 2 - 20, 200 - 20, 320 + 40, 320 + 40);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.lineWidth = 1;
        ctx.strokeRect((canvas.width - 320) / 2 - 20, 200 - 20, 320 + 40, 320 + 40);
        ctx.drawImage(qrImg, (canvas.width - 320) / 2, 200, 320, 320);

        try {
          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `QR_Card_${event?.slug || 'event'}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        } catch {
          toast.error('Failed to generate PNG.');
        }
      };
      qrImg.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };
  };

  const requestDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await adminApi.post<{ data: DownloadJob }>(`/admin/events/${uuid}/downloads`);
      setDownloadJob(res.data.data);
      toast.success('ZIP is being prepared. It may take a minute…');
      pollDownload(res.data.data.job_id);
    } catch {
      toast.error('Failed to start download.');
      setIsDownloading(false);
    }
  };

  const pollDownload = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await adminApi.get<{ data: DownloadJob }>(`/admin/downloads/${jobId}`);
        const job = res.data.data;
        setDownloadJob(job);
        if (job.status === 'ready') {
          clearInterval(interval);
          setIsDownloading(false);
          if (job.download_url) window.open(job.download_url, '_blank');
          toast.success('ZIP ready! Download started.');
        } else if (job.status === 'failed') {
          clearInterval(interval);
          setIsDownloading(false);
          toast.error('ZIP generation failed.');
        }
      } catch {
        clearInterval(interval);
        setIsDownloading(false);
      }
    }, 3000);
  };

  const copyJoinUrl = () => {
    if (event?.join_url) {
      navigator.clipboard.writeText(event.join_url);
      toast.success('Join URL copied!');
    }
  };

  const deletePhoto = async (photoUuid: string) => {
    if (!confirm('Delete this photo permanently?')) return;
    try {
      await adminApi.delete(`/admin/photos/${photoUuid}`);
      setPhotos((p) => p.filter((x) => x.id !== photoUuid));
      toast.success('Photo deleted.');
    } catch {
      toast.error('Failed to delete photo.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 350 }}>
        <ApertureLoader size={80} text="Memuat Detail Event..." />
      </div>
    );
  }

  if (!event) return null;

  const { label, className } = getEventStatusBadge(event.status, event.has_started);
  const joinUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/e/${event.slug}`;

  return (
    <div className="admin-page" style={{ maxWidth: 1400 }}>
      {/* Back */}
      <Link href="/events" className="btn btn-ghost btn-sm" style={{ marginBottom: '1.5rem', paddingLeft: 0 }}>
        <ArrowLeft size={16} /> Back to Events
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.75rem' }}>{event.title}</h1>
            <span className={`badge ${className}`}>{label}</span>
          </div>
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Calendar size={14} /> {formatDate(event.event_date)}
            </span>
            {event.venue && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <MapPin size={14} /> {event.venue}
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Image size={14} /> {event.total_photos} photos
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Users size={14} /> {event.total_participants} guests
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link href={`/events/${uuid}/edit`} className="btn btn-secondary btn-sm">
            <Edit size={14} /> Edit
          </Link>
          {event.status === 'draft' && (
            <button className="btn btn-primary btn-sm" onClick={() => changeStatus('publish')} disabled={!!actionLoading}>
              {actionLoading === 'publish' ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <CheckCircle size={14} />}
              Publish
            </button>
          )}
          {event.status === 'published' && !event.has_started && (
            <button className="btn btn-primary btn-sm" onClick={startEvent} disabled={!!actionLoading}>
              {actionLoading === 'start' ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Play size={14} />}
              Start Now
            </button>
          )}
          {event.status === 'published' && (
            <button className="btn btn-danger btn-sm" onClick={() => changeStatus('close')} disabled={!!actionLoading}>
              {actionLoading === 'close' ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <XCircle size={14} />}
              Close
            </button>
          )}
          {event.status === 'closed' && (
            <button className="btn btn-secondary btn-sm" onClick={() => changeStatus('archive')} disabled={!!actionLoading}>
              {actionLoading === 'archive' ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Archive size={14} />}
              Archive
            </button>
          )}
          <button
            className="btn btn-secondary btn-sm"
            onClick={requestDownload}
            disabled={isDownloading}
          >
            {isDownloading
              ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Preparing…</>
              : <><Download size={14} /> Download ZIP</>}
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => setShowDeleteModal(true)}
            disabled={!!actionLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
          >
            {actionLoading === 'delete' ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Trash2 size={14} />}
            Delete Event
          </button>
        </div>
      </div>

      <div className="admin-detail-grid">
        {/* Photos */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.125rem' }}>Photos</h2>
            <Link href={`/events/${uuid}/photos`} className="btn btn-ghost btn-sm">View all</Link>
          </div>

          {photos.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
              <Camera size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
              <p>No photos uploaded yet.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.625rem' }}>
              {photos.map((photo, idx) => {
                const isLast = idx === photos.length - 1;
                const remaining = totalPhotos - photos.length;
                const showOverlay = isLast && remaining > 0;
                return (
                  <div
                    key={photo.id}
                    style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '4/3', background: 'var(--bg-card)' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.thumbnail_url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />

                    {/* +N more overlay */}
                    {showOverlay ? (
                      <Link
                        href={`/events/${uuid}/photos`}
                        style={{
                          position: 'absolute', inset: 0,
                          background: 'rgba(0,0,0,0.72)',
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center',
                          textDecoration: 'none', gap: '0.25rem',
                        }}
                      >
                        <span style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: '#fff', lineHeight: 1 }}>
                          +{remaining}
                        </span>
                        <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          lihat semua
                        </span>
                      </Link>
                    ) : (
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0)',
                        transition: 'background 0.2s',
                        display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: '0.5rem',
                      }}
                        onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(0,0,0,0.6)'; }}
                        onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'rgba(0,0,0,0)'; }}
                      >
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ padding: '0.25rem 0.5rem', opacity: 0 }}
                          onClick={() => deletePhoto(photo.id)}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0'; }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* QR Code */}
          <div className="card" style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '0.9375rem', marginBottom: '1rem' }}>Guest QR Code</h3>
            <div className="qr-wrapper" style={{ margin: '0 auto 1rem' }}>
              <QRCode value={joinUrl} size={160} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: '0.8rem' }} onClick={copyJoinUrl}>
                  <Copy size={13} /> Copy URL
                </button>
                <Link href={joinUrl} target="_blank" className="btn btn-ghost btn-sm" style={{ padding: '0.4rem' }}>
                  <ExternalLink size={14} />
                </Link>
              </div>
              <button className="btn btn-secondary btn-sm" style={{ width: '100%', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }} onClick={downloadQrCode}>
                <Download size={13} /> Download QR (PNG)
              </button>
            </div>
            {event.join_code && (
              <div style={{
                marginTop: '0.875rem', padding: '0.625rem', borderRadius: 8,
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Join Code</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.15em' }}>
                  {event.join_code}
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="card" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '0.9375rem', marginBottom: '0.875rem' }}>Stats</h3>
            {[
              { label: 'Photos', value: event.total_photos.toLocaleString() },
              { label: 'Guests', value: event.total_participants.toLocaleString() },
              { label: 'Storage', value: formatMb(event.storage_used_mb ?? 0) },
            ].map(({ label, value }) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.5rem 0',
                borderBottom: '1px solid var(--border-color)',
                fontSize: '0.875rem',
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
            {/* Visibility row with icon */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.5rem 0',
              fontSize: '0.875rem',
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>Visibility</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {event.visibility === 'public'
                  ? <><Globe size={13} /> Public</>
                  : <><Lock size={13} /> Private</>}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Custom Delete Confirmation Modal ── */}
      <AnimatePresence>
        {showDeleteModal && (
          <div style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem',
          }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={{
                width: '100%', maxWidth: 440,
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: 16,
                padding: '2rem',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                display: 'flex', flexDirection: 'column', gap: '1.5rem',
                textAlign: 'center',
              }}
            >
              {/* Icon & Title */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#ef4444',
                }}>
                  <AlertTriangle size={28} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Delete Event permanently?
                </h3>
              </div>

              {/* Message */}
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                WARNING: Are you sure you want to permanently delete this event? This will delete all guest names, wishes, photos, and files on the storage server forever. This action CANNOT be undone!
              </p>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={actionLoading === 'delete'}
                  style={{ flex: 1, height: 44, borderRadius: 8, fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteConfirm}
                  disabled={actionLoading === 'delete'}
                  style={{
                    flex: 1, height: 44, borderRadius: 8, fontWeight: 700,
                    backgroundColor: '#ef4444', borderColor: '#ef4444', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                  }}
                >
                  {actionLoading === 'delete' ? (
                    <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  Delete Event
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
