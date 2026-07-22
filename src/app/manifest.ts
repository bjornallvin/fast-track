import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fast Track',
    short_name: 'Fast Track',
    description: 'A quiet fasting tracker — real-time timer, wellbeing check-ins, and group fasts.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    // Android link capturing: open in-scope links in the already-running app
    // window instead of spawning browser tabs. (iOS ignores this — Mail links
    // always open in the browser there; the home page has a paste-a-link
    // opener as the bridge.)
    launch_handler: { client_mode: 'navigate-existing' },
    background_color: '#f4ede0',
    theme_color: '#f4ede0',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
