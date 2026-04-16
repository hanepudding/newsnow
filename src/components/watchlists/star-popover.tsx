// Star button for news cards. Replaces the old one-watchlist toggle
// with a popover that lets the user pick which watchlists this source
// belongs to (multi-select, checkbox list). The star icon is "filled"
// when the source is in at least one watchlist.
//
// Opens on click, closes on outside click or Escape. Small enough to
// live in the card header without needing a full modal.

import type { SourceID } from "@shared/types"
import { MAX_WATCHLISTS } from "@shared/watchlists"
import { useEffect, useRef, useState } from "react"
import { useWatchlistMembership } from "~/hooks/useFocus"
import { canCreateWatchlistAtom, createWatchlistAtom } from "~/atoms"

export function StarPopover({ id, color }: { id: SourceID, color?: string }) {
  const { entries, isInAny, toggleInList } = useWatchlistMembership(id)
  const canCreate = useAtomValue(canCreateWatchlistAtom)
  const create = useSetAtom(createWatchlistAtom)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDocClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <span ref={ref} className="relative inline-block">
      <button
        type="button"
        title={isInAny ? "In one or more watchlists" : "Add to a watchlist"}
        className={$(
          "btn",
          isInAny ? "i-ph:star-fill" : "i-ph:star-duotone",
          color ? `color-${color}` : undefined,
        )}
        onClick={(e) => {
          e.stopPropagation()
          setOpen(v => !v)
        }}
      />
      {open && (
        <div
          className={$(
            "absolute right-0 top-full mt-1 z-50 min-w-44",
            "bg-base bg-op-95 backdrop-blur-md rounded-lg shadow-xl",
            "border border-neutral-400/20",
          )}
          onClick={e => e.stopPropagation()}
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
          {canCreate && (
            <button
              type="button"
              onClick={() => {
                const newId = create({ sources: [id] })
                if (newId) {
                  // The new watchlist is already created WITH this source in it.
                  // No further toggle needed.
                }
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs op-60 hover:op-100 hover:bg-neutral-400/10 transition-colors border-t border-neutral-400/15"
            >
              <span className="i-ph:plus-bold inline-block w-3.5 h-3.5 flex-shrink-0" />
              <span>New watchlist</span>
            </button>
          )}
        </div>
      )}
    </span>
  )
}
