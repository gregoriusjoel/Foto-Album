'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useI18n, LanguageToggle } from '@/lib/i18n';
import {
  Camera, ArrowRight, QrCode, Users, Download, Shield, Sparkles,
  Check, X, ChevronDown, RefreshCw, Smartphone, Image as ImageIcon,
  Heart, Calendar, MapPin
} from 'lucide-react';

// Unsplash premium authentic lifestyle photography
const SAMPLE_PHOTOS = [
  { url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&auto=format&fit=crop&q=80', label: 'Wedding Toast', aspect: '4/5' },
  { url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&auto=format&fit=crop&q=80', label: 'Birthday Celebration', aspect: '1/1' },
  { url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=80', label: 'Graduation Day', aspect: '3/2' },
  { url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80', label: 'Music Festival', aspect: '4/5' },
  { url: 'https://images.unsplash.com/photo-1543807535-eceef0bc6599?w=600&auto=format&fit=crop&q=80', label: 'Family Reunion', aspect: '1/1' },
  { url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&auto=format&fit=crop&q=80', label: 'Travel Adventure', aspect: '3/2' },
  { url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&auto=format&fit=crop&q=80', label: 'Corporate Seminar', aspect: '4/5' },
  { url: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600&auto=format&fit=crop&q=80', label: 'Community Feast', aspect: '1/1' },
  { url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&auto=format&fit=crop&q=80', label: 'Concert Crowd', aspect: '3/2' },
  { url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&auto=format&fit=crop&q=80', label: 'Night Party', aspect: '4/5' },
  { url: 'https://images.unsplash.com/photo-1517263904808-5dc91e3e7044?w=600&auto=format&fit=crop&q=80', label: 'Friends Dinner', aspect: '1/1' },
  { url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80', label: 'Outdoor Festival', aspect: '3/2' },
];

const NEW_UPLOAD_SAMPLES = [
  { url: 'https://images.unsplash.com/photo-1530103043960-ef38714abb15?w=600&auto=format&fit=crop&q=80', label: 'Wedding Sparklers', photographer: 'Guest #419', time: 'Just now' },
  { url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=600&auto=format&fit=crop&q=80', label: 'Graduation Cheering', photographer: 'Guest #108', time: 'Just now' },
  { url: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=600&auto=format&fit=crop&q=80', label: 'Dancing Circle', photographer: 'Guest #254', time: 'Just now' },
  { url: 'https://images.unsplash.com/photo-1505232458627-a7272658ba01?w=600&auto=format&fit=crop&q=80', label: 'Pool Party', photographer: 'Guest #881', time: 'Just now' },
];

export default function HomePage() {
  const { t } = useI18n();

  // Live Memory Roll uploads state
  const [liveUploads, setLiveUploads] = useState<any[]>([]);
  const [newUploadNotify, setNewUploadNotify] = useState<string | null>(null);

  // Demo simulator steps state
  const [demoStep, setDemoStep] = useState(1);
  const [simulatedUploadProgress, setSimulatedUploadProgress] = useState(0);
  const [simulatedGallery, setSimulatedGallery] = useState<string[]>([
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=300&q=80',
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=300&q=80',
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300&q=80'
  ]);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Floating navbar scroll state
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 25);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Periodic new photo uploads simulations
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      const nextPhoto = NEW_UPLOAD_SAMPLES[index % NEW_UPLOAD_SAMPLES.length];
      setLiveUploads((prev) => [nextPhoto, ...prev.slice(0, 5)]);
      setNewUploadNotify(`${nextPhoto.photographer} uploaded a new memory!`);
      index++;

      // Auto fade out notification
      setTimeout(() => {
        setNewUploadNotify(null);
      }, 2500);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Demo simulator functions
  const runSimulatedUpload = () => {
    setSimulatedUploadProgress(0);
    setDemoStep(4);
    const interval = setInterval(() => {
      setSimulatedUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const snapImg = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80';
            setSimulatedGallery((prevG) => [snapImg, ...prevG]);
            setDemoStep(5);
          }, 600);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  return (
    <main style={{
      background: 'var(--bg-page)',
      color: 'var(--text-primary)',
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-sans)',
      position: 'relative',
      overflowX: 'hidden'
    }} className="scrollbar-hide">

      {/* Grid overlay background */}
      <div className="paper-grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.6, pointerEvents: 'none', zIndex: 0 }} />

      {/* ── Navigation Header (Floating Glass Pill with Smooth CSS Transitions) ── */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <nav
          style={{
            pointerEvents: 'auto',
            width: '100%',
            maxWidth: scrolled ? '1080px' : '1200px',
            transform: scrolled ? 'translateY(12px)' : 'translateY(0px)',
            borderRadius: scrolled ? '999px' : '0px',
            backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.88)' : 'rgba(250, 248, 244, 0.85)',
            boxShadow: scrolled
              ? '0 16px 40px -8px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.04)'
              : 'none',
            borderStyle: 'solid',
            borderWidth: scrolled ? '1px' : '0 0 1px 0',
            borderColor: scrolled ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.06)',
            padding: scrolled ? '10px 24px' : '20px 32px',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Link href="/" className="brand-logo-container">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-memly.png"
                alt="Logo"
                className="brand-logo-img"
                style={{ height: scrolled ? 28 : 32, transition: 'height 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
              />
              <span
                className="brand-logo-text"
                style={{ fontSize: scrolled ? '1.35rem' : '1.5rem', transition: 'font-size 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                Memly
              </span>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <LanguageToggle />
              <Link href="/login" style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontWeight: 500,
                transition: 'color 0.2s'
              }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                {t('nav_signin')}
              </Link>
              <Link href="/register" style={{
                background: 'var(--color-burnt-orange)',
                color: 'var(--color-paper-white)',
                padding: scrolled ? '0.45rem 1.15rem' : '0.5rem 1.25rem',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.875rem',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'inline-block',
                boxShadow: '0 2px 8px rgba(184, 106, 60, 0.18)',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03) translateY(-1px)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1) translateY(0)'; }}>
                {t('nav_getstarted')}
              </Link>
            </div>
          </div>
        </nav>
      </div>



      {/* ── Hero Section ── */}
      <section style={{ padding: 'var(--space-96) 0 var(--space-64)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 2rem', textAlign: 'center' }}>

          <div className="animate-fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface)', border: 'var(--border-hairline)', borderRadius: '99px', padding: '0.35rem 1rem', marginBottom: 'var(--space-24)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--color-burnt-orange)' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-burnt-orange)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)' }}>{t('hero_badge')}</span>
          </div>

          <h1 className="animate-fade-up" style={{
            fontSize: 'clamp(2.5rem, 6.5vw, 4.75rem)',
            lineHeight: 1.1,
            fontWeight: 400,
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.03em',
            marginBottom: 'var(--space-24)'
          }}>
            Every perspective. <br />
            <span style={{ fontStyle: 'italic', color: 'var(--color-burnt-orange)' }}>One beautiful story.</span>
          </h1>

          <p className="animate-fade-up" style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
            color: 'var(--text-secondary)',
            maxWidth: '620px',
            margin: '0 auto var(--space-48)',
            lineHeight: 1.7,
            fontWeight: 300
          }}>
            {t('hero_subtitle')}
          </p>

          <div className="animate-fade-up" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{
              background: 'var(--color-burnt-orange)',
              color: 'var(--color-paper-white)',
              padding: '0.875rem 2.25rem',
              borderRadius: 'var(--radius-pill)',
              fontSize: '1rem',
              textDecoration: 'none',
              fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(184, 106, 60, 0.15)',
              transition: 'transform 0.3s var(--ease-glide), opacity 0.3s var(--ease-glide)'
            }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}>
              {t('hero_cta')} <ArrowRight size={18} />
            </Link>
            <a href="#demo" style={{
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: 'var(--border-hairline)',
              padding: '0.875rem 2.25rem',
              borderRadius: 'var(--radius-pill)',
              fontSize: '1rem',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'transform 0.3s var(--ease-glide), background 0.3s var(--ease-glide)'
            }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03) translateY(-1px)'; e.currentTarget.style.background = 'var(--bg-hover)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1) translateY(0)'; e.currentTarget.style.background = 'var(--bg-surface)'; }}>
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* ── Section: Live Memory Roll ── */}
      <section className="marquee-container" style={{ position: 'relative', width: '100vw', overflow: 'hidden', padding: 'var(--space-24) 0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Row 1 (Moving Left) */}
        <div style={{ display: 'flex', overflow: 'hidden', width: '100%' }}>
          <div className="marquee-row-left" style={{ display: 'flex', gap: '1.25rem' }}>
            {[...SAMPLE_PHOTOS, ...SAMPLE_PHOTOS].map((p, idx) => (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  width: '200px',
                  aspectRatio: p.aspect,
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: 'var(--border-hairline)',
                  boxShadow: 'var(--shadow-xs)',
                  cursor: 'pointer',
                  transition: 'all var(--dur-component) var(--ease-glide)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.03) translateY(-2px)';
                  e.currentTarget.style.borderColor = 'var(--text-primary)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1) translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.06)' }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(31,31,31,0.9) 0%, transparent 60%)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                  padding: '0.75rem', opacity: 0, transition: 'opacity 0.2s'
                }} className="hover-info" onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-paper-white)' }}>{p.label}</span>
                  <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.125rem', fontFamily: 'var(--font-mono)' }}>Guest uploaded 2s ago</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 (Moving Right) */}
        <div style={{ display: 'flex', overflow: 'hidden', width: '100%' }}>
          <div className="marquee-row-right" style={{ display: 'flex', gap: '1.25rem' }}>
            {[...SAMPLE_PHOTOS, ...SAMPLE_PHOTOS].reverse().map((p, idx) => (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  width: '240px',
                  aspectRatio: p.aspect === '4/5' ? '3/2' : p.aspect,
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: 'var(--border-hairline)',
                  boxShadow: 'var(--shadow-xs)',
                  cursor: 'pointer',
                  transition: 'all var(--dur-component) var(--ease-glide)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.03) translateY(-2px)';
                  e.currentTarget.style.borderColor = 'var(--text-primary)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1) translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.06)' }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(31,31,31,0.9) 0%, transparent 60%)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                  padding: '0.75rem', opacity: 0, transition: 'opacity 0.2s'
                }} className="hover-info" onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-paper-white)' }}>{p.label}</span>
                  <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.125rem', fontFamily: 'var(--font-mono)' }}>Guest uploaded Just now</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 3 (Live Pop-ins + Scrolling Left) */}
        <div style={{ display: 'flex', overflow: 'hidden', width: '100%' }}>
          <div className="marquee-row-left" style={{ display: 'flex', gap: '1.25rem' }}>
            {/* Pop-in simulated list */}
            {liveUploads.map((p, idx) => (
              <div
                key={`live-${idx}`}
                style={{
                  position: 'relative',
                  width: '220px',
                  aspectRatio: '1/1',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: '2px solid var(--color-burnt-orange)',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  animation: 'scaleUp 0.5s var(--ease-glide) both',
                  transition: 'all var(--dur-component) var(--ease-glide)'
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.06)' }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(31,31,31,0.9) 0%, transparent 60%)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                  padding: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.125rem' }}>
                    <Heart size={10} color="var(--color-burnt-orange)" fill="var(--color-burnt-orange)" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-paper-white)' }}>{p.photographer}</span>
                  </div>
                  <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)' }}>Live uploading...</span>
                </div>
              </div>
            ))}

            {SAMPLE_PHOTOS.map((p, idx) => (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  width: '200px',
                  aspectRatio: p.aspect,
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: 'var(--border-hairline)',
                  boxShadow: 'var(--shadow-xs)',
                  cursor: 'pointer',
                  transition: 'all var(--dur-component) var(--ease-glide)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.03) translateY(-2px)';
                  e.currentTarget.style.borderColor = 'var(--text-primary)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1) translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.06)' }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(31,31,31,0.9) 0%, transparent 50%)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                  padding: '0.75rem', opacity: 0, transition: 'opacity 0.2s'
                }} className="hover-info" onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-paper-white)' }}>{p.label}</span>
                  <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.125rem', fontFamily: 'var(--font-mono)' }}>Guest uploaded 10s ago</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* ── Section: Product Story (QR to ZIP) ── */}
      <section id="demo" style={{ padding: 'var(--space-96) 2rem', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 'var(--space-64)' }}>
            <span style={{ fontSize: 'var(--font-caption)', fontFamily: 'var(--font-mono)', color: 'var(--color-vintage-mustard)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>
              {t('demo_badge')}
            </span>
            <h2 style={{ fontSize: 'var(--font-display-l)', fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
              {t('demo_title')}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 300 }}>
              {t('demo_subtitle')}
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-64)', alignItems: 'center'
          }}>

            {/* Left: Step Controls list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {[
                { step: 1, title: t('demo_step1_title'), desc: t('demo_step1_desc') },
                { step: 2, title: t('demo_step2_title'), desc: t('demo_step2_desc') },
                { step: 3, title: t('demo_step3_title'), desc: t('demo_step3_desc') },
                { step: 4, title: t('demo_step4_title'), desc: t('demo_step4_desc') },
                { step: 5, title: t('demo_step5_title'), desc: t('demo_step5_desc') },
              ].map((s) => (
                <button
                  key={s.step}
                  onClick={() => {
                    if (s.step === 4) runSimulatedUpload();
                    else setDemoStep(s.step);
                  }}
                  style={{
                    background: demoStep === s.step ? 'var(--bg-surface)' : 'transparent',
                    border: 'none',
                    borderLeft: '2px solid ' + (demoStep === s.step ? 'var(--color-burnt-orange)' : 'var(--border-color)'),
                    padding: '0.75rem 1.25rem', textAlign: 'left', cursor: 'pointer',
                    transition: 'all var(--dur-hover) var(--ease-glide)'
                  }}
                >
                  <h3 style={{ fontSize: 'var(--font-body)', fontWeight: 600, color: demoStep === s.step ? 'var(--text-primary)' : 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    {s.title}
                  </h3>
                  <p style={{ fontSize: 'var(--font-small)', color: 'var(--text-muted)', lineHeight: 1.5, fontWeight: 300 }}>
                    {s.desc}
                  </p>
                </button>
              ))}
            </div>

            {/* Right: Simulator Mock Viewfinder Screen (Warm Paper Style) */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color-medium)',
              borderRadius: 'var(--radius-lg)', aspectRatio: '4/5', width: '100%', maxWidth: '440px', margin: '0 auto',
              padding: '2rem', display: 'flex', flexDirection: 'column', position: 'relative',
              boxShadow: 'var(--shadow-md)', overflow: 'hidden'
            }}>

              {/* Step 1: Organizer QR code layout */}
              {demoStep === 1 && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '1.5rem' }}>
                  <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: 'var(--border-hairline)' }}>
                    <QrCode size={140} color="var(--text-primary)" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 'var(--font-heading-s)', fontFamily: 'var(--font-display)', marginBottom: '0.25rem' }}>Wedding Archive</h4>
                    <p style={{ fontSize: 'var(--font-caption)', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>SCAN TO CONTRIBUTES</p>
                  </div>
                  <button onClick={() => setDemoStep(2)} style={{
                    background: 'transparent', border: 'var(--border-strong)', color: 'var(--text-primary)',
                    padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-pill)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'
                  }}>
                    Simulate scan <Smartphone size={14} />
                  </button>
                </div>
              )}

              {/* Step 2: Guest Scan Camera Frame mock */}
              {demoStep === 2 && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
                  <div style={{ position: 'relative', width: 180, height: 180, border: '1.5px dashed var(--color-vintage-mustard)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Smartphone size={60} style={{ color: 'var(--text-muted)' }} />
                    <div style={{ position: 'absolute', top: -5, left: -5, width: 20, height: 20, borderTop: '3px solid var(--color-vintage-mustard)', borderLeft: '3px solid var(--color-vintage-mustard)' }} />
                    <div style={{ position: 'absolute', top: -5, right: -5, width: 20, height: 20, borderTop: '3px solid var(--color-vintage-mustard)', borderRight: '3px solid var(--color-vintage-mustard)' }} />
                    <div style={{ position: 'absolute', bottom: -5, left: -5, width: 20, height: 20, borderBottom: '3px solid var(--color-vintage-mustard)', borderLeft: '3px solid var(--color-vintage-mustard)' }} />
                    <div style={{ position: 'absolute', bottom: -5, right: -5, width: 20, height: 20, borderBottom: '3px solid var(--color-vintage-mustard)', borderRight: '3px solid var(--color-vintage-mustard)' }} />
                  </div>
                  <button onClick={() => setDemoStep(3)} style={{
                    background: 'var(--color-charcoal)', color: 'var(--color-paper-white)', padding: '0.625rem 1.25rem', borderRadius: 'var(--radius-pill)',
                    fontSize: '0.875rem', fontWeight: 500, border: 'none', cursor: 'pointer'
                  }}>
                    Connect Shutter
                  </button>
                </div>
              )}

              {/* Step 3: Viewfinder snap shutter mock */}
              {demoStep === 3 && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  <div style={{
                    flex: 1, borderRadius: 'var(--radius-md)', overflow: 'hidden', position: 'relative',
                    backgroundImage: `url("https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80")`,
                    backgroundSize: 'cover', backgroundPosition: 'center', border: 'var(--border-hairline)'
                  }}>
                    <div style={{ position: 'absolute', top: 12, left: 12, background: 'var(--bg-surface)', border: 'var(--border-hairline)', padding: '0.25rem 0.5rem', borderRadius: 4, display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.625rem', fontFamily: 'var(--font-mono)' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--color-burnt-orange)' }} /> LIVE
                    </div>
                  </div>
                  <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1rem' }}>
                    <button onClick={runSimulatedUpload} style={{
                      width: 50, height: 50, borderRadius: '50%', border: '4px solid var(--color-charcoal)', backgroundColor: 'var(--color-charcoal)', cursor: 'pointer'
                    }} />
                  </div>
                </div>
              )}

              {/* Step 4: Live Uploading simulation */}
              {demoStep === 4 && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
                  <div style={{ position: 'relative', width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-page)', border: 'var(--border-hairline)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RefreshCw size={24} className="spinner" style={{ color: 'var(--color-burnt-orange)', animation: 'spin 1.5s linear infinite' }} />
                  </div>
                  <div style={{ width: '100%', maxWidth: '220px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>
                      <span>Uploading memory</span>
                      <span>{simulatedUploadProgress}%</span>
                    </div>
                    <div style={{ width: '100%', height: 3, background: 'var(--border-color)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${simulatedUploadProgress}%`, height: '100%', background: 'var(--color-burnt-orange)', transition: 'width 0.15s' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Shared Gallery populate with Download button */}
              {demoStep === 5 && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h5 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Shared Gallery ({simulatedGallery.length})</h5>
                    <button onClick={() => {
                      toast.success('ZIP Archive download initialized!');
                      setDemoStep(1);
                    }} style={{
                      background: 'var(--color-charcoal)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.75rem',
                      fontSize: '0.75rem', color: 'var(--color-paper-white)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'
                    }}>
                      <Download size={12} /> Download ZIP
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', flex: 1 }}>
                    {simulatedGallery.map((img, idx) => (
                      <div key={idx} style={{
                        aspectRatio: '1/1', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: 'var(--border-hairline)',
                        animation: idx === 0 ? 'scaleUp 0.4s var(--ease-glide) both' : 'none'
                      }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      </section>

      {/* ── Section: Shared Gallery Experience ── */}
      <section style={{ padding: 'var(--space-96) 2rem', background: 'var(--bg-surface)', borderTop: 'var(--border-hairline)', borderBottom: 'var(--border-hairline)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '4rem', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 'var(--font-caption)', fontFamily: 'var(--font-mono)', color: 'var(--color-vintage-mustard)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>
                Museum Presentation
              </span>
              <h2 style={{ fontSize: 'var(--font-display-l)', fontFamily: 'var(--font-display)', lineHeight: 1.15, fontWeight: 400, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
                An elegant gallery experience.
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-body)', lineHeight: 1.7, marginBottom: '2rem', fontWeight: 300 }}>
                Every memory collected is laid out beautifully like a curated museum portfolio. Easily review high-resolution uploads, replay guest audio wishes, and preserve favorites.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  'Beautiful chronological memory timeline grids',
                  'Typewriter wishes and audio wishes playback',
                  'Instant search filters by participant name',
                  'High-resolution downloads in one click'
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9375rem' }}>
                    <Check size={14} style={{ color: 'var(--color-burnt-orange)' }} />
                    <span style={{ fontWeight: 500 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulated Polaroid Showcase */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div style={{ background: '#fff', padding: '0.75rem 0.75rem 2rem', border: 'var(--border-hairline)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-sm)', transform: 'rotate(-2deg)' }}>
                <img src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=300&q=80" alt="" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} />
                <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.75rem', textTransform: 'uppercase' }}>Sarah J. // Wedding</span>
              </div>
              <div style={{ background: '#fff', padding: '0.75rem 0.75rem 2rem', border: 'var(--border-hairline)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-sm)', transform: 'rotate(3deg)', marginTop: '1.5rem' }}>
                <img src="https://images.unsplash.com/photo-1543807535-eceef0bc6599?w=300&q=80" alt="" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} />
                <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.75rem', textTransform: 'uppercase' }}>David M. // Gathering</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section: Problem vs. Solution ── */}
      <section style={{ padding: 'var(--space-96) 2rem', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 'var(--space-64)' }}>
            <h2 style={{ fontSize: 'var(--font-display-l)', fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
              Why Traditional Sharing Fails
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 300 }}>
              Collecting event photos shouldn&apos;t feel like a chore.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>

            {/* Without Memly */}
            <div style={{
              background: 'var(--bg-surface)',
              border: 'var(--border-hairline)',
              borderRadius: 'var(--radius-md)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem'
            }}>
              <h3 style={{ fontSize: 'var(--font-body)', fontWeight: 600, color: 'var(--color-burnt-orange)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <X size={16} /> Without Memly
              </h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', listStyle: 'none', padding: 0, margin: 0 }}>
                {[
                  'Chasing guests via messaging apps for days after.',
                  'Photos suffer heavy compression and lose quality.',
                  'Dozens of amazing candid viewpoints are lost forever.',
                  'Messy link sharing that requires guest logins.'
                ].map((txt, idx) => (
                  <li key={idx} style={{ fontSize: 'var(--font-small)', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--color-burnt-orange)', flexShrink: 0 }}>•</span> {txt}
                  </li>
                ))}
              </ul>
            </div>

            {/* With Memly */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1.5px solid var(--text-primary)',
              borderRadius: 'var(--radius-md)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem',
              boxShadow: 'var(--shadow-xs)'
            }}>
              <h3 style={{ fontSize: 'var(--font-body)', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Check size={16} /> With Memly
              </h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', listStyle: 'none', padding: 0, margin: 0 }}>
                {[
                  'Guests scan the custom QR code and instantly contribute.',
                  'All uploads remain in their absolute original resolution.',
                  'Every angle and memory is gathered in one central spot.',
                  'Zero app downloads and no guest email registration required.'
                ].map((txt, idx) => (
                  <li key={idx} style={{ fontSize: 'var(--font-small)', color: 'var(--text-primary)', display: 'flex', gap: '0.5rem', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--text-primary)', flexShrink: 0 }}>✓</span> {txt}
                  </li>
                ))}
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* ── Section: Key Benefits ── */}
      <section style={{ padding: 'var(--space-96) 2rem', background: 'var(--bg-surface)', borderTop: 'var(--border-hairline)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 'var(--space-64)' }}>
            <h2 style={{ fontSize: 'var(--font-display-l)', fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
              {t('benefits_title')}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 300 }}>
              {t('benefits_subtitle')}
            </p>
          </div>

          <style>{`
            .benefits-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 1.25rem;
            }
            @media (max-width: 1024px) {
              .benefits-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 1.25rem;
              }
            }
            @media (max-width: 640px) {
              .benefits-grid {
                grid-template-columns: 1fr;
                gap: 1rem;
              }
            }
          `}</style>

          <div className="benefits-grid">
            {[
              { title: t('b1_title'), desc: t('b1_desc') },
              { title: t('b2_title'), desc: t('b2_desc') },
              { title: t('b3_title'), desc: t('b3_desc') },
              { title: t('b4_title'), desc: t('b4_desc') },
            ].map((b, idx) => (
              <div key={idx} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color-medium)',
                borderRadius: 'var(--radius-md)', padding: '1.75rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem',
                boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s var(--ease-glide)'
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', backgroundColor: 'var(--bg-surface)', border: 'var(--border-hairline)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-vintage-mustard)'
                }}>
                  <Sparkles size={16} />
                </div>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 600 }}>{b.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, fontWeight: 300 }}>{b.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Section: Organizer Dashboard Preview ── */}
      <section style={{ padding: 'var(--space-96) 2rem', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 'var(--space-64)' }}>
            <span style={{ fontSize: 'var(--font-caption)', fontFamily: 'var(--font-mono)', color: 'var(--color-vintage-mustard)', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block', marginBottom: '0.5rem' }}>
              {t('dash_badge')}
            </span>
            <h2 style={{ fontSize: 'var(--font-display-l)', fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
              {t('dash_title')}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 300 }}>
              {t('dash_desc')}
            </p>
          </div>

          {/* Interactive Mock Dashboard */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color-medium)',
            borderRadius: 'var(--radius-lg)', width: '100%', padding: '2rem', display: 'flex', flexDirection: 'column',
            boxShadow: 'var(--shadow-md)', overflow: 'hidden'
          }}>
            {/* Tab top */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 'var(--border-hairline)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--color-olive-sage)' }} />
                <span style={{ fontSize: 'var(--font-small)', fontWeight: 600, color: 'var(--text-primary)' }}>Dashboard: Annual Gala 2026</span>
              </div>
              <button style={{
                background: 'var(--color-charcoal)', color: 'var(--color-paper-white)', border: 'none', borderRadius: 'var(--radius-pill)',
                padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.25rem'
              }}>
                <Download size={12} /> Download ZIP Archive
              </button>
            </div>

            {/* Metrics cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: t('dash_active_guests'), value: '184', change: '+12% just now', color: 'var(--color-burnt-orange)' },
                { label: t('dash_live_photos'), value: '542', change: '+32 this hour', color: 'var(--color-vintage-mustard)' },
                { label: t('dash_event_status'), value: t('dash_active'), change: 'Original resolution', color: 'var(--color-olive-sage)' },
              ].map((m, idx) => (
                <div key={idx} style={{ background: 'var(--bg-page)', border: 'var(--border-hairline)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{m.label}</div>
                  <div style={{ fontSize: 'var(--font-display-s)', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{m.value}</div>
                  <div style={{ fontSize: '0.625rem', color: m.color }}>{m.change}</div>
                </div>
              ))}
            </div>

            {/* Simulated Live Feed log */}
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>Live Event Upload Activity</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { name: 'Sarah J.', action: 'uploaded 3 new high-res photos', time: '1m ago' },
                  { name: 'David M.', action: 'joined the event and snapped a photo', time: '3m ago' },
                  { name: 'Guest #419', action: 'uploaded 1 panorama shot', time: '5m ago' },
                ].map((a, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--bg-page)', borderRadius: 'var(--radius-sm)', border: 'var(--border-hairline)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                      <span style={{ fontWeight: 600 }}>{a.name}</span>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 300 }}>{a.action}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.time}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── Section: Testimonials ── */}
      <section style={{ padding: 'var(--space-96) 2rem', background: 'var(--bg-surface)', borderTop: 'var(--border-hairline)', borderBottom: 'var(--border-hairline)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 'var(--space-64)' }}>
            <h2 style={{ fontSize: 'var(--font-display-l)', fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
              {t('test_title')}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 300 }}>
              {t('test_subtitle')}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {[
              { quote: t('t1_quote'), author: t('t1_author'), role: t('t1_role') },
              { quote: t('t2_quote'), author: t('t2_author'), role: t('t2_role') },
              { quote: t('t3_quote'), author: t('t3_author'), role: t('t3_role') },
            ].map((tItem, idx) => (
              <div key={idx} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color-medium)',
                borderRadius: 'var(--radius-md)', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.5rem',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <p style={{ fontSize: 'var(--font-body)', lineHeight: 1.6, color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '1.25rem', fontWeight: 300 }}>
                  &ldquo;{tItem.quote}&rdquo;
                </p>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{tItem.author}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{tItem.role}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Section: FAQ Accordion ── */}
      <section style={{ padding: 'var(--space-96) 2rem', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 'var(--space-64)' }}>
            <h2 style={{ fontSize: 'var(--font-display-l)', fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
              {t('faq_title')}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 300 }}>
              {t('faq_subtitle')}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[
              { q: t('faq1_q'), a: t('faq1_a') },
              { q: t('faq2_q'), a: t('faq2_a') },
              { q: t('faq3_q'), a: t('faq3_a') },
              { q: t('faq4_q'), a: t('faq4_a') },
              { q: t('faq5_q'), a: t('faq5_a') },
            ].map((f, idx) => (
              <div key={idx} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color-medium)',
                borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-xs)'
              }}>
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  style={{
                    width: '100%', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{f.q}</span>
                  <ChevronDown size={16} style={{
                    transform: openFaq === idx ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s', color: 'var(--text-muted)'
                  }} />
                </button>
                {openFaq === idx && (
                  <div style={{ padding: '0 1.25rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, fontWeight: 300 }}>
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Section: Final CTA ── */}
      <section style={{ padding: 'var(--space-96) 2rem', background: 'var(--bg-surface)', borderTop: 'var(--border-hairline)', position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'var(--font-display-l)', fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>
            Every memory deserves a home. <br />
            <span style={{ fontStyle: 'italic', color: 'var(--color-burnt-orange)' }}>Create yours today.</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem', marginBottom: '2.5rem', lineHeight: 1.6, fontWeight: 300 }}>
            Stop requesting photo sends. Start preserving memories automatically.
          </p>
          <Link href="/register" style={{
            background: 'var(--color-charcoal)',
            color: 'var(--color-paper-white)',
            padding: '0.875rem 2.25rem',
            borderRadius: 'var(--radius-pill)',
            fontSize: '1rem',
            textDecoration: 'none',
            fontWeight: 500,
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            transition: 'opacity 0.2s'
          }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
            Create Your First Event <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Footer Section ── */}
      <footer style={{
        borderTop: 'var(--border-hairline)',
        padding: '4rem 2rem 2rem',
        background: 'var(--bg-page)',
        position: 'relative', zIndex: 1
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2.5rem', marginBottom: '4rem' }}>
            {/* Branding col */}
            <div>
              <Link href="/" className="brand-logo-container" style={{ marginBottom: '1.25rem' }}>
                <img src="/logo-memly.png" alt="Logo" className="brand-logo-img" style={{ width: 24, height: 24 }} />
                <span className="brand-logo-text" style={{ fontSize: '1.125rem' }}>Memly</span>
              </Link>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5, fontWeight: 300 }}>
                A premium shared event memory preserves platform. Preserving stories, locations, and emotions.
              </p>
            </div>

            {/* Links cols */}
            {[
              {
                title: 'Product',
                links: ['Features', 'Integrations', 'Pricing', 'Changelog']
              },
              {
                title: 'Resources',
                links: ['Documentation', 'Guides', 'Support', 'Contact']
              },
              {
                title: 'Company',
                links: ['About Us', 'Careers', 'Blog', 'Privacy Policy']
              }
            ].map((col, idx) => (
              <div key={idx}>
                <h6 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem' }}>
                  {col.title}
                </h6>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', listStyle: 'none', padding: 0, margin: 0 }}>
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: 'var(--border-hairline)', paddingTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              © {new Date().getFullYear()} Memly. All rights reserved.
            </span>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <a href="#" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy</a>
              <a href="#" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Terms</a>
            </div>
          </div>

        </div>
      </footer>

    </main>
  );
}
