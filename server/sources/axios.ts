// Axios: general breaking news, 100-item deep feed.
const top = defineRSSSource("https://www.axios.com/feeds/feed.rss")

export default defineSource({
  axios: top,
})
