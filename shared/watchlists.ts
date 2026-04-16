// User-defined watchlists — the replacement for the old fixed focus/
// finance-bro/trending columns. Every visible tab in the navbar (other
// than Terminal) is now a watchlist, fully editable: rename, reorder,
// add/remove sources, delete, create new ones.
//
// Constraints:
// - Max 10 watchlists total (navbar would overflow otherwise)
// - IDs are stable strings used in URLs (/c/<id>) and in the persisted
//   storage. User-editable `name` is separate from `id`.
// - Source IDs inside a watchlist must be validated against the current
//   `sources` registry on read — deleted sources are silently dropped.

import type { SourceID } from "./types"

export const MAX_WATCHLISTS = 10

export interface Watchlist {
  /** Stable identifier, used in URL and storage. Slug-ish. */
  id: string
  /** Display name, shown in nav tabs and modals. Editable by user. */
  name: string
  /** Ordered source list. */
  sources: SourceID[]
}

// ---------------------------------------------------------------------------
// Default source lists — all hardcoded, no filter/derive magic.
// ---------------------------------------------------------------------------

// "Press" — the primary English-language finance press ticker.
const PRESS_SOURCES: SourceID[] = [
  "forexlive-news",
  "wsj-markets",
  "bloomberg-markets",
  "ft-markets",
  "reuters-business",
  "cnbc-top",
  "wsj-world",
  "ft-world",
  "bloomberg-politics",
  "reuters-world",
  "cnbc-world",
  "zerohedge",
  "axios",
]

// "CN Flash" — Chinese-language finance flash sources.
const CN_FLASH_SOURCES: SourceID[] = [
  "jin10",
  "wallstreetcn-news",
  "cls-telegraph",
]

// "Trending" — ranking / most-read lists.
const TRENDING_SOURCES: SourceID[] = [
  "wallstreetcn-hot",
  "cls-hot",
]

// "Clash News" — conflict monitoring / OSINT.
const CLASH_NEWS_SOURCES: SourceID[] = [
  "clashreport",
  "trumpstruth",
]

// ---------------------------------------------------------------------------
// Default watchlists. Tab order in the navbar follows array order here.
// ---------------------------------------------------------------------------

export const DEFAULT_WATCHLISTS: Watchlist[] = [
  { id: "press", name: "Press", sources: PRESS_SOURCES },
  { id: "cn-flash", name: "CN Flash", sources: CN_FLASH_SOURCES },
  { id: "trending", name: "Trending", sources: TRENDING_SOURCES },
  { id: "clash-news", name: "Clash News", sources: CLASH_NEWS_SOURCES },
]

// The watchlist id that the search-bar quick-star and the "first
// watchlist" fallback logic should target. Defaults to "clash-news"
// so that starring a source from the 更多 dialog adds it there.
export const DEFAULT_STAR_WATCHLIST_ID = "clash-news"

/**
 * Generate a fresh watchlist id that doesn't collide with any of the
 * existing ones. Format: `watchlist-<n>` where n is the smallest
 * positive integer that makes the id unique. Falls back to a
 * timestamp suffix if someone manages to fill 10k slots (they can't —
 * we cap at MAX_WATCHLISTS anyway).
 */
export function nextWatchlistId(existing: Watchlist[]): string {
  const taken = new Set(existing.map(w => w.id))
  for (let i = 1; i < 10_000; i++) {
    const candidate = `watchlist-${i}`
    if (!taken.has(candidate)) return candidate
  }
  return `watchlist-${Date.now()}`
}

/**
 * Default display name for a freshly-created watchlist.
 * Convention: "watchlist" for the first unnamed one, then
 * "watchlist 2", "watchlist 3", ... when a user creates more.
 */
export function nextWatchlistName(existing: Watchlist[]): string {
  const base = "watchlist"
  const taken = new Set(existing.map(w => w.name))
  if (!taken.has(base)) return base
  for (let i = 2; i < 10_000; i++) {
    const candidate = `${base} ${i}`
    if (!taken.has(candidate)) return candidate
  }
  return `${base} ${Date.now()}`
}
