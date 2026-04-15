// FXStreet: tight currency-pair flashes in the Bloomberg-Terminal style.
const news = defineRSSSource("https://www.fxstreet.com/rss/news")

export default defineSource({
  fxstreet: news,
})
