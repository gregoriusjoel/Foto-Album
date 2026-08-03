import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Event Preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

interface EventOg {
  title: string;
  description?: string | null;
  venue?: string | null;
  banner_photos?: string[] | null;
  thumbnail_url?: string | null;
}

/** Fetch an image from any URL and return a base64 data-URI */
async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const mime = res.headers.get('content-type') ?? 'image/webp';
    const b64  = Buffer.from(buf).toString('base64');
    return `data:${mime};base64,${b64}`;
  } catch {
    return null;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let event: EventOg | null = null;
  try {
    const res = await fetch(`${API_BASE}/api/v1/public/events/${slug}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const json = await res.json();
      event = json?.data ?? null;
    }
  } catch {
    // silently fail — use fallback
  }

  const rawBannerUrl = event?.banner_photos?.[0] ?? event?.thumbnail_url ?? null;
  const bannerSrc    = rawBannerUrl ? await fetchImageAsDataUrl(rawBannerUrl) : null;
  const title        = event?.title ?? 'Memly';
  const venue        = event?.venue ?? null;


  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          backgroundColor: '#0a0a0f',
          overflow: 'hidden',
        }}
      >
        {/* ── Banner photo ── */}
        {bannerSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bannerSrc}
            alt={title}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        ) : (
          /* Fallback gradient background */
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
              display: 'flex',
            }}
          />
        )}

        {/* ── Gradient overlay (bottom fade) ── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.08) 100%)',
            display: 'flex',
          }}
        />

        {/* ── Domain pill (top-center) ── */}
        <div
          style={{
            position: 'absolute',
            top: 36,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255,255,255,0.88)',
              borderRadius: 999,
              padding: '10px 28px',
              fontSize: 24,
              color: '#111',
              fontFamily: 'sans-serif',
              fontWeight: 500,
              letterSpacing: '-0.3px',
            }}
          >
            memly.id
          </div>
        </div>

        {/* ── Title & venue (bottom) ── */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '0 80px 60px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: title.length > 30 ? 56 : 68,
              fontWeight: 700,
              color: '#ffffff',
              fontFamily: 'sans-serif',
              textAlign: 'center',
              lineHeight: 1.15,
              letterSpacing: '-1px',
              textShadow: '0 2px 20px rgba(0,0,0,0.6)',
            }}
          >
            {title}
          </div>

          {venue && (
            <div
              style={{
                fontSize: 28,
                color: 'rgba(255,255,255,0.7)',
                fontFamily: 'sans-serif',
                fontWeight: 400,
                letterSpacing: '0.3px',
              }}
            >
              📍 {venue}
            </div>
          )}
        </div>

        {/* ── Memly logo watermark (bottom-right) ── */}
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            right: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 20,
              color: 'rgba(255,255,255,0.45)',
              fontFamily: 'sans-serif',
              fontWeight: 500,
              letterSpacing: '0.5px',
            }}
          >
            Memly
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
