import type FunctionalAstrolabe from 'iztro/lib/astro/FunctionalAstrolabe'
import { findDecadalReading } from '../content/decadalPalaces'
import type { DecadalInfo } from '../lib/chart'

const MUTAGEN_ORDER = ['祿', '權', '科', '忌'] as const
const MUTAGEN_CLASS: Record<string, string> = { 祿: 'mut-lu', 權: 'mut-quan', 科: 'mut-ke', 忌: 'mut-ji' }

/** 找出星曜落在本命哪一宮（含主星與輔星） */
function palaceOfStar(chart: FunctionalAstrolabe, starName: string) {
  return chart.palaces.find((p) =>
    [...p.majorStars, ...p.minorStars].some((s) => s.name === starName),
  )
}

export default function DecadalPanel({ chart, decadal }: { chart: FunctionalAstrolabe; decadal: DecadalInfo }) {
  const soulPalace = chart.palaces[decadal.index] // 大限命宮 = 大限所在宮
  const soulStars = soulPalace.majorStars.map((s) => s.name)
  const entry = findDecadalReading(soulPalace.name)

  return (
    <section className="yearly-panel decadal-panel">
      <h3>大限 {decadal.range[0]}–{decadal.range[1]} 歲（{decadal.stem}{decadal.branch}）</h3>
      <p className="yearly-meta">西元 {decadal.yearRange[0]}–{decadal.yearRange[1]}・十年運</p>
      <p className="yearly-soul-line">
        大限命宮在本命<strong>{soulPalace.name}</strong>（{soulPalace.earthlyBranch}宮），
        {soulStars.length > 0 ? <>坐 {soulStars.join('、')}</> : <>空宮，借對宮主星參看</>}
        ——這一宮的主題就是這十年的大方向。
      </p>
      {entry && (
        <div className="decadal-reading">
          <h4>{entry.title}</h4>
          <p>{entry.text}</p>
        </div>
      )}
      <ul className="monthly-mutagens">
        {MUTAGEN_ORDER.map((m, i) => {
          const starName = decadal.mutagenStars[i]
          const palace = palaceOfStar(chart, starName)
          return (
            <li key={m}>
              <b className={`mutagen dec ${MUTAGEN_CLASS[m]}`}>{m}</b>
              {starName}化{m} → 本命{palace ? palace.name : '（不在盤面）'}
            </li>
          )
        })}
      </ul>
      <p className="yearly-hint">大限是十年的底色，流年吉凶在這個底色上起伏；大限化忌落點是這十年要用心經營的領域。</p>
    </section>
  )
}
