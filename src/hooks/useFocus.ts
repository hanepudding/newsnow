// Source ↔ watchlist membership hook. Used by the star button in the
// card header and the search-bar preview row. Each source can live in
// any number of watchlists simultaneously.

import type { SourceID } from "@shared/types"
import { toggleSourceInWatchlistAtom, watchlistsAtom, watchlistsContaining } from "~/atoms"

export interface WatchlistMembershipEntry {
  id: string
  name: string
  included: boolean
}

/**
 * Returns the set of membership entries for `sourceId` across all
 * watchlists, plus a `toggle(watchlistId)` setter and a convenience
 * `isInAny` boolean (true when the source belongs to at least one
 * watchlist — the star icon's "filled" state uses this).
 */
export function useWatchlistMembership(sourceId: SourceID) {
  const watchlists = useAtomValue(watchlistsAtom)
  const toggle = useSetAtom(toggleSourceInWatchlistAtom)

  const entries: WatchlistMembershipEntry[] = useMemo(
    () => watchlists.map(w => ({
      id: w.id,
      name: w.name,
      included: w.sources.includes(sourceId),
    })),
    [watchlists, sourceId],
  )

  const isInAny = useMemo(() => entries.some(e => e.included), [entries])

  const toggleInList = useCallback(
    (watchlistId: string) => {
      toggle({ sourceId, watchlistId })
    },
    [toggle, sourceId],
  )

  return { entries, isInAny, toggleInList }
}

/**
 * Legacy name kept so any remaining callers don't break. Prefer
 * `useWatchlistMembership`. Returns just `isFocused` + `toggleFocus`
 * semantics backed by the FIRST watchlist (the user's primary
 * list — Press by default).
 */
export function useFocusWith(id: SourceID) {
  const { entries, toggleInList } = useWatchlistMembership(id)
  const first = entries[0]
  const isFocused = first?.included ?? false
  const toggleFocus = useCallback(() => {
    if (first) toggleInList(first.id)
  }, [first, toggleInList])

  return { toggleFocus, isFocused }
}

/**
 * Shorthand for "which watchlists contain this source?". Useful in
 * places that don't need the setter.
 */
export function useSourceWatchlistIds(sourceId: SourceID): string[] {
  const watchlists = useAtomValue(watchlistsAtom)
  return useMemo(() => watchlistsContaining(watchlists, sourceId), [watchlists, sourceId])
}
