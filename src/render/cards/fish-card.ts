import {
  createCard,
  drawBackground,
  drawBottomBar,
  drawRarityBadge,
  drawText,
  drawWrappedText,
  toAttachment,
} from '../canvas-base.js'
import { CARD, FONTS, TIERS, type CardTier } from '../theme.js'

export interface FishCardData {
  tier: CardTier // rarity
  emoji: string
  name: string // 한글
  scientificName?: string
  description: string
  sizeCm: number
  weightKg: number
  valueGold: number
  islandName: string
  weather?: { emoji: string; mod: number }
  eventLabel?: string // e.g. "✨ Golden Hour ×2", "🌊 Storm Catch", "🎉 Double Catch"
  isTrophy?: boolean // top-tier within size band
  isRecord?: boolean // near-max size
  secondCatch?: {
    emoji: string
    name: string
    sizeCm: number
    weightKg: number
    valueGold: number
    tier: CardTier
  }
}

export function renderFishCard(data: FishCardData) {
  const card = createCard(data.tier)
  const { ctx } = card
  drawBackground(card)

  // ── Top-left rarity badge ──
  drawRarityBadge(card, CARD.padding, CARD.padding, TIERS[data.tier].labelKr)

  // ── Top-right: weather + event label ──
  if (data.weather) {
    const weatherText = `${data.weather.emoji}  ×${data.weather.mod.toFixed(2)}`
    drawText(card, weatherText, CARD.width - CARD.padding, CARD.padding + 24, {
      align: 'right',
      size: FONTS.subtitleSize,
      weight: 'bold',
      color: '#FFFFFF',
      shadow: true,
    })
  }

  // Event label centered just below badge
  if (data.eventLabel) {
    drawText(card, data.eventLabel, CARD.width / 2, CARD.padding + 24, {
      align: 'center',
      size: FONTS.subtitleSize,
      weight: 'bold',
      color: '#FFFFFF',
      shadow: true,
    })
  }

  // ── Trophy / record stamp top-right under weather ──
  if (data.isRecord) {
    drawText(card, '🏆 RECORD', CARD.width - CARD.padding, CARD.padding + 60, {
      align: 'right',
      size: FONTS.smallSize,
      weight: 'bold',
      color: '#FFD700',
      shadow: true,
    })
  } else if (data.isTrophy) {
    drawText(card, '⭐ TROPHY', CARD.width - CARD.padding, CARD.padding + 60, {
      align: 'right',
      size: FONTS.smallSize,
      weight: 'bold',
      color: '#FDE68A',
      shadow: true,
    })
  }

  // ── Center: big emoji + name ──
  // Emoji on the left
  ctx.save()
  ctx.font = `120px "Sans KR", "Noto Color Emoji"`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(0,0,0,0.4)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 4
  ctx.fillText(data.emoji, 140, 200)
  ctx.restore()

  // Name on the right of emoji
  drawText(card, data.name, 250, 180, {
    size: FONTS.titleSize,
    weight: 'bold',
    color: '#FFFFFF',
    shadow: true,
    maxWidth: CARD.width - 250 - CARD.padding,
  })

  if (data.scientificName) {
    drawText(card, data.scientificName, 250, 215, {
      size: FONTS.smallSize,
      color: 'rgba(255,255,255,0.85)',
      shadow: true,
      maxWidth: CARD.width - 250 - CARD.padding,
    })
  }

  // Description (1-2 lines, wrapped)
  drawWrappedText(
    card,
    data.description,
    250,
    240,
    CARD.width - 250 - CARD.padding,
    24,
    {
      size: FONTS.bodySize,
      color: 'rgba(255,255,255,0.95)',
      shadow: true,
      baseline: 'top',
    },
  )

  // ── Bottom strip with stats ──
  drawBottomBar(card)
  const statsY = CARD.height - CARD.bottomBarHeight + 32
  const statsBaseline = CARD.height - CARD.bottomBarHeight + 58

  const sizeText =
    data.sizeCm >= 100
      ? `${(data.sizeCm / 100).toFixed(2)}m`
      : `${data.sizeCm.toFixed(1)}cm`
  const weightText =
    data.weightKg >= 1
      ? `${data.weightKg.toFixed(2)}kg`
      : `${(data.weightKg * 1000).toFixed(0)}g`

  const stats = [
    { icon: '📏', label: sizeText },
    { icon: '⚖️', label: weightText },
    { icon: '💰', label: `${data.valueGold.toLocaleString()}G` },
    { icon: '🏝️', label: data.islandName },
  ]

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

  // Second-catch banner overlay (double catch)
  if (data.secondCatch) {
    const secondTier = data.secondCatch.tier
    const secondPalette = TIERS[secondTier]
    const bannerY = 110
    const bannerH = 44
    ctx.save()
    ctx.fillStyle = secondPalette.dark
    ctx.globalAlpha = 0.85
    ctx.fillRect(0, bannerY, CARD.width, bannerH)
    ctx.globalAlpha = 1
    ctx.restore()
    const secondText = `🎉 +1 ${data.secondCatch.emoji} ${data.secondCatch.name} · ${data.secondCatch.sizeCm.toFixed(1)}cm · ${data.secondCatch.valueGold.toLocaleString()}G`
    drawText(card, secondText, CARD.width / 2, bannerY + bannerH / 2 + 6, {
      align: 'center',
      size: FONTS.smallSize,
      weight: 'bold',
      color: '#FFFFFF',
    })
  }

  return toAttachment(card.canvas, 'fish.png')
}
