import { createFileRoute } from "@tanstack/react-router"
import { watchlistsAtom } from "~/atoms"
import { Column } from "~/components/column"

export const Route = createFileRoute("/")({
  component: IndexComponent,
})

// Root landing: show the first watchlist the user has. For fresh
// installs that's "Press". If the user has deleted every watchlist,
// fall back to the Terminal view so they still see something.
function IndexComponent() {
  const watchlists = useAtomValue(watchlistsAtom)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const id = useMemo(() => watchlists[0]?.id ?? "terminal", [])
  return <Column id={id} />
}
