// Benzinga Markets: stock-mover flashes ("SURG falls 30% overnight").
const markets = defineRSSSource("https://www.benzinga.com/markets/feed")

export default defineSource({
  benzinga: markets,
})
