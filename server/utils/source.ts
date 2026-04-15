import type { AllSourceID } from "@shared/types"
import type { SourceGetter, SourceOption } from "#/types"

type R = Partial<Record<AllSourceID, SourceGetter>>
export function defineSource(source: SourceGetter): SourceGetter
export function defineSource(source: R): R
export function defineSource(source: SourceGetter | R): SourceGetter | R {
  return source
}

export function defineRSSSource(url: string, option?: SourceOption): SourceGetter {
  return async () => {
    const data = await rss2json(url)
    if (!data?.items.length) throw new Error("Cannot fetch rss data")
    return data.items.map(item => ({
      title: item.title,
      url: item.link,
      id: item.link,
      pubDate: !option?.hiddenDate ? item.created : undefined,
    }))
  }
}

// Build a Google News search RSS URL. Used as a reliable passthrough for
// publishers that don't expose public RSS (Reuters, Bloomberg) or have
// 403-prone feeds (WSJ). The `when:1d` operator limits to the last 24h.
export function gnewsSource(query: string, option?: SourceOption): SourceGetter {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`
  const inner = defineRSSSource(url, option)
  return async () => {
    const items = await inner()
    // Google News appends " - Publisher Name" to every title. Strip it.
    return items.map(item => ({
      ...item,
      title: item.title.replace(/\s+-\s[^-]+$/, "").trim(),
    }))
  }
}
