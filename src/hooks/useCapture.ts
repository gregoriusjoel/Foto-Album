'use client';

import { useState, useCallback, RefObject, useEffect } from 'react';

interface UseCaptureProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  persistedKey?: string;
}

/**
 * Safely applies CSS-like filters directly to canvas pixels.
 * This is a robust workaround for iOS/Mac Safari where Canvas 2D ctx.filter is either 
 * missing, buggy, or silently dropped on high-resolution/large canvases.
 */
export function applyFiltersToImageData(imageData: ImageData, filterId: string) {
  const data = imageData.data;
  const len = data.length;

  let grayscale = 0;
  let sepia = 0;
  let contrast = 1;
  let saturate = 1;
  let brightness = 1;
  let hue = 0; // in degrees

  if (filterId === 'hp5plus') {
    grayscale = 1;
    contrast = 1.35;
    brightness = 0.98;
  } else if (filterId === 'ektar100') {
    saturate = 1.65;
    contrast = 1.20;
    brightness = 1.0;
  } else if (filterId === 'portra400') {
    sepia = 0.10;
    saturate = 1.05;
    contrast = 0.93;
    brightness = 1.04;
  } else if (filterId === 'quicksnap') {
    saturate = 1.35;
    contrast = 1.15;
    brightness = 1.03;
    hue = 8;
  } else if (filterId === 'funsaver') {
    sepia = 0.25;
    contrast = 1.10;
    saturate = 1.35;
    brightness = 1.05;
    hue = -5;
  } else if (filterId === 'cinestill800t') {
    contrast = 1.15;
    brightness = 0.95;
    saturate = 1.15;
    hue = -12;
    sepia = 0.08;
  } else {
    // Normal / default
    return;
  }

  // Pre-calculate values
  const angle = (hue * Math.PI) / 180;
  const cosVal = Math.cos(angle);
  const sinVal = Math.sin(angle);
  
  // Hue rotation matrix coefficients
  const a00 = 0.213 + cosVal * 0.787 - sinVal * 0.213;
  const a01 = 0.715 - cosVal * 0.715 - sinVal * 0.715;
  const a02 = 0.072 - cosVal * 0.072 + sinVal * 0.928;
  const a10 = 0.213 - cosVal * 0.213 + sinVal * 0.143;
  const a11 = 0.715 + cosVal * 0.285 + sinVal * 0.140;
  const a12 = 0.072 - cosVal * 0.072 - sinVal * 0.283;
  const a20 = 0.213 - cosVal * 0.213 - sinVal * 0.787;
  const a21 = 0.715 - cosVal * 0.715 + sinVal * 0.715;
  const a22 = 0.072 + cosVal * 0.928 + sinVal * 0.072;

  // Contrast factor calculation
  const contrastPct = (contrast - 1) * 100;
  const factor = (259 * (contrastPct + 255)) / (255 * (259 - contrastPct));

  for (let i = 0; i < len; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // 1. Grayscale
    if (grayscale > 0) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = r + (gray - r) * grayscale;
      g = g + (gray - g) * grayscale;
      b = b + (gray - b) * grayscale;
    }

    // 2. Sepia
    if (sepia > 0) {
      const sr = (r * 0.393) + (g * 0.769) + (b * 0.189);
      const sg = (r * 0.349) + (g * 0.686) + (b * 0.168);
      const sb = (r * 0.272) + (g * 0.534) + (b * 0.131);
      r = r + (sr - r) * sepia;
      g = g + (sg - g) * sepia;
      b = b + (sb - b) * sepia;
    }

    // 3. Hue Rotation
    if (hue !== 0) {
      const hr = r * a00 + g * a01 + b * a02;
      const hg = r * a10 + g * a11 + b * a12;
      const hb = r * a20 + g * a21 + b * a22;
      r = hr;
      g = hg;
      b = hb;
    }

    // 4. Saturation
    if (saturate !== 1) {
      const sr = (0.213 + 0.787 * saturate) * r + (0.715 - 0.715 * saturate) * g + (0.072 - 0.072 * saturate) * b;
      const sg = (0.213 - 0.213 * saturate) * r + (0.715 + 0.285 * saturate) * g + (0.072 - 0.072 * saturate) * b;
      const sb = (0.213 - 0.213 * saturate) * r + (0.715 - 0.715 * saturate) * g + (0.072 + 0.928 * saturate) * b;
      r = sr;
      g = sg;
      b = sb;
    }

    // 5. Brightness
    if (brightness !== 1) {
      r = r * brightness;
      g = g * brightness;
      b = b * brightness;
    }

    // 6. Contrast
    if (contrast !== 1) {
      r = factor * (r - 128) + 128;
      g = factor * (g - 128) + 128;
      b = factor * (b - 128) + 128;
    }

    // Clamp and write back
    data[i] = r < 0 ? 0 : r > 255 ? 255 : r;
    data[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
    data[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }
}

export function useCapture({ videoRef, persistedKey }: UseCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastCapture, setLastCaptureState] = useState<string | null>(null);

  useEffect(() => {
    if (persistedKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(persistedKey);
      if (saved) setLastCaptureState(saved);
    }
  }, [persistedKey]);

  const setLastCapture = useCallback((val: string | null) => {
    setLastCaptureState(val);
    if (persistedKey && typeof window !== 'undefined') {
      if (val) {
        localStorage.setItem(persistedKey, val);
      } else {
        localStorage.removeItem(persistedKey);
      }
    }
  }, [persistedKey]);

  const capture = useCallback(async (filterId?: string): Promise<Blob | null> => {
    const video = videoRef.current;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return null;

    setIsCapturing(true);

    // Audio snap sound effect
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch {}

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsCapturing(false);
      return null;
    }

    // Mirror image if front camera is used (user facing)
    const stream = video.srcObject as MediaStream | null;
    const track = stream?.getVideoTracks()[0];
    const settings = track?.getSettings ? track.getSettings() : {};
    const isUserFacing = settings.facingMode === 'user';

    if (isUserFacing) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    // Draw the clean video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Apply the visual filter via high-compatibility pixel shader if requested
    if (filterId && filterId !== 'normal') {
      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        applyFiltersToImageData(imgData, filterId);
        ctx.putImageData(imgData, 0, 0);
      } catch (err) {
        console.error('JS pixel filter application failed:', err);
      }
    }

    // Set last capture preview as dataUrl
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setLastCapture(dataUrl);

    // Trigger visual shutter flash feedback
    setTimeout(() => {
      setIsCapturing(false);
    }, 150);

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        'image/jpeg',
        0.85
      );
    });
  }, [videoRef, setLastCapture]);

  return {
    capture,
    isCapturing,
    lastCapture,
    setLastCapture,
  };
}
