// OilPrice.com: energy-focused ticker for oil/gas headlines.
const main = defineRSSSource("https://oilprice.com/rss/main")

export default defineSource({
  oilprice: main,
})
