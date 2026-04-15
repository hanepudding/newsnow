// Forexlive: literal ticker-style flashes — central bank actions, FX
// headlines, "heads up for X traders" format. Closest thing to Bloomberg
// Terminal MSG panel without a paywall.
const news = defineRSSSource("https://www.forexlive.com/feed/news")
const centralbank = defineRSSSource("https://www.forexlive.com/feed/centralbank")

export default defineSource({
  "forexlive": news,
  "forexlive-news": news,
  "forexlive-centralbank": centralbank,
})
