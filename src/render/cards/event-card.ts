import {
  createCard,
  drawBackground,
  drawBottomBar,
  drawRarityBadge,
  drawText,
  drawWrappedText,
  toAttachment,
} from '../canvas-base.js'
import { CARD, FONTS, type CardTier } from '../theme.js'

// Generic event card used for treasure / sea monster / dangerous catch / no-bite / line break.
// Lets the caller drive the visual identity via tier + custom labels.

export interface EventCardData {
  tier: CardTier
  badge?: string // override badge label, falls back to tier label
  emoji: string
  title: string
  body: string
  islandName: string
  stats?: { icon: string; label: string }[]
}

export function renderEventCard(data: EventCardData) {
  const card = createCard(data.tier)
  const { ctx } = card
  drawBackground(card)

  drawRarityBadge(card, CARD.padding, CARD.padding, data.badge)

  // Big emoji
  ctx.save()
  ctx.font = `140px "Sans KR", "Noto Color Emoji"`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 10
  ctx.shadowOffsetY = 4
  ctx.fillText(data.emoji, 150, 210)
  ctx.restore()

  // Title
  drawText(card, data.title, 270, 175, {
    size: FONTS.titleSize,
    weight: 'bold',
    color: '#FFFFFF',
    shadow: true,
    maxWidth: CARD.width - 270 - CARD.padding,
  })

  // Wrapped body text
  drawWrappedText(
    card,
    data.body,
    270,
    215,
    CARD.width - 270 - CARD.padding,
    26,
    {
      size: FONTS.bodySize,
      color: 'rgba(255,255,255,0.95)',
      shadow: true,
      baseline: 'top',
    },
  )

  // Bottom strip
  drawBottomBar(card)
  const statsY = CARD.height - CARD.bottomBarHeight + 32
  const statsBaseline = CARD.height - CARD.bottomBarHeight + 58

  const stats = data.stats ?? [{ icon: '🏝️', label: data.islandName }]
  const colWidth = CARD.width / stats.length
  for (let i = 0; i < stats.length; i++) {
    const cx = colWidth * i + colWidth / 2
    drawText(card, stats[i].icon, cx, statsY, {
      align: 'center',
      size: 22,
      color: '#FFFFFF',
    })
    drawText(card, stats[i].label, cx, statsBaseline, {
      align: 'center',
      size: FONTS.smallSize,
      weight: 'bold',
      color: '#FFFFFF',
      maxWidth: colWidth - 16,
    })
  }

  return toAttachment(card.canvas, 'event.png')
}
