import { create } from 'zustand'
import type { BirthInput } from './lib/chart'
import { loadCharts, newId, saveCharts, type SavedChart } from './lib/storage'

type State = {
  input: BirthInput | null
  selectedPalace: string | null
  saved: SavedChart[]
  setInput: (input: BirthInput) => void
  selectPalace: (name: string | null) => void
  saveCurrent: () => void
  loadSaved: (id: string) => void
  deleteSaved: (id: string) => void
}

export const useStore = create<State>((set, get) => ({
  input: null,
  selectedPalace: null,
  saved: loadCharts(),

  setInput: (input) => set({ input, selectedPalace: null }),

  selectPalace: (name) => set({ selectedPalace: name }),

  saveCurrent: () => {
    const { input, saved } = get()
    if (!input) return
    const exists = saved.some(
      (c) =>
        c.name === input.name &&
        c.date === input.date &&
        c.timeIndex === input.timeIndex &&
        c.calendar === input.calendar &&
        c.gender === input.gender,
    )
    if (exists) return
    const next = [...saved, { ...input, id: newId() }]
    saveCharts(next)
    set({ saved: next })
  },

  loadSaved: (id) => {
    const chart = get().saved.find((c) => c.id === id)
    if (chart) {
      const { id: _id, ...input } = chart
      set({ input, selectedPalace: null })
    }
  },

  deleteSaved: (id) => {
    const next = get().saved.filter((c) => c.id !== id)
    saveCharts(next)
    set({ saved: next })
  },
}))
