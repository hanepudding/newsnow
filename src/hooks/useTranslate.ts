// Client-side translation cache + batched fetcher. Works in concert
// with the server-side /api/translate passthrough.
//
// Strategy:
// - One module-level Map<cacheKey, string> holds all translations in
//   RAM. cacheKey is `${target}::${text}`.
// - On hook call we check the cache synchronously; if hit, return
//   immediately.
// - On miss we queue the (text, target) pair. Misses are debounced by
//   50 ms so many cards mounting at once → one batched POST to
//   /api/translate with up to 50 items per request.
// - Cache is also persisted to localStorage under `translate-cache`
//   so that reloads are instant (same headline doesn't get
//   re-translated every time the user opens the dashboard).
// - LocalStorage cap: we prune to the most-recent 2000 entries on
//   write to keep the key under ~300 KB.

import { translateTargetAtom } from "./useSettings"

interface TranslateResponse { translations: string[] }

const CACHE_KEY = "translate-cache"
const MAX_ENTRIES = 2000
const BATCH_WINDOW_MS = 50
const BATCH_MAX_SIZE = 50

interface CacheEntry { translation: string, t: number }

let inMemoryCache: Map<string, CacheEntry> | null = null

function cacheKey(target: string, text: string) {
  return `${target}::${text}`
}

function loadCache(): Map<string, CacheEntry> {
  if (inMemoryCache) return inMemoryCache
  const map = new Map<string, CacheEntry>()
  if (typeof localStorage === "undefined") {
    inMemoryCache = map
    return map
  }
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, CacheEntry>
      for (const [k, v] of Object.entries(parsed)) {
        if (v && typeof v.translation === "string") map.set(k, v)
      }
    }
  } catch {}
  inMemoryCache = map
  return map
}

function persistCache(cache: Map<string, CacheEntry>) {
  if (typeof localStorage === "undefined") return
  // Prune by age (drop oldest) if over cap
  if (cache.size > MAX_ENTRIES) {
    const entries = Array.from(cache.entries()).sort((a, b) => b[1].t - a[1].t)
    cache.clear()
    for (const [k, v] of entries.slice(0, MAX_ENTRIES)) cache.set(k, v)
  }
  try {
    const obj: Record<string, CacheEntry> = {}
    for (const [k, v] of cache.entries()) obj[k] = v
    localStorage.setItem(CACHE_KEY, JSON.stringify(obj))
  } catch {
    // Quota exceeded? drop half and retry once.
    try {
      const entries = Array.from(cache.entries()).sort((a, b) => b[1].t - a[1].t)
      cache.clear()
      for (const [k, v] of entries.slice(0, Math.floor(MAX_ENTRIES / 2))) cache.set(k, v)
      const obj: Record<string, CacheEntry> = {}
      for (const [k, v] of cache.entries()) obj[k] = v
      localStorage.setItem(CACHE_KEY, JSON.stringify(obj))
    } catch {}
  }
}

interface QueueItem {
  text: string
  target: string
  resolve: (v: string) => void
}
let queue: QueueItem[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
const pending = new Map<string, Promise<string>>()

async function flush() {
  flushTimer = null
  const batch = queue
  queue = []
  if (batch.length === 0) return

  // Group by target language (each flush can handle multiple languages)
  const byTarget = new Map<string, QueueItem[]>()
  for (const item of batch) {
    const arr = byTarget.get(item.target) ?? []
    arr.push(item)
    byTarget.set(item.target, arr)
  }

  const cache = loadCache()

  await Promise.all(
    Array.from(byTarget.entries()).map(async ([target, items]) => {
      // Dedupe text within the batch
      const uniqueTexts = Array.from(new Set(items.map(i => i.text)))
      // Chunk at BATCH_MAX_SIZE
      const chunks: string[][] = []
      for (let i = 0; i < uniqueTexts.length; i += BATCH_MAX_SIZE) {
        chunks.push(uniqueTexts.slice(i, i + BATCH_MAX_SIZE))
      }
      const resultMap = new Map<string, string>()
      for (const chunk of chunks) {
        try {
          const res = await myFetch("/translate", {
            method: "POST",
            body: { texts: chunk, target },
          }) as TranslateResponse
          if (Array.isArray(res?.translations)) {
            chunk.forEach((text, idx) => {
              const translation = res.translations[idx] ?? ""
              resultMap.set(text, translation)
            })
          }
        } catch {
          // Leave resultMap empty for this chunk; items resolve with ""
        }
      }
      // Resolve items + update cache
      for (const item of items) {
        const translation = resultMap.get(item.text) ?? ""
        if (translation) {
          cache.set(cacheKey(target, item.text), { translation, t: Date.now() })
        }
        item.resolve(translation)
      }
    }),
  )
  persistCache(cache)
}

function scheduleFlush() {
  if (flushTimer != null) return
  flushTimer = setTimeout(flush, BATCH_WINDOW_MS)
}

async function translate(text: string, target: string): Promise<string> {
  if (!text || target === "off") return ""
  const cache = loadCache()
  const key = cacheKey(target, text)
  const cached = cache.get(key)
  if (cached) return cached.translation
  // In-flight dedupe
  const existing = pending.get(key)
  if (existing) return existing
  const promise = new Promise<string>((resolve) => {
    queue.push({ text, target, resolve })
    scheduleFlush()
  }).finally(() => {
    pending.delete(key)
  })
  pending.set(key, promise)
  return promise
}

// ISO 639-1 base-language comparison. "zh-CN" and "zh-TW" are both "zh"
// for our purposes — if a Chinese source is already zh, it doesn't need
// translation regardless of the user's specific Chinese variant.
function sameLang(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false
  const norm = (s: string) => s.toLowerCase().split(/[-_]/)[0]
  return norm(a) === norm(b)
}

/**
 * Returns the translated version of `text` for the current target
 * language, or the original text if translation is disabled / still
 * loading / failed / source language already matches target.
 * Re-renders when the translation arrives.
 *
 * Pass `sourceId` so the hook can look up the source's declared
 * `lang` field and skip the round trip when it matches. If sourceId
 * is omitted (or the source has no lang), we always translate.
 */
export function useTranslatedTitle(text: string, sourceId?: string): string {
  const target = useAtomValue(translateTargetAtom)
  const [translated, setTranslated] = useState<string>("")

  // Resolve source language synchronously from the sources registry.
  const sourceLang = sourceId ? (sources as Record<string, { lang?: string } | undefined>)[sourceId]?.lang : undefined
  const skip = target === "off" || !text || sameLang(sourceLang, target)

  useEffect(() => {
    if (skip) {
      setTranslated("")
      return
    }
    let cancelled = false
    translate(text, target).then((t) => {
      if (!cancelled) setTranslated(t)
    })
    return () => {
      cancelled = true
    }
  }, [text, target, skip])

  // Falls back to the original if translation empty (off / failed / pending / skipped)
  return translated || text
}

/**
 * Clear the translation cache. Useful for a settings-reset flow.
 */
export function clearTranslationCache() {
  inMemoryCache = null
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(CACHE_KEY)
  }
}
