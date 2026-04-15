const markets = defineRSSSource("https://feeds.bloomberg.com/markets/news.rss")
const politics = defineRSSSource("https://feeds.bloomberg.com/politics/news.rss")
const technology = defineRSSSource("https://feeds.bloomberg.com/technology/news.rss")

export default defineSource({
  "bloomberg": markets,
  "bloomberg-markets": markets,
  "bloomberg-politics": politics,
  "bloomberg-tech": technology,
})
