// ── API Types ──────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message: string;
  data: T;
}

export interface PaginatedData<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

// ── Event Types ────────────────────────────────────────────────
export type EventStatus = 'draft' | 'published' | 'closed' | 'archived';
export type EventCategory =
  | 'wedding'
  | 'birthday'
  | 'corporate'
  | 'graduation'
  | 'baby_shower'
  | 'anniversary'
  | 'conference'
  | 'party'
  | 'other';

export interface Event {
  id: string; // UUID exposed as "id"
  title: string;
  slug: string;
  description?: string | null;
  category: EventCategory;
  thumbnail_url?: string | null;
  banner_photos?: string[] | null;
  event_date: string;
  start_time: string;
  end_time?: string | null;
  timezone: string;
  venue?: string | null;
  maps_url?: string | null;
  allow_upload: boolean;
  allow_gallery: boolean;
  allow_download: boolean;
  allow_likes: boolean;
  allow_comments: boolean;
  guest_download: boolean;
  total_photos: number;
  total_participants: number;
  status: EventStatus;
  visibility: 'public' | 'private';
  requires_password: boolean;
  has_started: boolean;
  // Admin-only fields
  join_code?: string;
  join_url?: string;
  qr_url?: string;
  published_at?: string | null;
  closed_at?: string | null;
  storage_used_mb?: number;
  storage_limit_mb?: number;
  max_photos?: number | null;
}

// ── Photo Types ────────────────────────────────────────────────
export type PhotoStatus = 'processing' | 'ready' | 'failed';

export interface Photo {
  id: string;
  event_id: string;
  participant?: Participant;
  original_url: string;
  thumbnail_url: string;
  optimized_url: string;
  width: number;
  height: number;
  size_bytes: number;
  status: PhotoStatus;
  is_featured: boolean;
  is_hidden: boolean;
  like_count: number;
  liked: boolean;
  photographer: string;
  uploaded_at: string;
}

// ── Participant Types ──────────────────────────────────────────
export interface Participant {
  id: string;
  name: string;
  photos_count?: number;
  joined_at?: string;
}

// ── Auth Types ─────────────────────────────────────────────────
export type UserRole = 'super_admin' | 'organizer';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string | null;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ── Admin Dashboard Types ──────────────────────────────────────
export interface DashboardStats {
  total_events: number;
  published_events: number;
  total_photos: number;
  total_participants: number;
  storage_used_mb: number;
  recent_events: Event[];
}

// ── Download Job ───────────────────────────────────────────────
export interface DownloadJob {
  job_id: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  download_url?: string;
  expires_at?: string;
  progress?: number;
}

// ── Form Types ─────────────────────────────────────────────────
export interface CreateEventForm {
  title: string;
  category: EventCategory;
  description?: string;
  event_date: string;
  start_time: string;
  end_time?: string;
  timezone: string;
  venue?: string;
  maps_url?: string;
  password?: string;
  allow_upload: boolean;
  allow_gallery: boolean;
  allow_download: boolean;
  allow_likes: boolean;
  allow_comments: boolean;
  guest_download: boolean;
  max_photos?: number;
  storage_limit_mb?: number;
}

export interface JoinEventForm {
  name: string;
  join_code?: string;
}
