// CoinDesk: crypto news ticker.
const top = defineRSSSource("https://www.coindesk.com/arc/outboundfeeds/rss/")

export default defineSource({
  coindesk: top,
})
