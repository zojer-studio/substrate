import { promises as fs } from "fs"
import { FontWeight, SatoriOptions } from "satori/wasm"
import { GlobalConfiguration } from "../cfg"
import { QuartzPluginData } from "../plugins/vfile"
import { JSXInternal } from "preact/src/jsx"
import { FontSpecification, ThemeKey } from "./theme"
import path from "path"
import { QUARTZ } from "./path"

const defaultHeaderWeight = [700]
const defaultBodyWeight = [400]
export async function getSatoriFonts(headerFont: FontSpecification, bodyFont: FontSpecification) {
  // Get all weights for header and body fonts
  const headerWeights: FontWeight[] = (
    typeof headerFont === "string"
      ? defaultHeaderWeight
      : (headerFont.weights ?? defaultHeaderWeight)
  ) as FontWeight[]
  const bodyWeights: FontWeight[] = (
    typeof bodyFont === "string" ? defaultBodyWeight : (bodyFont.weights ?? defaultBodyWeight)
  ) as FontWeight[]

  const headerFontName = typeof headerFont === "string" ? headerFont : headerFont.name
  const bodyFontName = typeof bodyFont === "string" ? bodyFont : bodyFont.name

  // Fetch fonts for all weights
  const headerFontPromises = headerWeights.map((weight) => fetchTtf(headerFontName, weight))
  const bodyFontPromises = bodyWeights.map((weight) => fetchTtf(bodyFontName, weight))

  const [headerFontData, bodyFontData] = await Promise.all([
    Promise.all(headerFontPromises),
    Promise.all(bodyFontPromises),
  ])

  // Convert fonts to satori font format and return
  const fonts: SatoriOptions["fonts"] = [
    ...headerFontData.map((data, idx) => ({
      name: headerFontName,
      data,
      weight: headerWeights[idx],
      style: "normal" as const,
    })),
    ...bodyFontData.map((data, idx) => ({
      name: bodyFontName,
      data,
      weight: bodyWeights[idx],
      style: "normal" as const,
    })),
  ]

  return fonts
}

/**
 * Get the `.ttf` file of a google font
 * @param fontName name of google font
 * @param weight what font weight to fetch font
 * @returns `.ttf` file of google font
 */
export async function fetchTtf(
  fontName: string,
  weight: FontWeight,
): Promise<Buffer<ArrayBufferLike>> {
  const cacheKey = `${fontName.replaceAll(" ", "-")}-${weight}`
  const cacheDir = path.join(QUARTZ, ".quartz-cache", "fonts")
  const cachePath = path.join(cacheDir, cacheKey)

  // Check if font exists in cache
  try {
    await fs.access(cachePath)
    return fs.readFile(cachePath)
  } catch (error) {
    // ignore errors and fetch font
  }

  // Get css file from google fonts
  const cssResponse = await fetch(
    `https://fonts.googleapis.com/css2?family=${fontName}:wght@${weight}`,
  )
  const css = await cssResponse.text()

  // Extract .ttf url from css file
  const urlRegex = /url\((https:\/\/fonts.gstatic.com\/s\/.*?.ttf)\)/g
  const match = urlRegex.exec(css)

  if (!match) {
    throw new Error("Could not fetch font")
  }

  // fontData is an ArrayBuffer containing the .ttf file data
  const fontResponse = await fetch(match[1])
  const fontData = Buffer.from(await fontResponse.arrayBuffer())

  try {
    await fs.mkdir(cacheDir, { recursive: true })
    await fs.writeFile(cachePath, fontData)
  } catch (error) {
    console.warn(`Failed to cache font: ${error}`)
    // Continue even if caching fails
  }

  return fontData
}

export type SocialImageOptions = {
  /**
   * What color scheme to use for image generation (uses colors from config theme)
   */
  colorScheme: ThemeKey
  /**
   * Height to generate image with in pixels (should be around 630px)
   */
  height: number
  /**
   * Width to generate image with in pixels (should be around 1200px)
   */
  width: number
  /**
   * Whether to use the auto generated image for the root path ("/", when set to false) or the default og image (when set to true).
   */
  excludeRoot: boolean
  /**
   * JSX to use for generating image. See satori docs for more info (https://github.com/vercel/satori)
   * @param cfg global quartz config
   * @param userOpts options that can be set by user
   * @param title title of current page
   * @param description description of current page
   * @param fonts global font that can be used for styling
   * @param fileData full fileData of current page
   * @returns prepared jsx to be used for generating image
   */
  imageStructure: (
    cfg: GlobalConfiguration,
    userOpts: UserOpts,
    title: string,
    description: string,
    fonts: SatoriOptions["fonts"],
    fileData: QuartzPluginData,
  ) => JSXInternal.Element
}

export type UserOpts = Omit<SocialImageOptions, "imageStructure">

export type ImageOptions = {
  /**
   * what title to use as header in image
   */
  title: string
  /**
   * what description to use as body in image
   */
  description: string
  /**
   * header + body font to be used when generating satori image (as promise to work around sync in component)
   */
  fonts: SatoriOptions["fonts"]
  /**
   * `GlobalConfiguration` of quartz (used for theme/typography)
   */
  cfg: GlobalConfiguration
  /**
   * full file data of current page
   */
  fileData: QuartzPluginData
}

// This is the default template for generated social image.
export const defaultImage: SocialImageOptions["imageStructure"] = (
  cfg: GlobalConfiguration,
  { colorScheme }: UserOpts,
  title: string,
  description: string,
  fonts: SatoriOptions["fonts"],
  fileData: QuartzPluginData,
) => {
  const fontBreakPoint = 22
  const useSmallerFont = title.length > fontBreakPoint
  const iconPath = `https://${cfg.baseUrl}/static/icon.png`

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        width: "100%",
        backgroundColor: cfg.theme.colors[colorScheme].light,
        gap: "1rem",
        padding: "3rem 3rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          flexDirection: "row",
          gap: "2rem",
        }}
      >
        <div
          style={{
            display: "flex",
            border: "1px solid red",
          }}
        >
          <img src={iconPath} width={135} height={135} />
        </div>
        <div
          style={{
            display: "flex",
            color: cfg.theme.colors[colorScheme].dark,
            maxWidth: "80%",
          }}
        >
          <h1
            style={{
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: useSmallerFont ? 64 : 72,
              fontFamily: fonts[0].name,
            }}
          >
            {title}
          </h1>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          color: cfg.theme.colors[colorScheme].dark,
          fontSize: 44,
          fontFamily: fonts[1].name,
          maxWidth: "100%",
          maxHeight: "60%",
          overflow: "hidden",
        }}
      >
        <p
          style={{
            margin: 0,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 5,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {description}
        </p>
      </div>
    </div>
  )
}
