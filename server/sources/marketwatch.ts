const top = defineRSSSource("https://feeds.content.dowjones.io/public/rss/mw_topstories")
const pulse = defineRSSSource("https://feeds.content.dowjones.io/public/rss/mw_marketpulse")
const bulletins = defineRSSSource("https://feeds.content.dowjones.io/public/rss/mw_bulletins")

export default defineSource({
  "marketwatch": top,
  "marketwatch-top": top,
  "marketwatch-pulse": pulse,
  "marketwatch-bulletins": bulletins,
})
