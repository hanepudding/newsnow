// Reuters deprecated their public RSS (feeds.reuters.com) years ago. Google
// News search RSS is a reliable passthrough — it filters by site + time window
// and always returns well-formed RSS 2.0.
const world = defineSource(gnewsSource("when:1d site:reuters.com/world"))
const business = defineSource(gnewsSource("when:1d site:reuters.com/business"))
const markets = defineSource(gnewsSource("when:1d site:reuters.com/markets"))

export default defineSource({
  "reuters": world,
  "reuters-world": world,
  "reuters-business": business,
  "reuters-markets": markets,
})
