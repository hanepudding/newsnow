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

// Terminal columns: each entry is a watchlist id that a column
// aggregates from. Array length is also the column count. Users can
// +/- columns via buttons in the Terminal header; we cap at 1..6.
// Default: 2 columns [finance-bro, press].
export const MIN_TERMINAL_COLUMNS = 1
export const MAX_TERMINAL_COLUMNS = 6
export const terminalColumnsAtom = atomWithStorage<string[]>(
  "terminal-columns",
  ["finance-bro", "press"],
)

// Legacy atoms kept for one release to allow migration on first load.
// Will be removed after most users upgrade past this commit.
export const terminalLeftSourceColumnAtom = atomWithStorage<string>("terminal-left-source-column", "finance-bro")
export const terminalRightSourceColumnAtom = atomWithStorage<string>("terminal-right-source-column", "press")

// ---------------------------------------------------------------------
// Translation
// ---------------------------------------------------------------------
// Target language for headline translation. "off" disables the feature
// and no outbound requests are made. Anything else is a valid language
// code for Google Translate (zh-CN, en, ja, ru, es, fr, de, ko, ...).
//
// When enabled, user's titles are POSTed to /api/translate which
// proxies translate.googleapis.com. Results are cached client-side
// in localStorage by (text, target) hash to minimize network.

export const TRANSLATE_OPTIONS = [
  { value: "off", label: "Off" },
  { value: "zh-CN", label: "中文" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "ru", label: "Русский" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
] as const

export type TranslateTarget = (typeof TRANSLATE_OPTIONS)[number]["value"]

export const translateTargetAtom = atomWithStorage<TranslateTarget>("translate-target", "off")
