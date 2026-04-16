// Settings export / import / reset.
//
// What counts as "settings": the localStorage keys that describe how
// the user has customized their dashboard. Auth state (jwt, login,
// user) is intentionally NOT exported or restored — import should
// never carry another user's credentials, and a re-login is trivial.
//
// Shape on disk is a versioned JSON so future format changes can add
// a "migrate" step instead of breaking old exports.

import { sources } from "@shared/sources"
import type { Watchlist } from "@shared/watchlists"
import type { SourceID } from "@shared/types"

const SETTINGS_KEYS = [
  "watchlists",
  "refresh-interval",
  "sort-by-time",
  "terminal-columns",
  // Legacy keys kept in the allowlist so old exports still import cleanly;
  // they're ignored on read once terminal-columns is present.
  "terminal-left-source-column",
  "terminal-right-source-column",
  "translate-target",
] as const

// Translation cache lives under a separate key — we clean it on reset
// but don't export/import it (it's derived, not user-configured).
const TRANSLATE_CACHE_KEY = "translate-cache"

// Auth / non-user-preference keys that we never touch during import or
// reset. Anything else in localStorage is considered user-owned.
const AUTH_KEYS = new Set(["jwt", "user", "login"])

export interface ExportedSettings {
  version: 1
  exportedAt: string
  data: Record<string, unknown>
}

function isSettingsKey(k: string): boolean {
  return (SETTINGS_KEYS as readonly string[]).includes(k)
}

/**
 * Collect all setting keys from localStorage into a plain object. Each
 * value is parsed as JSON where possible (since atomWithStorage stores
 * JSON for everything), otherwise kept as the raw string.
 */
export function readSettingsFromLocalStorage(): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  for (const k of SETTINGS_KEYS) {
    const raw = localStorage.getItem(k)
    if (raw == null) continue
    try {
      data[k] = JSON.parse(raw)
    } catch {
      data[k] = raw
    }
  }
  return data
}

/**
 * Build the JSON payload for an export. Called by the Menu's
 * "Export settings" button.
 */
export function buildExportPayload(): ExportedSettings {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: readSettingsFromLocalStorage(),
  }
}

/**
 * Trigger a browser download for the given payload.
 */
export function downloadSettings(payload: ExportedSettings): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `newsnow-settings-${payload.exportedAt.slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Revoke on next tick so Safari/Firefox have time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

/**
 * Validate and apply an imported settings payload to localStorage.
 * Throws on structural errors. Silently drops unknown source IDs
 * inside watchlists so an export from an older version of the fork
 * still imports cleanly.
 */
export function applyImportedSettings(raw: unknown): {
  imported: string[]
  skipped: string[]
  droppedSources: number
} {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid file: expected a JSON object")
  }
  const payload = raw as Partial<ExportedSettings>
  if (payload.version !== 1) {
    throw new Error(`Unsupported settings version: ${payload.version}`)
  }
  if (!payload.data || typeof payload.data !== "object") {
    throw new Error("Invalid file: missing data field")
  }

  const imported: string[] = []
  const skipped: string[] = []
  let droppedSources = 0

  for (const [key, value] of Object.entries(payload.data)) {
    if (!isSettingsKey(key)) {
      skipped.push(key)
      continue
    }

    // Special handling for watchlists: filter out source IDs that no
    // longer exist in the current registry so a stale export doesn't
    // inject broken ids.
    if (key === "watchlists") {
      if (!Array.isArray(value)) {
        skipped.push(key)
        continue
      }
      const cleaned: Watchlist[] = []
      for (const w of value) {
        if (!w || typeof w !== "object") continue
        const watchlist = w as Partial<Watchlist>
        if (typeof watchlist.id !== "string" || typeof watchlist.name !== "string") continue
        const sourceList = Array.isArray(watchlist.sources) ? watchlist.sources : []
        const validSources = (sourceList as string[]).filter((id): id is SourceID => {
          const ok = typeof id === "string" && sources[id as SourceID] != null && !sources[id as SourceID].redirect
          if (!ok) droppedSources++
          return ok
        })
        cleaned.push({ id: watchlist.id, name: watchlist.name, sources: validSources })
      }
      localStorage.setItem(key, JSON.stringify(cleaned))
      imported.push(key)
      continue
    }

    localStorage.setItem(key, JSON.stringify(value))
    imported.push(key)
  }

  return { imported, skipped, droppedSources }
}

/**
 * Nuclear reset: wipe ALL browser state for this site.
 *
 * Goes beyond just clearing localStorage — also unregisters every
 * service worker and purges every Cache API entry. This is the
 * equivalent of the user manually going into DevTools → Application
 * → "Clear site data". Ensures:
 *   - Settings return to defaults (localStorage gone)
 *   - Old JS/CSS bundles are purged (Cache API gone)
 *   - The PWA service worker re-downloads fresh on next load (SW gone)
 *   - Any version-update problems are resolved (stale SW was the
 *     root cause of "need to clear browser data after deploy")
 *
 * Call window.location.reload() after this returns.
 */
export async function resetAllData(): Promise<void> {
  // 1. localStorage — wipe everything (not just our keys)
  localStorage.clear()

  // 2. Service workers — unregister all
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map(r => r.unregister()))
  }

  // 3. Cache API — delete every cache store
  if ("caches" in window) {
    const keys = await caches.keys()
    await Promise.all(keys.map(k => caches.delete(k)))
  }
}

/**
 * Open a file picker and return the parsed JSON content (or null if
 * the user cancelled).
 */
export async function pickSettingsFile(): Promise<unknown | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "application/json,.json"
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result))
          resolve(parsed)
        } catch (e) {
          resolve(Promise.reject(e))
        }
      }
      reader.onerror = () => resolve(Promise.reject(reader.error))
      reader.readAsText(file)
    }
    input.click()
  })
}
