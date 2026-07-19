import type { BirthInput } from './chart'

const PALACE_NAMES = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '僕役', '官祿', '田宅', '福德', '父母']

/** 目前檢視狀態：選中宮位／流年／流月／大限，讓分享連結能還原到同一個視圖 */
export type ViewState = {
  palace: string | null
  year: number
  month: number | null
  /** 選中的大限（大限宮在 palaces[] 的索引 0–11） */
  decadal: number | null
}

// 生日參數 ↔ URL query，讓命盤可以用連結分享（資料只在網址裡，不經伺服器）。
export function inputToParams(input: BirthInput, view?: ViewState): string {
  const p = new URLSearchParams()
  p.set('d', input.date)
  p.set('t', String(input.timeIndex))
  p.set('g', input.gender)
  if (input.calendar === 'lunar') p.set('cal', 'lunar')
  if (input.isLeapMonth) p.set('leap', '1')
  if (input.name && input.name !== '未命名') p.set('n', input.name)
  if (view) {
    if (view.palace) p.set('p', view.palace)
    if (view.year !== new Date().getFullYear()) p.set('y', String(view.year))
    if (view.month !== null) p.set('m', String(view.month))
    if (view.decadal !== null) p.set('dl', String(view.decadal)) // d 已被生日佔用，大限用 dl
  }
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

/** 從網址還原檢視狀態（宮位／流年／流月），無效值一律忽略 */
export function paramsToView(search: string): Partial<ViewState> {
  const p = new URLSearchParams(search)
  const view: Partial<ViewState> = {}
  const palace = p.get('p')
  if (palace && PALACE_NAMES.includes(palace)) view.palace = palace
  const y = Number(p.get('y'))
  if (Number.isInteger(y) && y >= 1900 && y <= 2200) view.year = y
  const m = Number(p.get('m'))
  if (Number.isInteger(m) && m >= 1 && m <= 12) view.month = m
  const dl = p.get('dl')
  if (dl !== null) {
    const i = Number(dl)
    if (Number.isInteger(i) && i >= 0 && i <= 11) view.decadal = i
  }
  return view
}

export function shareUrl(input: BirthInput, view?: ViewState): string {
  return `${location.origin}${location.pathname}?${inputToParams(input, view)}`
}
