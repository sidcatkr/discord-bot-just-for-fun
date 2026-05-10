import { createCanvas, type SKRSContext2D } from '@napi-rs/canvas'
import { ensureFontsRegistered } from '../fonts.js'
import { FONTS, TIERS, type CardTier } from '../theme.js'
import { toAttachment } from '../canvas-base.js'

ensureFontsRegistered()

export interface CodexEntry {
  tier: CardTier
  emoji: string
  name: string
  found: boolean
}

export interface CodexPageData {
  username: string
  page: number
  totalPages: number
  collected: number
  total: number
  entries: CodexEntry[] // up to 12 per page (4×3)
}

const PAGE_W = 960
const PAGE_H = 720
const HEADER_H = 100
const FOOTER_H = 50
const COLS = 4
const ROWS = 3
const CELL_PAD = 16

export function renderCodexPage(data: CodexPageData) {
  const canvas = createCanvas(PAGE_W, PAGE_H)
  const ctx = canvas.getContext('2d') as SKRSContext2D

  // Background
  ctx.fillStyle = '#0F172A'
  ctx.fillRect(0, 0, PAGE_W, PAGE_H)

  // Subtle radial vignette
  const grad = ctx.createRadialGradient(
    PAGE_W / 2,
    PAGE_H / 2,
    100,
    PAGE_W / 2,
    PAGE_H / 2,
    PAGE_W,
  )
  grad.addColorStop(0, 'rgba(255,255,255,0.04)')
  grad.addColorStop(1, 'rgba(0,0,0,0.4)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, PAGE_W, PAGE_H)

  // Header
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `bold 32px "Sans KR Bold", "Noto Color Emoji"`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(`📖 ${data.username}의 물고기 도감`, 32, HEADER_H / 2)

  ctx.font = `18px "Sans KR", "Noto Color Emoji"`
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.textAlign = 'right'
  const pct = data.total ? ((data.collected / data.total) * 100).toFixed(1) : '0'
  ctx.fillText(
    `${data.collected}/${data.total} (${pct}%)  ·  Page ${data.page}/${data.totalPages}`,
    PAGE_W - 32,
    HEADER_H / 2,
  )

  // Grid
  const gridY = HEADER_H
  const gridH = PAGE_H - HEADER_H - FOOTER_H
  const cellW = (PAGE_W - CELL_PAD * (COLS + 1)) / COLS
  const cellH = (gridH - CELL_PAD * (ROWS + 1)) / ROWS

  for (let i = 0; i < COLS * ROWS; i++) {
    const entry = data.entries[i]
    const col = i % COLS
    const row = Math.floor(i / COLS)
    const x = CELL_PAD + col * (cellW + CELL_PAD)
    const y = gridY + CELL_PAD + row * (cellH + CELL_PAD)

    drawCell(ctx, x, y, cellW, cellH, entry)
  }

  // Footer
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = `14px "Sans KR", "Noto Color Emoji"`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(
    '낚시로 새로운 물고기를 발견하세요!',
    PAGE_W / 2,
    PAGE_H - FOOTER_H / 2,
  )

  return toAttachment(canvas, `codex-${data.page}.png`)
}

function drawCell(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  entry: CodexEntry | undefined,
) {
  const r = 16

  if (!entry) {
    // Empty placeholder
    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    roundedRect(ctx, x, y, w, h, r)
    ctx.fill()
    return
  }

  const palette = TIERS[entry.tier]

  // Card background with rarity gradient
  const grad = ctx.createLinearGradient(x, y, x, y + h)
  grad.addColorStop(0, palette.light)
  grad.addColorStop(1, palette.dark)
  ctx.save()
  ctx.fillStyle = grad
  if (!entry.found) {
    ctx.globalAlpha = 0.18
  }
  roundedRect(ctx, x, y, w, h, r)
  ctx.fill()
  ctx.restore()

  // Border
  ctx.strokeStyle = entry.found ? palette.accent : 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 2
  roundedRect(ctx, x, y, w, h, r)
  ctx.stroke()

  // Emoji
  ctx.save()
  ctx.font = `64px "Sans KR", "Noto Color Emoji"`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (entry.found) {
    ctx.shadowColor = 'rgba(0,0,0,0.45)'
    ctx.shadowBlur = 6
  } else {
    ctx.globalAlpha = 0.4
  }
  ctx.fillText(entry.found ? entry.emoji : '❓', x + w / 2, y + h / 2 - 14)
  ctx.restore()

  // Name (or ???)
  ctx.fillStyle = entry.found ? '#FFFFFF' : 'rgba(255,255,255,0.4)'
  ctx.font = `bold ${FONTS.smallSize}px "Sans KR Bold", "Noto Color Emoji"`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const label = entry.found ? entry.name : '???'
  // Truncate long names
  const maxW = w - 12
  let display = label
  while (display.length > 0 && ctx.measureText(display).width > maxW) {
    display = display.slice(0, -1)
  }
  if (display !== label) display = display.slice(0, -1) + '…'
  ctx.fillText(display, x + w / 2, y + h - 22)
}

function roundedRect(
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
