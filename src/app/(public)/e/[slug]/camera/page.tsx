'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, CameraOff, RefreshCw, Zap, ZapOff, Image as ImageIcon, 
  ArrowLeft, ArrowRight, Loader2, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useParticipantStore } from '@/store';
import { useCamera } from '@/hooks/useCamera';
import { useCapture, applyFiltersToImageData } from '@/hooks/useCapture';
import { useCameraUpload } from '@/hooks/useCameraUpload';
import type { Event } from '@/types';
import { CustomAudioPlayer } from '@/components/ui/CustomAudioPlayer';
import { ApertureLoader } from '@/components/ui/ApertureLoader';

const FILM_FILTERS = [
  { id: 'normal', name: 'NORMAL', filter: 'none' },
  { id: 'funsaver', name: 'KODAK FUNSAVER', filter: 'sepia(25%) contrast(110%) saturate(135%) brightness(105%) hue-rotate(-5deg)' },
  { id: 'quicksnap', name: 'FUJIFILM QUICKSNAP', filter: 'saturate(135%) contrast(115%) brightness(103%) hue-rotate(8deg)' },
  { id: 'portra400', name: 'KODAK PORTRA 400', filter: 'sepia(10%) saturate(105%) contrast(93%) brightness(104%)' },
  { id: 'ektar100', name: 'KODAK EKTAR 100', filter: 'saturate(165%) contrast(120%) brightness(100%)' },
  { id: 'hp5plus', name: 'ILFORD HP5 PLUS', filter: 'grayscale(100%) contrast(135%) brightness(98%)' },
  { id: 'cinestill800t', name: 'CINESTILL 800T', filter: 'contrast(115%) brightness(95%) saturate(115%) hue-rotate(-12deg) sepia(8%)' },
];

const checkBrightness = (video: HTMLVideoElement): number => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 127;
    ctx.drawImage(video, 0, 0, 16, 16);
    const imgData = ctx.getImageData(0, 0, 16, 16);
    const data = imgData.data;
    let colorSum = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const avg = 0.299 * r + 0.587 * g + 0.114 * b;
      colorSum += avg;
    }
    return colorSum / (16 * 16);
  } catch (e) {
    console.warn("Brightness check failed, defaulting to bright:", e);
    return 127;
  }
};

