'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Calendar, Clock, MapPin, Lock, Image } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import type { CreateEventForm, Event } from '@/types';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/lib/cropImage';

const CATEGORIES = [
  { value: 'wedding',     label: 'Wedding' },
  { value: 'birthday',    label: 'Birthday' },
  { value: 'corporate',   label: 'Corporate' },
  { value: 'graduation',  label: 'Graduation' },
  { value: 'baby_shower', label: 'Baby Shower' },
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'conference',  label: 'Conference' },
  { value: 'party',       label: 'Party' },
  { value: 'other',       label: 'Other' },
];

const TIMEZONES = [
  'Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura',
  'Asia/Singapore', 'Asia/Kuala_Lumpur',
  'America/New_York', 'America/Los_Angeles', 'Europe/London',
];

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  category: z.string().min(1, 'Select a category'),
  description: z.string().optional(),
  event_date: z.string().min(1, 'Event date is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().optional(),
  timezone: z.string().min(1),
  venue: z.string().optional(),
  maps_url: z.union([z.string().url('Enter a valid URL'), z.literal('')]).optional(),
  password: z.string().optional(),
  allow_upload:   z.boolean(),
  allow_gallery:  z.boolean(),
  allow_download: z.boolean(),
  allow_likes:    z.boolean(),
  guest_download: z.boolean(),
  max_photos: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number().int().positive().optional()
  ),
});
type FormData = z.infer<typeof schema>;

