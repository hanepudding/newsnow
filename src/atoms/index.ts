import type { SourceID } from "@shared/types"
import type { Watchlist } from "@shared/watchlists"
import { DEFAULT_WATCHLISTS, MAX_WATCHLISTS, nextWatchlistId, nextWatchlistName } from "@shared/watchlists"
import { sources } from "@shared/sources"
import type { Update } from "./types"

// ---------------------------------------------------------------------
// Watchlists atom (replaces the old focus / finance-bro / trending
// columns + primitiveMetadataAtom. A watchlist is a user-editable set
// of sources with a display name. Every visible nav tab except
// Terminal corresponds to one entry in this array.
// ---------------------------------------------------------------------

const WATCHLISTS_KEY = "watchlists"
const LEGACY_METADATA_KEY = "metadata"

function validSources(ids: unknown): SourceID[] {
  if (!Array.isArray(ids)) return []
  return ids.filter((id): id is SourceID => typeof id === "string" && sources[id as SourceID] != null && !sources[id as SourceID].redirect)
}

function loadInitialWatchlists(): Watchlist[] {
  if (typeof localStorage === "undefined") {
    return DEFAULT_WATCHLISTS.map(w => ({ ...w, sources: validSources(w.sources) }))
  }

  // Priority 1: the current-format storage key
  try {
    const raw = localStorage.getItem(WATCHLISTS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Watchlist[]
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(w => w && typeof w.id === "string" && typeof w.name === "string")) {
        return parsed.map(w => ({
          id: w.id,
          name: w.name,
          sources: validSources(w.sources),
        }))
      }
    }
  } catch {}

  // Priority 2: migrate from the legacy `metadata` key
  try {
    const raw = localStorage.getItem(LEGACY_METADATA_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const data = parsed?.data
      if (data && typeof data === "object") {
        const out: Watchlist[] = []
        if (Array.isArray(data.focus)) {
          out.push({ id: "press", name: "Press", sources: validSources(data.focus) })
        }
        if (Array.isArray(data["finance-bro"])) {
          out.push({ id: "finance-bro", name: "Finance Bro", sources: validSources(data["finance-bro"]) })
        }
        if (Array.isArray(data.trending)) {
          out.push({ id: "trending", name: "Trending", sources: validSources(data.trending) })
        }
        if (out.length > 0) return out
      }
    }
  } catch {}

  // Priority 3: fresh-install defaults
  return DEFAULT_WATCHLISTS.map(w => ({
    id: w.id,
    name: w.name,
    sources: validSources(w.sources),
  }))
}

const watchlistsBaseAtom = atom<Watchlist[]>(loadInitialWatchlists())

export const watchlistsAtom = atom(
  get => get(watchlistsBaseAtom),
  (get, set, update: Update<Watchlist[]>) => {
    const next = update instanceof Function ? update(get(watchlistsBaseAtom)) : update
    set(watchlistsBaseAtom, next)
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(WATCHLISTS_KEY, JSON.stringify(next))
    }
  },
)

// ---------------------------------------------------------------------
// Current-column atoms. currentColumnIdAtom is a free-form string; it
// can hold any watchlist id, or the literal "terminal" for the Terminal
// view. Route /c/$column sets this on mount.
// ---------------------------------------------------------------------

export const currentColumnIdAtom = atom<string>("press")

// Derived: sources for the currently-selected watchlist. Empty if the
// column is "terminal" or the id doesn't resolve to a watchlist.
export const currentSourcesAtom = atom(
  (get) => {
    const id = get(currentColumnIdAtom)
    const lists = get(watchlistsAtom)
    return lists.find(w => w.id === id)?.sources ?? []
  },
  (get, set, update: Update<SourceID[]>) => {
    const id = get(currentColumnIdAtom)
    const lists = get(watchlistsAtom)
    const current = lists.find(w => w.id === id)?.sources ?? []
    const next = update instanceof Function ? update(current) : update
    set(watchlistsAtom, lists.map(w => (w.id === id ? { ...w, sources: next } : w)))
  },
)

// ---------------------------------------------------------------------
// Watchlist CRUD helpers exposed as setter-only atoms + a canCreate
// guard the UI reads to disable the "new" button at the cap.
// ---------------------------------------------------------------------

export const canCreateWatchlistAtom = atom(get => get(watchlistsAtom).length < MAX_WATCHLISTS)

export const createWatchlistAtom = atom(null, (get, set, seed?: Partial<Pick<Watchlist, "name" | "sources">>) => {
  const existing = get(watchlistsAtom)
  if (existing.length >= MAX_WATCHLISTS) return null
  const fresh: Watchlist = {
    id: nextWatchlistId(existing),
    name: seed?.name ?? nextWatchlistName(existing),
    sources: validSources(seed?.sources ?? []),
  }
  set(watchlistsAtom, [...existing, fresh])
  return fresh.id
})

export const renameWatchlistAtom = atom(null, (get, set, { id, name }: { id: string, name: string }) => {
  set(watchlistsAtom, get(watchlistsAtom).map(w => (w.id === id ? { ...w, name } : w)))
})

export const deleteWatchlistAtom = atom(null, (get, set, id: string) => {
  set(watchlistsAtom, get(watchlistsAtom).filter(w => w.id !== id))
})

export const reorderWatchlistsAtom = atom(null, (get, set, orderedIds: string[]) => {
  const lists = get(watchlistsAtom)
  const byId = new Map(lists.map(w => [w.id, w]))
  const next: Watchlist[] = []
  for (const id of orderedIds) {
    const w = byId.get(id)
    if (w) {
      next.push(w)
      byId.delete(id)
    }
  }
  // Append any that weren't in the incoming order (safety)
  for (const w of byId.values()) next.push(w)
  set(watchlistsAtom, next)
})

// ---------------------------------------------------------------------
// Source <-> watchlists membership helpers (used by the card star
// button's popover).
// ---------------------------------------------------------------------

export function watchlistsContaining(lists: Watchlist[], sourceId: SourceID): string[] {
  return lists.filter(w => w.sources.includes(sourceId)).map(w => w.id)
}

export const toggleSourceInWatchlistAtom = atom(
  null,
  (get, set, { sourceId, watchlistId }: { sourceId: SourceID, watchlistId: string }) => {
    const lists = get(watchlistsAtom)
    set(
      watchlistsAtom,
      lists.map((w) => {
        if (w.id !== watchlistId) return w
        const has = w.sources.includes(sourceId)
        return {
          ...w,
          sources: has ? w.sources.filter(s => s !== sourceId) : [...w.sources, sourceId],
        }
      }),
    )
  },
)

// ---------------------------------------------------------------------
// Misc (unchanged from before)
// ---------------------------------------------------------------------

export const goToTopAtom = atom({
  ok: false,
  el: undefined as HTMLElement | undefined,
  fn: undefined as (() => void) | undefined,
})
