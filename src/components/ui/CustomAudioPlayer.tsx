'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface CustomAudioPlayerProps {
  src: string;
  duration?: number; // hint from DB when browser can't read metadata (S3 streaming)
}

export function CustomAudioPlayer({ src, duration }: CustomAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  // Initialise with DB hint so display is never blank or Infinity on first render
  const [totalDuration, setTotalDuration] = useState<number>(
    duration && isFinite(duration) ? duration : 0
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset when src or hint changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setTotalDuration(duration && isFinite(duration) ? duration : 0);
  }, [src, duration]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((e) => {
          console.warn('Audio play failed:', e);
          setIsPlaying(false);
        });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    const d = audioRef.current.duration;
    // Only trust browser duration if it is a real finite number (not Infinity)
    if (isFinite(d) && d > 0) setTotalDuration(d);
    // Otherwise keep the DB hint already in state
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  };

  /** Format seconds → m:ss. Never shows Infinity or NaN. */
  const formatTime = (t: number): string => {
    if (!isFinite(t) || isNaN(t) || t < 0) return '--:--';
    const total = Math.floor(t);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const knownDuration = isFinite(totalDuration) && totalDuration > 0;
  const progressPercent = knownDuration ? (currentTime / totalDuration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !knownDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const newTime = ((e.clientX - rect.left) / rect.width) * totalDuration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      backgroundColor: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 24,
      padding: '0.45rem 0.875rem',
      width: '100%',
      fontFamily: 'var(--font-mono)',
      boxSizing: 'border-box',
    }}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
      />

      {/* Play / Pause */}
      <button
        onClick={togglePlay}
        style={{
          width: 30, height: 30,
          borderRadius: '50%',
          backgroundColor: isPlaying ? '#3b82f6' : 'rgba(255,255,255,0.1)',
          border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', cursor: 'pointer',
          transition: 'all 0.15s ease',
          padding: 0, flexShrink: 0,
        }}
      >
        {isPlaying
          ? <Pause size={12} fill="#fff" />
          : <Play size={12} fill="#fff" style={{ marginLeft: 1 }} />}
      </button>

      {/* Progress bar */}
      <div
        onClick={handleProgressClick}
        style={{
          flex: 1, height: 4,
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 2,
          cursor: knownDuration ? 'pointer' : 'default',
          position: 'relative',
          display: 'flex', alignItems: 'center',
        }}
      >
        <div style={{
          width: `${progressPercent}%`, height: '100%',
          backgroundColor: '#3b82f6', borderRadius: 2,
          transition: 'width 0.1s linear',
        }} />
        <div style={{
          position: 'absolute',
          left: `calc(${progressPercent}% - 4px)`,
          width: 8, height: 8, borderRadius: '50%',
          backgroundColor: '#fff',
          border: '1px solid #3b82f6',
          boxShadow: '0 0 6px rgba(59,130,246,0.5)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Timestamp */}
      <span style={{
        fontSize: '0.625rem',
        color: 'rgba(255,255,255,0.6)',
        minWidth: 54, textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
        flexShrink: 0,
      }}>
        {formatTime(currentTime)} / {formatTime(totalDuration)}
      </span>
    </div>
  );
}
