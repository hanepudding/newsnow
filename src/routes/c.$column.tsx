import { createFileRoute } from "@tanstack/react-router"
import { Column } from "~/components/column"

// The `column` param can be any string now:
// - a watchlist id (dynamic, user-defined)
// - the literal "terminal" (fixed merged-feed view)
// Validation happens inside <Column> — if the id resolves to neither,
// it falls back gracefully. Parser just normalizes to lowercase.
export const Route = createFileRoute("/c/$column")({
  component: SectionComponent,
  params: {
    parse: params => ({ column: params.column.toLowerCase() }),
    stringify: params => params,
  },
})

function SectionComponent() {
  const { column } = Route.useParams()
  return <Column id={column} />
}
