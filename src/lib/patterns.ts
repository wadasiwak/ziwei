import type FunctionalAstrolabe from 'iztro/lib/astro/FunctionalAstrolabe'
import type { IFunctionalPalace } from 'iztro/lib/astro/FunctionalPalace'

export type Pattern = { name: string; description: string }

// 只收錄規則明確、無派系爭議的經典格局。說明文案集中於此，偵測與文庫共用同一份。
export const PATTERN_LIBRARY: Pattern[] = [
  {
    name: '紫府同宮',
    description: '紫微、天府兩大主星同守命宮（只出現在寅申），帝座與財庫合體，氣度與守成能力兼備，一生格局不小，但也要留意自視與安逸並存的慣性。',
  },
  {
    name: '殺破狼',
    description: '命宮坐七殺、破軍、貪狼之一，三方必會齊另外兩顆，是典型的變動開創結構：人生大開大闔、不安於現狀，宜攻不宜守，把變動當養分就是你的優勢。',
  },
  {
    name: '機月同梁',
    description: '命宮三方四正齊會天機、太陰、天同、天梁，古云「機月同梁作吏人」：穩定、企劃、幕僚性質的結構，適合在制度內深耕專業，以穩取勝。',
  },
  {
    name: '火貪格',
    description: '貪狼與火星同宮（會入命宮三方四正），古稱橫發之格：爆發力強、機會來得又急又猛，但橫發也怕橫破，得手後記得落袋守成。',
  },
  {
    name: '鈴貪格',
    description: '貪狼與鈴星同宮（會入命宮三方四正），與火貪同屬奇格：屬於悶聲蓄力、一鳴驚人的爆發結構，成事常在低調醞釀之後。',
  },
  {
    name: '日月同宮',
    description: '太陽、太陰同守命宮（只出現在丑未），日月交輝：性格陰陽兩面兼具、剛柔並濟，情緒與能量隨場合切換，多才但也多內在拉扯。',
  },
  {
    name: '陽梁昌祿',
    description: '命宮三方四正齊會太陽、天梁、文昌、祿存，是最著名的讀書考試格：利於學術、國考、專業認證，靠功名與專業立身。',
  },
  {
    name: '祿馬交馳',
    description: '祿星（祿存或生年化祿）與天馬同宮，主動中生財：機會與財源在移動、外地、奔波中出現，越動越旺，宜往外開拓。',
  },
  {
    name: '石中隱玉',
    description: '巨門在子午守命，古稱石中隱玉：才華如璞玉藏於石中，早年多磨、越晚越發，靠專業與口碑慢火磨出光芒。',
  },
]

const LIB: Record<string, Pattern> = Object.fromEntries(PATTERN_LIBRARY.map((p) => [p.name, p]))

const majorNames = (p: IFunctionalPalace): string[] => p.majorStars.map((s) => s.name)
const allNames = (p: IFunctionalPalace): string[] => [...p.majorStars, ...p.minorStars].map((s) => s.name)

export function detectPatterns(chart: FunctionalAstrolabe): Pattern[] {
  const patterns: Pattern[] = []
  const soul = chart.palaces.find((p) => p.name === '命宮')
  if (!soul) return patterns

  const trineIdx = [soul.index, (soul.index + 4) % 12, (soul.index + 6) % 12, (soul.index + 8) % 12]
  const trinePalaces = trineIdx.map((i) => chart.palaces[i])
  const trineMajors = new Set(trinePalaces.flatMap(majorNames))
  const trineAll = new Set(trinePalaces.flatMap(allNames))
  const soulMajors = new Set(majorNames(soul))

  if (soulMajors.has('紫微') && soulMajors.has('天府')) patterns.push(LIB['紫府同宮'])

  if (['七殺', '破軍', '貪狼'].some((s) => soulMajors.has(s))) patterns.push(LIB['殺破狼'])

  if (['天機', '太陰', '天同', '天梁'].every((s) => trineMajors.has(s))) patterns.push(LIB['機月同梁'])

  if (trinePalaces.some((p) => { const names = allNames(p); return names.includes('貪狼') && names.includes('火星') })) {
    patterns.push(LIB['火貪格'])
  }
  if (trinePalaces.some((p) => { const names = allNames(p); return names.includes('貪狼') && names.includes('鈴星') })) {
    patterns.push(LIB['鈴貪格'])
  }

  if (soulMajors.has('太陽') && soulMajors.has('太陰')) patterns.push(LIB['日月同宮'])

  if (['太陽', '天梁', '文昌', '祿存'].every((s) => trineAll.has(s))) patterns.push(LIB['陽梁昌祿'])

  const luckStars = ['祿存']
  const yearLu = chart.palaces.flatMap((p) => [...p.majorStars, ...p.minorStars]).find((s) => s.mutagen === '祿')
  if (yearLu) luckStars.push(yearLu.name)
  if (chart.palaces.some((p) => { const names = allNames(p); return names.includes('天馬') && luckStars.some((s) => names.includes(s)) })) {
    patterns.push(LIB['祿馬交馳'])
  }

  if (soulMajors.has('巨門') && ['子', '午'].includes(soul.earthlyBranch)) patterns.push(LIB['石中隱玉'])

  return patterns
}
