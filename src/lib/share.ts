import type { BirthInput } from './chart'

// 生日參數 ↔ URL query，讓命盤可以用連結分享（資料只在網址裡，不經伺服器）。
export function inputToParams(input: BirthInput): string {
  const p = new URLSearchParams()
  p.set('d', input.date)
  p.set('t', String(input.timeIndex))
  p.set('g', input.gender)
  if (input.calendar === 'lunar') p.set('cal', 'lunar')
  if (input.isLeapMonth) p.set('leap', '1')
  if (input.name && input.name !== '未命名') p.set('n', input.name)
  return p.toString()
}

export function paramsToInput(search: string): BirthInput | null {
  const p = new URLSearchParams(search)
  const date = p.get('d')
  const t = p.get('t')
  const g = p.get('g')
  if (!date || t === null || (g !== '男' && g !== '女')) return null
  if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(date)) return null
  const timeIndex = Number(t)
  if (!Number.isInteger(timeIndex) || timeIndex < 0 || timeIndex > 12) return null
  return {
    name: p.get('n') ?? '未命名',
    gender: g,
    calendar: p.get('cal') === 'lunar' ? 'lunar' : 'solar',
    date,
    timeIndex,
    isLeapMonth: p.get('leap') === '1',
  }
}

export function shareUrl(input: BirthInput): string {
  return `${location.origin}${location.pathname}?${inputToParams(input)}`
}
