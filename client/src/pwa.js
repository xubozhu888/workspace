// Service-worker registration.
// registerType is "autoUpdate" (see vite.config.js): when a new version is
// deployed, the new service worker installs, activates immediately
// (skipWaiting + clientsClaim) and the page reloads onto the fresh build — so
// devices never get stuck showing an old cached UI.
import { registerSW } from "virtual:pwa-register";

registerSW({ immediate: true });
