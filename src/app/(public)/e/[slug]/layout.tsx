import type { Metadata } from 'next';
import { headers } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

interface EventOgData {
  title: string;
  description?: string | null;
  venue?: string | null;
  event_date?: string;
  category?: string;
  banner_photos?: string[] | null;
  thumbnail_url?: string | null;
  join_url?: string | null;
}

async function fetchEventOg(slug: string): Promise<EventOgData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/public/events/${slug}`, {
      next: { revalidate: 300 }, // cache 5 menit
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await fetchEventOg(slug);

  if (!event) {
    return {
      title: 'Event — Memly',
      description: 'Lihat dan bagikan momen bersama di Memly.',
    };
  }

  // Ambil gambar terbaik: banner pertama, fallback ke thumbnail
  const ogImage = event.banner_photos?.[0] ?? event.thumbnail_url ?? null;

  const title = event.title;
  const venue = event.venue ? ` · ${event.venue}` : '';
  const description =
    event.description?.trim() ||
    `Bergabung & kirim foto untuk event "${event.title}"${venue}. Buka Memly sekarang!`;

  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const proto = headersList.get('x-forwarded-proto') || 'https';
  const pageUrl = event.join_url ?? `${proto}://${host}/e/${slug}`;

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      url: pageUrl,
      siteName: 'Memly',
      title: `${title} — Memly`,
      description,
      ...(ogImage
        ? {
            images: [
              {
                url: ogImage,
                width: 1200,
                height: 630,
                alt: title,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: `${title} — Memly`,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
