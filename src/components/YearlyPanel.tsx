import type FunctionalAstrolabe from 'iztro/lib/astro/FunctionalAstrolabe'
import { findDailyReading } from '../content/dailyPalaces'
import { findJiCaution } from '../content/jiCautions'
import { findMonthlyReading } from '../content/monthlyPalaces'
import { findYearlyReading } from '../content/yearlyMutagens'
import { LUNAR_DAY_NAMES, LUNAR_MONTH_NAMES, lunarMonthDays, todayLunar, type DailyInfo, type DecadalInfo, type MonthlyInfo, type YearlyInfo } from '../lib/chart'
import { useStore } from '../state'

const MUTAGEN_ORDER = ['祿', '權', '科', '忌'] as const
const MUTAGEN_CLASS: Record<string, string> = { 祿: 'mut-lu', 權: 'mut-quan', 科: 'mut-ke', 忌: 'mut-ji' }

/** 找出星曜落在本命哪一宮（含主星與輔星） */
function palaceOfStar(chart: FunctionalAstrolabe, starName: string) {
  return chart.palaces.find((p) =>
    [...p.majorStars, ...p.minorStars].some((s) => s.name === starName),
  )
}

/** 大限選擇列：十二個十年區間，點選後盤面疊加大限層 */
export function DecadalBar({ decadals, yearly }: { decadals: DecadalInfo[]; yearly: YearlyInfo }) {
  const selectedDecadal = useStore((s) => s.selectedDecadal)
  const setDecadal = useStore((s) => s.setDecadal)
  const setYear = useStore((s) => s.setYear)
  return (
    <div className="decadal-bar">
      <span className="decadal-bar-label">大限</span>
      {decadals.map((d) => {
        const isNow = yearly.decadalIndex === d.index // 目前所選流年落在這個大限
        return (
          <button
            key={d.index}
            className={`${selectedDecadal === d.index ? 'active' : ''} ${isNow ? 'now' : ''}`}
            title={`${d.range[0]}–${d.range[1]} 歲（${d.yearRange[0]}–${d.yearRange[1]}）`}
            onClick={() => {
              if (selectedDecadal === d.index) {
                setDecadal(null)
                return
              }
              setDecadal(d.index)
              // 流年連動：所選流年不在這個大限內時，跳到大限起始年
              if (yearly.year < d.yearRange[0] || yearly.year > d.yearRange[1]) {
                setYear(d.yearRange[0])
              }
            }}
          >
            <span className="dec-age">{d.range[0]}–{d.range[1]}</span>
            <span className="dec-sb">{d.stem}{d.branch}</span>
          </button>
        )
      })}
    </div>
  )
}

