import type { BirthInput } from './chart'

/** note 為後來新增的選填欄位：舊資料沒有 note 也要能正常讀取（向後相容） */
export type SavedChart = BirthInput & { id: string; note?: string }

const KEY = 'ziwei-charts'

export function loadCharts(): SavedChart[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    if (!Array.isArray(parsed)) return []
    // 只留形狀正確的項目，舊項目缺 note 屬正常
    return parsed.filter(
      (c): c is SavedChart =>
        !!c && typeof c === 'object' && typeof (c as SavedChart).id === 'string' && typeof (c as SavedChart).date === 'string',
    )
  } catch {
    return []
  }
}

export function saveCharts(charts: SavedChart[]) {
  localStorage.setItem(KEY, JSON.stringify(charts))
}

export function newId(): string {
  return `c${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`
}
