import type FunctionalAstrolabe from 'iztro/lib/astro/FunctionalAstrolabe'
import type { IFunctionalPalace } from 'iztro/lib/astro/FunctionalPalace'

/** 五行局字串取五行：「水二局」→「水」 */
export function fiveElementOf(fiveElementsClass: string): string {
  return fiveElementsClass.charAt(0)
}

export type PalaceMajors = {
  palace: IFunctionalPalace
  /** 主星名（空宮時為借對宮的主星） */
  stars: string[]
  /** 空宮借對宮時的來源宮，否則 null */
  borrowedFrom: IFunctionalPalace | null
}

/** 取某宮主星；空宮照站上既有慣例借對宮主星參看 */
export function palaceMajors(chart: FunctionalAstrolabe, palaceName: string): PalaceMajors | null {
  const palace = chart.palaces.find((p) => p.name === palaceName)
  if (!palace) return null
  const borrowed = palace.majorStars.length === 0 ? chart.palaces[(palace.index + 6) % 12] : null
  return { palace, stars: (borrowed ?? palace).majorStars.map((s) => s.name), borrowedFrom: borrowed }
}

// ---- 互看區橋接語：14 星分四種關係氣質，4×4 規則模板組合（不寫 196 則） ----

type Temper = '開創' | '領導' | '表達' | '沉穩'

const STAR_TEMPER: Record<string, Temper> = {
  七殺: '開創', 破軍: '開創', 貪狼: '開創', 廉貞: '開創',
  紫微: '領導', 天府: '領導', 武曲: '領導', 天相: '領導',
  太陽: '表達', 天機: '表達', 巨門: '表達',
  天同: '沉穩', 太陰: '沉穩', 天梁: '沉穩',
}

const TEMPER_DESC: Record<Temper, string> = {
  開創: '敢衝敢變的行動派',
  領導: '穩健務實的掌舵派',
  表達: '動腦動口的思辨派',
  沉穩: '溫和細膩的沉穩派',
}

const BRIDGE: Record<string, string> = {
  '開創|開創': '兩股衝勁對上，來電快、火花足；提醒是都想往前衝的時候，記得輪流當踩煞車的那個人。',
  '開創|領導': '一個想要衝勁、一個給的是穩勁，速度感需要磨合；但穩紮穩打的底子，其實接得住這份期待。',
  '開創|表達': '期待行動、遇上點子與話語都多的人，聊得動也吵得起來；把討論收斂成一起行動，就對頻了。',
  '開創|沉穩': '期待轟轟烈烈、遇上細水長流，節奏差異是要磨合的地方；磨好了，一個開路、一個補給，各得其所。',
  '領導|開創': '期待可靠的掌舵者、遇上愛開新局的行動派，安全感要重新定義；對方的衝勁其實也撐得起一片天。',
  '領導|領導': '期待與本色都是掌舵型，價值觀務實對頻；提醒是兩人都想拿方向盤，分工講清楚感情更穩。',
  '領導|表達': '期待穩重、遇上靈活多話的思辨派，一動一靜要對時差；對方的點子能替務實的日子加上翅膀。',
  '領導|沉穩': '期待可靠、遇上溫和體貼，安穩感容易到位；提醒是別把對方的溫柔當成理所當然，主動權輪流拿。',
  '表達|開創': '期待聊得來、遇上用做的代替說的行動派，表達愛的語言不同；學會欣賞彼此不同的頻道是功課。',
  '表達|領導': '期待思想交流、遇上務實掌舵者，話題深度要慢慢培養；但對方給的踏實感是最好的後盾。',
  '表達|表達': '兩顆愛動腦的星對上，聊不完是最大優勢；提醒是道理都會講，記得把心情也放進對話裡。',
  '表達|沉穩': '期待腦力激盪、遇上安靜細膩的靈魂，一個說一個聽剛剛好；也要留意別變成單向廣播。',
  '沉穩|開創': '期待歲月靜好、遇上停不下來的行動派，生活步調需要協商；對方也會替日子帶來新鮮感。',
  '沉穩|領導': '期待溫柔陪伴、遇上務實掌舵者，浪漫要自己開口要；換來的是說到做到的安全感。',
  '沉穩|表達': '期待貼心、遇上妙語如珠的思辨派，熱鬧有餘、細膩要練；對方的幽默是日常最好的調味。',
  '沉穩|沉穩': '兩個溫和細膩的人相遇，舒服自在是基調；提醒是都不愛起衝突，心裡的話要記得說出口。',
}

