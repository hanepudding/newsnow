// Translation passthrough endpoint.
//
// Proxies the unofficial Google Translate endpoint
// (translate.googleapis.com/translate_a/single?client=gtx) which is
// stateless, API-key-free, and used by browser extensions.
//
// We expose it server-side rather than letting the client call Google
// directly so that:
//   1. CORS is guaranteed to work (some deployments block cross-origin)
//   2. The egress point is single and auditable — users on an
//      air-gapped deployment just need to whitelist translate.googleapis.com
//      on this server, not on every client
//   3. If someone wants to swap the provider later (LibreTranslate,
//      DeepL, etc.) only this file changes
//
// No server-side cache — client caches in localStorage by
// (text, targetLang) hash. For a personal dashboard the client cache
// covers 99% of repeat requests anyway.

import { z } from "zod"

const bodySchema = z.object({
  texts: z.array(z.string().min(1).max(2000)).min(1).max(50),
  target: z.string().min(2).max(10),
  source: z.string().min(2).max(10).optional(),
})

interface GoogleTranslateResponse {
  // Array-of-arrays: [segments, ..., detectedSrc, ...]
  // Each segment: [translatedText, originalText, ...]
  0: Array<[string, string, ...any[]]>
  2?: string
}

async function translateOne(text: string, target: string, source = "auto"): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(source)}&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text)}`
  try {
    const res = await myFetch(url, {
      responseType: "json",
      headers: {
        // Minimal UA to look like a normal client
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

  // Parallel fan-out. Google's unofficial endpoint handles reasonable
  // concurrency fine; we cap the batch at 50 so one request can't
  // blow through a rate limit.
  const translations = await Promise.all(
    texts.map(t => translateOne(t, target, source)),
  )

  return { translations }
})
