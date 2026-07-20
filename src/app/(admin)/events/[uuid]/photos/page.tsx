'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2, Star, EyeOff, Eye, Loader2, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import type { Photo } from '@/types';

export default function EventPhotosPage() {
  const params = useParams();
  const uuid = params.uuid as string;

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadPhotos = async (p = 1) => {
    if (p === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await adminApi.get<{ data: Photo[]; meta: { last_page: number } }>(
        `/admin/events/${uuid}/photos?per_page=24&page=${p}`
      );
      const data = Array.isArray(res.data.data) ? res.data.data : [];
      const last_page = res.data.meta?.last_page ?? 1;
      setPhotos((prev) => p === 1 ? data : [...prev, ...data]);
      setLastPage(last_page);
      setPage(p);
    } catch {
      toast.error('Failed to load photos.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { loadPhotos(1); }, [uuid]);

  const toggleFeature = async (photo: Photo) => {
    try {
      await adminApi.post(`/admin/photos/${photo.id}/feature`);
      setPhotos((prev) =>
        prev.map((p) => p.id === photo.id ? { ...p, is_featured: !p.is_featured } : p)
      );
      toast.success(photo.is_featured ? 'Unfeatured.' : 'Marked as featured!');
    } catch { toast.error('Failed.'); }
  };

  const toggleHide = async (photo: Photo) => {
    try {
      await adminApi.post(`/admin/photos/${photo.id}/hide`);
      setPhotos((prev) =>
        prev.map((p) => p.id === photo.id ? { ...p, is_hidden: !p.is_hidden } : p)
      );
      toast.success(photo.is_hidden ? 'Photo unhidden.' : 'Photo hidden from gallery.');
    } catch { toast.error('Failed.'); }
  };

  const deletePhoto = async (photo: Photo) => {
    if (!confirm('Permanently delete this photo?')) return;
    try {
      await adminApi.delete(`/admin/photos/${photo.id}`);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      toast.success('Photo deleted.');
    } catch { toast.error('Failed to delete.'); }
  };

  return (
    <div style={{ padding: '2rem 2.5rem', width: '100%', maxWidth: 1400, boxSizing: 'border-box' }}>
      <Link href={`/events/${uuid}`} className="btn btn-ghost btn-sm" style={{ marginBottom: '1.5rem', paddingLeft: 0 }}>
        <ArrowLeft size={16} /> Back to Event
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Photo Management</h1>
          <p style={{ marginTop: '0.25rem' }}>Moderate, feature, or hide individual photos.</p>
        </div>
        <div className="badge badge-gray" style={{ fontSize: '0.875rem' }}>
          {photos.length} photos
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {[...Array(12)].map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: '1', borderRadius: 10 }} />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No photos for this event yet.</p>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '0.75rem',
          }}>
            {photos.map((photo) => (
              <div
                key={photo.id}
                style={{
                  borderRadius: 10, overflow: 'hidden', position: 'relative',
                  background: 'var(--bg-card)',
                  border: photo.is_featured ? '2px solid #ffffff' : '1px solid var(--border-color)',
                  opacity: photo.is_hidden ? 0.45 : 1,
                  transition: 'all 0.15s',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.thumbnail_url}
                  alt=""
                  style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                />

                {/* Overlay */}
                <div className="photo-overlay" style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.65)',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '0.625rem',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = '0'; }}
                >
                  <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-sm"
                      style={{
                        padding: '0.3rem', borderRadius: 6,
                        background: photo.is_featured ? 'rgba(168,85,247,0.8)' : 'rgba(0,0,0,0.5)',
                        border: 'none', color: '#fff', cursor: 'pointer',
                      }}
                      title={photo.is_featured ? 'Unfeature' : 'Feature photo'}
                      onClick={() => toggleFeature(photo)}
                    >
                      <Star size={13} fill={photo.is_featured ? '#fff' : 'none'} />
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{
                        padding: '0.3rem', borderRadius: 6,
                        background: 'rgba(0,0,0,0.5)',
                        border: 'none', color: '#fff', cursor: 'pointer',
                      }}
                      title={photo.is_hidden ? 'Unhide' : 'Hide from gallery'}
                      onClick={() => toggleHide(photo)}
                    >
                      {photo.is_hidden ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      style={{ padding: '0.3rem', borderRadius: 6, border: 'none', cursor: 'pointer' }}
                      title="Delete photo"
                      onClick={() => deletePhoto(photo)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                    {photo.participant?.name ?? 'Unknown'}
                  </div>
                </div>

                {/* Featured badge */}
                {photo.is_featured && (
                  <div style={{
                    position: 'absolute', top: 6, left: 6,
                    background: 'rgba(168,85,247,0.9)', borderRadius: 4,
                    padding: '0.125rem 0.375rem', fontSize: '0.7rem', color: '#fff', fontWeight: 600,
                  }}>
                    ⭐ Featured
                  </div>
                )}
                {photo.is_hidden && (
                  <div style={{
                    position: 'absolute', top: 6, left: 6,
                    background: 'rgba(239,68,68,0.9)', borderRadius: 4,
                    padding: '0.125rem 0.375rem', fontSize: '0.7rem', color: '#fff', fontWeight: 600,
                  }}>
                    Hidden
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Load more */}
          {page < lastPage && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => loadPhotos(page + 1)}
                disabled={loadingMore}
              >
                {loadingMore ? <><Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> Loading…</> : 'Load More Photos'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
