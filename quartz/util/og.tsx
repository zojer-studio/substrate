import { FontWeight, SatoriOptions } from "satori/wasm"
import { GlobalConfiguration } from "../cfg"
import { QuartzPluginData } from "../plugins/vfile"
import { JSXInternal } from "preact/src/jsx"
import { FontSpecification, ThemeKey } from "./theme"

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

// Cache for memoizing font data
const fontCache = new Map<string, Promise<ArrayBuffer>>()

/**
 * Get the `.ttf` file of a google font
 * @param fontName name of google font
 * @param weight what font weight to fetch font
 * @returns `.ttf` file of google font
 */
export async function fetchTtf(fontName: string, weight: FontWeight): Promise<ArrayBuffer> {
  const cacheKey = `${fontName}-${weight}`
  if (fontCache.has(cacheKey)) {
    return fontCache.get(cacheKey)!
  }

  // If not in cache, fetch and store the promise
  const fontPromise = (async () => {
    try {
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

      // fontData is an ArrayBuffer containing the .ttf file data (get match[1] due to google fonts response format, always contains link twice, but second entry is the "raw" link)
      const fontResponse = await fetch(match[1])
      return await fontResponse.arrayBuffer()
    } catch (error) {
      throw new Error(`Error fetching font: ${error}`)
    }
  })()

  fontCache.set(cacheKey, fontPromise)
  return fontPromise
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
  _fileData: QuartzPluginData,
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
        gap: "2rem",
        padding: "1.5rem 5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          flexDirection: "row",
          gap: "2.5rem",
        }}
      >
        <img src={iconPath} width={135} height={135} />
        <div
          style={{
            display: "flex",
            color: cfg.theme.colors[colorScheme].dark,
            fontSize: useSmallerFont ? 70 : 82,
            fontFamily: fonts[0].name,
            maxWidth: "70%",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          <p
            style={{
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </p>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          color: cfg.theme.colors[colorScheme].dark,
          fontSize: 44,
          fontFamily: fonts[1].name,
          maxWidth: "100%",
          maxHeight: "40%",
          overflow: "hidden",
        }}
      >
        <p
          style={{
            margin: 0,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 3,
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
