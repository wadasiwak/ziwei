// 用古法規則獨立驗算 iztro 的排盤結果：
// 1. 安命宮/身宮公式（寅起正月，命逆時、身順時）
// 2. 年干四化表（甲廉破武陽…）
// 3. 五行局 = 命宮干支納音
// 4. 十四主星每顆恰好落一宮
import { astro } from 'iztro'

const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const MAJORS = ['紫微', '天機', '太陽', '武曲', '天同', '廉貞', '天府', '太陰', '貪狼', '巨門', '天相', '天梁', '七殺', '破軍']

// 年干四化（祿權科忌），與 iztro 預設一致
const MUTAGEN_TABLE = {
  甲: ['廉貞', '破軍', '武曲', '太陽'],
  乙: ['天機', '天梁', '紫微', '太陰'],
  丙: ['天同', '天機', '文昌', '廉貞'],
  丁: ['太陰', '天同', '天機', '巨門'],
  戊: ['貪狼', '太陰', '右弼', '天機'],
  己: ['武曲', '貪狼', '天梁', '文曲'],
  庚: ['太陽', '武曲', '太陰', '天同'],
  辛: ['巨門', '太陽', '文曲', '文昌'],
  壬: ['天梁', '紫微', '左輔', '武曲'],
  癸: ['破軍', '巨門', '太陰', '貪狼'],
}

// 六十甲子納音五行（每兩組干支一個五行）
const NAYIN = (
  '金金火火木木土土金金火火水水土土金金木木水水土土火火木木水水' +
  '金金火火木木土土金金火火水水土土金金木木水水土土火火木木水水'
).split('')
const ELEMENT_TO_CLASS = { 水: '水二局', 木: '木三局', 金: '金四局', 土: '土五局', 火: '火六局' }

function sexagenaryIndex(stem, branch) {
  const s = STEMS.indexOf(stem)
  const b = BRANCHES.indexOf(branch)
  for (let i = 0; i < 60; i++) {
    if (i % 10 === s && i % 12 === b) return i
  }
  throw new Error(`invalid stem-branch: ${stem}${branch}`)
}

let failures = 0
const assert = (cond, msg) => {
  if (cond) {
    console.log(`  ok: ${msg}`)
  } else {
    console.error(`  FAIL: ${msg}`)
    failures++
  }
}

