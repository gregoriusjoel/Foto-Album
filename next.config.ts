import type { NextConfig } from "next";
import fs from 'fs';
import path from 'path';

// Dynamically extract the latest tunnel host from backend/.env to resolve HMR blocking
let backendTunnelHost = '';
try {
  const backendEnvPath = path.resolve(process.cwd(), '../backend/.env');
  if (fs.existsSync(backendEnvPath)) {
    const envContent = fs.readFileSync(backendEnvPath, 'utf8');
    const match = envContent.match(/FRONTEND_URL=(.+)/);
    if (match && match[1]) {
      // Strip protocol and ports to get only the hostname
      backendTunnelHost = match[1].trim().replace(/^https?:\/\//, '').split(':')[0];
    }
  }
} catch (e) {
  console.warn("Could not read backend .env for allowedDevOrigins:", e);
}

const origins = ['192.168.1.7', 'localhost', '127.0.0.1', '*.loca.lt', 'loca.lt', '*.localtunnel.me', 'localtunnel.me', '*.pinggy.net', '*.pinggy-free.link'];
if (backendTunnelHost) {
  origins.push(backendTunnelHost);
}

const nextConfig: NextConfig = {
  allowedDevOrigins: origins,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '*.cloudflare.com' },
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'http',  hostname: '127.0.0.1' },
    ],
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl.replace(/\/$/, '')}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/(admin)/login', // handled by app router groups
        permanent: false,
      },
    ].filter(() => false); // placeholder — App Router groups handle routing
  },
};

export default nextConfig;
