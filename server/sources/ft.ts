const world = defineRSSSource("https://www.ft.com/world?format=rss")
const companies = defineRSSSource("https://www.ft.com/companies?format=rss")
const markets = defineRSSSource("https://www.ft.com/markets?format=rss")

export default defineSource({
  "ft": world,
  "ft-world": world,
  "ft-companies": companies,
  "ft-markets": markets,
})
