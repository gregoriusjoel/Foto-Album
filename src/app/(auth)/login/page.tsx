'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/store';
import type { AuthResponse } from '@/types';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await adminApi.post<{ data: AuthResponse; message: string }>(
        '/admin/auth/login',
        data
      );
      const { user, token } = res.data.data;
      setAuth(user, token);
      toast.success(`Welcome back, ${user.name}!`);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Login failed. Check your credentials.';
      toast.error(msg);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'var(--bg-page)',
    }}>
      <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 'var(--space-32)' }}>
        {/* Header Block */}
        <div style={{ textAlign: 'center' }}>
          <Link href="/" className="brand-logo-container" style={{ justifyContent: 'center', marginBottom: 'var(--space-12)' }}>
            <img src="/logo-memly.png" alt="Logo" className="brand-logo-img" style={{ width: 36, height: 36 }} />
            <span className="brand-logo-text" style={{ fontSize: '1.65rem' }}>Memly</span>
          </Link>
          <h1 style={{ fontSize: 'var(--font-display-l)', fontFamily: 'var(--font-display)', marginBottom: 'var(--space-8)' }}>
            Sign In
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-small)', fontWeight: 300 }}>
            Relive and manage your shared memory archives.
          </p>
        </div>

        {/* Form Block */}
        <div style={{
          background: 'var(--bg-surface)',
          border: 'var(--border-hairline)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-32)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
              <label htmlFor="login-email" style={{ fontSize: 'var(--font-caption)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  id="login-email"
                  type="email"
                  className={errors.email ? 'error' : ''}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: 'var(--border-strong)',
                    padding: '0.625rem 0.5rem 0.625rem 1.5rem',
                    fontSize: 'var(--font-body)',
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'border var(--dur-hover) var(--ease-glide)'
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register('email')}
                />
              </div>
              {errors.email && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-caption)', color: 'var(--color-burnt-orange)', marginTop: '0.25rem', display: 'block' }}>{errors.email.message}</span>}
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
              <label htmlFor="login-password" style={{ fontSize: 'var(--font-caption)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  className={errors.password ? 'error' : ''}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: 'var(--border-strong)',
                    padding: '0.625rem 2.25rem 0.625rem 1.5rem',
                    fontSize: 'var(--font-body)',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'border var(--dur-hover) var(--ease-glide)'
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: 0, top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0,
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-caption)', color: 'var(--color-burnt-orange)', marginTop: '0.25rem', display: 'block' }}>{errors.password.message}</span>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                background: 'var(--color-charcoal)',
                color: 'var(--color-paper-white)',
                width: '100%',
                padding: '0.875rem',
                borderRadius: 'var(--radius-pill)',
                fontSize: 'var(--font-body)',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                border: 'none',
                marginTop: 'var(--space-8)',
                transition: 'opacity var(--dur-hover) var(--ease-glide)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              {isSubmitting ? (
                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Signing in...</>
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div style={{ borderTop: 'var(--border-hairline)', marginTop: 'var(--space-24)', paddingTop: 'var(--space-16)', textAlign: 'center' }}>
            <p style={{ fontSize: 'var(--font-small)', color: 'var(--text-secondary)', fontWeight: 300 }}>
              Don't have an account?{' '}
              <Link href="/register" style={{ color: 'var(--color-burnt-orange)', fontWeight: 500 }}>
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