function verify(label, chart, timeIndex) {
  console.log(`\n[${label}] ${chart.solarDate} / ${chart.lunarDate} / ${chart.chineseDate}`)
  const lunar = chart.rawDates.lunarDate

  // 安命身宮：寅(2)起正月順數至生月；命宮再逆數生時，身宮順數生時。
  // 早/晚子時的時支都是子(0)。fixLeap 之下閏月十五(含)之後以下月論。
  let month = lunar.lunarMonth
  if (lunar.isLeap && lunar.lunarDay > 15) month += 1
  const hourBranch = timeIndex === 12 ? 0 : timeIndex
  const soulBranch = BRANCHES[(((2 + (month - 1) - hourBranch) % 12) + 12) % 12]
  const bodyBranch = BRANCHES[(2 + (month - 1) + hourBranch) % 12]
  assert(chart.earthlyBranchOfSoulPalace === soulBranch, `命宮 ${chart.earthlyBranchOfSoulPalace} = 公式 ${soulBranch}`)
  assert(chart.earthlyBranchOfBodyPalace === bodyBranch, `身宮 ${chart.earthlyBranchOfBodyPalace} = 公式 ${bodyBranch}`)

  // 五行局 = 命宮干支納音
  const soulPalace = chart.palaces.find((p) => p.earthlyBranch === soulBranch)
  const nayinElement = NAYIN[sexagenaryIndex(soulPalace.heavenlyStem, soulPalace.earthlyBranch)]
  assert(
    chart.fiveElementsClass === ELEMENT_TO_CLASS[nayinElement],
    `五行局 ${chart.fiveElementsClass} = 命宮${soulPalace.heavenlyStem}${soulPalace.earthlyBranch}納音${nayinElement} → ${ELEMENT_TO_CLASS[nayinElement]}`,
  )

  // 十四主星每顆恰好一宮
  const placed = chart.palaces.flatMap((p) => p.majorStars.map((s) => s.name)).filter((n) => MAJORS.includes(n))
  assert(placed.length === 14 && new Set(placed).size === 14, `十四主星各落一宮（實得 ${placed.length}）`)

  // 年干四化
  const yearStem = chart.rawDates.chineseDate.yearly[0]
  const expected = MUTAGEN_TABLE[yearStem]
  const allStars = chart.palaces.flatMap((p) => [...p.majorStars, ...p.minorStars])
  const actual = ['祿', '權', '科', '忌'].map((m) => allStars.find((s) => s.mutagen === m)?.name)
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${yearStem}年四化 ${actual.join('、')} = 表 ${expected.join('、')}`,
  )
}

// 案例一：iztro 文件範例（陽曆、庚辰年）
verify('陽曆一般', astro.bySolar('2000-8-16', 2, '女', true, 'zh-TW'), 2)

// 案例二：晚子時（23:00–23:59），日柱進位但時支仍為子
verify('晚子時', astro.bySolar('1990-1-1', 12, '男', true, 'zh-TW'), 12)

// 案例三：早子時對照
verify('早子時', astro.bySolar('1990-1-1', 0, '男', true, 'zh-TW'), 0)

// 案例四：農曆閏月（2023 癸卯年閏二月，二十日 → 十五之後以三月論）
verify('閏月下半', astro.byLunar('2023-2-20', 6, '女', true, true, 'zh-TW'), 6)

// 案例五：農曆閏月上半（閏二月初十 → 仍以二月論）
verify('閏月上半', astro.byLunar('2023-2-10', 6, '女', true, true, 'zh-TW'), 6)

// ---- 流年驗證：流年命宮 = 太歲地支所在宮位；流年四化 = 該年年干四化 ----
function verifyYearly(chart, year) {
  console.log(`\n[流年 ${year}]`)
  const h = chart.horoscope(`${year}-6-1`)
  // 西元年 → 干支（1984 甲子）
  const stem = STEMS[(((year - 4) % 10) + 10) % 10]
  const branch = BRANCHES[(((year - 4) % 12) + 12) % 12]
  assert(h.yearly.heavenlyStem === stem && h.yearly.earthlyBranch === branch, `年干支 ${h.yearly.heavenlyStem}${h.yearly.earthlyBranch} = ${stem}${branch}`)
  assert(chart.palaces[h.yearly.index].earthlyBranch === branch, `流年命宮在${branch}宮（palaces[${h.yearly.index}]）`)
  assert(h.yearly.palaceNames[h.yearly.index] === '命宮', `流年宮名對齊（index 處為命宮）`)
  assert(JSON.stringify(h.yearly.mutagen) === JSON.stringify(MUTAGEN_TABLE[stem]), `${stem}年流年四化 ${h.yearly.mutagen.join('、')}`)
}

const sample = astro.bySolar('2000-8-16', 2, '女', true, 'zh-TW')
verifyYearly(sample, 2026) // 丙午
verifyYearly(sample, 2025) // 乙巳
verifyYearly(sample, 2033) // 癸丑

// ---- 大限驗證 ----
// 1. 起運歲數 = 五行局數（水二局 2 歲起、木三局 3 歲起…）
// 2. 順逆：陽男陰女順行、陰男陽女逆行（年干陰陽以農曆生年干為準）
// 3. 大限四化 = 大限宮干四化；horoscope 反查的大限宮與宮名對齊
const CLASS_TO_START = { 水二局: 2, 木三局: 3, 金四局: 4, 土五局: 5, 火六局: 6 }
function verifyDecadal(label, chart) {
  console.log(`\n[大限 ${label}] ${chart.solarDate} ${chart.gender}`)
  const start = CLASS_TO_START[chart.fiveElementsClass]
  const yearStem = chart.rawDates.chineseDate.yearly[0]
  const isYangStem = STEMS.indexOf(yearStem) % 2 === 0
  const forward = (isYangStem && chart.gender === '男') || (!isYangStem && chart.gender === '女')
  const soulIdx = chart.palaces.findIndex((p) => p.earthlyBranch === chart.earthlyBranchOfSoulPalace)

  // palaces[] 索引依地支順序遞增（寅卯辰…），順行 = 索引 +1
  let rangesOk = true
  for (let k = 0; k < 12; k++) {
    const idx = (((soulIdx + (forward ? k : -k)) % 12) + 12) % 12
    const expected = [start + 10 * k, start + 10 * k + 9]
    const actual = chart.palaces[idx].decadal.range
    if (actual[0] !== expected[0] || actual[1] !== expected[1]) {
      console.error(`  FAIL: palaces[${idx}] 大限 ${actual.join('-')} ≠ 古法 ${expected.join('-')}`)
      rangesOk = false
      failures++
    }
  }
  if (rangesOk) {
    assert(true, `${yearStem}年${chart.gender}（${isYangStem ? '陽' : '陰'}${chart.gender}）${forward ? '順' : '逆'}行，${chart.fiveElementsClass} ${start} 歲起運，十二大限起訖皆合`)
  }

  // 大限四化：用各大限起始虛歲反查 horoscope，宮位命中且四化 = 宮干查表
  const birthYear = chart.rawDates.lunarDate.lunarYear
  let mutagenOk = true
  for (const p of chart.palaces) {
    const h = chart.horoscope(`${birthYear + p.decadal.range[0] - 1}-6-1`)
    const expected = MUTAGEN_TABLE[p.decadal.heavenlyStem]
    if (h.decadal.index !== p.index) {
      console.error(`  FAIL: 虛歲 ${p.decadal.range[0]} 反查大限落 palaces[${h.decadal.index}]，應為 ${p.index}`)
      mutagenOk = false
      failures++
    }
    if (JSON.stringify(h.decadal.mutagen) !== JSON.stringify(expected)) {
      console.error(`  FAIL: ${p.decadal.heavenlyStem}干大限四化 ${h.decadal.mutagen.join('、')} ≠ 表 ${expected.join('、')}`)
      mutagenOk = false
      failures++
    }
    if (h.decadal.palaceNames[h.decadal.index] !== '命宮') {
      console.error(`  FAIL: 大限宮名未對齊（index 處應為命宮）`)
      mutagenOk = false
      failures++
    }
  }
  if (mutagenOk) assert(true, '十二大限反查命中、大限四化皆與宮干四化表一致')
}

verifyDecadal('陽女逆行', astro.bySolar('1992-7-7', 8, '女', true, 'zh-TW')) // 壬申年 金四局，範例命盤
verifyDecadal('陰男逆行', astro.bySolar('1990-1-1', 0, '男', true, 'zh-TW')) // 春節前生，農曆己巳年 水二局
verifyDecadal('陽女逆行2', sample) // 庚辰年 木三局
verifyDecadal('陽男順行', astro.bySolar('1984-6-1', 4, '男', true, 'zh-TW')) // 甲子年
verifyDecadal('陰女順行', astro.bySolar('1995-8-8', 6, '女', true, 'zh-TW')) // 乙亥年

// ---- 流月驗證：月干支依五虎遁（年干定寅月干），月支正月起寅 ----
import('lunar-lite').then(({ lunar2solar }) => {
  console.log('\n[流月 五虎遁]')
  // 五虎遁：甲己→丙寅、乙庚→戊寅、丙辛→庚寅、丁壬→壬寅、戊癸→甲寅
  const TIGER = { 甲: '丙', 己: '丙', 乙: '戊', 庚: '戊', 丙: '庚', 辛: '庚', 丁: '壬', 壬: '壬', 戊: '甲', 癸: '甲' }
  const year = 2026 // 丙年
  for (const month of [1, 3, 12]) {
    const solarDate = lunar2solar(`${year}-${month}-15`, false).toString()
    const h = sample.horoscope(solarDate)
    const firstStemIdx = STEMS.indexOf(TIGER[STEMS[(year - 4) % 10]])
    const expectStem = STEMS[(firstStemIdx + month - 1) % 10]
    const expectBranch = BRANCHES[(2 + month - 1) % 12]
    assert(
      h.monthly.heavenlyStem === expectStem && h.monthly.earthlyBranch === expectBranch,
      `${year} 農曆${month}月 干支 ${h.monthly.heavenlyStem}${h.monthly.earthlyBranch} = ${expectStem}${expectBranch}`,
    )
    assert(h.monthly.palaceNames[h.monthly.index] === '命宮', `流月宮名對齊（index 處為命宮）`)
  }
  if (failures) {
    console.error(`\n${failures} 項驗證失敗`)
    process.exit(1)
  }
  console.log('\n全部通過：命身宮、五行局、主星分布、四化、大限、流年、流月皆與古法一致')
})

