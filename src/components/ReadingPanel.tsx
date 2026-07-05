import type FunctionalAstrolabe from 'iztro/lib/astro/FunctionalAstrolabe'
import type { IFunctionalPalace } from 'iztro/lib/astro/FunctionalPalace'
import { auxStarNote } from '../content/auxStars'
import { mutagenNote } from '../content/mutagens'
import { findReading } from '../content/starInPalace'
import { findPairReading } from '../content/starPairs'
import { starOverview } from '../content/stars'
import { useStore } from '../state'

function oppositePalace(chart: FunctionalAstrolabe, palace: IFunctionalPalace): IFunctionalPalace {
  return chart.palaces[(palace.index + 6) % 12]
}

function starLabel(s: { name: string; brightness?: string; mutagen?: string }) {
  return `${s.name}${s.brightness ? `(${s.brightness})` : ''}${s.mutagen ? `化${s.mutagen}` : ''}`
}

export default function ReadingPanel({ chart }: { chart: FunctionalAstrolabe }) {
  const selectedPalace = useStore((s) => s.selectedPalace)
  const selectPalace = useStore((s) => s.selectPalace)

  if (!selectedPalace) return null
  const palace = chart.palaces.find((p) => p.name === selectedPalace)
  if (!palace) return null

  const borrowed = palace.majorStars.length === 0 ? oppositePalace(chart, palace) : null
  const readingStars = borrowed ? borrowed.majorStars : palace.majorStars
  const pairEntry =
    readingStars.length === 2 ? findPairReading(readingStars[0].name, readingStars[1].name) : undefined
  const mutagensInPalace = [...palace.majorStars, ...palace.minorStars].filter((s) => s.mutagen)
  const auxWithNotes = palace.minorStars.filter((s) => auxStarNote[s.name])

  return (
    <aside className="reading-panel">
      <header>
        <h3>
          {palace.name}
          {palace.isBodyPalace && <em className="body-badge">身宮</em>}
          <span className="reading-branch">{palace.heavenlyStem}{palace.earthlyBranch}宮・大限 {palace.decadal.range[0]}–{palace.decadal.range[1]} 歲</span>
        </h3>
        <button className="close" onClick={() => selectPalace(null)} aria-label="關閉">✕</button>
      </header>

      {borrowed && (
        <p className="borrow-note">
          此宮無主星，依古法借對宮（{borrowed.name}・{borrowed.earthlyBranch}宮）主星參看，力量較本宮主星弱，並更需參照三方四正。
        </p>
      )}

      {pairEntry && (
        <section className="reading-entry pair-entry">
          <h4>
            {pairEntry.stars[0]}・{pairEntry.stars[1]} 同宮
            <span className="reading-title">{pairEntry.title}</span>
          </h4>
          <p>{pairEntry.text}</p>
        </section>
      )}

      {readingStars.map((star) => {
        const entry = findReading(star.name, palace.name)
        return (
          <section key={star.name} className="reading-entry">
            <h4>
              {star.name}
              {star.brightness ? <i className="brightness">（{star.brightness}）</i> : null}
              {entry ? <span className="reading-title">{entry.title}</span> : null}
            </h4>
            <p className="star-overview">{starOverview[star.name]}</p>
            {entry && <p>{entry.text}</p>}
          </section>
        )
      })}

      {mutagensInPalace.length > 0 && (
        <section className="reading-entry">
          <h4>本宮四化</h4>
          {mutagensInPalace.map((s) => (
            <p key={s.name}>
              <strong>{s.name}{mutagenNote[s.mutagen!]?.name}</strong>：{mutagenNote[s.mutagen!]?.text}
            </p>
          ))}
        </section>
      )}

      <section className="reading-entry">
        <h4>三方四正會照</h4>
        {[
          { label: '對宮', p: chart.palaces[(palace.index + 6) % 12] },
          { label: '三合', p: chart.palaces[(palace.index + 4) % 12] },
          { label: '三合', p: chart.palaces[(palace.index + 8) % 12] },
        ].map(({ label, p }, i) => (
          <p key={i} className="trine-line">
            <span className="trine-label">{label}</span>
            <strong>{p.name}</strong>（{p.earthlyBranch}）：
            {p.majorStars.length > 0 ? p.majorStars.map(starLabel).join('、') : '空宮'}
            {p.minorStars.filter((s) => s.mutagen).map((s) => `、${starLabel(s)}`).join('')}
          </p>
        ))}
        <p className="trine-note">盤面上虛線框的宮位即此宮的三方四正，論斷以本宮＋會照星曜合看。</p>
      </section>

      {auxWithNotes.length > 0 && (
        <section className="reading-entry">
          <h4>同宮輔星</h4>
          {auxWithNotes.map((s) => (
            <p key={s.name}>
              <strong>{s.name}</strong>：{auxStarNote[s.name]}
            </p>
          ))}
        </section>
      )}

      <p className="disclaimer">解讀為單星靜態文案，實際論斷需綜合三方四正、亮度與四化；本站僅供參考與娛樂。</p>
    </aside>
  )
}
