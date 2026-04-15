const currents = defineRSSSource("https://seekingalpha.com/market_currents.xml")
const articles = defineRSSSource("https://seekingalpha.com/feed.xml")

export default defineSource({
  "seekingalpha": currents,
  "seekingalpha-currents": currents,
  "seekingalpha-articles": articles,
})
