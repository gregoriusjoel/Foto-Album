'use client';

import Lottie from 'lottie-react';
import cameraAperture from '@/app/camera-aperture.json';

interface ApertureLoaderProps {
  size?: number;
  text?: string;
  fullscreen?: boolean;
}

export const ApertureLoader = ({ 
  size = 120, 
  text, 
  fullscreen = false 
}: ApertureLoaderProps) => {
  const content = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <Lottie 
          animationData={cameraAperture} 
          loop={true} 
          style={{ width: '100%', height: '100%' }} 
        />
      </div>
      {text && (
        <p style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 10, 12, 0.95)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        {content}
      </div>
    );
  }

  return content;
};
