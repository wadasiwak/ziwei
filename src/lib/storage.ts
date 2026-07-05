import type { BirthInput } from './chart'

export type SavedChart = BirthInput & { id: string }

const KEY = 'ziwei-charts'

export function loadCharts(): SavedChart[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as SavedChart[]) : []
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
