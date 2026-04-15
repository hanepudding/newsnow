// Trump on Truth Social, via the long-running third-party mirror
// trumpstruth.org. The official truthsocial.com API is behind a
// Cloudflare interstitial (403) and the profile page is a JS-rendered
// SPA that returns an empty shell to server-side scrapers — the
// mirror's RSS feed is the only stable way to get Trump's posts
// without running a headless browser.
//
// Trade-off: this source introduces one extra domain to whitelist if
// the deployment is air-gapped: `trumpstruth.org`. The mirror serves
// only Trump's own posts and does not expose any user data.
const feed = defineRSSSource("https://trumpstruth.org/feed")

export default defineSource({
  trumpstruth: feed,
})
