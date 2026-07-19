import { create } from 'zustand'
import type { BirthInput } from './lib/chart'
import { loadCharts, newId, saveCharts, type SavedChart } from './lib/storage'

type State = {
  input: BirthInput | null
  selectedPalace: string | null
  selectedYear: number
  /** 農曆月 1–12，null 表示不看流月 */
  selectedMonth: number | null
  /** 農曆日 1–30，null 表示不看流日（需先選流月） */
  selectedDay: number | null
  /** 選中的大限（以大限宮在 palaces[] 的索引表示），null 表示不看大限 */
  selectedDecadal: number | null
  /** 合盤（雙人比較）模式：非 null 時顯示合盤視圖，取代單盤區塊 */
  synastry: { a: BirthInput; b: BirthInput } | null
  saved: SavedChart[]
  setInput: (input: BirthInput) => void
  selectPalace: (name: string | null) => void
  setYear: (year: number) => void
  setMonth: (month: number | null) => void
  setDay: (day: number | null) => void
  setDecadal: (index: number | null) => void
  setSynastry: (pair: { a: BirthInput; b: BirthInput } | null) => void
  /** 回傳 'saved' 或 'duplicate'（已保存過同一張盤） */
  saveCurrent: () => 'saved' | 'duplicate' | 'noop'
  loadSaved: (id: string) => void
  deleteSaved: (id: string) => void
  /** 改名／改備註 */
  updateSaved: (id: string, patch: { name?: string; note?: string }) => void
}

const sameChart = (c: SavedChart, input: BirthInput) =>
  c.name === input.name &&
  c.date === input.date &&
  c.timeIndex === input.timeIndex &&
  c.calendar === input.calendar &&
  c.gender === input.gender

export const useStore = create<State>((set, get) => ({
  input: null,
  selectedPalace: null,
  selectedYear: new Date().getFullYear(),
  selectedMonth: null,
  selectedDay: null,
  selectedDecadal: null,
  synastry: null,
  saved: loadCharts(),

  // 大限索引是「這張盤」的宮位索引，換盤時必須歸零
  setInput: (input) => set({ input, selectedPalace: null, selectedDecadal: null }),

  setYear: (year) => set({ selectedYear: year }),

  // 換流月時流日歸零（各月天數不同，舊的日序無意義）
  setMonth: (month) => set({ selectedMonth: month, selectedDay: null }),

  setDay: (day) => set({ selectedDay: day }),

  setDecadal: (index) => set({ selectedDecadal: index }),

  setSynastry: (pair) => set({ synastry: pair }),

  selectPalace: (name) => set({ selectedPalace: name }),

  saveCurrent: () => {
    const { input, saved } = get()
    if (!input) return 'noop'
    if (saved.some((c) => sameChart(c, input))) return 'duplicate'
    const next = [...saved, { ...input, id: newId() }]
    saveCharts(next)
    set({ saved: next })
    return 'saved'
  },

  loadSaved: (id) => {
    const chart = get().saved.find((c) => c.id === id)
    if (chart) {
      const { id: _id, note: _note, ...input } = chart
      set({ input, selectedPalace: null, selectedDecadal: null })
    }
  },

  deleteSaved: (id) => {
    const next = get().saved.filter((c) => c.id !== id)
    saveCharts(next)
    set({ saved: next })
  },

  updateSaved: (id, patch) => {
    const next = get().saved.map((c) =>
      c.id === id
        ? { ...c, ...(patch.name !== undefined ? { name: patch.name.trim() || c.name } : {}), ...(patch.note !== undefined ? { note: patch.note.trim() } : {}) }
        : c,
    )
    saveCharts(next)
    set({ saved: next })
  },
}))
