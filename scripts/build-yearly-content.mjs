// Assemble 流年四化×十二宮 JSON files into src/content/yearlyMutagens.ts.
// Usage: node scripts/build-yearly-content.mjs <dir-with-4-json-files>
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const MUTAGENS = ['祿', '權', '科', '忌']
const PALACES = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '僕役', '官祿', '田宅', '福德', '父母']

const dir = process.argv[2]
if (!dir) {
  console.error('usage: node scripts/build-yearly-content.mjs <dir>')
  process.exit(1)
}

const entries = []
for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const arr = JSON.parse(readFileSync(join(dir, f), 'utf8'))
  for (const e of arr) entries.push({ mutagen: e.mutagen, palace: e.palace, title: e.title, text: e.text })
}

const seen = new Set()
for (const e of entries) {
  if (!MUTAGENS.includes(e.mutagen)) throw new Error(`unknown mutagen: ${e.mutagen}`)
  if (!PALACES.includes(e.palace)) throw new Error(`unknown palace: ${e.palace}`)
  const key = `${e.mutagen}|${e.palace}`
  if (seen.has(key)) throw new Error(`duplicate: ${key}`)
  seen.add(key)
  if (!e.title || !e.text || e.text.length < 60) throw new Error(`bad entry: ${key}`)
}
if (seen.size !== 48) throw new Error(`expected 48 entries, got ${seen.size}`)

entries.sort(
  (a, b) => MUTAGENS.indexOf(a.mutagen) - MUTAGENS.indexOf(b.mutagen) || PALACES.indexOf(a.palace) - PALACES.indexOf(b.palace),
)

const out = `// 由 scripts/build-yearly-content.mjs 產生，流年四化 × 12 宮共 48 則解讀。
export type YearlyMutagenEntry = {
  mutagen: string
  palace: string
  title: string
  text: string
}

export const yearlyMutagens: YearlyMutagenEntry[] = ${JSON.stringify(entries, null, 2)}

export function findYearlyReading(mutagen: string, palace: string): YearlyMutagenEntry | undefined {
  return yearlyMutagens.find((e) => e.mutagen === mutagen && e.palace === palace)
}
`
writeFileSync(new URL('../src/content/yearlyMutagens.ts', import.meta.url), out)
console.log(`wrote ${seen.size} entries to src/content/yearlyMutagens.ts`)
