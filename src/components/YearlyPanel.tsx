import type FunctionalAstrolabe from 'iztro/lib/astro/FunctionalAstrolabe'
import { findYearlyReading } from '../content/yearlyMutagens'
import type { YearlyInfo } from '../lib/chart'
import { useStore } from '../state'

const MUTAGEN_ORDER = ['祿', '權', '科', '忌'] as const
const MUTAGEN_CLASS: Record<string, string> = { 祿: 'mut-lu', 權: 'mut-quan', 科: 'mut-ke', 忌: 'mut-ji' }

/** 找出星曜落在本命哪一宮（含主星與輔星） */
function palaceOfStar(chart: FunctionalAstrolabe, starName: string) {
  return chart.palaces.find((p) =>
    [...p.majorStars, ...p.minorStars].some((s) => s.name === starName),
  )
}

export function YearBar({ yearly, birthYear }: { yearly: YearlyInfo; birthYear: number }) {
  const setYear = useStore((s) => s.setYear)
  const thisYear = new Date().getFullYear()
  return (
    <div className="year-bar">
      <button onClick={() => setYear(yearly.year - 1)} disabled={yearly.year <= birthYear} aria-label="前一年">‹</button>
      <span className="year-label">
        {yearly.year} <b>{yearly.stem}{yearly.branch}年</b>・虛歲 {yearly.nominalAge}
      </span>
      <button onClick={() => setYear(yearly.year + 1)} aria-label="後一年">›</button>
      {yearly.year !== thisYear && (
        <button className="back-to-now" onClick={() => setYear(thisYear)}>回今年</button>
      )}
    </div>
  )
}

export default function YearlyPanel({ chart, yearly }: { chart: FunctionalAstrolabe; yearly: YearlyInfo }) {
  const soulPalace = chart.palaces[yearly.soulPalaceIndex]
  const decadalPalace = chart.palaces[yearly.decadalIndex]
  const soulStars = soulPalace.majorStars.map((s) => s.name)

  return (
    <section className="yearly-panel">
      <h3>{yearly.year} {yearly.stem}{yearly.branch}年 流年</h3>
      <p className="yearly-meta">
        虛歲 {yearly.nominalAge}・行{decadalPalace.name}大限（{decadalPalace.decadal.range[0]}–{decadalPalace.decadal.range[1]} 歲）
      </p>
      <p className="yearly-soul-line">
        流年命宮在本命<strong>{soulPalace.name}</strong>（{soulPalace.earthlyBranch}宮），
        {soulStars.length > 0 ? <>坐 {soulStars.join('、')}</> : <>空宮，借對宮主星參看</>}
        ——這一宮的主題就是今年的主旋律。
      </p>

      <div className="yearly-mutagens">
        {MUTAGEN_ORDER.map((m, i) => {
          const starName = yearly.mutagenStars[i]
          const palace = palaceOfStar(chart, starName)
          const entry = palace ? findYearlyReading(m, palace.name) : undefined
          return (
            <details key={m} open={m === '忌'} className="yearly-mutagen">
              <summary>
                <b className={`mutagen flow ${MUTAGEN_CLASS[m]}`}>{m}</b>
                <span className="mutagen-line">
                  {starName}化{m} → 本命{palace ? palace.name : '（不在盤面）'}
                </span>
                {entry && <span className="mutagen-title">{entry.title}</span>}
              </summary>
              {entry && <p>{entry.text}</p>}
            </details>
          )
        })}
      </div>
      <p className="yearly-hint">看流年抓兩件事：流年命宮的星、化忌落點（今年的功課）。吉凶輕重仍需配合大限與本命結構。</p>
    </section>
  )
}
