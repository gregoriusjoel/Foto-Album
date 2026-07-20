'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

export interface CameraUploadState {
  isUploading: boolean;
  progress: number;
  justUploaded: boolean;
  uploadedCount: number;
  error: string | null;
}

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 generator for non-secure HTTP contexts
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export function useCameraUpload(eventSlug: string) {
  const [state, setState] = useState<CameraUploadState>({
    isUploading: false,
    progress: 0,
    justUploaded: false,
    uploadedCount: 0,
    error: null,
  });

  const upload = useCallback(async (blob: Blob): Promise<boolean> => {
    setState((prev) => ({ ...prev, isUploading: true, progress: 0, error: null }));

    const formData = new FormData();
    // Match backend upload input name "file"
    formData.append('file', blob, 'capture.jpg');

    try {
      const idempotencyKey = generateUUID();

      await api.post(`/public/events/${eventSlug}/uploads`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Idempotency-Key': idempotencyKey,
        },
        onUploadProgress: (event) => {
          const progress = Math.round((event.loaded * 100) / (event.total ?? 1));
          setState((prev) => ({ ...prev, progress }));
        },
      });

      setState((prev) => ({
        ...prev,
        isUploading: false,
        progress: 100,
        justUploaded: true,
        uploadedCount: prev.uploadedCount + 1,
      }));

      // Flash success toast message for 2 seconds
      setTimeout(() => {
        setState((prev) => ({ ...prev, justUploaded: false, progress: 0 }));
      }, 2000);

      return true;
    } catch (err: any) {
      console.error('Camera upload failed:', err);
      const message = err?.response?.data?.message ?? 'Upload failed. Please try again.';
      setState((prev) => ({ ...prev, isUploading: false, progress: 0, error: message }));
      return false;
    }
  }, [eventSlug]);

  return {
    upload,
    uploadState: state,
  };
}
