// AP's public RSS endpoints (feeds.apnews.com/rss/*) block non-browser
// user agents. Google News passthrough is reliable. AP articles all live
// under apnews.com/article/<slug> — there are no category subpaths to
// filter on, so we use keyword-based section filters instead.
const top = defineSource(gnewsSource("when:1d site:apnews.com"))
const business = defineSource(gnewsSource("when:1d site:apnews.com (business OR markets OR economy OR stocks)"))
const world = defineSource(gnewsSource("when:1d site:apnews.com (world OR international OR russia OR china OR europe OR middle-east)"))

export default defineSource({
  "apnews": top,
  "apnews-top": top,
  "apnews-business": business,
  "apnews-world": world,
})
