import { MetadataRoute } from 'next';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://memly.online';

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  try {
    const res = await fetch(`${API_BASE}/api/v1/public/events`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      const events = Array.isArray(json?.data) ? json.data : [];
      events.forEach((evt: { slug: string; updated_at?: string }) => {
        routes.push({
          url: `${baseUrl}/e/${evt.slug}`,
          lastModified: evt.updated_at ? new Date(evt.updated_at) : new Date(),
          changeFrequency: 'hourly',
          priority: 0.8,
        });
      });
    }
  } catch {
    // Fallback to static routes
  }

  return routes;
}