export default function GuestCameraPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { name, isJoined } = useParticipantStore();

  // Hooks
  const { videoRef, state: cam, switchCamera, toggleFlash, startCamera } = useCamera(false);
  const { capture, isCapturing, lastCapture, setLastCapture } = useCapture({ videoRef, persistedKey: `memly_last_capture_${slug}` });
  const { upload, uploadState } = useCameraUpload(slug);

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoCount, setPhotoCount] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState(FILM_FILTERS[0]);
  const [showFullscreenOverlay, setShowFullscreenOverlay] = useState(false);

  // Mode selector state
  const [mode, setMode] = useState<'photo' | 'voice'>('photo');

  // Voice/Audio Guestbook states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [textMessage, setTextMessage] = useState('');
  const [isSubmittingWish, setIsSubmittingWish] = useState(false);

  // Native input fallback ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const isFs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      if (!isFs) {
        setShowFullscreenOverlay(true);
      } else {
        // Already fullscreen, start camera immediately
        startCamera(cam.facing);
      }
    }
  }, []);

  const enterFullscreen = async () => {
    setShowFullscreenOverlay(false);
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if ((docEl as any).webkitRequestFullscreen) {
        await (docEl as any).webkitRequestFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen request failed:', e);
    }
    // Trigger camera start now that the video element is mounting
    startCamera(cam.facing);
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isJoined(slug)) {
      router.replace(`/e/${slug}`);
      return;
    }
    loadEventDetails();
  }, [slug, mounted]);

  const loadEventDetails = async () => {
    try {
      const evtRes = await api.get<{ data: Event }>(`/public/events/${slug}`);
      const ev = evtRes.data.data;
      // Guard: redirect to thank-you page if event is no longer accepting uploads
      // Keep loading=true so camera UI never flashes before redirect
      if (ev.status === 'closed' || ev.status === 'archived') {
        router.replace(`/e/${slug}/closed`);
        return;
      }
      setEvent(ev);

      // Fetch photo count separately to avoid concurrent-request issues with php artisan serve
      try {
        const cntRes = await api.get<{ data: { total_photos: number } }>(`/public/events/${slug}/gallery/count`);
        setPhotoCount(cntRes.data.data.total_photos);
      } catch {
        // Non-critical — camera still works without photo count
        setPhotoCount(0);
      }

      setLoading(false);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      // 404 means event is closed/archived (backend only serves published events publicly)
      if (status === 404) {
        router.replace(`/e/${slug}/closed`);
        return; // Keep loading=true, let redirect handle navigation
      }
      if (status === 403) {
        router.replace(`/e/${slug}`);
        return;
      }
      toast.error('Failed to load event details.');
      setLoading(false);
    }
  };

  const handleCapture = async () => {
    if (isCapturing || uploadState.isUploading || !cam.isReady) return;

    let autoFlashTriggered = false;
    if (cam.hasFlash && cam.flashMode === 'auto' && videoRef.current) {
      const brightness = checkBrightness(videoRef.current);
      if (brightness < 60) {
        autoFlashTriggered = true;
        try {
          const stream = videoRef.current.srcObject as MediaStream | null;
          const track = stream?.getVideoTracks()[0];
          if (track) {
            await track.applyConstraints({
              advanced: [{ torch: true } as any],
            });
          }
        } catch (e) {
          console.warn("Failed to enable auto flash:", e);
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    const blob = await capture(selectedFilter.id);

    if (autoFlashTriggered) {
      try {
        const stream = videoRef.current?.srcObject as MediaStream | null;
        const track = stream?.getVideoTracks()[0];
        if (track) {
          await track.applyConstraints({
            advanced: [{ torch: false } as any],
          });
        }
      } catch (e) {
        console.warn("Failed to disable auto flash:", e);
      }
    }

    if (!blob) {
      toast.error('Failed to snap photo.');
      return;
    }

    const success = await upload(blob);
    if (success) {
      setPhotoCount((c) => c + 1);
    }
  };

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const options = { mimeType: 'audio/webm' };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      recorder.ondataavailable = (event: any) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);

      setIsRecording(true);
      setRecordingTime(0);
      setAudioBlob(null);
      setAudioUrl(null);

      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const next = prev + 1;
          setAudioDuration(next);
          return next;
        });
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording:', err);
      toast.error('Microphone access denied or unavailable.');
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const clearRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setAudioDuration(0);
  };

  const handleSendWish = async () => {
    if (!textMessage.trim() && !audioBlob) {
      toast.error('Please write a message or record a voice note.');
      return;
    }

    setIsSubmittingWish(true);
    const formData = new FormData();
    if (textMessage.trim()) {
      formData.append('text_message', textMessage);
    }
    if (audioBlob) {
      const ext = audioBlob.type.includes('mp4') ? 'm4a' : 'webm';
      formData.append('audio', audioBlob, `voice_${Date.now()}.${ext}`);
      formData.append('audio_duration_seconds', audioDuration.toString());
    }

    try {
      await api.post(`/public/events/${slug}/wishes`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Your wishes have been sent to the couple! ❤️');
      setTextMessage('');
      clearRecording();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send wishes.');
    } finally {
      setIsSubmittingWish(false);
    }
  };

  // Fallback upload (using native camera input)
  const handleNativeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    let fileToUpload: Blob | File = file;

    if (selectedFilter.id !== 'normal') {
      try {
        fileToUpload = await new Promise<Blob>((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(file);
              return;
            }
            ctx.drawImage(img, 0, 0);
            try {
              const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              applyFiltersToImageData(imgData, selectedFilter.id);
              ctx.putImageData(imgData, 0, 0);
              canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else resolve(file);
              }, 'image/jpeg', 0.85);
            } catch (err) {
              console.error('Failed applying filter to native upload image:', err);
              resolve(file);
            }
          };
          img.onerror = () => resolve(file);
          img.src = URL.createObjectURL(file);
        });
      } catch (err) {
        console.error('Failed applying filter to upload:', err);
      }
    }

    const success = await upload(fileToUpload);
    if (success) {
      setPhotoCount((c) => c + 1);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLastCapture(reader.result as string);
      };
      reader.readAsDataURL(fileToUpload);
    }
  };

  if (!mounted || !isJoined(slug)) return null;

  if (showFullscreenOverlay) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0c0c0f',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        zIndex: 100,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        {/* Viewfinder corners — decorative only */}
        {['tl','tr','bl','br'].map((pos) => (
          <div key={pos} style={{
            position: 'absolute',
            width: 28,
            height: 28,
            borderColor: 'rgba(255,255,255,0.25)',
            borderStyle: 'solid',
            borderTopWidth:    pos.startsWith('t') ? 1.5 : 0,
            borderBottomWidth: pos.startsWith('b') ? 1.5 : 0,
            borderLeftWidth:   pos.endsWith('l')   ? 1.5 : 0,
            borderRightWidth:  pos.endsWith('r')   ? 1.5 : 0,
            top:    pos.startsWith('t') ? '1.25rem' : undefined,
            bottom: pos.startsWith('b') ? '1.25rem' : undefined,
            left:   pos.endsWith('l')   ? '1.25rem' : undefined,
            right:  pos.endsWith('r')   ? '1.25rem' : undefined,
          }} />
        ))}

        <div style={{ maxWidth: 320, width: '100%', animation: 'slideUp 0.4s ease both' }}>
          {/* Camera icon */}
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            border: '2px solid rgba(255,255,255,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.75rem',
          }}>
            <Camera size={34} color="#ffffff" />
          </div>

          {/* Event title */}
          <h2 style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#ffffff',
            marginBottom: '0.5rem',
            lineHeight: 1.3,
          }}>
            {event?.title ?? slug?.replace(/-/g, ' ').toUpperCase() ?? 'Camera'}
          </h2>

          {/* Subtitle */}
          <p style={{
            fontSize: '0.875rem',
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.65,
            marginBottom: '2rem',
          }}>
            Tap the button below to open your disposable camera.
          </p>

          {/* CTA Button — fully explicit styles, no CSS class dependency */}
          <button
            onClick={enterFullscreen}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.9rem 1.5rem',
              background: '#ffffff',
              color: '#0c0c0f',
              border: 'none',
              borderRadius: '12px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '0.95rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 0 24px rgba(255,255,255,0.15)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(255,255,255,0.25)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 24px rgba(255,255,255,0.15)';
            }}
          >
            <Camera size={18} />
            Open Camera
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <ApertureLoader fullscreen text="Membuka Kamera..." />;
  }

  // Ring circumference calculations
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (uploadState.progress / 100) * circumference;

  return (
    <div style={{ 
      position: 'fixed', inset: 0, 
      backgroundColor: '#000', 
      color: '#fff', 
      display: 'flex', flexDirection: 'column',
      userSelect: 'none',
      overflow: 'hidden',
    }}>
      {/* ── Hidden Fallback Native Input ── */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleNativeUpload}
        style={{ display: 'none' }}
      />

      {/* ── Camera View Area ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b' }}>
        {/* Render video element permanently so that videoRef.current is never null during startCamera */}
        {/* eslint-disable-next-line @next/next/no-html-video-element */}
        <div style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          filter: selectedFilter.filter,
          WebkitFilter: selectedFilter.filter,
          willChange: 'filter',
          transform: 'translateZ(0)',
          display: (cam.isReady && !cam.error && mode === 'photo') ? 'block' : 'none',
        }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover',
              transform: cam.facing === 'user' ? 'scaleX(-1)' : 'none',
            }}
          />
        </div>

        {/* Viewfinder focus brackets overlay */}
        {cam.isReady && !cam.error && !cam.isLoading && mode === 'photo' && (
          <div className="camera-viewfinder-container">
            <div className="viewfinder-corner viewfinder-corner-tl" />
            <div className="viewfinder-corner viewfinder-corner-tr" />
            <div className="viewfinder-corner viewfinder-corner-bl" />
            <div className="viewfinder-corner viewfinder-corner-br" />
            <div className="viewfinder-center" />

            {/* Retro camera markings */}
            <div className="camera-meta-label" style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', color: 'rgba(255,255,255,0.7)', textShadow: '0 1px 2px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }} /> LIVE
            </div>
          </div>
        )}

        {/* Retro Voice Note Mode Viewport */}
        {mode === 'voice' && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundColor: '#0c0c0f',
            zIndex: 10,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem',
            overflowY: 'auto'
          }}>
            {/* Retro Cassette Visualization */}
            <div style={{
              width: '100%',
              maxWidth: 290,
              aspectRatio: '1.6',
              backgroundColor: '#1b1b22',
              borderRadius: 12,
              border: '3px solid #333',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5), inset 0 0 15px rgba(0,0,0,0.8)',
              position: 'relative',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              padding: '0.75rem',
              marginBottom: '1.25rem',
              userSelect: 'none',
            }}>
              {/* Cassette Label Header */}
              <div style={{
                height: 28,
                backgroundColor: '#3b82f6',
                borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#000', fontFamily: 'var(--font-mono)', fontSize: '0.625rem', fontWeight: 900,
                letterSpacing: '0.1em', padding: '0 0.5rem',
                borderBottom: '2px solid #1d4ed8'
              }}>
                AUDIO GUESTBOOK // SIDE A
              </div>

              {/* Tape Reels Center Block */}
              <div style={{
                flex: 1,
                margin: '0.5rem 0',
                backgroundColor: '#0a0a0d',
                borderRadius: 6,
                border: '2px solid #222',
                display: 'flex', alignItems: 'center', justifyContent: 'space-evenly',
                position: 'relative'
              }}>
                {/* Left Reel */}
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  backgroundColor: '#18181c', border: '3px dashed #555',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: isRecording ? 'spin 2.5s linear infinite' : 'none'
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#0a0a0d' }} />
                </div>

                {/* Tape Window */}
                <div style={{
                  width: 60, height: 24,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid #333',
                  borderRadius: 3,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.625rem', fontFamily: 'var(--font-mono)', color: isRecording ? '#ef4444' : '#666',
                  fontWeight: 800
                }}>
                  {isRecording ? '• REC' : 'READY'}
                </div>

                {/* Right Reel */}
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  backgroundColor: '#18181c', border: '3px dashed #555',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: isRecording ? 'spin 2.5s linear infinite' : 'none'
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#0a0a0d' }} />
                </div>
              </div>

              {/* Cassette Footer Info */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: '#888',
                padding: '0 0.25rem'
              }}>
                <span>C-60</span>
                <span>DOLBY SYSTEM</span>
              </div>
            </div>

            {/* Time / Status Indicator */}
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 800,
              color: isRecording ? '#ef4444' : '#fff', marginBottom: '1rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              {isRecording && <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444', animation: 'pulse 1s infinite' }} />}
              {audioUrl ? (
                <span style={{ color: '#10b981' }}>RECORDED ({audioDuration}s)</span>
              ) : (
                <span>{isRecording ? `RECORDING: ${recordingTime}s` : 'TAP RED BUTTON TO RECORD'}</span>
              )}
            </div>

            {/* Wishes Input field */}
            <div style={{ width: '100%', maxWidth: 290, marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.625rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>
                Write wishes for the couple (Optional)
              </label>
              <textarea
                value={textMessage}
                onChange={(e) => setTextMessage(e.target.value)}
                placeholder="Wishing you both a lifetime of love and happiness..."
                style={{
                  width: '100%',
                  height: 56,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8125rem',
                  color: '#fff',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'var(--font-sans)',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.3)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
              />
            </div>

            {/* Custom Preview Player if recorded */}
            {audioUrl && (
              <div style={{
                width: '100%', maxWidth: 290,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderRadius: 8,
                padding: '0.5rem',
                border: '1px solid rgba(255,255,255,0.08)',
                marginBottom: '1rem',
              }}>
                <CustomAudioPlayer src={audioUrl} duration={audioDuration} />
                <button
                  onClick={clearRecording}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', padding: '0.25rem' }}
                >
                  Delete Audio
                </button>
              </div>
            )}

            {/* Send Button */}
            {(textMessage.trim() || audioBlob) && (
              <button
                onClick={handleSendWish}
                disabled={isSubmittingWish}
                className="btn btn-primary"
                style={{
                  width: '100%', maxWidth: 290,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  boxShadow: 'var(--shadow-glow)',
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  fontWeight: 800,
                  fontSize: '0.8125rem',
                  padding: '0.625rem',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                {isSubmittingWish ? (
                  <>
                    <Loader2 size={14} className="spinner" /> Sending...
                  </>
                ) : (
                  <>
                    Send Wishes <Sparkles size={14} />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Loading Spinner */}
        {cam.isLoading && mode === 'photo' && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: '#000', zIndex: 4
          }}>
            <div className="spinner spinner-lg" />
            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>Opening camera...</p>
          </div>
        )}

        {/* Fallback/Error State */}
        {cam.error && mode === 'photo' && (
          // Fallback UI if WebRTC fails/permissions denied
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '2rem', textAlign: 'center', background: '#0c0c0f', zIndex: 5
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem',
            }}>
              <CameraOff size={32} style={{ color: '#ef4444' }} />
            </div>
            
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 700 }}>
              Camera Preview Unavailable
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: 280, marginBottom: '2rem', lineHeight: 1.6 }}>
              Tap below to use your phone&apos;s high-quality native camera app instead. Photos will upload automatically!
            </p>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-primary btn-lg"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: 'var(--shadow-glow)' }}
            >
              <Camera size={20} /> Open Native Camera
            </button>
          </div>
        )}

        {/* ── Visual feedback overlays ── */}
        {/* Shutter flash */}
        <AnimatePresence>
          {isCapturing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.85, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ position: 'absolute', inset: 0, backgroundColor: '#fff', zIndex: 10, pointerEvents: 'none' }}
            />
          )}
        </AnimatePresence>

        {/* Upload success banner */}
        <AnimatePresence>
          {uploadState.justUploaded && (
            <motion.div
              initial={{ opacity: 0, y: -40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              style={{
                position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)',
                zIndex: 20, pointerEvents: 'none'
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                background: 'rgba(255,255,255,0.95)', border: '1px solid #fff',
                boxShadow: 'var(--shadow-xl)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)',
              }}>
                <CheckCircle2 size={15} color="#000" />
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#000', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CAPTURED // UPLOADED</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
 
        {/* ── Top overlay bar ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)',
          padding: 'calc(1rem + env(safe-area-inset-top)) 1rem 2rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          zIndex: 15
        }}>
          {/* Back to Gallery */}
          <Link href={`/e/${slug}/gallery`} className="btn btn-ghost btn-sm" style={{ 
            color: '#fff', display: 'flex', alignItems: 'center', gap: '0.375rem',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.875rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            <ArrowLeft size={12} /> GALLERY
          </Link>
 
          {/* Event title */}
          <div style={{ textAlign: 'center', maxWidth: '40%', fontFamily: 'var(--font-mono)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {event?.title}
            </div>
            <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
              Hi, {name}
            </div>
          </div>
 
          {/* Photo Counter + Flash Container */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            {/* Photo Counter */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
              borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.875rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700
            }}>
              <ImageIcon size={12} style={{ color: 'rgba(255,255,255,0.8)' }} />
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{photoCount}</span>
            </div>

            {/* Flash Toggle */}
            {cam.isReady && cam.hasFlash && mode === 'photo' && (
              <button
                onClick={toggleFlash}
                style={{
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                  borderRadius: '50%',
                  width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: cam.flashMode === 'on' ? '#eab308' : cam.flashMode === 'auto' ? '#3b82f6' : '#fff', cursor: 'pointer',
                  padding: 0,
                }}
                title={`Flash: ${cam.flashMode.toUpperCase()}`}
              >
                {cam.flashMode === 'on' ? (
                  <Zap size={16} fill="#eab308" color="#eab308" />
                ) : cam.flashMode === 'auto' ? (
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={14} color="#3b82f6" fill="#3b82f6" />
                    <span style={{ position: 'absolute', bottom: -5, right: -5, fontSize: '0.45rem', fontWeight: 900, color: '#3b82f6' }}>A</span>
                  </div>
                ) : (
                  <ZapOff size={16} />
                )}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ── Bottom Controls ── */}
      <div style={{
        backgroundColor: '#000',
        padding: '1.25rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom))',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        zIndex: 15,
      }}>
        {/* ── Filter Selector (Only in photo mode) ── */}
        {mode === 'photo' && cam.isReady && !cam.error && !cam.isLoading && (
          <div 
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              gap: '0.5rem',
              overflowX: 'auto',
              padding: '0.25rem 0.5rem',
              scrollbarWidth: 'none',
              width: '100%',
            }}
            className="scrollbar-hide"
          >
            {FILM_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f)}
                style={{
                  flexShrink: 0,
                  background: selectedFilter.id === f.id ? '#fff' : 'rgba(255, 255, 255, 0.1)',
                  color: selectedFilter.id === f.id ? '#000' : '#fff',
                  border: selectedFilter.id === f.id ? '1.5px solid #fff' : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px',
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  boxShadow: selectedFilter.id === f.id ? '0 2px 8px rgba(255,255,255,0.2)' : 'none',
                }}
              >
                {f.name}
              </button>
            ))}
          </div>
        )}

        {/* ── Mode Switcher ── */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '2rem',
          margin: '0.25rem 0 0.5rem'
        }}>
          <button
            onClick={() => setMode('photo')}
            style={{
              background: 'none', border: 'none',
              color: mode === 'photo' ? '#fff' : 'rgba(255,255,255,0.4)',
              fontSize: '0.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer',
              transition: 'color 0.15s ease',
              padding: '0.25rem 0.5rem',
            }}
          >
            Photo
            {mode === 'photo' && (
              <div style={{ width: 12, height: 2, background: '#fff', margin: '4px auto 0' }} />
            )}
          </button>
          <button
            onClick={() => setMode('voice')}
            style={{
              background: 'none', border: 'none',
              color: mode === 'voice' ? 'var(--color-burnt-orange)' : 'rgba(255,255,255,0.4)',
              fontSize: '0.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer',
              transition: 'color 0.15s ease',
              padding: '0.25rem 0.5rem',
            }}
          >
            Retro Voice
            {mode === 'voice' && (
              <div style={{ width: 12, height: 2, background: 'var(--color-burnt-orange)', margin: '4px auto 0' }} />
            )}
          </button>
        </div>

        {/* ── Shutter Bar / Record Control Bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          
          {/* Left: last captured thumbnail link to Gallery */}
          <div style={{ width: 44, height: 44 }}>
            {lastCapture ? (
              <Link href={`/e/${slug}/gallery`} style={{ display: 'block', width: '100%', height: '100%' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lastCapture}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: '2px solid var(--color-paper-white)' }}
                />
              </Link>
            ) : (
              <div style={{ 
                width: '100%', height: '100%', borderRadius: 8, 
                border: '2px dashed rgba(255,255,255,0.2)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.3)'
              }}>
                <ImageIcon size={18} />
              </div>
            )}
          </div>

          {/* Center: Capture Shutter OR Record Button */}
          {mode === 'photo' ? (
            <div style={{ position: 'relative', width: 76, height: 76, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Circular progress loader for uploads */}
              {uploadState.isUploading && (
                <svg style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)', width: 76, height: 76 }} viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                  <circle
                    cx="32" cy="32" r={radius} fill="none" stroke="#ffffff" strokeWidth="3"
                    strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.15s' }}
                  />
                </svg>
              )}

              <button
                onClick={cam.isReady ? handleCapture : () => fileInputRef.current?.click()}
                disabled={isCapturing || uploadState.isUploading}
                style={{
                  width: 60, height: 60, borderRadius: '50%',
                  border: '4px solid #fff', backgroundColor: '#fff',
                  cursor: 'pointer', transition: 'transform 0.1s, opacity 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: (isCapturing || uploadState.isUploading) ? 0.6 : 1,
                  padding: 0,
                }}
                onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.92)'; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {/* Inner dot */}
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  backgroundColor: '#fff', border: '2px solid #000'
                }} />

                {uploadState.isUploading && (
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Loader2 size={20} className="spinner" style={{ color: '#000' }} />
                  </div>
                )}
              </button>
            </div>
          ) : (
            <div style={{ position: 'relative', width: 76, height: 76, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isSubmittingWish}
                style={{
                  width: 60, height: 60, borderRadius: '50%',
                  border: '4px solid #ef4444', backgroundColor: '#000',
                  cursor: 'pointer', transition: 'transform 0.1s, opacity 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: isSubmittingWish ? 0.5 : 1,
                  padding: 0,
                }}
                onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.92)'; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                title={isRecording ? "Stop Recording" : "Start Recording"}
              >
                {/* Inner red dot/square */}
                <div style={{
                  width: isRecording ? 18 : 36,
                  height: isRecording ? 18 : 36,
                  borderRadius: isRecording ? '4px' : '50%',
                  backgroundColor: '#ef4444',
                  transition: 'all 0.2s ease'
                }} />
              </button>
            </div>
          )}

          {/* Right: Camera settings controls (Photo mode) or spacer (Voice mode) */}
          <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center', minWidth: 44, justifyContent: 'flex-end' }}>
            {mode === 'photo' ? (
              <>
                {cam.isReady && cam.availableCameras.length > 1 && (
                  <button
                    onClick={switchCamera}
                    style={{
                      background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
                      width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', cursor: 'pointer'
                    }}
                    title="Switch Camera"
                  >
                    <RefreshCw size={18} />
                  </button>
                )}

                {!cam.isReady && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
                      width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', cursor: 'pointer'
                    }}
                    title="Snap using System Camera"
                  >
                    <Camera size={18} />
                  </button>
                )}
              </>
            ) : (
              <div style={{ width: 38, height: 38 }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
