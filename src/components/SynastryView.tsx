import { useEffect, useMemo, useRef, useState } from 'react'
import type FunctionalAstrolabe from 'iztro/lib/astro/FunctionalAstrolabe'
import { findElementSynastry } from '../content/elementSynastry'
import { findLoveStyle } from '../content/starInLove'
import { computeChart, TIME_OPTIONS, type BirthInput } from '../lib/chart'
import { synastryUrl } from '../lib/share'
import {
  bridgeLine,
  fiveElementOf,
  mutagenLandingLine,
  mutagenLandings,
  palaceMajors,
} from '../lib/synastry'
import { useStore } from '../state'

function SummaryCard({ input, chart, tag, displayName }: { input: BirthInput; chart: FunctionalAstrolabe; tag: string; displayName: string }) {
  const soul = palaceMajors(chart, '命宮')!
  const bodyPalace = chart.palaces.find((p) => p.isBodyPalace)!
  return (
    <article className="syn-card">
      <h3>
        <span className="syn-tag">{tag}</span>
        {displayName}
      </h3>
      <dl>
        <div>
          <dt>生辰</dt>
          <dd>
            {input.calendar === 'lunar' ? '農曆' : '國曆'} {input.date}・{TIME_OPTIONS[input.timeIndex]?.label.split(' ')[0] ?? ''}・{input.gender}
          </dd>
        </div>
        <div>
          <dt>命宮主星</dt>
          <dd>{soul.borrowedFrom ? `空宮（借對宮 ${soul.stars.join('、')}）` : soul.stars.join('、')}</dd>
        </div>
        <div>
          <dt>身宮</dt>
          <dd>{bodyPalace.name}（{bodyPalace.earthlyBranch}宮）</dd>
        </div>
        <div>
          <dt>五行局</dt>
          <dd>{chart.fiveElementsClass}</dd>
        </div>
      </dl>
    </article>
  )
}

/** 互看區單向：from 的夫妻宮（理想伴侶輪廓）對照 to 的命宮（本人樣子） */
function GazeSection({
  fromName,
  fromChart,
  toName,
  toChart,
}: {
  fromName: string
  fromChart: FunctionalAstrolabe
  toName: string
  toChart: FunctionalAstrolabe
}) {
  const spouse = palaceMajors(fromChart, '夫妻')
  const soul = palaceMajors(toChart, '命宮')
  if (!spouse || !soul) return null
  return (
    <section className="syn-block syn-gaze">
      <h3>在 {fromName} 的命盤裡：理想伴侶的樣子 × {toName} 本人</h3>
      <p className="syn-frame">
        夫妻宮描繪的是 {fromName} 心中理想伴侶的輪廓；拿來對照 {toName} 命宮呈現的本人特質，看看想像與真人哪裡合拍、哪裡需要磨合。
      </p>
      <div className="syn-pair">
        <div className="syn-side">
          <h4>{fromName} 的夫妻宮：{spouse.stars.join('、')}</h4>
          {spouse.borrowedFrom && (
            <p className="borrow-note">
              夫妻宮無主星，依古法借對宮（{spouse.borrowedFrom.name}）主星參看，力量較本宮主星弱。
            </p>
          )}
          {spouse.stars.map((s) => {
            const e = findLoveStyle(s)
            return e ? (
              <p key={s}>
                <strong>{s}</strong>（{e.title}）：{e.text}
              </p>
            ) : null
          })}
        </div>
        <div className="syn-side">
          <h4>{toName} 的命宮：{soul.stars.join('、')}</h4>
          {soul.borrowedFrom && (
            <p className="borrow-note">
              命宮無主星，依古法借對宮（{soul.borrowedFrom.name}）主星參看，力量較本宮主星弱。
            </p>
          )}
          {soul.stars.map((s) => {
            const e = findLoveStyle(s)
            return e ? (
              <p key={s}>
                <strong>{s}</strong>（{e.title}）：{e.text}
              </p>
            ) : null
          })}
        </div>
      </div>
      {spouse.stars[0] && soul.stars[0] && (
        <p className="syn-bridge">{bridgeLine(fromName, spouse.stars[0], toName, soul.stars[0])}</p>
      )}
    </section>
  )
}

