'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import cameraAperture from '../../../public/Camera Aperture.json';

const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;

export function Preloader({ children }: { children: React.ReactNode }) {
  const [showPreloader, setShowPreloader] = useState<boolean | null>(null);
  const lottieRef = useRef<any>(null);

  useEffect(() => {
    try {
      const now = Date.now();
      const lastSeen = localStorage.getItem('memly_preloader_last_seen');
      const sessionLoaded = sessionStorage.getItem('memly_session_loaded');

      const navEntries = typeof window !== 'undefined' ? performance.getEntriesByType('navigation') : [];
      const isReload = navEntries.length > 0 && (navEntries[0] as PerformanceNavigationTiming).type === 'reload';
      const isExpired = !lastSeen || (now - parseInt(lastSeen, 10)) > FIVE_HOURS_MS;

      // Show preloader if page was reloaded, or if 5 hours have passed, or if session isn't marked
      if (isReload || isExpired || !sessionLoaded) {
        setShowPreloader(true);
      } else {
        setShowPreloader(false);
      }
    } catch {
      setShowPreloader(false);
    }
  }, []);

  const handleAnimationComplete = () => {
    try {
      localStorage.setItem('memly_preloader_last_seen', String(Date.now()));
      sessionStorage.setItem('memly_session_loaded', 'true');
    } catch {}

    setShowPreloader(false);
  };

  useEffect(() => {
    if (showPreloader) {
      if (lottieRef.current) {
        lottieRef.current.setSpeed(1.2);
      }
      const timer = setTimeout(() => {
        handleAnimationComplete();
      }, 2300);
      return () => clearTimeout(timer);
    }
  }, [showPreloader]);

  return (
    <>
      <AnimatePresence mode="wait">
        {showPreloader && (
          <motion.div
            key="memly-preloader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              backgroundColor: '#FAF8F4',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              pointerEvents: 'auto',
            }}
          >
            {/* Soft grid background */}
            <div style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.5,
              backgroundImage: 'radial-gradient(#d6cfc7 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              pointerEvents: 'none',
            }} />

            {/* Centered Content Wrapper (100% Perfect Screen Dead-Center) */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 2,
              transform: 'translateY(-2.5rem)',
            }}>
              {/* Aperture Lottie Animation */}
              <motion.div
                initial={{ scale: 0.75, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ width: 440, height: 440, position: 'relative' }}
              >
                <Lottie
                  lottieRef={lottieRef}
                  animationData={cameraAperture}
                  loop={true}
                  autoplay={true}
                  style={{ width: '100%', height: '100%' }}
                />
              </motion.div>

              {/* Animated Memly Brand Title */}
              <div style={{ marginTop: '-10.5rem', textAlign: 'center', position: 'relative' }}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '2.5rem',
                      fontWeight: 700,
                      letterSpacing: '-0.03em',
                      color: 'var(--text-primary)',
                      lineHeight: 1,
                    }}
                  >
                    Memly
                  </span>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-burnt-orange)',
                      display: 'inline-block',
                    }}
                  />
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.7, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'var(--text-secondary)',
                    marginTop: '0.5rem',
                  }}
                >
                  Digital Memory Archives
                </motion.p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </>
  );
}
