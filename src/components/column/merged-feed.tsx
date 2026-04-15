// The "terminal" view: a two-column dashboard where each column is a
// time-sorted timeline merged from whatever watchlist the user picks at
// runtime. Each column has its own independent watchlist-id atom so
// you can run e.g. Finance Bro next to Press at the same time.
//
// Each MergedFeedColumn reuses the /api/s?id=... endpoint (and its
// server-side cache) via useQueries, so if the source watchlist tab is
// visited the same queries back both views.

import type { PrimitiveAtom } from "jotai"
import type { NewsItem, SourceID, SourceResponse } from "@shared/types"
import { useQueries } from "@tanstack/react-query"
import { useWindowSize } from "react-use"
import { OverlayScrollbar } from "../common/overlay-scrollbar"
import {
  refreshIntervalAtom,
  terminalLeftSourceColumnAtom,
  terminalRightSourceColumnAtom,
} from "~/hooks/useSettings"
import { useTranslatedTitle } from "~/hooks/useTranslate"
import { watchlistsAtom } from "~/atoms"

interface MergedItem extends NewsItem {
  __source: SourceID
}

function itemTimestamp(item: NewsItem): number {
  const raw = item.pubDate ?? item.extra?.date
  if (raw == null) return 0
  const t = typeof raw === "number" ? raw : new Date(raw).valueOf()
  return Number.isFinite(t) ? t : 0
}

function useRelativeTimeFromTs(ts: number) {
  return useRelativeTime(ts || "")
}

function MergedItemRow({ item }: { item: MergedItem }) {
  const { width } = useWindowSize()
  const source = sources[item.__source]
  const baseId = item.__source.split("-")[0]
  const relative = useRelativeTimeFromTs(itemTimestamp(item))
  const displayTitle = useTranslatedTitle(item.title)

  return (
    <li className="flex flex-col gap-0.5 border-s border-neutral-400/30 pl-3 ml-1 pb-2 relative">
      <span
        className="absolute w-2 h-2 rounded-full bg-neutral-400/50 -left-1 top-2"
      />
      <span className="flex items-center gap-1.5 text-xs text-neutral-400/80">
        <img
          src={`/icons/${baseId}.png`}
          className="w-3.5 h-3.5 rounded-full inline-block"
          alt=""
          onError={e => (e.currentTarget.style.display = "none")}
        />
        <span className={$(`color-${source.color}`, "font-medium")}>{source.name}</span>
        {source.title && (
          <span className={$("px-1 rounded bg-base bg-op-40", `color-${source.color}`)}>
            {source.title}
          </span>
        )}
        <span className="op-60">·</span>
        <span className="tabular-nums op-70">{relative}</span>
      </span>
      <a
        href={width < 768 ? item.mobileUrl || item.url : item.url}
        target="_blank"
        rel="noopener noreferrer"
        title={item.extra?.hover}
        className="text-base leading-snug hover:bg-neutral-400/10 rounded-md px-1 -mx-1 visited:(text-neutral-400/80)"
      >
        {displayTitle}
      </a>
    </li>
  )
}

function MergedFeedColumn({ sourceAtom }: { sourceAtom: PrimitiveAtom<string> }) {
  const refreshInterval = useAtomValue(refreshIntervalAtom)
  const [sourceColumn, setSourceColumn] = useAtom(sourceAtom)
  const watchlists = useAtomValue(watchlistsAtom)

  // Resolve the selected watchlist. If the stored id no longer exists
  // (user deleted the watchlist), fall back to the first available one.
  const effective = useMemo(() => {
    const match = watchlists.find(w => w.id === sourceColumn)
    if (match) return match
    return watchlists[0]
  }, [watchlists, sourceColumn])

  const sourceIds = effective?.sources ?? []
  const effectiveId = effective?.id ?? ""
  const effectiveName = effective?.name ?? "—"

  const queries = useQueries({
    queries: sourceIds.map(id => ({
      queryKey: ["source", id] as const,
      queryFn: async () => {
        const res: SourceResponse = await myFetch(`/s?id=${id}`)
        return res
      },
      staleTime: refreshInterval > 0 ? Math.max(0, refreshInterval - 5_000) : Infinity,
      refetchInterval: refreshInterval > 0 ? refreshInterval : false,
      refetchIntervalInBackground: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      retry: false,
    })),
  })

  const isFetchingAny = queries.some(q => q.isFetching)
  const allErrored = queries.length > 0 && queries.every(q => q.isError)

  const items = useMemo<MergedItem[]>(() => {
    const merged: MergedItem[] = []
    queries.forEach((q, i) => {
      const id = sourceIds[i]
      if (!id || !q.data?.items) return
      for (const item of q.data.items) {
        merged.push({ ...item, __source: id })
      }
    })
    merged.sort((a, b) => itemTimestamp(b) - itemTimestamp(a))
    return merged
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queries.map(q => q.dataUpdatedAt).join(","), sourceIds.join(",")])

  return (
    <div className="bg-base bg-op-70! backdrop-blur-md rounded-2xl p-4 md:p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 px-1 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="i-ph:terminal-window-duotone text-xl op-70" />
          <span className="text-lg font-bold">Terminal</span>
          <span className="flex items-center gap-1 text-xs op-70">
            <span className="op-60">aggregating</span>
            <span className="relative font-mono">
              <span className="px-1 rounded bg-neutral-400/15 border border-neutral-400/20">
                {effectiveName}
                <span className="i-ph:caret-down ml-0.5 text-[10px] align-middle" />
              </span>
              <select
                title="切换聚合来源"
                value={effectiveId}
                onChange={e => setSourceColumn(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full"
              >
                {watchlists.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </span>
          </span>
          <span className="text-xs op-50">
            {sourceIds.length}
            {" srcs · "}
            {items.length}
            {" items"}
          </span>
        </div>
        {allErrored && sourceIds.length > 0 && (
          <span className="text-xs text-red-400">all errored</span>
        )}
      </div>

      {sourceIds.length === 0
        ? (
            <div className="text-center op-60 py-12 flex-1">
              <p className="mb-2">
                {effectiveName}
                {" "}
                是空的
              </p>
              <p className="text-xs op-70">
                {watchlists.length === 0
                  ? "你目前没有任何 watchlist。通过右上角的 ··· 菜单管理 watchlists。"
                  : "切换到另一个 watchlist，或者在那个 tab 里加点源。"}
              </p>
            </div>
          )
        : (
            <OverlayScrollbar
              className="flex-1 overflow-y-auto"
              options={{ overflow: { x: "hidden" } }}
              defer
            >
              <ol className="flex flex-col gap-2 pr-2">
                {items.map(item => (
                  <MergedItemRow key={`${item.__source}-${item.id}`} item={item} />
                ))}
                {items.length === 0 && !isFetchingAny && (
                  <li className="text-center op-50 py-8">no items yet</li>
                )}
              </ol>
            </OverlayScrollbar>
          )}
    </div>
  )
}

export function MergedFeed() {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto w-full"
      style={{ height: "calc(100vh - 180px)" }}
    >
      <MergedFeedColumn sourceAtom={terminalLeftSourceColumnAtom} />
      <MergedFeedColumn sourceAtom={terminalRightSourceColumnAtom} />
    </div>
  )
}
