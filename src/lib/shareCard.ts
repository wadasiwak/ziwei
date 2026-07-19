// 命盤概要分享卡：把命盤重點畫成一張 900×1200 的圖（canvas），
// 手機優先走系統分享面板（navigator.share，可直傳 LINE/IG），否則下載 PNG。
import type FunctionalAstrolabe from 'iztro/lib/astro/FunctionalAstrolabe'
import { findReading } from '../content/starInPalace'
import type { BirthInput } from './chart'
import type { Pattern } from './patterns'

const W = 900
const H = 1200
const FONT = "'PingFang TC','Noto Sans TC','Microsoft JhengHei',sans-serif"

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export async function makeChartCard(
  chart: FunctionalAstrolabe,
  input: BirthInput,
  patterns: Pattern[],
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // 背景：與站上同色系的深紫夜空
  ctx.fillStyle = '#14121c'
  ctx.fillRect(0, 0, W, H)
  const g1 = ctx.createRadialGradient(W * 0.85, -50, 0, W * 0.85, -50, 700)
  g1.addColorStop(0, 'rgba(201,168,106,0.14)')
  g1.addColorStop(1, 'rgba(201,168,106,0)')
  ctx.fillStyle = g1
  ctx.fillRect(0, 0, W, H)
  const g2 = ctx.createRadialGradient(0, H, 0, 0, H, 700)
  g2.addColorStop(0, 'rgba(107,92,165,0.18)')
  g2.addColorStop(1, 'rgba(107,92,165,0)')
  ctx.fillStyle = g2
  ctx.fillRect(0, 0, W, H)

  // 標題
  ctx.textAlign = 'center'
  ctx.fillStyle = '#e8c987'
  ctx.font = `600 46px ${FONT}`
  ctx.fillText(`✦ ${input.name} 的紫微命盤`, W / 2, 110)
  ctx.fillStyle = '#8f89a8'
  ctx.font = `26px ${FONT}`
  ctx.fillText(`國曆 ${chart.solarDate}・${chart.time}（${chart.timeRange}）・${chart.gender}`, W / 2, 164)
  ctx.fillText(`農曆 ${chart.lunarDate}`, W / 2, 204)

  // 命盤重點：命宮主星（空宮借對宮）
  const soul = chart.palaces.find((p) => p.name === '命宮')!
  const bodyPalace = chart.palaces.find((p) => p.isBodyPalace)!
  const borrowed = soul.majorStars.length === 0 ? chart.palaces[(soul.index + 6) % 12] : null
  const soulStars = (borrowed ?? soul).majorStars.map((s) => s.name)
  const soulLine = borrowed
    ? `空宮（借對宮 ${soulStars.join('、')}）`
    : soulStars.join('、')

  // 資訊面板
  const panelX = 90
  const panelW = W - 180
  const panelY = 260
  const rows: [string, string][] = [
    ['命宮主星', `${soulLine}（${soul.earthlyBranch}宮）`],
    ['身宮', `${bodyPalace.name}（${bodyPalace.earthlyBranch}宮）`],
    ['五行局', chart.fiveElementsClass],
    ['命主／身主', `${chart.soul}／${chart.body}`],
    ['生肖・星座', `${chart.zodiac}・${chart.sign}`],
  ]
  const rowH = 66
  const panelH = rows.length * rowH + 40
  ctx.fillStyle = 'rgba(30,27,42,0.85)'
  roundRect(ctx, panelX, panelY, panelW, panelH, 18)
  ctx.fill()
  ctx.strokeStyle = '#3a3552'
  ctx.lineWidth = 2
  roundRect(ctx, panelX, panelY, panelW, panelH, 18)
  ctx.stroke()

  rows.forEach(([label, value], i) => {
    const y = panelY + 62 + i * rowH
    ctx.textAlign = 'left'
    ctx.fillStyle = '#8f89a8'
    ctx.font = `26px ${FONT}`
    ctx.fillText(label, panelX + 44, y)
    ctx.textAlign = 'right'
    ctx.fillStyle = '#d8d4e8'
    ctx.font = `600 28px ${FONT}`
    ctx.fillText(value, panelX + panelW - 44, y)
  })

  // 格局徽章（最多 4 個，膠囊外框排一排，太多就換行）
  let y = panelY + panelH + 80
  if (patterns.length > 0) {
    ctx.textAlign = 'center'
    ctx.fillStyle = '#8f89a8'
    ctx.font = `24px ${FONT}`
    ctx.fillText('本盤格局', W / 2, y)
    y += 50
    const names = patterns.slice(0, 4).map((p) => p.name)
    ctx.font = `600 28px ${FONT}`
    const padX = 26
    const gapX = 20
    const widths = names.map((n) => ctx.measureText(n).width + padX * 2)
    // 簡單流式排版：一列排不下就換行
    let line: number[] = []
    let lineW = 0
    const flush = () => {
      let x = (W - (lineW - gapX)) / 2
      for (const idx of line) {
        const w = widths[idx]
        ctx.strokeStyle = '#8a7448'
        ctx.lineWidth = 2
        roundRect(ctx, x, y - 32, w, 48, 24)
        ctx.stroke()
        ctx.fillStyle = '#e8c987'
        ctx.textAlign = 'center'
        ctx.fillText(names[idx], x + w / 2, y + 2)
        x += w + gapX
      }
      line = []
      lineW = 0
      y += 66
    }
    names.forEach((_, i) => {
      if (lineW + widths[i] + gapX > panelW && line.length > 0) flush()
      line.push(i)
      lineW += widths[i] + gapX
    })
    if (line.length > 0) flush()
    y += 30
  }

  // 一句話（取命宮主星的解讀標題）
  const firstStar = soulStars[0]
  const titleEntry = firstStar ? findReading(firstStar, '命宮') : undefined
  if (titleEntry) {
    ctx.textAlign = 'center'
    ctx.fillStyle = '#c9a86a'
    ctx.font = `600 40px ${FONT}`
    ctx.fillText(`「${titleEntry.title}」`, W / 2, y + 40)
    y += 100
  }

  // 底部站名
  ctx.textAlign = 'center'
  ctx.fillStyle = '#8f89a8'
  ctx.font = `24px ${FONT}`
  ctx.fillText('紫微斗數排盤 ✦ wadasiwak.github.io/ziwei', W / 2, H - 90)
  ctx.fillStyle = '#5f5a76'
  ctx.font = `20px ${FONT}`
  ctx.fillText('點宮位看解讀・流年流月・僅供參考與娛樂', W / 2, H - 52)

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  )
}

// 手機走系統分享面板，桌機直接下載
export async function shareOrDownload(blob: Blob, filename: string): Promise<void> {
  const file = new File([blob], filename, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return
    } catch {
      // 用戶取消分享面板就退回下載
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
