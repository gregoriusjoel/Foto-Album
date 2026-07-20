'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Camera, Users, Image, HardDrive, TrendingUp, ArrowRight, Calendar, Sparkles } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/store';
import { formatDate, getEventStatusBadge, formatMb, getCategoryLabel } from '@/lib/utils';
import type { DashboardStats, Event } from '@/types';

export default function DashboardPage() {
  const { user } = useAuthStore();
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
    { label: 'Total Events',    value: stats?.total_events ?? 0,        icon: Calendar, color: '#a1a1aa' },
    { label: 'Photos Taken',    value: stats?.total_photos ?? 0,         icon: Image,    color: '#ffffff' },
    { label: 'Participants',    value: stats?.total_participants ?? 0,    icon: Users,    color: '#d1d1d6' },
    { label: 'Storage Used',    value: formatMb(stats?.storage_used_mb ?? 0), icon: HardDrive, color: '#e4e4e7', isString: true },
  ];

  return (
    <div className="admin-page" style={{ maxWidth: 1400 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
            Good {getGreeting()},{' '}
            <span className="gradient-text">{user?.name?.split(' ')[0]}</span> <Sparkles size={20} style={{ display: 'inline', verticalAlign: 'middle', color: 'var(--text-secondary)' }} />
          </h1>
          <p style={{ fontSize: '0.9375rem' }}>Here&apos;s what&apos;s happening with your events.</p>
        </div>
        <Link href="/events/new" className="btn btn-primary">
          <Plus size={16} /> New Event
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="admin-stat-grid" style={{ marginBottom: '2rem' }}>
        {statCards.map((s, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, flexShrink: 0,
              background: `${s.color}1a`,
              border: `1px solid ${s.color}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: s.color,
            }}>
              <s.icon size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.125rem', fontWeight: 500 }}>
                {s.label}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', lineHeight: 1 }}>
                {loading ? <span className="skeleton" style={{ width: 60, height: 24, display: 'block' }} /> : s.isString ? s.value : s.value.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Events */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ fontSize: '1.0625rem' }}>Recent Events</h2>
          <Link href="/events" className="btn btn-ghost btn-sm" style={{ fontSize: '0.8125rem' }}>
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
            <p>No events yet. <Link href="/events/new" style={{ color: 'var(--color-brand-400)' }}>Create your first event</Link></p>
          </div>
        ) : (
          <div>
            {events.map((event, i) => {
              const { label, className } = getEventStatusBadge(event.status);
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1rem 1.5rem',
                    borderBottom: i < events.length - 1 ? '1px solid var(--border-color)' : 'none',
                    textDecoration: 'none',
                    transition: 'background 0.15s',
                    color: 'inherit',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-color-medium)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff',
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
