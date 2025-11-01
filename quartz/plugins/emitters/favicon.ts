import { promises as fs } from "fs"
import path from "path"
import { joinSegments, QUARTZ, FullSlug } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import { write } from "./helpers"
import { BuildCtx } from "../../util/ctx"

export const Favicon: QuartzEmitterPlugin = () => ({
  name: "Favicon",
  async *emit({ argv }) {
    const faviconDir = joinSegments(QUARTZ, "..", "public", "favicon")
    const faviconFiles = [
      "favicon.ico",
      "favicon-16x16.png",
      "favicon-32x32.png",
      "apple-touch-icon.png",
      "android-chrome-192x192.png",
      "android-chrome-512x512.png",
      "site.webmanifest",
    ]

    for (const file of faviconFiles) {
      const filePath = path.join(faviconDir, file)
      try {
        const content = await fs.readFile(filePath)
        yield write({
          ctx: { argv } as BuildCtx,
          slug: `favicon/${path.parse(file).name}` as FullSlug,
          ext: path.extname(file),
          content,
        })
      } catch (e) {
        console.warn(`Could not read favicon file: ${file}`)
      }
    }
  },
  async *partialEmit() {},
})
