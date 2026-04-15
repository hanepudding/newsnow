// Manage watchlists: create, rename, reorder, delete. Opens as a
// centered modal from the header Menu. Kept deliberately simple —
// operations mutate the watchlistsAtom directly, no "dirty" tracking
// or save/cancel flow, so the UI always reflects the persisted state.

import type { Watchlist } from "@shared/watchlists"
import { MAX_WATCHLISTS } from "@shared/watchlists"
import { useState } from "react"
import {
  canCreateWatchlistAtom,
  createWatchlistAtom,
  deleteWatchlistAtom,
  renameWatchlistAtom,
  reorderWatchlistsAtom,
  watchlistsAtom,
} from "~/atoms"

export const manageWatchlistsOpenAtom = atom(false)

export function ManageWatchlistsModal() {
  const [open, setOpen] = useAtom(manageWatchlistsOpenAtom)
  const watchlists = useAtomValue(watchlistsAtom)
  const canCreate = useAtomValue(canCreateWatchlistAtom)
  const create = useSetAtom(createWatchlistAtom)
  const rename = useSetAtom(renameWatchlistAtom)
  const del = useSetAtom(deleteWatchlistAtom)
  const reorder = useSetAtom(reorderWatchlistsAtom)

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  if (!open) return null

  return (
    <div
      className={$(
        "fixed inset-0 z-100 flex items-center justify-center p-4",
        "bg-black/40 backdrop-blur-sm",
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false)
      }}
    >
      <div
        className={$(
          "bg-base bg-op-95 backdrop-blur-md rounded-2xl shadow-2xl",
          "w-full max-w-md max-h-[80vh] flex flex-col",
          "border border-neutral-400/20",
        )}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-400/15">
          <span className="text-lg font-bold">Manage watchlists</span>
          <button
            type="button"
            className="btn i-ph:x-bold op-60 hover:op-100"
            onClick={() => setOpen(false)}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {watchlists.length === 0 && (
            <p className="text-center op-60 py-6">还没有 watchlist</p>
          )}
          {watchlists.map((w, i) => (
            <WatchlistRow
              key={w.id}
              watchlist={w}
              isFirst={i === 0}
              isLast={i === watchlists.length - 1}
              onMoveUp={() => {
                const next = [...watchlists]
                ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
                reorder(next.map(x => x.id))
              }}
              onMoveDown={() => {
                const next = [...watchlists]
                ;[next[i + 1], next[i]] = [next[i], next[i + 1]]
                reorder(next.map(x => x.id))
              }}
              onRename={(name) => {
                if (name.trim()) rename({ id: w.id, name: name.trim() })
              }}
              confirmingDelete={confirmDelete === w.id}
              onRequestDelete={() => setConfirmDelete(w.id)}
              onCancelDelete={() => setConfirmDelete(null)}
              onConfirmDelete={() => {
                del(w.id)
                setConfirmDelete(null)
              }}
            />
          ))}
        </div>

        <div className="px-4 py-3 border-t border-neutral-400/15 flex items-center justify-between">
          <span className="text-xs op-50">
            {watchlists.length}
            {" / "}
            {MAX_WATCHLISTS}
          </span>
          <button
            type="button"
            disabled={!canCreate}
            onClick={() => create()}
            className={$(
              "flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors",
              canCreate ? "bg-primary/20 hover:bg-primary/30 cursor-pointer" : "op-30 cursor-not-allowed",
            )}
          >
            <span className="i-ph:plus-bold" />
            <span>New watchlist</span>
          </button>
        </div>
      </div>
    </div>
  )
}

interface RowProps {
  watchlist: Watchlist
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onRename: (name: string) => void
  confirmingDelete: boolean
  onRequestDelete: () => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
}

function WatchlistRow({
  watchlist,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRename,
  confirmingDelete,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: RowProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(watchlist.name)

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-400/5 border border-neutral-400/10">
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          disabled={isFirst}
          onClick={onMoveUp}
          className={$("i-ph:caret-up-bold text-xs", isFirst ? "op-20" : "op-60 hover:op-100 cursor-pointer")}
        />
        <button
          type="button"
          disabled={isLast}
          onClick={onMoveDown}
          className={$("i-ph:caret-down-bold text-xs", isLast ? "op-20" : "op-60 hover:op-100 cursor-pointer")}
        />
      </div>

      <div className="flex-1 min-w-0">
        {editing
          ? (
              <input
                autoFocus
                type="text"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onBlur={() => {
                  onRename(draft)
                  setEditing(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onRename(draft)
                    setEditing(false)
                  } else if (e.key === "Escape") {
                    setDraft(watchlist.name)
                    setEditing(false)
                  }
                }}
                className="w-full bg-transparent border-b border-primary/50 focus:outline-none text-sm"
              />
            )
          : (
              <button
                type="button"
                onClick={() => {
                  setDraft(watchlist.name)
                  setEditing(true)
                }}
                className="block w-full text-left truncate text-sm hover:op-80"
                title="Click to rename"
              >
                {watchlist.name}
              </button>
            )}
        <span className="text-xs op-50">
          {watchlist.sources.length}
          {" sources"}
        </span>
      </div>

      {confirmingDelete
        ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onConfirmDelete}
                className="px-2 py-1 text-xs rounded bg-red-500/20 hover:bg-red-500/30 text-red-300"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={onCancelDelete}
                className="px-2 py-1 text-xs rounded bg-neutral-400/10 hover:bg-neutral-400/20"
              >
                Cancel
              </button>
            </div>
          )
        : (
            <button
              type="button"
              onClick={onRequestDelete}
              className="btn i-ph:trash-duotone op-50 hover:op-100 hover:text-red-400"
              title="Delete watchlist"
            />
          )}
    </div>
  )
}
