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

// Source presets used to seed the 3 default watchlists on fresh
// installs. These are CONSTANTS, not live metadata — after first load
// the user owns the lists and edits persist to localStorage.

const FINANCE_BRO_SOURCES = [
  // Primary ticker flash
  "forexlive-news",
  "jin10",
  "wallstreetcn-news",
  "cls-telegraph",
  // Markets
  "wsj-markets",
  "bloomberg-markets",
  "ft-markets",
  "reuters-business",
  "cnbc-top",
  // World / macro
  "wsj-world",
  "ft-world",
  "bloomberg-politics",
  "reuters-world",
  "cnbc-world",
  // Editorial / opinion
  "zerohedge",
  "axios",
] as const satisfies readonly SourceID[]

// "Press" is the English-language subset of Finance Bro — same publishers
// minus the three Chinese flash sources (jin10, wallstreetcn-news,
// cls-telegraph). Originally this was the "focus" column.
const CHINESE_SOURCE_IDS = new Set<SourceID>([
  "jin10",
  "wallstreetcn-news",
  "cls-telegraph",
])
const PRESS_SOURCES = FINANCE_BRO_SOURCES.filter(
  id => !CHINESE_SOURCE_IDS.has(id as SourceID),
) as SourceID[]

const TRENDING_SOURCES = [
  "wallstreetcn-hot",
  "cls-hot",
] as const satisfies readonly SourceID[]

export const DEFAULT_WATCHLISTS: Watchlist[] = [
  { id: "press", name: "Press", sources: [...PRESS_SOURCES] },
  { id: "finance-bro", name: "Finance Bro", sources: [...FINANCE_BRO_SOURCES] },
  { id: "trending", name: "Trending", sources: [...TRENDING_SOURCES] },
]

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
