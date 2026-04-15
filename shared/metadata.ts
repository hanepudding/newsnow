import { sources } from "./sources"
import { typeSafeObjectEntries, typeSafeObjectFromEntries } from "./type.util"
import type { ColumnID, HiddenColumnID, Metadata, SourceID } from "./types"

// Fixed columns are anything the user doesn't own via the watchlists
// atom. Today that's just "terminal" (a view-over-watchlists) plus the
// hidden publisher-group columns that only appear in the 更多 search
// bar. All user-visible watchlists live in src/atoms watchlistsAtom.
export const columns = {
  terminal: {
    zh: "Terminal",
  },
  china: {
    zh: "China",
  },
  world: {
    zh: "World",
  },
  finance: {
    zh: "Finance",
  },
  tech: {
    zh: "Tech",
  },
  deprecated: {
    zh: "deprecated",
  },
} as const

// Tabs from metadata that show up in the top navbar beyond the dynamic
// watchlists. Order: watchlists first, then these.
export const fixedColumnIds = ["terminal"] as const satisfies Partial<ColumnID>[]
export const hiddenColumns = Object.keys(columns).filter(id => !fixedColumnIds.includes(id as any)) as HiddenColumnID[]

export const metadata: Metadata = typeSafeObjectFromEntries(typeSafeObjectEntries(columns).map(([k, v]) => {
  switch (k) {
    case "terminal":
      // "terminal" is the unified timeline view that aggregates whatever
      // watchlist the user picks at runtime. Empty source list — the
      // view reads directly from watchlistsAtom.
      return [k, {
        name: v.zh,
        sources: [] as SourceID[],
      }]
    default:
      // Hidden publisher-group columns (china/world/finance/tech/
      // deprecated) are derived from source.column metadata.
      return [k, {
        name: v.zh,
        sources: typeSafeObjectEntries(sources).filter(([, v]) => v.column === k && !v.redirect).map(([k]) => k),
      }]
  }
}))
