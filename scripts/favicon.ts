import fs from "node:fs"

import { fileURLToPath } from "node:url"
import { join } from "node:path"
import { Buffer } from "node:buffer"
import { consola } from "consola"
import { originSources } from "../shared/pre-sources"

const projectDir = fileURLToPath(new URL("..", import.meta.url))
const iconsDir = join(projectDir, "public", "icons")
async function tryDownload(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, { redirect: "follow" })
    if (!response.ok) return null
    const buf = Buffer.from(await response.arrayBuffer())
    if (buf.byteLength < 100) return null
    return buf
  } catch {
    return null
  }
}

async function downloadImage(host: string, outputPath: string, id: string) {
  const sources = [
    `https://icons.duckduckgo.com/ip3/${host}.ico`,
    `https://www.google.com/s2/favicons?domain=${host}&sz=64`,
    `https://icons.duckduckgo.com/ip3/${host.replace(/^www\./, "")}.ico`,
  ]
  for (const url of sources) {
    const buf = await tryDownload(url)
    if (buf) {
      fs.writeFileSync(outputPath, buf)
      consola.success(`${id}: downloaded successfully.`)
      return
    }
  }
  consola.error(`${id}: could not fetch favicon for ${host} from any provider.`)
}

async function main() {
  await Promise.all(
    Object.entries(originSources).map(async ([id, source]) => {
      try {
        const icon = join(iconsDir, `${id}.png`)
        if (fs.existsSync(icon)) {
          // consola.info(`${id}: icon exists. skip.`)
          return
        }
        if (!source.home) return
        const host = source.home.replace(/^https?:\/\//, "").replace(/\/.*$/, "")
        await downloadImage(host, icon, id)
      } catch (e) {
        consola.error(id, "\n", e)
      }
    }),
  )
}

main()
