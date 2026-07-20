'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import {
  ArrowLeft, Camera, Users, Image, Download, Share2,
  CheckCircle, XCircle, Archive, Edit, Trash2, Copy,
  Loader2, ExternalLink, MapPin, Calendar, Globe, Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import { formatDate, getEventStatusBadge, formatMb } from '@/lib/utils';
import type { Event, Photo, DownloadJob } from '@/types';

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!event) return null;

  const { label, className } = getEventStatusBadge(event.status);
  const joinUrl = event.join_url ?? `${typeof window !== 'undefined' ? window.location.origin : ''}/e/${event.slug}`;

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
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: '0.8rem' }} onClick={copyJoinUrl}>
                <Copy size={13} /> Copy URL
              </button>
              <Link href={joinUrl} target="_blank" className="btn btn-ghost btn-sm" style={{ padding: '0.4rem' }}>
                <ExternalLink size={14} />
              </Link>
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
              { label: 'Photos',     value: event.total_photos.toLocaleString() },
              { label: 'Guests',     value: event.total_participants.toLocaleString() },
              { label: 'Storage',    value: formatMb(event.storage_used_mb ?? 0) },
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
    </div>
  );
}
