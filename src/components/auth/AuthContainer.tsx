'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/store';
import type { AuthResponse } from '@/types';
import { useI18n, LanguageToggle } from '@/lib/i18n';

// Login schema
const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

// Register schema
const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

interface FloatingInputProps {
  id: string;
  label: string;
  type?: string;
  icon: any;
  error?: string;
  register: UseFormRegister<any>;
  autoComplete?: string;
  showToggle?: boolean;
  onToggleShow?: () => void;
  showPw?: boolean;
}

function FloatingInput({
  id,
  label,
  type = 'text',
  icon: Icon,
  error,
  register,
  autoComplete,
  showToggle = false,
  onToggleShow,
  showPw = false,
}: FloatingInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState('');

  const regProps = register(id, {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
    },
  });

  const isActive = isFocused || value.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <div style={{ position: 'relative', paddingTop: '1.2rem' }}>
        <Icon
          size={14}
          style={{
            position: 'absolute',
            left: 0,
            bottom: '0.65rem',
            color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
            transition: 'color 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

        {/* Animated Floating Label */}
        <label
          htmlFor={id}
          style={{
            position: 'absolute',
            left: '1.5rem',
            top: isActive ? '0rem' : '1.85rem',
            fontSize: isActive ? 'var(--font-caption)' : 'var(--font-body)',
            fontFamily: isActive ? 'var(--font-mono)' : 'var(--font-sans)',
            textTransform: isActive ? 'uppercase' : 'none',
            letterSpacing: isActive ? '0.08em' : 'normal',
            color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: isActive ? 600 : 300,
            pointerEvents: 'none',
            transition: 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {label}
        </label>

        <input
          id={id}
          type={type}
          className={error ? 'error' : ''}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            borderBottom: isActive ? '1.5px solid var(--text-primary)' : 'var(--border-strong)',
            padding: showToggle ? '0.625rem 2.25rem 0.625rem 1.5rem' : '0.625rem 0.5rem 0.625rem 1.5rem',
            fontSize: 'var(--font-body)',
            fontFamily: type === 'password' && !showPw ? 'var(--font-mono)' : 'var(--font-sans)',
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'border-color 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          autoComplete={autoComplete}
          {...regProps}
          onFocus={() => {
            setIsFocused(true);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            setValue(e.target.value);
            regProps.onBlur(e);
          }}
        />

        {showToggle && onToggleShow && (
          <button
            type="button"
            onClick={onToggleShow}
            style={{
              position: 'absolute',
              right: 0,
              bottom: '0.65rem',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 0,
              zIndex: 1,
            }}
            aria-label="Toggle password visibility"
          >
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
      {error && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-caption)', color: 'var(--color-burnt-orange)', marginTop: '0.25rem', display: 'block' }}>
          {error}
        </span>
      )}
    </div>
  );
}

export function AuthContainer({ initialMode }: { initialMode: 'login' | 'register' }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();
  const setAuth = useAuthStore((s) => s.setAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (pathname.includes('/login')) setMode('login');
    else if (pathname.includes('/register')) setMode('register');
  }, [pathname]);

  const switchMode = (targetMode: 'login' | 'register') => {
    setMode(targetMode);
    router.push(targetMode === 'login' ? '/login' : '/register', { scroll: false });
  };

  // Forms
  const loginForm = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      const res = await adminApi.post<{ data: AuthResponse; message: string }>('/admin/auth/login', data);
      const { user, token } = res.data.data;
      setAuth(user, token);
      toast.success(`Welcome back, ${user.name}!`);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Login failed. Check your credentials.';
      toast.error(msg);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormData) => {
    try {
      const res = await adminApi.post<{ data: AuthResponse; message: string }>('/admin/auth/register', data);
      const { user, token } = res.data.data;
      setAuth(user, token);
      toast.success(`Welcome to Memly, ${user.name}!`);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Registration failed. Please try again.';
      toast.error(msg);
    }
  };

  const isLogin = mode === 'login';

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'var(--bg-page)',
      perspective: '1200px',
      position: 'relative',
    }}>
      {/* Top Right Floating Language Switcher */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10 }}>
        <LanguageToggle />
      </div>

      <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 'var(--space-32)' }}>
        {/* Header Block with Slide Down (Exit) & Slide Up (Enter) Text Animation */}
        <div style={{ textAlign: 'center' }}>
          <Link href="/" className="brand-logo-container" style={{ justifyContent: 'center', marginBottom: 'var(--space-12)' }}>
            <img src="/logo-memly.png" alt="Logo" className="brand-logo-img" style={{ width: 36, height: 36 }} />
            <span className="brand-logo-text" style={{ fontSize: '1.65rem' }}>Memly</span>
          </Link>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: -32, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 32, filter: 'blur(4px)' }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 style={{ fontSize: 'var(--font-display-l)', fontFamily: 'var(--font-display)', marginBottom: 'var(--space-8)' }}>
                {isLogin ? t('login_title') : t('register_title')}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-small)', fontWeight: 300 }}>
                {isLogin ? t('login_subtitle') : t('register_subtitle')}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 3D Card Flip / Rotation Container */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ rotateY: -180, opacity: 0, scale: 0.88, filter: 'blur(2px)' }}
            animate={{ rotateY: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ rotateY: 180, opacity: 0, scale: 0.88, filter: 'blur(2px)' }}
            transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
            style={{
              transformStyle: 'preserve-3d',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color-medium)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-32)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {isLogin ? (
              /* LOGIN FORM */
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
                <FloatingInput
                  id="email"
                  label={t('form_email')}
                  type="email"
                  icon={Mail}
                  error={loginForm.formState.errors.email?.message}
                  register={loginForm.register}
                  autoComplete="email"
                />

                <FloatingInput
                  id="password"
                  label={t('form_password')}
                  type={showPw ? 'text' : 'password'}
                  icon={Lock}
                  error={loginForm.formState.errors.password?.message}
                  register={loginForm.register}
                  autoComplete="current-password"
                  showToggle
                  showPw={showPw}
                  onToggleShow={() => setShowPw(!showPw)}
                />

                <button
                  type="submit"
                  disabled={loginForm.formState.isSubmitting}
                  style={{
                    background: 'var(--color-charcoal)', color: 'var(--color-paper-white)', width: '100%', padding: '0.875rem',
                    borderRadius: 'var(--radius-pill)', fontSize: 'var(--font-body)', fontWeight: 500, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', border: 'none', marginTop: 'var(--space-12)'
                  }}
                >
                  {loginForm.formState.isSubmitting ? (
                    <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading...</>
                  ) : (
                    <>{t('form_btn_signin')} <ArrowRight size={16} /></>
                  )}
                </button>

                <div style={{ borderTop: 'var(--border-hairline)', marginTop: 'var(--space-24)', paddingTop: 'var(--space-16)', textAlign: 'center' }}>
                  <p style={{ fontSize: 'var(--font-small)', color: 'var(--text-secondary)', fontWeight: 300 }}>
                    {t('login_dont_have')}{' '}
                    <button type="button" onClick={() => switchMode('register')} style={{ background: 'none', border: 'none', color: 'var(--color-burnt-orange)', fontWeight: 500, cursor: 'pointer', padding: 0 }}>
                      {t('login_create_one')}
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              /* REGISTER FORM */
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
                <FloatingInput
                  id="name"
                  label={t('form_fullname')}
                  type="text"
                  icon={User}
                  error={registerForm.formState.errors.name?.message}
                  register={registerForm.register}
                  autoComplete="name"
                />

                <FloatingInput
                  id="email"
                  label={t('form_email')}
                  type="email"
                  icon={Mail}
                  error={registerForm.formState.errors.email?.message}
                  register={registerForm.register}
                  autoComplete="email"
                />

                <FloatingInput
                  id="password"
                  label={t('form_password')}
                  type={showPw ? 'text' : 'password'}
                  icon={Lock}
                  error={registerForm.formState.errors.password?.message}
                  register={registerForm.register}
                  autoComplete="new-password"
                  showToggle
                  showPw={showPw}
                  onToggleShow={() => setShowPw(!showPw)}
                />

                <FloatingInput
                  id="password_confirmation"
                  label={t('form_confirm_pw')}
                  type={showPw ? 'text' : 'password'}
                  icon={Lock}
                  error={registerForm.formState.errors.password_confirmation?.message}
                  register={registerForm.register}
                  autoComplete="new-password"
                />

                <button
                  type="submit"
                  disabled={registerForm.formState.isSubmitting}
                  style={{
                    background: 'var(--color-charcoal)', color: 'var(--color-paper-white)', width: '100%', padding: '0.875rem',
                    borderRadius: 'var(--radius-pill)', fontSize: 'var(--font-body)', fontWeight: 500, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', border: 'none', marginTop: 'var(--space-16)'
                  }}
                >
                  {registerForm.formState.isSubmitting ? (
                    <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading...</>
                  ) : (
                    <>{t('form_btn_register')} <ArrowRight size={16} /></>
                  )}
                </button>

                <div style={{ borderTop: 'var(--border-hairline)', marginTop: 'var(--space-20)', paddingTop: 'var(--space-16)', textAlign: 'center' }}>
                  <p style={{ fontSize: 'var(--font-small)', color: 'var(--text-secondary)', fontWeight: 300 }}>
                    {t('register_already_have')}{' '}
                    <button type="button" onClick={() => switchMode('login')} style={{ background: 'none', border: 'none', color: 'var(--color-burnt-orange)', fontWeight: 500, cursor: 'pointer', padding: 0 }}>
                      {t('register_signin_link')}
                    </button>
                  </p>
                </div>
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
