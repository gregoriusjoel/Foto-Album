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
  { href: '/events', icon: Calendar, label: 'Events' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarClosing, setSidebarClosing] = useState(false);

  const openSidebar = () => {
    setSidebarClosing(false);
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarClosing(true);
    // unmount after animation (250ms + small buffer)
    setTimeout(() => {
      setSidebarOpen(false);
      setSidebarClosing(false);
    }, 270);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const handleLogout = async () => {
    try {
      await adminApi.post('/admin/auth/logout');
    } catch { }
    clearAuth();
    toast.success('Logged out.');
    router.push('/login');
  };

  const Sidebar = () => (
    <aside style={{
      width: '100%',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '1.25rem 1.25rem 1rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/dashboard" className="brand-logo-container">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-memly.png" alt="Logo" className="brand-logo-img" style={{ width: 28, height: 28 }} />
          <span className="brand-logo-text" style={{ fontSize: '1.2rem' }}>Memly</span>
        </Link>
        <button
          className="btn btn-ghost btn-sm hide-desktop"
          onClick={closeSidebar}
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
            onClick={closeSidebar}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '0.125rem',
                textDecoration: 'none',
                fontWeight: active ? 600 : 400,
                fontSize: '0.9rem',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: active ? 'var(--bg-page)' : 'transparent',
                border: active ? 'var(--border-hairline)' : '1px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={17} style={{ color: active ? 'var(--color-burnt-orange)' : 'inherit' }} />
              {label}
              {active && <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--color-burnt-orange)' }} />}
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
      <div className="hide-mobile" style={{ display: 'flex', height: '100%', width: 240, flexShrink: 0 }}>
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          {/* Dark backdrop */}
          <div
            onClick={closeSidebar}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.55)',
              zIndex: 1000,
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              animation: sidebarClosing
                ? 'fadeOut 0.25s ease forwards'
                : 'fadeIn 0.25s ease forwards',
            }}
          />
          {/* Drawer panel */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: 272,
              zIndex: 1001,
              animation: sidebarClosing
                ? 'slideOutLeft 0.25s cubic-bezier(0.55, 0, 0.75, 0.06) forwards'
                : 'slideInLeft 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
              boxShadow: '4px 0 24px rgba(0,0,0,0.18)',
            }}
          >
            <Sidebar />
          </div>
        </>
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
            onClick={openSidebar}
            style={{ padding: '0.375rem' }}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
            Memly
          </span>
        </header>

        <main style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
