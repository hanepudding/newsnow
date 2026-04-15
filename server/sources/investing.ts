// Investing.com: per-vertical news feeds. 10 items each but the content
// is solid market coverage across economic/forex/commodities beats.
const economic = defineRSSSource("https://www.investing.com/rss/news_14.rss")
const forex = defineRSSSource("https://www.investing.com/rss/news_1.rss")
const commodities = defineRSSSource("https://www.investing.com/rss/news_11.rss")

export default defineSource({
  "investing": economic,
  "investing-economic": economic,
  "investing-forex": forex,
  "investing-commodities": commodities,
})
