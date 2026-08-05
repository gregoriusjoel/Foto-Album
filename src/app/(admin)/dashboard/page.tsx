'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Camera, Users, Image, HardDrive, TrendingUp, ArrowRight, Calendar, Sparkles } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/store';
import { formatDate, getEventStatusBadge, formatMb, getCategoryLabel } from '@/lib/utils';
import type { DashboardStats, Event } from '@/types';
import { useI18n } from '@/lib/i18n';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { t } = useI18n();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, eventsRes] = await Promise.all([
          adminApi.get<{ data: DashboardStats }>('/admin/dashboard/statistics'),
          adminApi.get<{ data: Event[] }>('/admin/events?per_page=5'),
        ]);
        setStats(statsRes.data.data);
        setEvents(Array.isArray(eventsRes.data.data) ? eventsRes.data.data : []);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const statCards = [
    { label: t('admin_total_events'),    value: stats?.total_events ?? 0,        icon: Calendar, color: 'var(--color-burnt-orange)' },
    { label: t('admin_total_photos'),    value: stats?.total_photos ?? 0,         icon: Image,    color: 'var(--color-vintage-mustard)' },
    { label: t('admin_total_contributors'), value: stats?.total_participants ?? 0,    icon: Users,    color: 'var(--color-olive-sage)' },
    { label: 'Storage Used',    value: formatMb(stats?.storage_used_mb ?? 0), icon: HardDrive, color: 'var(--color-vintage-brown)', isString: true },
  ];

  return (
    <div className="admin-page" style={{ maxWidth: 1400, padding: 'var(--space-32) var(--space-24)' }}>
      {/* Header */}
      <div className="dash-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-32)', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="dash-greeting" style={{ fontSize: 'var(--font-display-l)', fontFamily: 'var(--font-display)', marginBottom: '0.25rem', wordBreak: 'break-word' }}>
            {t('admin_welcome')},{' '}
            <span style={{ fontStyle: 'italic', color: 'var(--color-burnt-orange)' }}>{user?.name}</span>
          </h1>
          <p style={{ fontSize: 'var(--font-small)', color: 'var(--text-secondary)', fontWeight: 300 }}>{t('admin_sub_overview')}</p>
        </div>
        <Link href="/events/new" className="btn btn-primary" style={{ borderRadius: 'var(--radius-pill)', padding: '0.625rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <Plus size={16} /> {t('admin_new_event')}
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="admin-stat-grid" style={{ marginBottom: 'var(--space-32)' }}>
        {statCards.map((s, i) => (
          <div key={i} className="card stat-card" style={{
            display: 'flex', alignItems: 'center', gap: '1rem', padding: 'var(--space-24)',
            background: 'var(--bg-card)', border: '1px solid var(--border-color-medium)', borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)', overflow: 'hidden'
          }}>
            <div className="stat-card-icon" style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              background: 'var(--bg-page)',
              border: 'var(--border-hairline)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: s.color,
            }}>
              <s.icon size={18} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="stat-card-label" style={{ fontSize: 'var(--font-caption)', color: 'var(--text-muted)', marginBottom: 'var(--space-4)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.label}
              </div>
              <div className="stat-card-value" style={{ fontSize: 'var(--font-display-m)', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', lineHeight: 1 }}>
                {loading ? <span className="skeleton" style={{ width: 60, height: 24, display: 'block' }} /> : s.isString ? s.value : s.value.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>


      {/* Recent Events */}
      <div className="card" style={{
        padding: 0, background: 'var(--bg-card)', border: '1px solid var(--border-color-medium)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden'
      }}>
        <div style={{
          padding: 'var(--space-16) var(--space-24)',
          borderBottom: 'var(--border-hairline)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ fontSize: 'var(--font-heading-s)', fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--text-primary)' }}>{t('admin_recent_events')}</h2>
          <Link href="/events" className="btn btn-ghost btn-sm" style={{ fontSize: 'var(--font-caption)' }}>
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1,2,3].map(i => (
              <div key={i} className="skeleton" style={{ height: 60, borderRadius: 10 }} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <Camera size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
            <p>No events yet. <Link href="/events/new" style={{ color: 'var(--color-burnt-orange)' }}>Create your first event</Link></p>
          </div>
        ) : (
          <div>
            {events.map((event, i) => {
              const { label, className } = getEventStatusBadge(event.status, event.has_started);
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1rem 1.5rem',
                    borderBottom: i < events.length - 1 ? 'var(--border-hairline)' : 'none',
                    textDecoration: 'none',
                    transition: 'background var(--dur-hover) var(--ease-glide)',
                    color: 'inherit',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                    background: 'var(--bg-surface)',
                    border: 'var(--border-hairline)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-primary)',
                  }}>
                    <Camera size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {event.title}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                      {formatDate(event.event_date)} · {event.total_photos} photos · {event.total_participants} guests
                    </div>
                  </div>
                  <span className={`badge ${className}`}>{label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}
