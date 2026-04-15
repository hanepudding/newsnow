const top = defineRSSSource("https://www.cnbc.com/id/100003114/device/rss/rss.html")
const markets = defineRSSSource("https://www.cnbc.com/id/15839069/device/rss/rss.html")
const world = defineRSSSource("https://www.cnbc.com/id/100727362/device/rss/rss.html")

export default defineSource({
  "cnbc": top,
  "cnbc-top": top,
  "cnbc-markets": markets,
  "cnbc-world": world,
})
