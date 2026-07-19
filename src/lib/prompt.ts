import type FunctionalAstrolabe from 'iztro/lib/astro/FunctionalAstrolabe'
import { LUNAR_DAY_NAMES, LUNAR_MONTH_NAMES, type BirthInput, type DailyInfo, type MonthlyInfo, type YearlyInfo } from './chart'

const MUTAGEN_ORDER = ['祿', '權', '科', '忌']

// 把整張命盤組成結構化文字＋解讀指令，讓使用者貼到任何 LLM 取得綜合解讀。
export function buildLlmPrompt(
  chart: FunctionalAstrolabe,
  input: BirthInput,
  yearly: YearlyInfo | null,
  monthly: MonthlyInfo | null = null,
  daily: DailyInfo | null = null,
): string {
  const lines: string[] = []
  lines.push('你是一位資深紫微斗數老師。以下是一張完整命盤資料，請給出綜合解讀。')
  lines.push('')
  lines.push('【基本資料】')
  lines.push(`盤主：${input.name}｜性別：${chart.gender}｜國曆：${chart.solarDate}｜農曆：${chart.lunarDate}｜時辰：${chart.time}（${chart.timeRange}）`)
  lines.push(`四柱：${chart.chineseDate}｜五行局：${chart.fiveElementsClass}｜命主：${chart.soul}｜身主：${chart.body}`)
  lines.push('')
  lines.push('【十二宮】（依宮位列出：主星[亮度][生年四化]、輔星、雜曜、大限）')
  for (const p of chart.palaces) {
    const majors = p.majorStars
      .map((s) => `${s.name}${s.brightness ? `(${s.brightness})` : ''}${s.mutagen ? `[化${s.mutagen}]` : ''}`)
      .join('、') || '空宮'
    const minors = p.minorStars
      .map((s) => `${s.name}${s.mutagen ? `[化${s.mutagen}]` : ''}`)
      .join('、')
    const adjs = p.adjectiveStars.map((s) => s.name).join('、')
    const marks = [p.isBodyPalace ? '身宮' : '', p.isOriginalPalace ? '來因' : ''].filter(Boolean).join('、')
    lines.push(
      `${p.name}（${p.heavenlyStem}${p.earthlyBranch}${marks ? '，' + marks : ''}）｜主星：${majors}` +
        (minors ? `｜輔星：${minors}` : '') +
        (adjs ? `｜雜曜：${adjs}` : '') +
        `｜大限 ${p.decadal.range[0]}–${p.decadal.range[1]} 歲`,
    )
  }
  if (yearly) {
    const soulPalace = chart.palaces[yearly.soulPalaceIndex]
    const decadalPalace = chart.palaces[yearly.decadalIndex]
    lines.push('')
    lines.push(`【${yearly.year} ${yearly.stem}${yearly.branch}年 流年】`)
    lines.push(`虛歲 ${yearly.nominalAge}，行${decadalPalace.name}大限（${decadalPalace.decadal.range[0]}–${decadalPalace.decadal.range[1]} 歲），流年命宮在本命${soulPalace.name}（${soulPalace.earthlyBranch}宮）`)
    lines.push(`流年四化：${yearly.mutagenStars.map((s, i) => `${s}化${MUTAGEN_ORDER[i]}`).join('、')}`)
    if (monthly) {
      lines.push(
        `${LUNAR_MONTH_NAMES[monthly.month - 1]}（${monthly.stem}${monthly.branch}月）流月：流月命宮在本命${chart.palaces[monthly.soulPalaceIndex].name}，流月四化 ${monthly.mutagenStars.map((s, i) => `${s}化${MUTAGEN_ORDER[i]}`).join('、')}`,
      )
    }
    if (monthly && daily) {
      lines.push(
        `${LUNAR_DAY_NAMES[daily.day - 1]}（${daily.stem}${daily.branch}日，國曆 ${daily.solarDate}）流日：流日命宮在本命${chart.palaces[daily.soulPalaceIndex].name}，流日四化 ${daily.mutagenStars.map((s, i) => `${s}化${MUTAGEN_ORDER[i]}`).join('、')}`,
      )
    }
  }
  lines.push('')
  lines.push('【解讀要求】')
  lines.push('1. 先總論命格：命宮三方四正的結構、五行局與命主身主的呼應、整體格局高低與人生主軸。')
  lines.push('2. 分述重點宮位：事業（官祿）、財富（財帛/田宅）、感情（夫妻）、健康（疾厄），主星亮度與生年四化要納入判斷。')
  lines.push('3. 指出這張盤最需要注意的二至三個課題（化忌與煞星的落點），用建設性的語氣給具體建議。')
  if (yearly) lines.push(`4. 針對 ${yearly.year} 流年：結合大限與流年四化，說明今年的機會與功課。`)
  lines.push('請用白話但保留必要術語，語氣中肯，不宿命論、不恐嚇。')
  return lines.join('\n')
}