/** 合盤比較視圖：摘要卡並列＋互看區（雙向）＋五行局生剋＋生年四化互動 */
export default function SynastryView() {
  const synastry = useStore((s) => s.synastry)
  const setSynastry = useStore((s) => s.setSynastry)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // 匿名事件：記一次「有人開了合盤」，不帶任何輸入資料
  useEffect(() => {
    const gc = (window as { goatcounter?: { count?: (opts: object) => void } }).goatcounter
    if (gc?.count) gc.count({ path: 'event/synastry', title: '合盤', event: true })
  }, [])

  const a = synastry?.a ?? null
  const b = synastry?.b ?? null

  const chartA = useMemo(() => {
    if (!a) return null
    try {
      return computeChart(a)
    } catch (e) {
      console.error(e)
      return null
    }
  }, [a])

  const chartB = useMemo(() => {
    if (!b) return null
    try {
      return computeChart(b)
    } catch (e) {
      console.error(e)
      return null
    }
  }, [b])

  if (!a || !b) return null

  if (!chartA || !chartB) {
    return (
      <section className="synastry">
        <p className="error">其中一張命盤無法排出，請確認生日資料後重新選擇。</p>
        <button className="secondary syn-close" onClick={() => setSynastry(null)}>離開合盤</button>
      </section>
    )
  }

  // 兩人同名時加甲乙區分，避免內文分不清誰是誰
  const aName = a.name === b.name ? `${a.name}（甲）` : a.name
  const bName = a.name === b.name ? `${b.name}（乙）` : b.name

  const elA = fiveElementOf(chartA.fiveElementsClass)
  const elB = fiveElementOf(chartB.fiveElementsClass)
  const elEntry = findElementSynastry(elA, elB)
  const landingsAtoB = mutagenLandings(chartA, chartB)
  const landingsBtoA = mutagenLandings(chartB, chartA)

  const share = () => {
    navigator.clipboard.writeText(synastryUrl(a, b)).then(() => {
      setCopied(true)
      setToast('已複製合盤連結 ✓ 傳給對方打開就是這兩張盤的比較（生日資料只在連結裡，不經任何伺服器）。')
      timers.current.push(setTimeout(() => setCopied(false), 2000))
      timers.current.push(setTimeout(() => setToast(null), 8000))
    })
  }

  return (
    <section className="synastry">
      <div className="synastry-head">
        <h2>合盤比較</h2>
        <p className="synastry-sub">兩張命盤的互看與化學反應，當作認識彼此的話題就好。</p>
        <div className="syn-actions">
          <button className="secondary syn-share" title="複製這組合盤的專屬連結" onClick={share}>
            {copied ? '已複製 ✓' : '分享合盤'}
          </button>
          <button className="secondary syn-close" onClick={() => setSynastry(null)}>離開合盤</button>
        </div>
      </div>

      {toast && <p className="copy-toast">{toast}</p>}

      <div className="syn-summary">
        <SummaryCard input={a} chart={chartA} tag="甲" displayName={aName} />
        <SummaryCard input={b} chart={chartB} tag="乙" displayName={bName} />
      </div>

      <GazeSection fromName={aName} fromChart={chartA} toName={bName} toChart={chartB} />
      <GazeSection fromName={bName} fromChart={chartB} toName={aName} toChart={chartA} />

      <section className="syn-block syn-element">
        <h3>五行局的化學反應</h3>
        {elEntry ? (
          <p>
            {aName} 是 <b>{chartA.fiveElementsClass}</b>、{bName} 是 <b>{chartB.fiveElementsClass}</b>，五行
            <span className="syn-relation">{elEntry.relation === '比和' ? '比和（同類）' : elEntry.relation}</span>：
            {elEntry.text.replaceAll('{A}', aName).replaceAll('{B}', bName)}
          </p>
        ) : (
          <p>{aName} 是 {chartA.fiveElementsClass}、{bName} 是 {chartB.fiveElementsClass}。</p>
        )}
      </section>

      <section className="syn-block syn-mutagen">
        <h3>生年四化的交會</h3>
        <p className="syn-frame">
          每個人都帶著出生年的四顆化星（祿、權、科、忌）。看它們落進對方命盤的哪個宮位，就知道這段緣分容易在哪些領域起作用。
        </p>
        <div className="syn-pair">
          <div className="syn-side">
            <h4>{aName} 的四化，落在 {bName} 的盤上</h4>
            {landingsAtoB.map((l) => (
              <p key={l.mutagen}>
                <strong>化{l.mutagen}（{l.star}）</strong>→ {bName} 的{l.palaceName}：{mutagenLandingLine(aName, bName, l)}
              </p>
            ))}
          </div>
          <div className="syn-side">
            <h4>{bName} 的四化，落在 {aName} 的盤上</h4>
            {landingsBtoA.map((l) => (
              <p key={l.mutagen}>
                <strong>化{l.mutagen}（{l.star}）</strong>→ {aName} 的{l.palaceName}：{mutagenLandingLine(bName, aName, l)}
              </p>
            ))}
          </div>
        </div>
      </section>

      <p className="disclaimer">
        合盤是主星與四化的靜態對照，僅供參考與娛樂；每段關係都由兩個人共同經營，沒有天生註定的好壞，差異只是需要磨合的地方。
      </p>
    </section>
  )
}
