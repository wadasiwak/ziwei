import { astro } from 'iztro'
import type FunctionalAstrolabe from 'iztro/lib/astro/FunctionalAstrolabe'

export type BirthInput = {
  name: string
  gender: '男' | '女'
  calendar: 'solar' | 'lunar'
  /** YYYY-M-D */
  date: string
  /** 0=早子時(00:00-00:59)、1=丑時 … 11=亥時、12=晚子時(23:00-23:59) */
  timeIndex: number
  isLeapMonth: boolean
}

export const TIME_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: '早子時 00:00–00:59' },
  { value: 1, label: '丑時 01:00–02:59' },
  { value: 2, label: '寅時 03:00–04:59' },
  { value: 3, label: '卯時 05:00–06:59' },
  { value: 4, label: '辰時 07:00–08:59' },
  { value: 5, label: '巳時 09:00–10:59' },
  { value: 6, label: '午時 11:00–12:59' },
  { value: 7, label: '未時 13:00–14:59' },
  { value: 8, label: '申時 15:00–16:59' },
  { value: 9, label: '酉時 17:00–18:59' },
  { value: 10, label: '戌時 19:00–20:59' },
  { value: 11, label: '亥時 21:00–22:59' },
  { value: 12, label: '晚子時 23:00–23:59' },
]

export function computeChart(input: BirthInput): FunctionalAstrolabe {
  if (input.calendar === 'solar') {
    return astro.bySolar(input.date, input.timeIndex, input.gender, true, 'zh-TW')
  }
  return astro.byLunar(input.date, input.timeIndex, input.gender, input.isLeapMonth, true, 'zh-TW')
}
