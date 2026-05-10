import {
  createCard,
  drawBackground,
  drawBottomBar,
  drawRarityBadge,
  drawText,
  drawWrappedText,
  toAttachment,
} from '../canvas-base.js'
import { CARD, FONTS } from '../theme.js'

export interface TrashCardData {
  emoji: string
  name: string
  description: string
  disposalCost: number
  pollutionAmount: number
  islandName: string
  pollutionLevel: number // 0-10
}

export function renderTrashCard(data: TrashCardData) {
  const card = createCard('trash')
  const { ctx } = card
  drawBackground(card)

  drawRarityBadge(card, CARD.padding, CARD.padding)

  drawText(card, '🗑️ 쓰레기를 낚았다...', CARD.width / 2, CARD.padding + 24, {
    align: 'center',
    size: FONTS.subtitleSize,
    weight: 'bold',
    color: '#FFF8F0',
    shadow: true,
  })

  // Big trash emoji
  ctx.save()
  ctx.font = `120px "Sans KR", "Noto Color Emoji"`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(0,0,0,0.4)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 4
  ctx.fillText(data.emoji, 140, 200)
  ctx.restore()

  drawText(card, data.name, 250, 180, {
    size: FONTS.titleSize,
    weight: 'bold',
    color: '#FFF8F0',
    shadow: true,
    maxWidth: CARD.width - 250 - CARD.padding,
  })

  drawWrappedText(
    card,
    data.description,
    250,
    220,
    CARD.width - 250 - CARD.padding,
    24,
    {
      size: FONTS.bodySize,
      color: 'rgba(255,248,240,0.95)',
      shadow: true,
      baseline: 'top',
    },
  )

  drawBottomBar(card)
  const statsY = CARD.height - CARD.bottomBarHeight + 32
  const statsBaseline = CARD.height - CARD.bottomBarHeight + 58

  const stats = [
    { icon: '💸', label: `처리 ${data.disposalCost}G` },
    { icon: '🏭', label: `오염 +${data.pollutionAmount.toFixed(1)}` },
    { icon: '🌊', label: `${data.pollutionLevel.toFixed(1)}/10` },
    { icon: '🏝️', label: data.islandName },
  ]
  const colWidth = CARD.width / stats.length
  for (let i = 0; i < stats.length; i++) {
    const cx = colWidth * i + colWidth / 2
    drawText(card, stats[i].icon, cx, statsY, {
      align: 'center',
      size: 22,
      color: '#FFF8F0',
    })
    drawText(card, stats[i].label, cx, statsBaseline, {
      align: 'center',
      size: FONTS.smallSize,
      weight: 'bold',
      color: '#FFF8F0',
      maxWidth: colWidth - 16,
    })
  }

  return toAttachment(card.canvas, 'trash.png')
}
