// Assemble per-star JSON files (from content generation) into src/content/starInPalace.ts.
// Usage: node scripts/build-content.mjs <dir-with-14-json-files>
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const STARS = ['紫微', '天機', '太陽', '武曲', '天同', '廉貞', '天府', '太陰', '貪狼', '巨門', '天相', '天梁', '七殺', '破軍']
const PALACES = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '僕役', '官祿', '田宅', '福德', '父母']

const dir = process.argv[2]
if (!dir) {
  console.error('usage: node scripts/build-content.mjs <dir>')
  process.exit(1)
}

const entries = []
for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const arr = JSON.parse(readFileSync(join(dir, f), 'utf8'))
  for (const e of arr) entries.push({ star: e.star, palace: e.palace, title: e.title, text: e.text })
}

const seen = new Set()
for (const e of entries) {
  if (!STARS.includes(e.star)) throw new Error(`unknown star: ${e.star}`)
  if (!PALACES.includes(e.palace)) throw new Error(`unknown palace: ${e.palace} (${e.star})`)
  const key = `${e.star}|${e.palace}`
  if (seen.has(key)) throw new Error(`duplicate: ${key}`)
  seen.add(key)
  if (!e.title || !e.text || e.text.length < 80) throw new Error(`bad entry: ${key}`)
}
if (seen.size !== 168) throw new Error(`expected 168 entries, got ${seen.size}`)

entries.sort((a, b) => STARS.indexOf(a.star) - STARS.indexOf(b.star) || PALACES.indexOf(a.palace) - PALACES.indexOf(b.palace))

const out = `// 由 scripts/build-content.mjs 產生，14 主星 × 12 宮共 168 則解讀。
export type StarInPalaceEntry = {
  star: string
  palace: string
  title: string
  text: string
}

export const starInPalace: StarInPalaceEntry[] = ${JSON.stringify(entries, null, 2)}

export function findReading(star: string, palace: string): StarInPalaceEntry | undefined {
  return starInPalace.find((e) => e.star === star && e.palace === palace)
}
`
writeFileSync(new URL('../src/content/starInPalace.ts', import.meta.url), out)
console.log(`wrote ${seen.size} entries to src/content/starInPalace.ts`)
