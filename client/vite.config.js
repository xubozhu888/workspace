import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// The app itself is a single self-contained index.html (React + Babel + Tailwind
// via CDN). Vite bundles only /src/pwa.js (service-worker registration) and the
// PWA plugin generates the service worker. In dev, /api is proxied to the
// Express backend on :3001 (used when VITE_API_BASE_URL is not set).
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
    },
  },
  plugins: [
    VitePWA({
      registerType: "prompt", // we show our own "Update available" banner
      injectRegister: false, // we register manually in src/pwa.js
      manifest: false, // we ship our own public/manifest.json
      includeAssets: ["icon-192.png", "icon-512.png", "manifest.json"],
      workbox: {
        // App shell precached on install so reopening is instant.
        globPatterns: ["**/*.{js,css,html,png,svg,ico,json,woff2}"],
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            // All API calls: always go to the network (never serve stale data),
            // falling back to cache only if offline.
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 10,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Local static assets: stale-while-revalidate.
            urlPattern: ({ request }) =>
              ["style", "script", "image", "font"].includes(request.destination),
            handler: "StaleWhileRevalidate",
            options: { cacheName: "asset-cache" },
          },
          {
            // CDN dependencies (React, Babel, Tailwind, emoji fonts) so the
            // shell still loads offline after the first visit.
            urlPattern: ({ url }) =>
              ["unpkg.com", "cdn.tailwindcss.com", "cdn.jsdelivr.net"].includes(url.hostname),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "cdn-cache",
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        // Keep the SW off during `vite dev` so HMR stays clean; it is fully
        // active in the production build (`vite build` / `vite preview`).
        enabled: false,
      },
    }),
  ],
});