/** 橋接語：甲方夫妻宮主星（理想伴侶輪廓）對上乙方命宮主星（本人樣子），以主星氣質規則組合 */
export function bridgeLine(aName: string, aStar: string, bName: string, bStar: string): string {
  const ta = STAR_TEMPER[aStar]
  const tb = STAR_TEMPER[bStar]
  if (!ta || !tb) return ''
  return `${aName}期待的伴侶偏「${TEMPER_DESC[ta]}」，而${bName}本人偏「${TEMPER_DESC[tb]}」——${BRIDGE[`${ta}|${tb}`]}`
}

// ---- 生年四化互動：甲方的生年四化星，落在乙方盤上的哪些宮 ----

const MUTAGEN_ORDER = ['祿', '權', '科', '忌'] as const

export type MutagenLanding = {
  mutagen: string
  star: string
  /** 該星在對方盤上的宮位名 */
  palaceName: string
}

/** 取生年四化（依祿權科忌排序），直接讀盤上帶 mutagen 的星 */
export function birthMutagens(chart: FunctionalAstrolabe): { mutagen: string; star: string }[] {
  const found: Record<string, string> = {}
  for (const p of chart.palaces) {
    for (const s of [...p.majorStars, ...p.minorStars]) {
      if (s.mutagen) found[s.mutagen] = s.name
    }
  }
  return MUTAGEN_ORDER.filter((m) => found[m]).map((m) => ({ mutagen: m, star: found[m] }))
}

/** 甲方生年四化星落在乙方盤上的宮位（四化星必為 14 主星或昌曲輔弼，兩張盤都有；防禦性略過找不到者） */
export function mutagenLandings(from: FunctionalAstrolabe, to: FunctionalAstrolabe): MutagenLanding[] {
  return birthMutagens(from).flatMap(({ mutagen, star }) => {
    const palace = to.palaces.find((p) => [...p.majorStars, ...p.minorStars].some((s) => s.name === star))
    return palace ? [{ mutagen, star, palaceName: palace.name }] : []
  })
}

const PALACE_TOPIC: Record<string, string> = {
  命宮: '這個人本身', 兄弟: '手足與親近平輩', 夫妻: '感情世界', 子女: '晚輩緣與新計畫',
  財帛: '金錢與收入', 疾厄: '健康與情緒', 遷移: '外出與變動', 僕役: '朋友與人脈',
  官祿: '工作與事業', 田宅: '家庭與居住', 福德: '心境與享受', 父母: '長輩與文書事務',
}

/** 四化落宮一句話（規則模板組宮位主題，不逐宮寫死） */
export function mutagenLandingLine(fromName: string, toName: string, landing: MutagenLanding): string {
  const topic = PALACE_TOPIC[landing.palaceName] ?? landing.palaceName
  switch (landing.mutagen) {
    case '祿':
      return `${fromName}帶來的順遂與資源，最容易灌注在${toName}的${topic}上，是這段緣分自然的甜區。`
    case '權':
      return `${fromName}會在${toName}的${topic}上特別想出意見、想使力，是助力也帶點強勢，記得留商量空間。`
    case '科':
      return `${fromName}像溫和的貴人，會在${toName}的${topic}上幫襯與美言，是細水長流的加分。`
    default:
      return `${fromName}對${toName}的${topic}特別在意、放不下，這裡是兩人比較容易糾結的題目，多點耐心慢慢磨。`
  }
}
