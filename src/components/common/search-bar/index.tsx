import { Command } from "cmdk"
import { useMount } from "react-use"
import type { SourceID } from "@shared/types"
import { useMemo, useRef, useState } from "react"
import pinyin from "@shared/pinyin.json"
import { OverlayScrollbar } from "../overlay-scrollbar"
import { CardWrapper } from "~/components/column/card"

import "./cmdk.css"

interface SourceItemProps {
  id: SourceID
  name: string
  title?: string
  column: any
  pinyin: string
}

function groupByColumn(items: SourceItemProps[]) {
  return items.reduce((acc, item) => {
    const k = acc.find(i => i.column === item.column)
    if (k) k.sources = [...k.sources, item]
    else acc.push({ column: item.column, sources: [item] })
    return acc
  }, [] as {
    column: string
    sources: SourceItemProps[]
  }[]).sort((m, n) => {
    if (m.column === "Tech") return -1
    if (n.column === "Tech") return 1

    // Always park these at the very end, in this order.
    if (m.column === "deprecated") return 1
    if (n.column === "deprecated") return -1
    if (m.column === "Uncategorized") return 1
    if (n.column === "Uncategorized") return -1

    return m.column < n.column ? -1 : 1
  })
}

export function SearchBar() {
  const { opened, toggle } = useSearchBar()
  const sourceItems = useMemo(
    () =>
      groupByColumn(typeSafeObjectEntries(sources)
        .filter(([_, source]) => !source.redirect)
        .map(([k, source]) => ({
          id: k,
          title: source.title,
          column: source.column ? columns[source.column].zh : "Uncategorized",
          name: source.name,
          pinyin: pinyin?.[k as keyof typeof pinyin] ?? "",
        })))
    , [],
  )
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [value, setValue] = useState<SourceID>("github-trending-today")

  useMount(() => {
    inputRef?.current?.focus()
    const keydown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggle()
      }
    }
    document.addEventListener("keydown", keydown)
    return () => {
      document.removeEventListener("keydown", keydown)
    }
  })

  return (
    <Command.Dialog
      open={opened}
      onOpenChange={toggle}
      value={value}
      onValueChange={(v) => {
        if (v in sources) {
          setValue(v as SourceID)
        }
      }}
    >
      <Command.Input
        ref={inputRef}
        autoFocus
        placeholder="Search sources..."
      />
      <div className="md:flex pt-2">
        <OverlayScrollbar defer className="overflow-y-auto md:min-w-275px">
          <Command.List>
            <Command.Empty> No sources found. Open an issue on GitHub if you want one added. </Command.Empty>
            {
              sourceItems.map(({ column, sources }) => (
                <Command.Group heading={column} key={column}>
                  {
                    sources.map(item => <SourceItem item={item} key={item.id} />)
                  }
                </Command.Group>
              ),
              )
            }
          </Command.List>
        </OverlayScrollbar>
        <div className="flex-1 pt-2 px-4 min-w-350px max-md:hidden">
          {/*
            key={value}: forces a full CardWrapper remount on source change.
              Without it, React Query's `placeholderData: prev => prev` keeps
              the previous source's items on screen forever when the new
              fetch hangs or errors.
            eager: skips the IntersectionObserver gate (the preview pane is
              always visible once the dialog is open, so lazy-mounting adds
              a one-frame empty flash on every remount).
          */}
          <CardWrapper key={value} id={value} eager />
        </div>
      </div>
    </Command.Dialog>
  )
}

function SourceItem({ item }: {
  item: SourceItemProps
}) {
  const { entries, isInAny, toggleInList } = useWatchlistMembership(item.id)
  const [picker, setPicker] = useState(false)
  const rowRef = useRef<HTMLDivElement | null>(null)

  // Close picker on outside click / Escape
  useEffect(() => {
    if (!picker) return
    const onDoc = (e: MouseEvent) => {
      if (!rowRef.current?.contains(e.target as Node)) setPicker(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPicker(false)
    }
    document.addEventListener("mousedown", onDoc)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDoc)
      document.removeEventListener("keydown", onKey)
    }
  }, [picker])

  return (
    <div ref={rowRef} className="relative">
      <Command.Item
        keywords={[item.name, item.title ?? "", item.pinyin]}
        value={item.id}
        className="flex justify-between items-center p-2"
        onSelect={() => setPicker(v => !v)}
      >
        <span className="flex gap-2 items-center">
          <span
            className={$("w-4 h-4 rounded-md bg-cover")}
            style={{
              backgroundImage: `url(/icons/${item.id.split("-")[0]}.png)`,
            }}
          />
          <span>{item.name}</span>
          <span className="text-xs text-neutral-400/80 self-end mb-3px">{item.title}</span>
        </span>
        <span className={$(isInAny ? "i-ph-star-fill" : "i-ph-star-duotone", "bg-primary op-40")}></span>
      </Command.Item>
      {picker && (
        <div
          className={$(
            "absolute right-2 top-full mt-1 z-100 min-w-44",
            "bg-base bg-op-95 backdrop-blur-md rounded-lg shadow-xl",
            "border border-neutral-400/20",
          )}
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
        >
          <div className="px-3 py-2 text-xs op-60 border-b border-neutral-400/15">
            Add to watchlist
          </div>
          {entries.length === 0
            ? (
                <div className="px-3 py-2 text-xs op-50">No watchlists</div>
              )
            : (
                <ul className="py-1">
                  {entries.map(e => (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => toggleInList(e.id)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-neutral-400/10 transition-colors"
                      >
                        <span
                          className={$(
                            "inline-block w-3.5 h-3.5 flex-shrink-0",
                            e.included ? "i-ph:check-square-fill color-primary" : "i-ph:square-duotone op-60",
                          )}
                        />
                        <span className="truncate text-left flex-1">{e.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
        </div>
      )}
    </div>
  )
}
