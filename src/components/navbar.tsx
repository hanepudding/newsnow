import { metadata } from "@shared/metadata"
import { Link } from "@tanstack/react-router"
import { currentColumnIdAtom, watchlistsAtom } from "~/atoms"

export function NavBar() {
  const currentId = useAtomValue(currentColumnIdAtom)
  const watchlists = useAtomValue(watchlistsAtom)
  const { toggle } = useSearchBar()

  return (
    <span className={$([
      "flex p-3 rounded-2xl bg-primary/1 text-sm",
      "shadow shadow-primary/20 hover:shadow-primary/50 transition-shadow-500",
      "flex-wrap gap-y-1",
    ])}
    >
      <button
        type="button"
        onClick={() => toggle(true)}
        className={$(
          "px-2 hover:(bg-primary/10 rounded-md) op-70 dark:op-90",
          "cursor-pointer transition-all",
        )}
      >
        更多
      </button>
      {watchlists.map(w => (
        <Link
          key={w.id}
          to="/c/$column"
          params={{ column: w.id }}
          className={$(
            "px-2 hover:(bg-primary/10 rounded-md) cursor-pointer transition-all whitespace-nowrap",
            currentId === w.id ? "color-primary font-bold" : "op-70 dark:op-90",
          )}
        >
          {w.name}
        </Link>
      ))}
      <Link
        to="/c/$column"
        params={{ column: "terminal" }}
        className={$(
          "px-2 hover:(bg-primary/10 rounded-md) cursor-pointer transition-all whitespace-nowrap",
          currentId === "terminal" ? "color-primary font-bold" : "op-70 dark:op-90",
        )}
      >
        {metadata.terminal.name}
      </Link>
    </span>
  )
}
