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

export type YearlyInfo = {
  year: number
  stem: string
  branch: string
  nominalAge: number
  /** 流年命宮在 palaces[] 的索引 */
  soulPalaceIndex: number
  /** 十二流年宮名，對齊 palaces[] */
  palaceNames: string[]
  /** 流年四化星名，依 [祿, 權, 科, 忌] 順序 */
  mutagenStars: string[]
  /** 該年所行大限在 palaces[] 的索引 */
  decadalIndex: number
}

// 取盤主某西元年的流年資料。用 6/1 取值可穩定落在該農曆年內（避開年初分界）。
export function computeYearly(chart: FunctionalAstrolabe, year: number): YearlyInfo {
  const h = chart.horoscope(`${year}-6-1`)
  return {
    year,
    stem: h.yearly.heavenlyStem,
    branch: h.yearly.earthlyBranch,
    nominalAge: h.age.nominalAge,
    soulPalaceIndex: h.yearly.index,
    palaceNames: h.yearly.palaceNames,
    mutagenStars: h.yearly.mutagen,
    decadalIndex: h.decadal.index,
  }
}

/** 盤面上顯示用的流年宮名縮寫 */
export const YEARLY_SHORT: Record<string, string> = {
  命宮: '年命', 兄弟: '年兄', 夫妻: '年夫', 子女: '年子',
  財帛: '年財', 疾厄: '年疾', 遷移: '年遷', 僕役: '年友',
  官祿: '年官', 田宅: '年田', 福德: '年福', 父母: '年父',
}
