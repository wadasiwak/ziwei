// Verify src/content/starInPalace.ts covers all 14 stars × 12 palaces with non-empty text.
import { readFileSync } from 'node:fs'

const STARS = ['紫微', '天機', '太陽', '武曲', '天同', '廉貞', '天府', '太陰', '貪狼', '巨門', '天相', '天梁', '七殺', '破軍']
const PALACES = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '僕役', '官祿', '田宅', '福德', '父母']

const src = readFileSync(new URL('../src/content/starInPalace.ts', import.meta.url), 'utf8')
const start = src.indexOf('= [') + 2
const json = src.slice(start, src.lastIndexOf(']') + 1)
const entries = JSON.parse(json)

const seen = new Set()
let bad = 0
for (const e of entries) {
  seen.add(`${e.star}|${e.palace}`)
  if (!e.title || !e.text || e.text.length < 80) {
    console.error(`bad entry: ${e.star}|${e.palace}`)
    bad++
  }
}
for (const s of STARS) {
  for (const p of PALACES) {
    if (!seen.has(`${s}|${p}`)) {
      console.error(`missing: ${s}|${p}`)
      bad++
    }
  }
}
if (entries.length !== 168 || bad) {
  console.error(`FAIL: ${entries.length} entries, ${bad} problems`)
  process.exit(1)
}
console.log('OK: 168 entries, all stars × palaces covered')

// 流年四化 × 十二宮 48 則
const ysrc = readFileSync(new URL('../src/content/yearlyMutagens.ts', import.meta.url), 'utf8')
const yentries = JSON.parse(ysrc.slice(ysrc.indexOf('= [') + 2, ysrc.lastIndexOf(']') + 1))
const yseen = new Set()
let ybad = 0
for (const e of yentries) {
  yseen.add(`${e.mutagen}|${e.palace}`)
  if (!e.title || !e.text || e.text.length < 60) {
    console.error(`bad yearly entry: ${e.mutagen}|${e.palace}`)
    ybad++
  }
}
for (const m of ['祿', '權', '科', '忌']) {
  for (const p of PALACES) {
    if (!yseen.has(`${m}|${p}`)) {
      console.error(`missing yearly: ${m}|${p}`)
      ybad++
    }
  }
}
if (yentries.length !== 48 || ybad) {
  console.error(`FAIL yearly: ${yentries.length} entries, ${ybad} problems`)
  process.exit(1)
}
console.log('OK: 48 yearly mutagen entries covered')

// 大限命宮落本命十二宮 12 則（每則 100 字以上白話概述）
const dsrc = readFileSync(new URL('../src/content/decadalPalaces.ts', import.meta.url), 'utf8')
const dentries = JSON.parse(dsrc.slice(dsrc.indexOf('= [') + 2, dsrc.lastIndexOf(']') + 1))
const dseen = new Set()
let dbad = 0
for (const e of dentries) {
  dseen.add(e.palace)
  if (!e.title || !e.text || e.text.length < 100 || e.text.length > 180) {
    console.error(`bad decadal entry: ${e.palace}（${e.text?.length ?? 0} 字）`)
    dbad++
  }
}
for (const p of PALACES) {
  if (!dseen.has(p)) {
    console.error(`missing decadal: ${p}`)
    dbad++
  }
}
if (dentries.length !== 12 || dbad) {
  console.error(`FAIL decadal: ${dentries.length} entries, ${dbad} problems`)
  process.exit(1)
}
console.log('OK: 12 decadal palace entries covered')

// 流日命宮落本命十二宮 12 則（每則 40–80 字的輕量「今日盤」內容）
const daySrc = readFileSync(new URL('../src/content/dailyPalaces.ts', import.meta.url), 'utf8')
const dayEntries = JSON.parse(daySrc.slice(daySrc.indexOf('= [') + 2, daySrc.lastIndexOf(']') + 1))
const daySeen = new Set()
let dayBad = 0
for (const e of dayEntries) {
  daySeen.add(e.palace)
  if (!e.title || !e.text || e.text.length < 40 || e.text.length > 80) {
    console.error(`bad daily entry: ${e.palace}（${e.text?.length ?? 0} 字）`)
    dayBad++
  }
}
for (const p of PALACES) {
  if (!daySeen.has(p)) {
    console.error(`missing daily: ${p}`)
    dayBad++
  }
}
if (dayEntries.length !== 12 || dayBad) {
  console.error(`FAIL daily: ${dayEntries.length} entries, ${dayBad} problems`)
  process.exit(1)
}
console.log('OK: 12 daily palace entries covered')

// 雙星同宮 24 組（實際會同宮的組合固定就是這 24 種）
const PAIRS = [
  '紫微天府', '紫微貪狼', '紫微天相', '紫微七殺', '紫微破軍',
  '天機太陰', '天機巨門', '天機天梁',
  '太陽巨門', '太陽天梁', '太陽太陰',
  '武曲天府', '武曲貪狼', '武曲天相', '武曲七殺', '武曲破軍',
  '天同太陰', '天同巨門', '天同天梁',
  '廉貞天府', '廉貞貪狼', '廉貞天相', '廉貞七殺', '廉貞破軍',
]
const psrc = readFileSync(new URL('../src/content/starPairs.ts', import.meta.url), 'utf8')
const pentries = JSON.parse(
  psrc
    .slice(psrc.indexOf('= [') + 2, psrc.indexOf(']\n\nexport function') + 1)
    .replace(/'/g, '"')
    .replace(/(\w+):/g, '"$1":')
    .replace(/,(\s*[}\]])/g, '$1'),
)
let pbad = 0
const pseen = new Set(pentries.map((e) => e.stars.join('')))
for (const pair of PAIRS) {
  if (!pseen.has(pair)) {
    console.error(`missing pair: ${pair}`)
    pbad++
  }
}
for (const e of pentries) {
  if (!e.title || !e.text || e.text.length < 100) {
    console.error(`bad pair entry: ${e.stars.join('')}`)
    pbad++
  }
}
if (pentries.length !== 24 || pbad) {
  console.error(`FAIL pairs: ${pentries.length} entries, ${pbad} problems`)
  process.exit(1)
}
console.log('OK: 24 star-pair entries covered')
