'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Camera, LayoutDashboard, Calendar, Settings, LogOut, ChevronRight, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { getInitials } from '@/lib/utils';

const navLinks = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/events',    icon: Calendar,        label: 'Events' },
  { href: '/settings',  icon: Settings,         label: 'Settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const handleLogout = async () => {
    try {
      await adminApi.post('/admin/auth/logout');
    } catch {}
    clearAuth();
    toast.success('Logged out.');
    router.push('/login');
  };

  const Sidebar = () => (
    <aside style={{
      width: 240,
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '1.25rem 1.25rem 1rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-satu-album.png" alt="Logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.0625rem', color: 'var(--text-primary)' }}>
            FotoAlbum
          </span>
        </Link>
        <button
          className="btn btn-ghost btn-sm hide-desktop"
          onClick={() => setSidebarOpen(false)}
          style={{ padding: '0.25rem' }}
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem 0.75rem' }}>
        {navLinks.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '0.125rem',
                textDecoration: 'none',
                fontWeight: active ? 600 : 400,
                fontSize: '0.9rem',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: active ? 'rgba(255,255,255,0.05)' : 'transparent',
                border: '1px solid ' + (active ? 'rgba(255,255,255,0.15)' : 'transparent'),
                transition: 'all 0.15s',
              }}
            >
              <Icon size={17} style={{ color: active ? '#ffffff' : 'inherit' }} />
              {label}
              {active && <ChevronRight size={14} style={{ marginLeft: 'auto', color: '#ffffff' }} />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div style={{
        padding: '0.875rem 1rem',
        borderTop: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--text-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.8125rem', fontWeight: 800, color: 'var(--bg-page)', flexShrink: 0,
        }}>
          {getInitials(user?.name ?? 'U')}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.role}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-ghost btn-sm"
          style={{ padding: '0.375rem', color: 'var(--text-muted)' }}
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>
      {/* Desktop sidebar */}
      <div className="hide-mobile" style={{ display: 'flex', height: '100%' }}>
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="modal-overlay"
          style={{ justifyContent: 'flex-start', alignItems: 'stretch' }}
          onClick={() => setSidebarOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: 260, height: '100%' }}>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Mobile header */}
        <header className="hide-desktop" style={{
          height: 56, borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-surface)',
          display: 'flex', alignItems: 'center',
          padding: '0 1rem', gap: '0.75rem',
        }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setSidebarOpen(true)}
            style={{ padding: '0.375rem' }}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
            FotoAlbum
          </span>
        </header>

        <main style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
