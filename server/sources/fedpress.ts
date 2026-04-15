// Federal Reserve Board press releases: primary macro signal. Low
// frequency but high importance (rate decisions, enforcement actions,
// discount-rate minutes).
const press = defineRSSSource("https://www.federalreserve.gov/feeds/press_all.xml")

export default defineSource({
  fedpress: press,
})
