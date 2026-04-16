import { Link } from "@tanstack/react-router"
import { useIsFetching } from "@tanstack/react-query"
import type { SourceID } from "@shared/types"
import { NavBar } from "../navbar"
import { Menu } from "./menu"
import { currentSourcesAtom, goToTopAtom } from "~/atoms"
import {
  REFRESH_INTERVAL_OPTIONS,
  TRANSLATE_OPTIONS,
  refreshIntervalAtom,
  sortByTimeAtom,
  translateTargetAtom,
} from "~/hooks/useSettings"

function GoTop() {
  const { ok, fn: goToTop } = useAtomValue(goToTopAtom)
  return (
    <button
      type="button"
      title="Go To Top"
      className={$("i-ph:arrow-fat-up-duotone", ok ? "op-50 btn" : "op-0")}
      onClick={goToTop}
    />
  )
}

// Combined manual refresh + auto-refresh interval selector. Click the icon
// to refresh now. The small label beside it ("30s") is a native select that
// sets the auto-refresh interval.
function RefreshCluster() {
  const currentSources = useAtomValue(currentSourcesAtom)
  const { refresh } = useRefetch()
  const refreshAll = useCallback(() => refresh(...currentSources), [refresh, currentSources])
  const [interval, setInterval] = useAtom(refreshIntervalAtom)
  const currentLabel = REFRESH_INTERVAL_OPTIONS.find(o => o.value === interval)?.label ?? `${Math.round(interval / 1000)}s`

  const isFetching = useIsFetching({
    predicate: (query) => {
      const [type, id] = query.queryKey as ["source" | "entire", SourceID]
      return (type === "source" && currentSources.includes(id)) || type === "entire"
    },
  })

  return (
    <span className="flex items-center gap-1">
      <button
        type="button"
        title="Refresh now"
        className={$("i-ph:arrow-counter-clockwise-duotone btn", isFetching && "animate-spin i-ph:circle-dashed-duotone")}
        onClick={refreshAll}
      />
      <span className="relative text-xs font-mono op-70 hover:op-100 transition-opacity">
        <span className={$("tabular-nums", interval === 0 && "op-50")}>{currentLabel}</span>
        <select
          title="Auto-refresh interval"
          value={interval}
          onChange={e => setInterval(Number(e.target.value))}
          className="absolute inset-0 opacity-0 cursor-pointer w-full"
        >
          {REFRESH_INTERVAL_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </span>
    </span>
  )
}

function SortByTime() {
  const [sortByTime, setSortByTime] = useAtom(sortByTimeAtom)
  return (
    <button
      type="button"
      title={sortByTime ? "Sort by time" : "Default order"}
      className={$(
        "btn",
        sortByTime ? "i-ph:clock-countdown-duotone" : "i-ph:list-bullets-duotone",
      )}
      onClick={() => setSortByTime(!sortByTime)}
    />
  )
}

// Translation language selector. Off means no outbound calls to
// translate.googleapis.com. Anything else triggers per-headline
// translation (cached client-side).
function TranslateSelector() {
  const [target, setTarget] = useAtom(translateTargetAtom)
  const current = TRANSLATE_OPTIONS.find(o => o.value === target) ?? TRANSLATE_OPTIONS[0]
  return (
    <span className="relative inline-flex items-center">
      <span
        className={$(
          "btn i-ph:translate-duotone",
          target === "off" && "op-40",
        )}
        title={target === "off" ? "Translation: off" : `Translate to ${current.label}`}
      />
      {target !== "off" && (
        <span className="text-xs font-mono op-70 -ml-0.5 pointer-events-none">{current.label}</span>
      )}
      <select
        title="Translation target"
        value={target}
        onChange={e => setTarget(e.target.value as any)}
        className="absolute inset-0 opacity-0 cursor-pointer w-full"
      >
        {TRANSLATE_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </span>
  )
}

export function Header() {
  return (
    <>
      <span className="flex justify-self-start">
        <Link to="/" className="flex gap-2 items-center">
          <div className="h-10 w-10 bg-cover" title="logo" style={{ backgroundImage: "url(/icon.svg)" }} />
          <span className="text-2xl font-brand line-height-none!">
            <p>News</p>
            <p className="mt--1">
              <span className="color-primary-6">N</span>
              <span>ow</span>
            </p>
          </span>
        </Link>
        <a target="_blank" href={Homepage} className="btn text-sm ml-1 font-mono">
          {`v${Version}`}
        </a>
      </span>
      <span className="justify-self-center">
        <span className="hidden md:(inline-block)">
          <NavBar />
        </span>
      </span>
      <span className="justify-self-end flex gap-2 items-center text-xl text-primary-600 dark:text-primary">
        <GoTop />
        <TranslateSelector />
        <SortByTime />
        <RefreshCluster />
        <Menu />
      </span>
    </>
  )
}
