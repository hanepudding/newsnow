// Translation endpoint with server-side SQLite cache.
//
// Flow per headline:
//   1. Check SQLite cache by hash(target + text)
//   2. Cache hit → return immediately (no Google request)
//   3. Cache miss → call Google Translate → store result → return
//
// This means: N users seeing the same Bloomberg headline only trigger
// ONE Google Translate request total. Every subsequent user (or the
// same user on a different device) gets the cached translation from
// SQLite. Cache TTL is 7 days — headline translations don't change.
//
// The client still has its own localStorage cache on top of this, so
// the typical flow for a returning user is:
//   localStorage hit → no server request at all
//   localStorage miss, server cache hit → fast, no Google
//   both miss → Google → cached at both levels

import { z } from "zod"
import md5 from "md5"
import { getCacheTable } from "#/database/cache"

const bodySchema = z.object({
  texts: z.array(z.string().min(1).max(2000)).min(1).max(50),
  target: z.string().min(2).max(10),
  source: z.string().min(2).max(10).optional(),
})

interface GoogleTranslateResponse {
  0: Array<[string, string, ...any[]]>
  2?: string
}

function cacheKey(target: string, text: string): string {
  return `tr:${target}:${md5(text)}`
}

async function translateOne(text: string, target: string, source = "auto"): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(source)}&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text)}`
  try {
    const res = await myFetch(url, {
      responseType: "json",
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    }) as GoogleTranslateResponse

    if (!Array.isArray(res?.[0])) return ""
    const parts: string[] = []
    for (const seg of res[0]) {
      if (Array.isArray(seg) && typeof seg[0] === "string") parts.push(seg[0])
    }
    return parts.join("")
  } catch (e: any) {
    logger.warn(`translate failed for "${text.slice(0, 40)}...": ${e.message}`)
    return ""
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: `Invalid body: ${parsed.error.message}`,
    })
  }

  const { texts, target, source } = parsed.data

  // Try to get a cache table. If DB is unavailable, fall through to
  // direct translation (stateless passthrough, still works).
  let cache: Awaited<ReturnType<typeof getCacheTable>> | undefined
  try {
    cache = await getCacheTable()
  } catch {}

  const translations = await Promise.all(
    texts.map(async (text) => {
      const key = cacheKey(target, text)

      // 1. Check server cache
      if (cache) {
        try {
          const cached = await cache.get(key)
          if (cached?.items?.[0]?.title) {
            return cached.items[0].title
          }
        } catch {}
      }

      // 2. Cache miss → call Google
      const result = await translateOne(text, target, source)

      // 3. Store in server cache (fire-and-forget)
      if (cache && result) {
        try {
          // Reuse the existing cache table shape: items is NewsItem[].
          // We store the translation as a single-item array with the
          // translated text in the `title` field. A bit of a hack but
          // avoids creating a separate table.
          await cache.set(key, [{ id: key, title: result, url: "" }])
        } catch {}
      }

      return result
    }),
  )

  return { translations }
})
