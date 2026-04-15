import { sources } from "./sources"
import { typeSafeObjectEntries, typeSafeObjectFromEntries } from "./type.util"
import type { ColumnID, HiddenColumnID, Metadata, SourceID } from "./types"

export const columns = {
  "focus": {
    zh: "关注",
  },
  "finance-bro": {
    zh: "Finance Bro",
  },
  "trending": {
    zh: "Trending",
  },
  "terminal": {
    zh: "Terminal",
  },
  "china": {
    zh: "国内",
  },
  "world": {
    zh: "国际",
  },
  "finance": {
    zh: "财经",
  },
  "tech": {
    zh: "科技",
  },
  "deprecated": {
    zh: "deprecated",
  },
} as const

// Tabs that show up in the top navbar. Order matters.
export const fixedColumnIds = ["focus", "finance-bro", "trending", "terminal"] as const satisfies Partial<ColumnID>[]
export const hiddenColumns = Object.keys(columns).filter(id => !fixedColumnIds.includes(id as any)) as HiddenColumnID[]

// Static source list for the "finance-bro" preset. Lives here so the list
// is literally predefined — not derived from each source's `type` field.
// Edit this array to change what the tab shows by default.
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
] as const satisfies SourceID[]

// Default "focus" list seeded on fresh installs — every English-language
// source from FINANCE_BRO_SOURCES (i.e. the full list minus the three
// Chinese-language sources: jin10, wallstreetcn-news, cls-telegraph).
// Existing users with a saved focus list are unaffected.
const CHINESE_SOURCES = new Set<SourceID>([
  "jin10",
  "wallstreetcn-news",
  "cls-telegraph",
])
const DEFAULT_FOCUS_SOURCES = FINANCE_BRO_SOURCES.filter(
  id => !CHINESE_SOURCES.has(id as SourceID),
) as SourceID[]

// Static source list for the "trending" tab — ranking-style feeds from
// publishers that expose a "most-read today" list. Add more here later.
const TRENDING_SOURCES = [
  "wallstreetcn-hot",
  "cls-hot",
] as const satisfies SourceID[]

export const metadata: Metadata = typeSafeObjectFromEntries(typeSafeObjectEntries(columns).map(([k, v]) => {
  switch (k) {
    case "focus":
      // "focus" seeds with the English Finance Bro sources on a fresh
      // install. Users with existing stored focus lists keep theirs
      // (preprocessMetadata preserves stored focus as-is).
      return [k, {
        name: v.zh,
        sources: DEFAULT_FOCUS_SOURCES.filter(id => sources[id] && !sources[id].redirect),
      }]
    case "terminal":
      // "terminal" is the unified timeline view that aggregates whatever
      // tab the user picks at runtime. The actual source list is read
      // dynamically from the selected tab, not from here.
      return [k, {
        name: v.zh,
        sources: [] as SourceID[],
      }]
    case "finance-bro":
      return [k, {
        name: v.zh,
        sources: FINANCE_BRO_SOURCES.filter(id => sources[id] && !sources[id].redirect) as SourceID[],
      }]
    case "trending":
      return [k, {
        name: v.zh,
        sources: TRENDING_SOURCES.filter(id => sources[id] && !sources[id].redirect) as SourceID[],
      }]
    default:
      return [k, {
        name: v.zh,
        sources: typeSafeObjectEntries(sources).filter(([, v]) => v.column === k && !v.redirect).map(([k]) => k),
      }]
  }
}))
