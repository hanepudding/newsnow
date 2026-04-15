// Clash Report — an OSINT-style conflict-monitoring Telegram channel.
// No public RSS, no official API. We scrape Telegram's public web
// preview page `t.me/s/<channel>` which renders the last ~20 posts as
// server-rendered HTML. This is the standard pattern used by every
// Telegram-to-RSS bridge on the internet and is stable year-over-year.
//
// Trade-off: adds `t.me` to the whitelist. Telegram logs the request
// but does not require auth. Channel is public; no user data involved.

import * as cheerio from "cheerio"
import type { NewsItem } from "@shared/types"

const CHANNEL = "ClashReport"

const source = defineSource(async () => {
  const html: string = await myFetch(`https://t.me/s/${CHANNEL}`, { responseType: "text" })
  const $ = cheerio.load(html)

  const items: NewsItem[] = []
  $(".tgme_widget_message_wrap").each((_, el) => {
    const $el = $(el)
    const msg = $el.find(".tgme_widget_message")
    const link = msg.attr("data-post")
    if (!link) return

    // Prefer the message's text body; fall back to photo caption or a
    // service announcement. Many Clash Report posts are map images with
    // caption underneath — the caption lives in the same text block.
    const textEl = $el.find(".tgme_widget_message_text").first()
    let title = textEl.text().trim()

    // If there's no text at all (e.g. pure-media post), use the first
    // few words of the link's alt description. Skip entirely if we
    // still have nothing — a photo without caption isn't useful here.
    if (!title) {
      const mediaTitle = $el.find(".tgme_widget_message_photo_wrap").attr("aria-label")?.trim()
      if (mediaTitle) title = mediaTitle
    }
    if (!title) return

    // Collapse whitespace, cap length for the ticker view.
    title = title.replace(/\s+/g, " ").trim()

    const time = $el.find(".tgme_widget_message_date time").attr("datetime")
    const date = time ? new Date(time).valueOf() : undefined

    items.push({
      id: link,
      title,
      url: `https://t.me/${link}`,
      mobileUrl: `https://t.me/${link}`,
      extra: date ? { date } : undefined,
    })
  })

  // Telegram's preview page lists posts oldest-first on the page; the
  // downstream sort handles order, but reverse once here so the newest
  // appears at the top of the raw list too.
  return items.reverse()
})

export default defineSource({
  clashreport: source,
})
