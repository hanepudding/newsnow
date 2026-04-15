// ZeroHedge: market/macro/politics with a healthy dose of editorial
// spice. Feedburner feed is still live.
const feed = defineRSSSource("https://feeds.feedburner.com/zerohedge/feed")

export default defineSource({
  zerohedge: feed,
})
