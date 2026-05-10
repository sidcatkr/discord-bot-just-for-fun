import { GlobalFonts } from '@napi-rs/canvas'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Resolve assets/fonts/ regardless of dev (src/) or build location.
const fontsDir = path.resolve(__dirname, '..', '..', 'assets', 'fonts')

let registered = false

export function ensureFontsRegistered() {
  if (registered) return
  const regular = path.join(fontsDir, 'NotoSansKR-Regular.ttf')
  const bold = path.join(fontsDir, 'NotoSansKR-Bold.ttf')

  if (fs.existsSync(regular)) {
    GlobalFonts.registerFromPath(regular, 'Sans KR')
  } else {
    console.warn(`[render] Missing font: ${regular}`)
  }
  if (fs.existsSync(bold)) {
    GlobalFonts.registerFromPath(bold, 'Sans KR Bold')
  } else {
    console.warn(`[render] Missing font: ${bold}`)
  }

  // Color emoji fallback. @napi-rs/canvas falls back to other registered
  // families when a glyph is missing in the primary font.
  const emoji = path.join(fontsDir, 'NotoColorEmoji.ttf')
  if (fs.existsSync(emoji)) {
    GlobalFonts.registerFromPath(emoji, 'Noto Color Emoji')
  }

  registered = true
}
