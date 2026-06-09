// Service-worker registration + "Update available" banner.
// This is the only ES module Vite bundles; the rest of the app is the inline
// React/Babel script in index.html. Decoupling the PWA wiring here keeps that
// app untouched while still using vite-plugin-pwa's generated service worker.
import { registerSW } from "virtual:pwa-register";

let updateSW = null;

function showUpdateBanner() {
  if (document.getElementById("pwa-update-banner")) return;

  const bar = document.createElement("div");
  bar.id = "pwa-update-banner";
  bar.style.cssText =
    "position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:9999;" +
    "display:flex;align-items:center;gap:12px;background:#166534;color:#fff;" +
    "padding:10px 14px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.25);" +
    "font:600 14px/1.2 ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;" +
    "max-width:92vw;";

  const text = document.createElement("span");
  text.textContent = "A new version is available.";
  text.style.fontWeight = "500";

  const btn = document.createElement("button");
  btn.textContent = "Refresh to update";
  btn.style.cssText =
    "background:#fff;color:#166534;border:0;border-radius:8px;padding:7px 12px;" +
    "font-weight:700;cursor:pointer;white-space:nowrap;";
  // updateSW(true) tells the waiting SW to skipWaiting, then reloads the page.
  btn.onclick = () => updateSW && updateSW(true);

  bar.appendChild(text);
  bar.appendChild(btn);
  document.body.appendChild(bar);
}

// registerType is 'prompt' (see vite.config.js): a new SW installs and waits,
// and onNeedRefresh fires so we can prompt the user instead of auto-reloading.
updateSW = registerSW({
  onNeedRefresh() {
    showUpdateBanner();
  },
  onOfflineReady() {
    console.log("[pwa] App ready to work offline.");
  },
});
