import { XMLParser } from "fast-xml-parser"
import type { RSSInfo } from "../types"

// Decode HTML entities that leak through double-encoded RSS titles
// (common in WSJ, Benzinga, etc. where source sends `&amp;#x2019;` and
// fast-xml-parser only unwraps one layer).
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: "\"",
  apos: "'",
  nbsp: " ",
}
function decodeEntities(s: string): string {
  if (!s || typeof s !== "string" || !s.includes("&")) return s
  return s.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (full, code) => {
    if (code[0] === "#") {
      const cp = code[1] === "x" || code[1] === "X"
        ? Number.parseInt(code.slice(2), 16)
        : Number.parseInt(code.slice(1), 10)
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : full
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? full
  })
}

export async function rss2json(url: string): Promise<RSSInfo | undefined> {
  if (!/^https?:\/\/[^\s$.?#].\S*/i.test(url)) return

  // Force text parsing — ofetch's content-type autodetect mis-handles some
  // feeds (e.g. Bloomberg's application/rss+xml returns `{}`).
  const data = await myFetch(url, { responseType: "text" })

  const xml = new XMLParser({
    attributeNamePrefix: "",
    textNodeName: "$text",
    ignoreAttributes: false,
  })

  const result = xml.parse(data as string)

  let channel = result.rss && result.rss.channel ? result.rss.channel : result.feed
  if (Array.isArray(channel)) channel = channel[0]

  const rss = {
    title: channel.title ?? "",
    description: channel.description ?? "",
    link: channel.link && channel.link.href ? channel.link.href : channel.link,
    image: channel.image ? channel.image.url : channel["itunes:image"] ? channel["itunes:image"].href : "",
    category: channel.category || [],
    updatedTime: channel.lastBuildDate ?? channel.updated,
    items: [],
  }

  let items = channel.item || channel.entry || []
  if (items && !Array.isArray(items)) items = [items]

  for (let i = 0; i < items.length; i++) {
    const val = items[i]
    const media = {}

    const obj = {
      id: val.guid && val.guid.$text ? val.guid.$text : val.id,
      title: decodeEntities(val.title && val.title.$text ? val.title.$text : val.title),
      description: val.summary && val.summary.$text ? val.summary.$text : val.description,
      link: val.link && val.link.href ? val.link.href : val.link,
      author: val.author && val.author.name ? val.author.name : val["dc:creator"],
      created: val.updated ?? val.pubDate ?? val.created,
      category: val.category || [],
      content: val.content && val.content.$text ? val.content.$text : val["content:encoded"],
      enclosures: val.enclosure ? (Array.isArray(val.enclosure) ? val.enclosure : [val.enclosure]) : [],
    };

    ["content:encoded", "podcast:transcript", "itunes:summary", "itunes:author", "itunes:explicit", "itunes:duration", "itunes:season", "itunes:episode", "itunes:episodeType", "itunes:image"].forEach((s) => {
      // @ts-expect-error TODO
      if (val[s]) obj[s.replace(":", "_")] = val[s]
    })

    if (val["media:thumbnail"]) {
      Object.assign(media, { thumbnail: val["media:thumbnail"] })
      obj.enclosures.push(val["media:thumbnail"])
    }

    if (val["media:content"]) {
      Object.assign(media, { thumbnail: val["media:content"] })
      obj.enclosures.push(val["media:content"])
    }

    if (val["media:group"]) {
      if (val["media:group"]["media:title"]) obj.title = val["media:group"]["media:title"]

      if (val["media:group"]["media:description"]) obj.description = val["media:group"]["media:description"]

      if (val["media:group"]["media:thumbnail"]) obj.enclosures.push(val["media:group"]["media:thumbnail"].url)

      if (val["media:group"]["media:content"]) obj.enclosures.push(val["media:group"]["media:content"])
    }

    Object.assign(obj, { media })

    // @ts-expect-error TODO
    rss.items.push(obj)
  }

  return rss
}
