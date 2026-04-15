import process from "node:process"
import type { VitePWAOptions } from "vite-plugin-pwa"
import { VitePWA } from "vite-plugin-pwa"

const pwaOption: Partial<VitePWAOptions> = {
  // Auto-update the service worker when a new build lands on the server.
  // Without this, the default `prompt` mode waits for user confirmation
  // and the old bundle keeps serving — the symptom was "需要清浏览器数据
  // 才能看到新版". With `autoUpdate` + skipWaiting + clientsClaim, the
  // new SW installs, immediately claims open clients, and on the next
  // navigation (or hook-triggered reload) users see the new bundle.
  registerType: "autoUpdate",
  includeAssets: ["icon.svg", "apple-touch-icon.png"],
  filename: "swx.js",
  manifest: {
    name: "NewsNow",
    short_name: "NewsNow",
    description: "Elegant reading of real-time and hottest news",
    theme_color: "#F14D42",
    icons: [
      {
        src: "pwa-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  },
  workbox: {
    navigateFallbackDenylist: [/^\/api/],
    // Take over immediately when a new SW registers. Pairs with
    // registerType: "autoUpdate" to give silent updates.
    skipWaiting: true,
    clientsClaim: true,
    // Force the new SW to re-fetch every precached asset on activation,
    // so stale entries from an old build can't leak into a new one.
    cleanupOutdatedCaches: true,
  },
  devOptions: {
    enabled: process.env.SW_DEV === "true",
    type: "module",
    navigateFallback: "index.html",
  },
}

export default function pwa() {
  return VitePWA(pwaOption)
}
