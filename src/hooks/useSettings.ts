// User-facing dashboard settings. Persisted to localStorage via Jotai's
// atomWithStorage. Consumed by card.tsx (refetchInterval + item sort) and
// edited in the header Menu.
//
// refreshInterval: 0 = off, otherwise ms between polls. Server cache still
// throttles real upstream fetches per source.interval, so polling more
// aggressively than the source interval is cheap.
//
// sortByTime: when true, timeline-style cards (non-hottest sources) are
// sorted newest-first by pubDate / extra.date. Hottest/ranking sources are
// never sorted — their order is the ranking.

export const REFRESH_INTERVAL_OPTIONS = [
  { label: "Off", value: 0 },
  { label: "5s", value: 5_000 },
  { label: "10s", value: 10_000 },
  { label: "15s", value: 15_000 },
  { label: "30s", value: 30_000 },
  { label: "60s", value: 60_000 },
  { label: "2min", value: 120_000 },
  { label: "5min", value: 300_000 },
] as const

export const refreshIntervalAtom = atomWithStorage<number>("refresh-interval", 15_000)
export const sortByTimeAtom = atomWithStorage<boolean>("sort-by-time", false)

// Which tabs the two Terminal columns aggregate from. Any fixedColumnID
// except "terminal" itself is valid. Defaults: left = finance-bro, right
// = focus. Each column remembers its own selection independently.
export const terminalLeftSourceColumnAtom = atomWithStorage<string>("terminal-left-source-column", "finance-bro")
export const terminalRightSourceColumnAtom = atomWithStorage<string>("terminal-right-source-column", "focus")
