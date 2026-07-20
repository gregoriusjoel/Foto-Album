'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Camera, Users, Image, Filter,
  MoreVertical, Globe, Lock, Archive, XCircle, CheckCircle,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { formatDate, getEventStatusBadge, getCategoryLabel } from '@/lib/utils';
import type { Event, EventStatus } from '@/types';
import toast from 'react-hot-toast';

const STATUS_TABS: { value: EventStatus | 'all'; label: string }[] = [
  { value: 'all',       label: 'All' },
  { value: 'draft',     label: 'Drafts' },
  { value: 'published', label: 'Live' },
  { value: 'closed',    label: 'Closed' },
  { value: 'archived',  label: 'Archived' },
];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all');

  const loadEvents = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;
      const res = await adminApi.get<{ data: Event[] }>('/admin/events', { params });
      setEvents(Array.isArray(res.data.data) ? res.data.data : []);
    } catch {
      toast.error('Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEvents(); }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadEvents(); };

  const changeStatus = async (uuid: string, action: 'publish' | 'close' | 'archive') => {
    try {
      await adminApi.post(`/admin/events/${uuid}/${action}`);
      toast.success(`Event ${action}d.`);
      loadEvents();
    } catch {
      toast.error(`Failed to ${action} event.`);
    }
  };

  const filteredEvents = events;

  return (
    <div className="admin-page" style={{ maxWidth: 1400 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.75rem' }}>Events</h1>
        <Link href="/events/new" className="btn btn-primary">
          <Plus size={16} /> New Event
        </Link>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Status tabs */}
        <div style={{
          display: 'flex', gap: '0.25rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '0.25rem',
        }}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value as EventStatus | 'all')}
              className="btn btn-sm"
              style={{
                background: statusFilter === tab.value ? 'var(--gradient-brand)' : 'transparent',
                color: statusFilter === tab.value ? '#000' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: statusFilter === tab.value ? 700 : 400,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: 200 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{
              position: 'absolute', left: '0.75rem', top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none',
            }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.25rem' }}
              placeholder="Search events…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm">Search</button>
        </form>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 10 }} />)}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <Camera size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
            <h3 style={{ marginBottom: '0.5rem' }}>No events found</h3>
            <p style={{ marginBottom: '1.5rem' }}>Create your first event to get started.</p>
            <Link href="/events/new" className="btn btn-primary">
              <Plus size={16} /> New Event
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Event', 'Date', 'Photos', 'Guests', 'Status', 'Actions'].map((h) => (
                    <th key={h} style={{
                      padding: '0.875rem 1.25rem',
                      textAlign: 'left',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => {
                  const { label, className } = getEventStatusBadge(event.status);
                  return (
                    <tr
                      key={event.id}
                      style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.12s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}
                    >
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)',
                          }}>
                            <Camera size={16} />
                          </div>
                          <div>
                            <Link
                              href={`/events/${event.id}`}
                              style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', textDecoration: 'none' }}
                            >
                              {event.title}
                            </Link>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {getCategoryLabel(event.category)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {formatDate(event.event_date)}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          <Image size={14} /> {event.total_photos.toLocaleString()}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          <Users size={14} /> {event.total_participants.toLocaleString()}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span className={`badge ${className}`}>{label}</span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <Link href={`/events/${event.id}`} className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem' }}>
                            View
                          </Link>
                          {event.status === 'draft' && (
                            <button
                              className="btn btn-sm badge-success"
                              style={{ border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                              onClick={() => changeStatus(event.id, 'publish')}
                            >
                              <CheckCircle size={13} /> Publish
                            </button>
                          )}
                          {event.status === 'published' && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => changeStatus(event.id, 'close')}
                            >
                              <XCircle size={13} /> Close
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
