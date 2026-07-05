import type FunctionalAstrolabe from 'iztro/lib/astro/FunctionalAstrolabe'
import { findYearlyReading } from '../content/yearlyMutagens'
import { LUNAR_MONTH_NAMES, type MonthlyInfo, type YearlyInfo } from '../lib/chart'
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

export function MonthBar({ monthly }: { monthly: MonthlyInfo | null }) {
  const selectedMonth = useStore((s) => s.selectedMonth)
  const setMonth = useStore((s) => s.setMonth)
  return (
    <div className="month-bar">
      <span className="month-bar-label">流月</span>
      {LUNAR_MONTH_NAMES.map((name, i) => {
        const m = i + 1
        return (
          <button
            key={m}
            className={selectedMonth === m ? 'active' : ''}
            onClick={() => setMonth(selectedMonth === m ? null : m)}
          >
            {name.replace('月', '')}
          </button>
        )
      })}
      {monthly && <span className="month-info">{monthly.stem}{monthly.branch}月</span>}
    </div>
  )
}

export default function YearlyPanel({
  chart,
  yearly,
  monthly,
}: {
  chart: FunctionalAstrolabe
  yearly: YearlyInfo
  monthly: MonthlyInfo | null
}) {
  const soulPalace = chart.palaces[yearly.soulPalaceIndex]
  const decadalPalace = chart.palaces[yearly.decadalIndex]
  const soulStars = soulPalace.majorStars.map((s) => s.name)

  return (
    <section className="yearly-panel">
      <h3>{yearly.year} {yearly.stem}{yearly.branch}年 流年</h3>
      <p className="yearly-meta">
        虛歲 {yearly.nominalAge}・行{decadalPalace.name}大限（{decadalPalace.decadal.range[0]}–{decadalPalace.decadal.range[1]} 歲，{yearly.decadalStem}{yearly.decadalBranch}）
      </p>
      <details className="yearly-mutagen decadal-block">
        <summary>
          <span className="mutagen-line">大限四化（十年運的底色）</span>
        </summary>
        <ul className="monthly-mutagens">
          {MUTAGEN_ORDER.map((m, i) => {
            const starName = yearly.decadalMutagenStars[i]
            const palace = palaceOfStar(chart, starName)
            return (
              <li key={m}>
                <b className={`mutagen flow ${MUTAGEN_CLASS[m]}`}>{m}</b>
                {starName}化{m} → 本命{palace ? palace.name : '（不在盤面）'}
              </li>
            )
          })}
        </ul>
      </details>
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
      {monthly && (
        <div className="monthly-block">
          <h4>{LUNAR_MONTH_NAMES[monthly.month - 1]}（{monthly.stem}{monthly.branch}月）流月</h4>
          <p className="yearly-soul-line">
            流月命宮在本命<strong>{chart.palaces[monthly.soulPalaceIndex].name}</strong>
            （{chart.palaces[monthly.soulPalaceIndex].earthlyBranch}宮）
            {chart.palaces[monthly.soulPalaceIndex].majorStars.length > 0
              ? <>，坐 {chart.palaces[monthly.soulPalaceIndex].majorStars.map((s) => s.name).join('、')}</>
              : <>，空宮</>}
          </p>
          <ul className="monthly-mutagens">
            {MUTAGEN_ORDER.map((m, i) => {
              const starName = monthly.mutagenStars[i]
              const palace = palaceOfStar(chart, starName)
              return (
                <li key={m}>
                  <b className={`mutagen flow ${MUTAGEN_CLASS[m]}`}>{m}</b>
                  {starName}化{m} → 本命{palace ? palace.name : '（不在盤面）'}
                </li>
              )
            })}
          </ul>
        </div>
      )}
      <p className="yearly-hint">看流年抓兩件事：流年命宮的星、化忌落點（今年的功課）。吉凶輕重仍需配合大限與本命結構。</p>
    </section>
  )
}
