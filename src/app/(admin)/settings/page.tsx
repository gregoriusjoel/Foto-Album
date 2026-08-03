'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Lock, Eye, EyeOff, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/store';
import type { User as UserType } from '@/types';

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email'),
    password: z.string().optional().or(z.literal('')),
    password_confirmation: z.string().optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      if (data.password && data.password.length > 0) {
        return data.password.length >= 8;
      }
      return true;
    },
    {
      message: 'Password must be at least 8 characters',
      path: ['password'],
    }
  )
  .refine(
    (data) => {
      if (data.password && data.password.length > 0) {
        return data.password === data.password_confirmation;
      }
      return true;
    },
    {
      message: 'Passwords do not match',
      path: ['password_confirmation'],
    }
  );

type FormData = z.infer<typeof schema>;

export default function SettingsPage() {
  const { user, token, setAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await adminApi.get<{ data: UserType }>('/admin/auth/me');
        const u = res.data.data;
        reset({
          name: u.name,
          email: u.email,
          password: '',
          password_confirmation: '',
        });
      } catch (err) {
        toast.error('Failed to load profile details.');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload: Record<string, string> = {
        name: data.name,
        email: data.email,
      };

      if (data.password) {
        payload.password = data.password;
        payload.password_confirmation = data.password_confirmation || '';
      }

      const res = await adminApi.put<{ data: UserType; message: string }>('/admin/auth/me', payload);
      
      // Update store so layout sidebar updates immediately
      if (token) {
        setAuth(res.data.data, token);
      }
      
      reset({
        name: res.data.data.name,
        email: res.data.data.email,
        password: '',
        password_confirmation: '',
      });
      
      toast.success('Profile updated successfully!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update profile.';
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div className="admin-page" style={{ maxWidth: 800 }}>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.375rem' }}>Account Settings</h1>
      <p style={{ marginBottom: '2rem' }}>Manage your profile information and security password.</p>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* ── Profile Section ── */}
        <section className="card">
          <h2 style={{ fontSize: '1rem', marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>Profile Details</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="profile-name">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{
                  position: 'absolute', left: '0.875rem', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input
                  id="profile-name"
                  type="text"
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Your full name"
                  {...register('name')}
                />
              </div>
              {errors.name && <span className="form-error">{errors.name.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="profile-email">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{
                  position: 'absolute', left: '0.875rem', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input
                  id="profile-email"
                  type="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="you@example.com"
                  {...register('email')}
                />
              </div>
              {errors.email && <span className="form-error">{errors.email.message}</span>}
            </div>
          </div>
        </section>

        {/* ── Password Section ── */}
        <section className="card">
          <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Change Password</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Leave blank if you do not want to change your password.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="profile-password">New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', left: '0.875rem', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input
                  id="profile-password"
                  type={showPw ? 'text' : 'password'}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                  placeholder="Min. 8 characters"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: '0.875rem', top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0,
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="profile-confirm">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', left: '0.875rem', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input
                  id="profile-confirm"
                  type={showPw ? 'text' : 'password'}
                  className={`form-input ${errors.password_confirmation ? 'error' : ''}`}
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Repeat new password"
                  {...register('password_confirmation')}
                />
              </div>
              {errors.password_confirmation && (
                <span className="form-error">{errors.password_confirmation.message}</span>
              )}
            </div>
          </div>
        </section>

        {/* ── Submit Button ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ minWidth: 150 }}
          >
            {isSubmitting ? (
              <><Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving…</>
            ) : (
              <><Save size={16} /> Save Settings</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
