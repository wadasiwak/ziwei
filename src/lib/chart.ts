import { astro } from 'iztro'
import type FunctionalAstrolabe from 'iztro/lib/astro/FunctionalAstrolabe'
import { getTotalDaysOfLunarMonth, lunar2solar, solar2lunar } from 'lunar-lite'

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
  decadalStem: string
  decadalBranch: string
  /** 大限四化星名，依 [祿, 權, 科, 忌] 順序 */
  decadalMutagenStars: string[]
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
    decadalStem: h.decadal.heavenlyStem,
    decadalBranch: h.decadal.earthlyBranch,
    decadalMutagenStars: h.decadal.mutagen,
  }
}

export type MonthlyInfo = {
  /** 農曆月 1–12 */
  month: number
  stem: string
  branch: string
  /** 流月命宮在 palaces[] 的索引 */
  soulPalaceIndex: number
  /** 十二流月宮名，對齊 palaces[] */
  palaceNames: string[]
  /** 流月四化星名，依 [祿, 權, 科, 忌] 順序 */
  mutagenStars: string[]
}

export const LUNAR_MONTH_NAMES = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '臘月']

// 取某流年（西元年）農曆某月的流月資料。取該農曆月十五對應的國曆日期送 horoscope。
export function computeMonthly(chart: FunctionalAstrolabe, year: number, lunarMonth: number): MonthlyInfo {
  const solarDate = lunar2solar(`${year}-${lunarMonth}-15`, false).toString()
  const h = chart.horoscope(solarDate)
  return {
    month: lunarMonth,
    stem: h.monthly.heavenlyStem,
    branch: h.monthly.earthlyBranch,
    soulPalaceIndex: h.monthly.index,
    palaceNames: h.monthly.palaceNames,
    mutagenStars: h.monthly.mutagen,
  }
}

export const LUNAR_DAY_NAMES = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
]

export type DailyInfo = {
  /** 農曆日 1–30 */
  day: number
  /** 流日日柱干支 */
  stem: string
  branch: string
  /** 流日命宮在 palaces[] 的索引 */
  soulPalaceIndex: number
  /** 十二流日宮名，對齊 palaces[] */
  palaceNames: string[]
  /** 流日四化星名，依 [祿, 權, 科, 忌] 順序 */
  mutagenStars: string[]
  /** 對應的國曆日期 YYYY-M-D */
  solarDate: string
}

/** 某流年（西元年）農曆某月的天數（29 或 30），供流日選擇列使用 */
export function lunarMonthDays(year: number, lunarMonth: number): number {
  return getTotalDaysOfLunarMonth(lunar2solar(`${year}-${lunarMonth}-1`, false).toString())
}

// 取某流年農曆某月某日的流日資料。與流月同一套模型：不區分閏月（閏月以本月論）。
export function computeDaily(chart: FunctionalAstrolabe, year: number, lunarMonth: number, lunarDay: number): DailyInfo {
  if (lunarDay < 1 || lunarDay > lunarMonthDays(year, lunarMonth)) {
    throw new Error(`invalid lunar day: ${year}-${lunarMonth}-${lunarDay}`)
  }
  const solarDate = lunar2solar(`${year}-${lunarMonth}-${lunarDay}`, false).toString()
  const h = chart.horoscope(solarDate)
  return {
    day: lunarDay,
    stem: h.daily.heavenlyStem,
    branch: h.daily.earthlyBranch,
    soulPalaceIndex: h.daily.index,
    palaceNames: h.daily.palaceNames,
    mutagenStars: h.daily.mutagen,
    solarDate,
  }
}

/** 今天的農曆年月日（年為農曆年：春節前的一月屬前一農曆年，可直接餵給流年／流月／流日） */
export function todayLunar(): { year: number; month: number; day: number; isLeap: boolean } {
  const now = new Date()
  const l = solar2lunar(`${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`)
  // 注意：流月／流日模型不分閏月，閏月期間以同名正月份近似（isLeap 供介面提示用）
  return { year: l.lunarYear, month: l.lunarMonth, day: l.lunarDay, isLeap: l.isLeap }
}

/** 盤面上顯示用的流年宮名縮寫 */
export const YEARLY_SHORT: Record<string, string> = {
  命宮: '年命', 兄弟: '年兄', 夫妻: '年夫', 子女: '年子',
  財帛: '年財', 疾厄: '年疾', 遷移: '年遷', 僕役: '年友',
  官祿: '年官', 田宅: '年田', 福德: '年福', 父母: '年父',
}

export type DecadalInfo = {
  /** 大限宮在 palaces[] 的索引 */
  index: number
  stem: string
  branch: string
  /** 虛歲起訖 */
  range: [number, number]
  /** 對應西元年起訖（虛歲 = 西元年 − 出生年 + 1） */
  yearRange: [number, number]
  /** 十二大限宮名，對齊 palaces[] */
  palaceNames: string[]
  /** 大限四化星名，依 [祿, 權, 科, 忌] 順序 */
  mutagenStars: string[]
}

// 列出十二個大限（依起運歲數排序）。宮名與四化以 iztro 為準：
// 用「該大限起始虛歲對應的西元年」反查 horoscope 取得，不自行推算順逆。
// 虛歲以農曆年計，出生在春節前的人農曆生年比國曆早一年，故取 lunarYear。
export function listDecadals(chart: FunctionalAstrolabe): DecadalInfo[] {
  const birthYear = chart.rawDates.lunarDate.lunarYear
  return [...chart.palaces]
    .sort((a, b) => a.decadal.range[0] - b.decadal.range[0])
    .map((p) => {
      const [from, to] = p.decadal.range
      const h = chart.horoscope(`${birthYear + from - 1}-6-1`)
      return {
        index: p.index,
        stem: p.decadal.heavenlyStem,
        branch: p.decadal.earthlyBranch,
        range: [from, to],
        yearRange: [birthYear + from - 1, birthYear + to - 1],
        palaceNames: h.decadal.palaceNames,
        mutagenStars: h.decadal.mutagen,
      }
    })
}

/** 盤面上顯示用的大限宮名縮寫 */
export const DECADAL_SHORT: Record<string, string> = {
  命宮: '大命', 兄弟: '大兄', 夫妻: '大夫', 子女: '大子',
  財帛: '大財', 疾厄: '大疾', 遷移: '大遷', 僕役: '大友',
  官祿: '大官', 田宅: '大田', 福德: '大福', 父母: '大父',
}
