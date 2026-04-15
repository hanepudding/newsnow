// Nikkei Asia's direct RSS (asia.nikkei.com/rss/feed/nar) returned 0 items
// in our smoke test. Google News passthrough is more reliable.
const top = defineSource(gnewsSource("when:1d site:asia.nikkei.com"))
const business = defineSource(gnewsSource("when:1d site:asia.nikkei.com/Business"))
const economy = defineSource(gnewsSource("when:1d site:asia.nikkei.com/Economy"))

export default defineSource({
  "nikkei": top,
  "nikkei-top": top,
  "nikkei-business": business,
  "nikkei-economy": economy,
})
