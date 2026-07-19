import { useMemo, useState } from 'react'
import { starInPalace, type StarInPalaceEntry } from '../content/starInPalace'
import { starPairs, type StarPairEntry } from '../content/starPairs'
import { starOverview } from '../content/stars'
import { PATTERN_LIBRARY, type Pattern } from '../lib/patterns'

const STARS = ['紫微', '天機', '太陽', '武曲', '天同', '廉貞', '天府', '太陰', '貪狼', '巨門', '天相', '天梁', '七殺', '破軍']
const PALACE_ORDER = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '僕役', '官祿', '田宅', '福德', '父母']

type Tab = 'star' | 'pair' | 'pattern'

/** 解讀文庫：不用排盤即可瀏覽 168 則主星×宮位解讀、24 則雙星同宮與格局說明 */
export default function Library({ onUseChart }: { onUseChart: () => void }) {
  const [tab, setTab] = useState<Tab>('star')
  const [star, setStar] = useState('紫微')
  const [q, setQ] = useState('')
  const query = q.trim()

  // 搜尋跨三個分區：星名／宮名／標題／內文關鍵字
  const hits = useMemo(() => {
    if (!query) return null
    const match = (...fields: string[]) => fields.some((f) => f.includes(query))
    return {
      star: starInPalace.filter((e) => match(e.star, e.palace, e.title, e.text)),
      pair: starPairs.filter((e) => match(e.stars[0], e.stars[1], e.title, e.text)),
      pattern: PATTERN_LIBRARY.filter((e) => match(e.name, e.description)),
    }
  }, [query])

  const starEntries = useMemo(
    () =>
      starInPalace
        .filter((e) => e.star === star)
        .sort((a, b) => PALACE_ORDER.indexOf(a.palace) - PALACE_ORDER.indexOf(b.palace)),
    [star],
  )

  const UseChartLink = ({ label }: { label?: string }) => (
    <button className="link-btn lib-use" onClick={onUseChart}>
      {label ?? '排我的盤看看'} →
    </button>
  )

  const StarCard = ({ e }: { e: StarInPalaceEntry }) => (
    <article className="lib-card">
      <h4>
        <span className="lib-card-tag">{e.star}・{e.palace}</span>
        {e.title}
      </h4>
      <p>{e.text}</p>
      <UseChartLink label={`排我的盤，看${e.star}落在哪一宮`} />
    </article>
  )

  const PairCard = ({ e }: { e: StarPairEntry }) => (
    <article className="lib-card">
      <h4>
        <span className="lib-card-tag">{e.stars[0]}＋{e.stars[1]}</span>
        {e.title}
      </h4>
      <p>{e.text}</p>
      <UseChartLink />
    </article>
  )

  const PatternCard = ({ e }: { e: Pattern }) => (
    <article className="lib-card">
      <h4><span className="lib-card-tag">格局</span>{e.name}</h4>
      <p>{e.description}</p>
      <UseChartLink label="排我的盤，看有沒有這個格局" />
    </article>
  )

  return (
    <section className="library">
      <div className="library-head">
        <h2>解讀文庫</h2>
        <p className="library-sub">
          14 主星 × 12 宮共 {starInPalace.length} 則白話解讀，加上 {starPairs.length} 組雙星同宮與 {PATTERN_LIBRARY.length} 個經典格局，不用排盤也能翻。
        </p>
        <input
          className="library-search"
          type="search"
          placeholder="搜尋星名、宮名或內文關鍵字，例如「紫微」「夫妻」「面子」"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {hits ? (
        <div className="lib-results">
          <p className="lib-count">
            找到 {hits.star.length + hits.pair.length + hits.pattern.length} 則：
            主星×宮位 {hits.star.length}・雙星同宮 {hits.pair.length}・格局 {hits.pattern.length}
          </p>
          <div className="lib-grid">
            {hits.star.map((e) => <StarCard key={`${e.star}-${e.palace}`} e={e} />)}
            {hits.pair.map((e) => <PairCard key={e.stars.join('')} e={e} />)}
            {hits.pattern.map((e) => <PatternCard key={e.name} e={e} />)}
          </div>
          {hits.star.length + hits.pair.length + hits.pattern.length === 0 && (
            <p className="lib-empty">查無符合的解讀，換個關鍵字試試（星名、宮名或文案中的詞都可以搜）。</p>
          )}
        </div>
      ) : (
        <>
          <div className="lib-tabs">
            <button className={tab === 'star' ? 'active' : ''} onClick={() => setTab('star')}>主星 × 十二宮</button>
            <button className={tab === 'pair' ? 'active' : ''} onClick={() => setTab('pair')}>雙星同宮</button>
            <button className={tab === 'pattern' ? 'active' : ''} onClick={() => setTab('pattern')}>格局</button>
          </div>

          {tab === 'star' && (
            <>
              <div className="star-chips">
                {STARS.map((s) => (
                  <button key={s} className={star === s ? 'active' : ''} onClick={() => setStar(s)}>{s}</button>
                ))}
              </div>
              <p className="star-chip-overview">{star}：{starOverview[star]}</p>
              <div className="lib-grid">
                {starEntries.map((e) => <StarCard key={e.palace} e={e} />)}
              </div>
            </>
          )}

          {tab === 'pair' && (
            <div className="lib-grid">
              {starPairs.map((e) => <PairCard key={e.stars.join('')} e={e} />)}
            </div>
          )}

          {tab === 'pattern' && (
            <div className="lib-grid">
              {PATTERN_LIBRARY.map((e) => <PatternCard key={e.name} e={e} />)}
            </div>
          )}
        </>
      )}
    </section>
  )
}
