import { createCanvas, type SKRSContext2D, type Canvas } from '@napi-rs/canvas'
import { AttachmentBuilder } from 'discord.js'
import { CARD, FONTS, TIERS, type CardTier } from './theme.js'
import { ensureFontsRegistered } from './fonts.js'

ensureFontsRegistered()

export interface CardCanvas {
  canvas: Canvas
  ctx: SKRSContext2D
  tier: CardTier
}

export function createCard(
  tier: CardTier,
  width = CARD.width,
  height = CARD.height,
): CardCanvas {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d') as SKRSContext2D
  return { canvas, ctx, tier }
}

// Outer rounded rect, gradient fill, abstract decorative shapes.
export function drawBackground(card: CardCanvas) {
  const { ctx, tier, canvas } = card
  const { width, height } = canvas
  const palette = TIERS[tier]

  // Clip to rounded rectangle
  ctx.save()
  roundedRectPath(ctx, 0, 0, width, height, CARD.cornerRadius)
  ctx.clip()

  // Vertical gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, palette.light)
  gradient.addColorStop(0.55, palette.base)
  gradient.addColorStop(1, palette.dark)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Abstract decorative shapes — translucent geometry on top of the gradient.
  // Deterministic layout per tier so each card looks consistent.
  ctx.globalAlpha = 0.12
  ctx.fillStyle = palette.accent

  // Big circle top-right
  ctx.beginPath()
  ctx.arc(width - 80, 80, 160, 0, Math.PI * 2)
  ctx.fill()

  // Diamond center-bottom
  ctx.beginPath()
  ctx.moveTo(width * 0.35, height - 60)
  ctx.lineTo(width * 0.45, height - 140)
  ctx.lineTo(width * 0.55, height - 60)
  ctx.lineTo(width * 0.45, height + 20)
  ctx.closePath()
  ctx.fill()

  // Wave path bottom-left
  ctx.beginPath()
  ctx.moveTo(-20, height - 30)
  ctx.bezierCurveTo(
    width * 0.2,
    height - 110,
    width * 0.35,
    height + 40,
    width * 0.55,
    height - 20,
  )
  ctx.lineTo(-20, height + 20)
  ctx.closePath()
  ctx.fill()

  // Small accent circle top-left
  ctx.beginPath()
  ctx.arc(60, 60, 36, 0, Math.PI * 2)
  ctx.fill()

  ctx.globalAlpha = 1
  ctx.restore()
}

export function drawRarityBadge(
  card: CardCanvas,
  x: number,
  y: number,
  labelOverride?: string,
) {
  const { ctx, tier } = card
  const palette = TIERS[tier]
  const label = labelOverride ?? palette.label
  ctx.save()

  ctx.font = `bold ${FONTS.badgeSize}px "Sans KR Bold", "Noto Color Emoji"`
  const textWidth = ctx.measureText(label).width
  const padding = CARD.badgePadding
  const badgeWidth = textWidth + padding * 2
  const badgeHeight = CARD.badgeHeight

  // Pill background (white-ish, semi-transparent over tier color)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'
  roundedRectPath(ctx, x, y, badgeWidth, badgeHeight, badgeHeight / 2)
  ctx.fill()

  // Tier-colored border
  ctx.strokeStyle = palette.dark
  ctx.lineWidth = 2
  roundedRectPath(ctx, x, y, badgeWidth, badgeHeight, badgeHeight / 2)
  ctx.stroke()

  // Label text
  ctx.fillStyle = palette.dark
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillText(label, x + padding, y + badgeHeight / 2 + 1)

  ctx.restore()
  return { width: badgeWidth, height: badgeHeight }
}

export function drawBottomBar(card: CardCanvas) {
  const { ctx, canvas } = card
  const y = canvas.height - CARD.bottomBarHeight
  ctx.save()
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
  ctx.fillRect(0, y, canvas.width, CARD.bottomBarHeight)
  ctx.restore()
}

export interface TextOpts {
  font?: string
  size?: number
  weight?: 'normal' | 'bold'
  color?: string
  align?: CanvasTextAlign
  baseline?: CanvasTextBaseline
  maxWidth?: number
  shadow?: boolean
}

export function drawText(
  card: CardCanvas,
  text: string,
  x: number,
  y: number,
  opts: TextOpts = {},
) {
  const { ctx } = card
  const size = opts.size ?? FONTS.bodySize
  const weight = opts.weight ?? 'normal'
  const family = weight === 'bold' ? '"Sans KR Bold", "Noto Color Emoji"' : '"Sans KR", "Noto Color Emoji"'
  ctx.save()
  ctx.font = `${weight === 'bold' ? 'bold ' : ''}${size}px ${family}`
  ctx.fillStyle = opts.color ?? '#FFFFFF'
  ctx.textAlign = opts.align ?? 'left'
  ctx.textBaseline = opts.baseline ?? 'alphabetic'

  if (opts.shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetY = 2
  }

  if (opts.maxWidth && ctx.measureText(text).width > opts.maxWidth) {
    // Ellipsize
    let truncated = text
    while (
      truncated.length > 0 &&
      ctx.measureText(truncated + '…').width > opts.maxWidth
    ) {
      truncated = truncated.slice(0, -1)
    }
    text = truncated + '…'
  }

  ctx.fillText(text, x, y)
  ctx.restore()
}

// Word-wrapped text in a fixed-width box. Returns final y position.
export function drawWrappedText(
  card: CardCanvas,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  opts: TextOpts = {},
): number {
  const { ctx } = card
  const size = opts.size ?? FONTS.bodySize
  const weight = opts.weight ?? 'normal'
  const family = weight === 'bold' ? '"Sans KR Bold", "Noto Color Emoji"' : '"Sans KR", "Noto Color Emoji"'
  ctx.save()
  ctx.font = `${weight === 'bold' ? 'bold ' : ''}${size}px ${family}`
  ctx.fillStyle = opts.color ?? '#FFFFFF'
  ctx.textBaseline = opts.baseline ?? 'top'
  if (opts.shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetY = 2
  }

  const words = text.split('')
  let line = ''
  let cursorY = y
  for (const ch of words) {
    if (ch === '\n') {
      ctx.fillText(line, x, cursorY)
      line = ''
      cursorY += lineHeight
      continue
    }
    const test = line + ch
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, cursorY)
      line = ch
      cursorY += lineHeight
    } else {
      line = test
    }
  }
  if (line.length > 0) ctx.fillText(line, x, cursorY)
  ctx.restore()
  return cursorY + lineHeight
}

function roundedRectPath(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export function toAttachment(canvas: Canvas, name: string) {
  const buffer = canvas.toBuffer('image/png')
  return new AttachmentBuilder(buffer, { name })
}
