'use client';

import { useState, useEffect, useRef } from 'react';
import Lottie from 'lottie-react';
import cameraAperture from '@/app/camera-aperture.json';

interface ApertureLoaderProps {
  size?: number;
  text?: string;
  fullscreen?: boolean;
}

export const ApertureLoader = ({ 
  size = 180, 
  text, 
  fullscreen = false 
}: ApertureLoaderProps) => {
  const [mounted, setMounted] = useState(false);
  const lottieRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && lottieRef.current) {
      lottieRef.current.setSpeed(2.5); // Set animation to run 2.5x faster
    }
  }, [mounted]);

  const content = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.25rem',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{ 
        position: 'relative', 
        width: size, 
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {mounted && (
          <Lottie 
            lottieRef={lottieRef}
            animationData={cameraAperture} 
            loop={true} 
            autoplay={true}
            style={{ width: '100%', height: '100%' }} 
          />
        )}
      </div>
      {text && (
        <p style={{
          fontSize: '0.875rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-sans)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em'
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
        backgroundColor: 'rgba(250, 248, 244, 0.96)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
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
