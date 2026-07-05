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
