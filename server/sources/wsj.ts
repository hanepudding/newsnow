// Wall Street Journal: Dow Jones's public RSS endpoints still work
// (feeds.content.dowjones.io). Headlines only — paywall on full articles,
// but that's fine for a ticker.
const markets = defineRSSSource("https://feeds.content.dowjones.io/public/rss/RSSMarketsMain")
const world = defineRSSSource("https://feeds.content.dowjones.io/public/rss/RSSWorldNews")

export default defineSource({
  "wsj": markets,
  "wsj-markets": markets,
  "wsj-world": world,
})
