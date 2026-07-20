'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface CameraState {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  facing: 'user' | 'environment';
  hasFlash: boolean;
  flashMode: 'on' | 'off' | 'auto';
  availableCameras: MediaDeviceInfo[];
}

export function useCamera(autoStart: boolean = true) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [state, setState] = useState<CameraState>({
    isReady: false,
    isLoading: false,
    error: null,
    facing: 'environment',
    hasFlash: false,
    flashMode: 'off',
    availableCameras: [],
  });

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState((prev) => ({ ...prev, isReady: false }));
  }, []);

  const startCamera = useCallback(async (facingMode: 'user' | 'environment') => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    stopCamera();

    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: facingMode,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    };

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isReady: false,
        error: 'Camera stream requires HTTPS. Please use the native camera below.',
      }));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Safe delay check to ensure React ref has bound to the newly mounted video element
      if (!videoRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      if (videoRef.current) {
        // 1. Fallback: play when metadata loaded (some mobile OS require this check)
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((err) => {
            if (err.name !== 'AbortError') {
              console.error("Metadata fallback video play failed:", err);
            }
          });
        };

        videoRef.current.srcObject = stream;
        
        // 2. Attempt immediate play (works on most browsers if already interactively joined)
        videoRef.current.play().catch((err) => {
          if (err.name !== 'AbortError') {
            console.warn("Immediate video play failed, waiting for metadata:", err);
          }
        });
      }

      // Check for flashlight capabilities
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      const hasFlash = 'torch' in capabilities;

      // List all available video inputs
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((d) => d.kind === 'videoinput');

      setState((prev) => ({
        ...prev,
        isReady: true,
        isLoading: false,
        facing: facingMode,
        hasFlash,
        availableCameras: cameras,
      }));
    } catch (err: any) {
      console.error('Failed to open camera:', err);
      let errMsg = 'Could not access camera. Please make sure permissions are granted.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errMsg = 'Camera permission denied. Please enable camera access in your settings.';
      }
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isReady: false,
        error: errMsg,
      }));
    }
  }, [stopCamera]);

  const switchCamera = useCallback(() => {
    const nextFacing = state.facing === 'environment' ? 'user' : 'environment';
    startCamera(nextFacing);
  }, [state.facing, startCamera]);

  const toggleFlash = useCallback(async () => {
    if (!streamRef.current || !state.hasFlash) return;
    
    const track = streamRef.current.getVideoTracks()[0];
    let nextMode: 'off' | 'auto' | 'on' = 'off';
    
    if (state.flashMode === 'off') nextMode = 'auto';
    else if (state.flashMode === 'auto') nextMode = 'on';
    else nextMode = 'off';
    
    try {
      await track.applyConstraints({
        advanced: [{ torch: nextMode === 'on' } as any],
      });
      setState((prev) => ({ ...prev, flashMode: nextMode }));
    } catch (err) {
      console.error('Failed to toggle flash/torch:', err);
    }
  }, [state.hasFlash, state.flashMode]);

  // Autostart on mount or change
  useEffect(() => {
    if (autoStart) {
      startCamera(state.facing);
    }
    return () => stopCamera();
  }, [autoStart]);

  // Listen to user interactions to bypass mobile WebKit/Safari autoplay restrictions during SPA routing
  useEffect(() => {
    const resumeVideo = () => {
      const video = videoRef.current;
      if (video && video.srcObject && video.paused) {
        video.play().catch((err) => {
          console.warn("User interaction video play failed:", err);
        });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('click', resumeVideo);
      window.addEventListener('touchstart', resumeVideo, { passive: true });
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('click', resumeVideo);
        window.removeEventListener('touchstart', resumeVideo);
      }
    };
  }, []);

  return {
    videoRef,
    state,
    startCamera,
    stopCamera,
    switchCamera,
    toggleFlash,
  };
}
