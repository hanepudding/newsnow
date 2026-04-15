import { useRegisterSW } from "virtual:pwa-register/react"
import { useToast } from "./useToast"

// With pwa.config.ts set to `registerType: "autoUpdate"` + workbox
// skipWaiting/clientsClaim, new service workers install and take over
// immediately when a new build is deployed. This hook ties a fully
// automatic reload to that event: when `needRefresh` fires (SW has a
// new bundle waiting), we show a short grace-toast and then reload so
// the new JS/CSS is running in the open tab. No manual "clear browser
// data" or hard refresh required.
export function usePWA() {
  const toaster = useToast()

  useRegisterSW({
    onNeedRefresh() {
      // Short countdown toast, then reload. 3 s is enough for the user
      // to see what's happening without being disruptive.
      toaster("有新版本，3 秒后自动刷新", { type: "info" })
      setTimeout(() => {
        // Bust any cache-busters and force a full reload. The new SW is
        // already active (skipWaiting) so the next load reads the new
        // index.html and bundle.
        window.location.reload()
      }, 3000)
    },
  })
}
