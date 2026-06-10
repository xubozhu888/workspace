import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// The app is compiled by Vite: React is bundled, JSX is precompiled (no
// in-browser Babel), and Tailwind is built to a CSS file — so the app loads
// from our own domain with no third-party CDN dependency (important for
// reliable loading in regions where CDNs like unpkg are slow/blocked).
// In dev, /api is proxied to the Express backend on :3001.
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
    },
  },
  plugins: [
    react(),
    VitePWA({
      // Auto-update: a new deploy installs, activates immediately and reloads,
      // so devices never get stuck on an old cached UI (no "tap to refresh").
      registerType: "autoUpdate",
      injectRegister: false, // we register manually in src/pwa.js
      manifest: false, // we ship our own public/manifest.json
      includeAssets: ["icon-192.png", "icon-512.png", "manifest.json"],
      workbox: {
        // App shell precached on install so reopening is instant.
        globPatterns: ["**/*.{js,css,html,png,svg,ico,json,woff2}"],
        navigateFallback: "/index.html",
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
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
            // Static assets: stale-while-revalidate.
            urlPattern: ({ request }) =>
              ["style", "script", "image", "font"].includes(request.destination),
            handler: "StaleWhileRevalidate",
            options: { cacheName: "asset-cache" },
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
