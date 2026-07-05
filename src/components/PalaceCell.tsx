import type { IFunctionalPalace } from 'iztro/lib/astro/FunctionalPalace'
import type FunctionalStar from 'iztro/lib/star/FunctionalStar'

const MUTAGEN_CLASS: Record<string, string> = { 祿: 'mut-lu', 權: 'mut-quan', 科: 'mut-ke', 忌: 'mut-ji' }

function Star({ star, kind, yearlyMutagen }: { star: FunctionalStar; kind: 'major' | 'minor' | 'adj'; yearlyMutagen?: string }) {
  return (
    <span className={`star star-${kind}`}>
      {star.name}
      {star.brightness ? <i className="brightness">{star.brightness}</i> : null}
      {star.mutagen ? <b className={`mutagen ${MUTAGEN_CLASS[star.mutagen] ?? ''}`}>{star.mutagen}</b> : null}
      {yearlyMutagen ? <b className={`mutagen flow ${MUTAGEN_CLASS[yearlyMutagen] ?? ''}`}>{yearlyMutagen}</b> : null}
    </span>
  )
}

export default function PalaceCell({
  palace,
  selected,
  related,
  onClick,
  yearlyName,
  isYearlySoul,
  isMonthlySoul,
  yearlyMutagenOf,
}: {
  palace: IFunctionalPalace
  selected: boolean
  /** 是否為選中宮位的三方四正 */
  related: boolean
  onClick: () => void
  /** 該宮的流年宮名縮寫（如「年命」），null 表示不顯示流年層 */
  yearlyName: string | null
  isYearlySoul: boolean
  isMonthlySoul: boolean
  /** 星名 → 流年四化（祿權科忌），無則 undefined */
  yearlyMutagenOf: (starName: string) => string | undefined
}) {
  return (
    <button
      className={`palace ${selected ? 'selected' : ''} ${related ? 'related' : ''} ${palace.name === '命宮' ? 'soul' : ''}`}
      onClick={onClick}
      data-palace={palace.name}
    >
      <div className="palace-stars">
        <div className="majors">
          {palace.majorStars.map((s) => (
            <Star key={s.name} star={s} kind="major" yearlyMutagen={yearlyMutagenOf(s.name)} />
          ))}
          {palace.majorStars.length === 0 && <span className="empty-palace">空宮</span>}
        </div>
        <div className="minors">
          {palace.minorStars.map((s) => (
            <Star key={s.name} star={s} kind="minor" yearlyMutagen={yearlyMutagenOf(s.name)} />
          ))}
        </div>
        <div className="adjs">
          {palace.adjectiveStars.map((s) => (
            <span key={s.name} className="star star-adj">{s.name}</span>
          ))}
        </div>
      </div>
      <div className="palace-footer">
        <span className="palace-name">
          {palace.name}
          {palace.isBodyPalace && <em className="body-badge">身</em>}
          {yearlyName && <em className={`yearly-tag ${isYearlySoul ? 'yearly-soul' : ''}`}>{yearlyName}</em>}
          {isMonthlySoul && <em className="yearly-tag monthly-soul">月命</em>}
        </span>
        <span className="palace-meta">
          <span className="decadal">{palace.decadal.range[0]}–{palace.decadal.range[1]}</span>
          <span className="stem-branch">{palace.heavenlyStem}{palace.earthlyBranch}</span>
        </span>
      </div>
    </button>
  )
}
