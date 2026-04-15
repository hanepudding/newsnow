const top = defineRSSSource("https://finance.yahoo.com/news/rssindex")

export default defineSource({
  yahoofinance: top,
})