export function YearBar({ yearly, birthYear, decadal }: { yearly: YearlyInfo; birthYear: number; decadal: DecadalInfo | null }) {
  const setYear = useStore((s) => s.setYear)
  const setMonth = useStore((s) => s.setMonth)
  const setDay = useStore((s) => s.setDay)
  const thisYear = new Date().getFullYear()
  const inDecadal = decadal !== null && yearly.year >= decadal.yearRange[0] && yearly.year <= decadal.yearRange[1]
  // 一鍵跳到今日的流年／流月／流日（以農曆年月日為準，春節前自動落在前一流年）
  const goToday = () => {
    const t = todayLunar()
    setYear(t.year)
    setMonth(t.month)
    setDay(t.day)
  }
  return (
    <div className="year-bar">
      <button onClick={() => setYear(yearly.year - 1)} disabled={yearly.year <= birthYear} aria-label="前一年">‹</button>
      <span className="year-label">
        {yearly.year} <b>{yearly.stem}{yearly.branch}年</b>・虛歲 {yearly.nominalAge}
      </span>
      <button onClick={() => setYear(yearly.year + 1)} aria-label="後一年">›</button>
      <button className="today-btn" title="一鍵跳到今天的流年、流月、流日" onClick={goToday}>今天</button>
      {yearly.year !== thisYear && (
        <button className="back-to-now" onClick={() => setYear(thisYear)}>回今年</button>
      )}
      {decadal && (
        <span className={`dec-range ${inDecadal ? '' : 'out'}`}>
          大限 {decadal.yearRange[0]}–{decadal.yearRange[1]}{!inDecadal && '（此年在大限外）'}
        </span>
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

/** 流日選擇列：選了流月才出現，列出當月農曆日（29 或 30 天），點選後盤面疊加流日層 */
export function DayBar({ yearly, daily }: { yearly: YearlyInfo; daily: DailyInfo | null }) {
  const selectedMonth = useStore((s) => s.selectedMonth)
  const selectedDay = useStore((s) => s.selectedDay)
  const setDay = useStore((s) => s.setDay)
  if (selectedMonth === null) return null
  const days = lunarMonthDays(yearly.year, selectedMonth)
  const t = todayLunar()
  const todayHere = !t.isLeap && t.year === yearly.year && t.month === selectedMonth ? t.day : null
  return (
    <div className="day-bar">
      <span className="day-bar-label">流日</span>
      {Array.from({ length: days }, (_, i) => i + 1).map((d) => (
        <button
          key={d}
          className={`${selectedDay === d ? 'active' : ''} ${todayHere === d ? 'now' : ''}`}
          title={todayHere === d ? '今天' : undefined}
          onClick={() => setDay(selectedDay === d ? null : d)}
        >
          {LUNAR_DAY_NAMES[d - 1]}
        </button>
      ))}
      {daily && <span className="day-info">{daily.stem}{daily.branch}日・國曆 {daily.solarDate}</span>}
    </div>
  )
}

export default function YearlyPanel({
  chart,
  yearly,
  monthly,
  daily,
}: {
  chart: FunctionalAstrolabe
  yearly: YearlyInfo
  monthly: MonthlyInfo | null
  daily: DailyInfo | null
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
      {monthly && (() => {
        const monthlySoul = chart.palaces[monthly.soulPalaceIndex]
        const entry = findMonthlyReading(monthlySoul.name)
        const jiStar = monthly.mutagenStars[3]
        const jiPalace = palaceOfStar(chart, jiStar)
        const ji = jiPalace ? findJiCaution(jiPalace.name) : undefined
        return (
          <div className="monthly-block">
            <h4>{LUNAR_MONTH_NAMES[monthly.month - 1]}（{monthly.stem}{monthly.branch}月）流月</h4>
            <p className="yearly-soul-line">
              流月命宮在本命<strong>{monthlySoul.name}</strong>（{monthlySoul.earthlyBranch}宮）
              {monthlySoul.majorStars.length > 0
                ? <>，坐 {monthlySoul.majorStars.map((s) => s.name).join('、')}</>
                : <>，空宮</>}
            </p>
            {entry && <p className="daily-reading"><b>{entry.title}</b>——{entry.text}</p>}
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
            {ji && jiPalace && (
              <p className="daily-reading ji-caution">
                <b>本月功課</b>：{jiStar}化忌入本命{jiPalace.name}——{ji.text}
              </p>
            )}
          </div>
        )
      })()}
      {daily && (() => {
        const dailySoul = chart.palaces[daily.soulPalaceIndex]
        const entry = findDailyReading(dailySoul.name)
        const jiStar = daily.mutagenStars[3]
        const jiPalace = palaceOfStar(chart, jiStar)
        const ji = jiPalace ? findJiCaution(jiPalace.name) : undefined
        return (
          <div className="monthly-block daily-block">
            <h4>
              {LUNAR_DAY_NAMES[daily.day - 1]}（{daily.stem}{daily.branch}日）流日
              <span className="daily-solar">國曆 {daily.solarDate}</span>
            </h4>
            <p className="yearly-soul-line">
              今日盤：流日命宮在本命<strong>{dailySoul.name}</strong>（{dailySoul.earthlyBranch}宮）
              {dailySoul.majorStars.length > 0
                ? <>，坐 {dailySoul.majorStars.map((s) => s.name).join('、')}</>
                : <>，空宮</>}
            </p>
            {entry && <p className="daily-reading"><b>{entry.title}</b>——{entry.text}</p>}
            <ul className="monthly-mutagens">
              {MUTAGEN_ORDER.map((m, i) => {
                const starName = daily.mutagenStars[i]
                const palace = palaceOfStar(chart, starName)
                return (
                  <li key={m}>
                    <b className={`mutagen day ${MUTAGEN_CLASS[m]}`}>{m}</b>
                    {starName}化{m} → 本命{palace ? palace.name : '（不在盤面）'}
                  </li>
                )
              })}
            </ul>
            {ji && jiPalace && (
              <p className="daily-reading ji-caution">
                <b>今日留意</b>：{jiStar}化忌入本命{jiPalace.name}——{ji.text}
              </p>
            )}
          </div>
        )
      })()}
      <p className="yearly-hint">看流年抓兩件事：流年命宮的星、化忌落點（今年的功課）。吉凶輕重仍需配合大限與本命結構。</p>
    </section>
  )
}
