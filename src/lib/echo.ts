import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<any> | null;
  }
}

let echoInstance: Echo<any> | null = null;

export function getEcho(): Echo<any> | null {
  if (typeof window === 'undefined') return null;

  if (echoInstance) return echoInstance;

  window.Pusher = Pusher;

  const key = process.env.NEXT_PUBLIC_REVERB_APP_KEY || 'fotoalbum-key';
  const host = process.env.NEXT_PUBLIC_REVERB_HOST || (window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname);
  const port = process.env.NEXT_PUBLIC_REVERB_PORT
    ? Number(process.env.NEXT_PUBLIC_REVERB_PORT)
    : (window.location.protocol === 'https:' ? 443 : 8080);
  const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME || (window.location.protocol === 'https:' ? 'https' : 'http');
  const forceTLS = scheme === 'https';

  try {
    echoInstance = new Echo({
      broadcaster: 'reverb',
      key: key,
      wsHost: host,
      wsPort: port,
      wssPort: port,
      forceTLS: forceTLS,
      enabledTransports: ['ws', 'wss'],
    });

    window.Echo = echoInstance;
    return echoInstance;
  } catch (error) {
    console.error('Failed to initialize Laravel Echo:', error);
    return null;
  }
}
