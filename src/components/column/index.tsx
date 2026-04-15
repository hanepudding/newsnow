import { useTitle } from "react-use"
import { NavBar } from "../navbar"
import { Dnd } from "./dnd"
import { MergedFeed } from "./merged-feed"
import { currentColumnIdAtom, watchlistsAtom } from "~/atoms"

export function Column({ id }: { id: string }) {
  const [currentColumnId, setCurrentColumnId] = useAtom(currentColumnIdAtom)
  const watchlists = useAtomValue(watchlistsAtom)

  useEffect(() => {
    setCurrentColumnId(id)
  }, [id, setCurrentColumnId])

  // Title: watchlist name if it resolves, else "Terminal", else fallback
  const displayName = useMemo(() => {
    if (id === "terminal") return metadata.terminal.name
    const w = watchlists.find(w => w.id === id)
    return w?.name ?? id
  }, [id, watchlists])

  useTitle(`NewsNow | ${displayName}`)

  return (
    <>
      <div className="flex justify-center md:hidden mb-6">
        <NavBar />
      </div>
      {id === currentColumnId && (id === "terminal" ? <MergedFeed /> : <Dnd />)}
    </>
  )
}