export default function NewEventPage() {
  const router = useRouter();
  const [submitMode, setSubmitMode] = useState<'draft' | 'publish'>('draft');

  // Slots state
  const [banners, setBanners] = useState<{ file: File | null; preview: string; cropped: boolean }[]>([
    { file: null, preview: '', cropped: false },
    { file: null, preview: '', cropped: false },
    { file: null, preview: '', cropped: false },
  ]);

  // Cropper states
  const [activeCropIndex, setActiveCropIndex] = useState<number | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const handleSlotFileChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropImageSrc(url);
    setActiveCropIndex(index);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleSaveCrop = async () => {
    if (activeCropIndex === null || !cropImageSrc || !croppedAreaPixels) return;
    try {
      const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], `banner_${activeCropIndex + 1}.jpg`, { type: 'image/jpeg' });
      const newPreview = URL.createObjectURL(croppedFile);

      setBanners((prev) => {
        const copy = [...prev];
        copy[activeCropIndex] = {
          file: croppedFile,
          preview: newPreview,
          cropped: true,
        };
        return copy;
      });

      // Clear crop state
      setActiveCropIndex(null);
      setCropImageSrc(null);
      setCroppedAreaPixels(null);
    } catch (e) {
      console.error(e);
      toast.error("Failed to crop image.");
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FormData>({ resolver: zodResolver(schema) as any, defaultValues: {
      allow_upload: true,
      allow_gallery: true,
      allow_download: true,
      allow_likes: true,
      guest_download: true,
      timezone: 'Asia/Jakarta',
    },
  });

  const onSubmit = async (data: FormData) => {
    const incomplete = banners.some((b) => !b.file || !b.cropped);
    if (incomplete) {
      toast.error("Please upload and crop all 3 photos for the banner preview.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('category', data.category);
      if (data.description) formData.append('description', data.description);
      formData.append('event_date', data.event_date);
      formData.append('start_time', data.start_time);
      if (data.end_time) formData.append('end_time', data.end_time);
      formData.append('timezone', data.timezone);
      if (data.venue) formData.append('venue', data.venue);
      if (data.maps_url) formData.append('maps_url', data.maps_url);
      if (data.password) formData.append('password', data.password);
      formData.append('allow_upload', data.allow_upload ? '1' : '0');
      formData.append('allow_gallery', data.allow_gallery ? '1' : '0');
      formData.append('allow_download', data.allow_download ? '1' : '0');
      formData.append('allow_likes', data.allow_likes ? '1' : '0');
      formData.append('guest_download', data.guest_download ? '1' : '0');
      if (data.max_photos) formData.append('max_photos', String(data.max_photos));

      banners.forEach((b) => {
        if (b.file) {
          formData.append('banner_photos[]', b.file);
        }
      });

      const res = await adminApi.post<{ data: Event; message: string }>('/admin/events', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const event = res.data.data;

      if (submitMode === 'publish') {
        await adminApi.post(`/admin/events/${event.id}/publish`);
        toast.success('Event created and published!');
      } else {
        toast.success('Event saved as draft.');
      }
      router.push(`/events/${event.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create event.';
      toast.error(msg);
    }
  };

  const toggles = [
    { key: 'allow_upload',   label: 'Allow guests to upload photos', desc: 'Guests can add photos to the gallery' },
    { key: 'allow_gallery',  label: 'Show photo gallery',            desc: 'Guests can browse all photos' },
    { key: 'allow_download', label: 'Allow guest downloads',         desc: 'Guests can download individual photos' },
    { key: 'allow_likes',    label: 'Enable photo likes',            desc: 'Guests can like their favorite photos' },
  ] as const;

  return (
    <div className="admin-page" style={{ maxWidth: 1400 }}>
      {/* Back */}
      <Link href="/events" className="btn btn-ghost btn-sm" style={{ marginBottom: '1.5rem', paddingLeft: 0 }}>
        <ArrowLeft size={16} /> Back to Events
      </Link>

      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.375rem' }}>Create New Event</h1>
      <p style={{ marginBottom: '2rem' }}>Fill in the details below to set up your shared photo album.</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="admin-new-event-grid" style={{
          display: 'grid',
          gap: '1.5rem',
          alignItems: 'start',
          marginBottom: '2rem'
        }}>
          {/* Left Column: Basic Info, Date & Time, Location */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* ── Basic Info ── */}
            <section className="card" style={{ margin: 0 }}>
              <h2 style={{ fontSize: '1rem', marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>Basic Information</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="evt-title">Event Title *</label>
                  <input id="evt-title" type="text" className={`form-input ${errors.title ? 'error' : ''}`}
                    placeholder="e.g. Wedding of Sarah & Tom" {...register('title')} />
                  {errors.title && <span className="form-error">{errors.title.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="evt-category">Category *</label>
                  <select id="evt-category" className={`form-select ${errors.category ? 'error' : ''}`} {...register('category')}>
                    <option value="">— Select category —</option>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  {errors.category && <span className="form-error">{errors.category.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="evt-desc">Description</label>
                  <textarea id="evt-desc" className="form-textarea" rows={3}
                    placeholder="Optional event description for your guests…" {...register('description')} />
                </div>
              </div>
            </section>

            {/* ── Date & Time ── */}
            <section className="card" style={{ margin: 0 }}>
              <h2 style={{ fontSize: '1rem', marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>
                <Calendar size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                Date & Time
              </h2>
              <div className="admin-time-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="evt-date">Event Date *</label>
                  <input id="evt-date" type="date" className={`form-input ${errors.event_date ? 'error' : ''}`}
                    {...register('event_date')} />
                  {errors.event_date && <span className="form-error">{errors.event_date.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="evt-tz">Timezone</label>
                  <select id="evt-tz" className="form-select" {...register('timezone')}>
                    {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="evt-start">Start Time *</label>
                  <input id="evt-start" type="time" className={`form-input ${errors.start_time ? 'error' : ''}`}
                    {...register('start_time')} />
                  {errors.start_time && <span className="form-error">{errors.start_time.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="evt-end">End Time</label>
                  <input id="evt-end" type="time" className="form-input" {...register('end_time')} />
                </div>
              </div>
            </section>

            {/* ── Location ── */}
            <section className="card" style={{ margin: 0 }}>
              <h2 style={{ fontSize: '1rem', marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>
                <MapPin size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                Location
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="evt-venue">Venue Name</label>
                  <input id="evt-venue" type="text" className="form-input"
                    placeholder="e.g. The Grand Ballroom, Jakarta" {...register('venue')} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="evt-maps">Google Maps URL</label>
                  <input id="evt-maps" type="url" className={`form-input ${errors.maps_url ? 'error' : ''}`}
                    placeholder="https://maps.google.com/…" {...register('maps_url')} />
                  {errors.maps_url && <span className="form-error">{errors.maps_url.message}</span>}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Banners & Event Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* ── Banner Photos (Header Preview with Interactive Cropper) ── */}
            <section className="card" style={{ margin: 0 }}>
              <h2 style={{ fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                Banner Gallery Preview *
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Choose and crop exactly 3 images. These will be formatted to the landscape ratio (16:9) for the sliding header.
              </p>

              <div className="admin-banner-grid" style={{ display: 'grid', gap: '1rem' }}>
                {banners.map((slot, index) => (
                  <div
                    key={index}
                    style={{
                      border: '1px solid var(--border-color-medium)',
                      borderRadius: 12,
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      background: 'rgba(0,0,0,0.01)',
                      textAlign: 'center',
                      minHeight: 180,
                      justifyContent: 'center',
                      position: 'relative'
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSlotFileChange(e, index)}
                      id={`evt-banner-input-${index}`}
                      style={{ display: 'none' }}
                    />
                    
                    {slot.preview ? (
                      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color-strong)', position: 'relative' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={slot.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <span style={{ position: 'absolute', top: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', padding: '0.15rem 0.35rem', borderRadius: 3, fontWeight: 700 }}>
                            PHOTO {index + 1}
                          </span>
                          {!slot.cropped && (
                            <span style={{ position: 'absolute', bottom: 4, right: 4, backgroundColor: 'var(--color-error)', color: '#fff', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', padding: '0.15rem 0.35rem', borderRadius: 3, fontWeight: 700 }}>
                              NEEDS CROP
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'center' }}>
                          <label htmlFor={`evt-banner-input-${index}`} className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                            Change
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setCropImageSrc(slot.preview);
                              setActiveCropIndex(index);
                              setZoom(1);
                              setCrop({ x: 0, y: 0 });
                            }}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            Crop
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 42, height: 42, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                          <Image size={20} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          SLOT {index + 1}
                        </span>
                        <label htmlFor={`evt-banner-input-${index}`} className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                          Select Photo
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* ── Settings ── */}
            <section className="card" style={{ margin: 0 }}>
              <h2 style={{ fontSize: '1rem', marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>Event Settings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {toggles.map(({ key, label, desc }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{desc}</div>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" {...register(key)} />
                      <span className="toggle-thumb" />
                    </label>
                  </div>
                ))}

                <div className="divider" style={{ margin: '0.5rem 0' }} />

                <div className="admin-time-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="evt-max">Max Photos</label>
                    <div style={{ position: 'relative' }}>
                      <Image size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                      <input id="evt-max" type="number" className="form-input" style={{ paddingLeft: '2.25rem' }}
                        placeholder="Unlimited" min={1} {...register('max_photos')} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="evt-pw">
                      <Lock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                      Join Password
                    </label>
                    <input id="evt-pw" type="text" className="form-input"
                      placeholder="Leave blank for open access" {...register('password')} />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* ── Submit Buttons ── */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <Link href="/events" className="btn btn-ghost">Cancel</Link>
          <button
            type="submit"
            className="btn btn-secondary"
            disabled={isSubmitting}
            onClick={() => setSubmitMode('draft')}
          >
            {isSubmitting && submitMode === 'draft'
              ? <><Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving…</>
              : 'Save as Draft'}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            onClick={() => setSubmitMode('publish')}
          >
            {isSubmitting && submitMode === 'publish'
              ? <><Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> Publishing…</>
              : 'Create & Publish'}
          </button>
        </div>
      </form>

      {/* ── Cropper Modal ── */}
      {activeCropIndex !== null && cropImageSrc && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-box" style={{ maxWidth: 600, padding: '1.5rem', background: 'var(--bg-card)' }}>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
              Crop Photo {activeCropIndex + 1}
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Drag and zoom to select the exact section that will be displayed in the sliding gallery banner (16:9 aspect ratio).
            </p>

            <div style={{ position: 'relative', width: '100%', height: 320, background: '#09090b', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color-medium)' }}>
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Zoom Slider Control */}
            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Zoom</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-label="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--color-brand-400)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setActiveCropIndex(null);
                  setCropImageSrc(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveCrop}
              >
                Save Crop Area
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
