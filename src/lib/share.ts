import type { BirthInput } from './chart'

const PALACE_NAMES = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '僕役', '官祿', '田宅', '福德', '父母']

/** 目前檢視狀態：選中宮位／流年／流月／大限，讓分享連結能還原到同一個視圖 */
export type ViewState = {
  palace: string | null
  year: number
  month: number | null
  /** 農曆日 1–30（需搭配 month） */
  day: number | null
  /** 選中的大限（大限宮在 palaces[] 的索引 0–11） */
  decadal: number | null
}

// 單人生日參數的寫入／讀取。suffix 供合盤第二人使用（d2、t2⋯⋯），單盤沿用原參數名不變。
function setPersonParams(p: URLSearchParams, input: BirthInput, suffix: string) {
  p.set(`d${suffix}`, input.date)
  p.set(`t${suffix}`, String(input.timeIndex))
  p.set(`g${suffix}`, input.gender)
  if (input.calendar === 'lunar') p.set(`cal${suffix}`, 'lunar')
  if (input.isLeapMonth) p.set(`leap${suffix}`, '1')
  if (input.name && input.name !== '未命名') p.set(`n${suffix}`, input.name)
}

function getPersonParams(p: URLSearchParams, suffix: string): BirthInput | null {
  const date = p.get(`d${suffix}`)
  const t = p.get(`t${suffix}`)
  const g = p.get(`g${suffix}`)
  if (!date || t === null || (g !== '男' && g !== '女')) return null
  if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(date)) return null
  const timeIndex = Number(t)
  if (!Number.isInteger(timeIndex) || timeIndex < 0 || timeIndex > 12) return null
  return {
    name: p.get(`n${suffix}`) ?? '未命名',
    gender: g,
    calendar: p.get(`cal${suffix}`) === 'lunar' ? 'lunar' : 'solar',
    date,
    timeIndex,
    isLeapMonth: p.get(`leap${suffix}`) === '1',
  }
}

// 生日參數 ↔ URL query，讓命盤可以用連結分享（資料只在網址裡，不經伺服器）。
export function inputToParams(input: BirthInput, view?: ViewState): string {
  const p = new URLSearchParams()
  setPersonParams(p, input, '')
  if (view) {
    if (view.palace) p.set('p', view.palace)
    if (view.year !== new Date().getFullYear()) p.set('y', String(view.year))
    if (view.month !== null) p.set('m', String(view.month))
    if (view.month !== null && view.day !== null) p.set('dd', String(view.day)) // d 已被生日佔用，流日用 dd
    if (view.decadal !== null) p.set('dl', String(view.decadal)) // 大限用 dl
  }
  return p.toString()
}

export function paramsToInput(search: string): BirthInput | null {
  return getPersonParams(new URLSearchParams(search), '')
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
  const dd = Number(p.get('dd'))
  if (view.month !== undefined && Number.isInteger(dd) && dd >= 1 && dd <= 30) view.day = dd
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

// ---- 合盤（雙人比較）：syn=1 ＋ 兩組生日參數（第二人加後綴 2） ----

export function synastryToParams(a: BirthInput, b: BirthInput): string {
  const p = new URLSearchParams()
  p.set('syn', '1')
  setPersonParams(p, a, '')
  setPersonParams(p, b, '2')
  return p.toString()
}

/** 從網址還原合盤：需 syn=1 且兩組生日參數皆有效，否則回 null（走一般單盤流程） */
export function paramsToSynastry(search: string): { a: BirthInput; b: BirthInput } | null {
  const p = new URLSearchParams(search)
  if (p.get('syn') !== '1') return null
  const a = getPersonParams(p, '')
  const b = getPersonParams(p, '2')
  return a && b ? { a, b } : null
}

export function synastryUrl(a: BirthInput, b: BirthInput): string {
  return `${location.origin}${location.pathname}?${synastryToParams(a, b)}`
}
