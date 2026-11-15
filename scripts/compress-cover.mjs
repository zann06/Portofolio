// Compress a project cover with the Playwright Chromium we already have.
// Re-encodes to JPEG at a capped width + given quality. No extra deps.
// Usage: node scripts/compress-cover.mjs <in> <out> [maxWidth] [quality]
import { readFile, writeFile } from "node:fs/promises"

const PW = "file:///C:/Users/User/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs"
const { chromium } = await import(PW)

const [, , input, output, maxW = "1600", q = "82"] = process.argv
if (!input || !output) {
  console.error("usage: node scripts/compress-cover.mjs <in> <out> [maxWidth] [quality]")
  process.exit(1)
}

const src = await readFile(input)
const dataUrl = `data:image/jpeg;base64,${src.toString("base64")}`

const browser = await chromium.launch({
  executablePath:
    "C:/Users/User/AppData/Local/ms-playwright/chromium-1254/chrome-win64/chrome.exe",
})
const page = await browser.newPage()

const result = await page.evaluate(
  async ({ dataUrl, maxW, q }) => {
    const img = new Image()
    img.src = dataUrl
    await img.decode()

    const scale = Math.min(1, maxW / img.naturalWidth)
    const w = Math.round(img.naturalWidth * scale)
    const h = Math.round(img.naturalHeight * scale)

    const c = document.createElement("canvas")
    c.width = w
    c.height = h
    const ctx = c.getContext("2d")
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(img, 0, 0, w, h)

    return {
      srcW: img.naturalWidth,
      srcH: img.naturalHeight,
      outW: w,
      outH: h,
      b64: c.toDataURL("image/jpeg", q).split(",")[1],
    }
  },
  { dataUrl, maxW: Number(maxW), q: Number(q) }
)

await browser.close()

const buf = Buffer.from(result.b64, "base64")
await writeFile(output, buf)

console.log(
  JSON.stringify(
    {
      input,
      output,
      original: `${result.srcW}x${result.srcH}`,
      resized: `${result.outW}x${result.outH}`,
      bytesBefore: src.length,
      bytesAfter: buf.length,
      savedPct: Math.round((1 - buf.length / src.length) * 100) + "%",
    },
    null,
    2
  )
)
