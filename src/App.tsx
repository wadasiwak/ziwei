import { useEffect, useMemo, useState } from 'react'
import BirthForm from './components/BirthForm'
import ChartGrid from './components/ChartGrid'
import DecadalPanel from './components/DecadalPanel'
import Glossary from './components/Glossary'
import Library from './components/Library'
import PatternCard from './components/PatternCard'
import ReadingPanel from './components/ReadingPanel'
import SavedCharts from './components/SavedCharts'
import YearlyPanel, { DayBar, DecadalBar, MonthBar, YearBar } from './components/YearlyPanel'
import { computeChart, computeDaily, computeMonthly, computeYearly, listDecadals } from './lib/chart'
import { isDemoInput } from './lib/demo'
import { detectPatterns } from './lib/patterns'
import { buildLlmPrompt } from './lib/prompt'
import { makeChartCard, shareOrDownload } from './lib/shareCard'
import { inputToParams, paramsToInput, paramsToView, shareUrl } from './lib/share'
import { useStore } from './state'

function useCopy(): [string | null, string | null, (text: string, label: string, toast: string) => void, (msg: string) => void] {
  const [copied, setCopied] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const copy = (text: string, label: string, toastMsg: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label)
      setToast(toastMsg)
      setTimeout(() => setCopied(null), 2000)
      setTimeout(() => setToast(null), 8000)
    })
  }
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 8000)
  }
  return [copied, toast, copy, showToast]
}

export default function App() {
  const input = useStore((s) => s.input)
  const setInput = useStore((s) => s.setInput)
  const selectedPalace = useStore((s) => s.selectedPalace)
  const selectPalace = useStore((s) => s.selectPalace)
  const selectedYear = useStore((s) => s.selectedYear)
  const selectedMonth = useStore((s) => s.selectedMonth)
  const selectedDay = useStore((s) => s.selectedDay)
  const selectedDecadal = useStore((s) => s.selectedDecadal)
  const setYear = useStore((s) => s.setYear)
  const setMonth = useStore((s) => s.setMonth)
  const setDay = useStore((s) => s.setDay)
  const setDecadal = useStore((s) => s.setDecadal)
  const [showForm, setShowForm] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [copied, toast, copy, showToast] = useCopy()

  // 開站時從網址讀取分享的命盤參數與檢視狀態（宮位／流年／流月）
  useEffect(() => {
    const fromUrl = paramsToInput(location.search)
    if (fromUrl) {
      setInput(fromUrl)
      const view = paramsToView(location.search)
      if (view.year !== undefined) setYear(view.year)
      if (view.month !== undefined) setMonth(view.month)
      if (view.day !== undefined) setDay(view.day) // 需在 setMonth 之後（換月會歸零流日）
      if (view.palace !== undefined) selectPalace(view.palace)
      if (view.decadal !== undefined) setDecadal(view.decadal)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 命盤或檢視狀態變動時同步到網址，直接複製網址列也能分享同一個視圖
  useEffect(() => {
    if (input) {
      const view = { palace: selectedPalace, year: selectedYear, month: selectedMonth, day: selectedDay, decadal: selectedDecadal }
      history.replaceState(null, '', `${location.pathname}?${inputToParams(input, view)}`)
    }
  }, [input, selectedPalace, selectedYear, selectedMonth, selectedDay, selectedDecadal])

  const chart = useMemo(() => {
    if (!input) return null
    try {
      return computeChart(input)
    } catch (e) {
      console.error(e)
      return null
    }
  }, [input])

  // 匿名事件：記一次「有人排了盤」，不帶任何輸入資料
  useEffect(() => {
    const gc = (window as { goatcounter?: { count?: (opts: object) => void } }).goatcounter
    if (chart && gc?.count) {
      gc.count({ path: 'event/chart-created', title: '排盤', event: true })
    }
  }, [chart])

  const birthYear = chart ? Number(chart.solarDate.split('-')[0]) : 0

  const yearly = useMemo(() => {
    if (!chart) return null
    try {
      return computeYearly(chart, Math.max(selectedYear, birthYear))
    } catch (e) {
      console.error(e)
      return null
    }
  }, [chart, selectedYear, birthYear])

  const monthly = useMemo(() => {
    if (!chart || !yearly || selectedMonth === null) return null
    try {
      return computeMonthly(chart, yearly.year, selectedMonth)
    } catch (e) {
      console.error(e)
      return null
    }
  }, [chart, yearly, selectedMonth])

  const daily = useMemo(() => {
    if (!chart || !yearly || selectedMonth === null || selectedDay === null) return null
    try {
      return computeDaily(chart, yearly.year, selectedMonth, selectedDay)
    } catch (e) {
      console.error(e)
      return null
    }
  }, [chart, yearly, selectedMonth, selectedDay])

  const decadals = useMemo(() => {
    if (!chart) return null
    try {
      return listDecadals(chart)
    } catch (e) {
      console.error(e)
      return null
    }
  }, [chart])

  const decadal = useMemo(
    () => (decadals && selectedDecadal !== null ? decadals.find((d) => d.index === selectedDecadal) ?? null : null),
    [decadals, selectedDecadal],
  )

  const patterns = useMemo(() => (chart ? detectPatterns(chart) : []), [chart])

  const saveImage = async () => {
    if (!chart || !input) return
    try {
      const blob = await makeChartCard(chart, input, patterns)
      await shareOrDownload(blob, `紫微命盤-${input.name}.png`)
      showToast('已產生命盤概要卡 ✓ 手機會跳出分享面板，電腦則直接下載 PNG。')
    } catch (e) {
      console.error(e)
      showToast('圖片產生失敗，請改用「分享」複製連結。')
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1
          className={chart ? 'clickable' : ''}
          title={chart ? '重新排盤' : undefined}
          onClick={() => chart && setShowForm((v) => !v)}
        >
          紫微斗數排盤
        </h1>
        <div className="header-actions">
          {chart && input && !showLibrary && (
            <>
              <button
                className="secondary"
                title="複製這張命盤的專屬連結，傳給對方打開就是同一張盤"
                onClick={() => copy(shareUrl(input, { palace: selectedPalace, year: selectedYear, month: selectedMonth, day: selectedDay, decadal: selectedDecadal }), 'share', '已複製命盤連結 ✓ 用 LINE 或訊息傳給對方，打開就是這張盤（連目前選的宮位、大限、流年流月流日都一起還原；生日資料只在連結裡，不經任何伺服器）。')}
              >
                {copied === 'share' ? '已複製 ✓' : '分享'}
              </button>
              <button
                className="secondary"
                title="複製整張命盤的結構化資料，貼到 ChatGPT／Claude 等 AI 取得整盤綜合解讀"
                onClick={() => copy(buildLlmPrompt(chart, input, yearly, monthly, daily), 'ai', '已複製整張命盤資料 ✓ 接著開啟 ChatGPT、Claude 或任何 AI，直接「貼上→送出」，就會得到這張盤的綜合解讀。')}
              >
                {copied === 'ai' ? '已複製 ✓' : 'AI 解讀'}
              </button>
              <button
                className="secondary"
                title="把命盤重點（命宮主星、身宮、格局）做成一張圖，方便傳給朋友或存起來"
                onClick={saveImage}
              >
                存成圖片
              </button>
              <button className="secondary" onClick={() => setShowForm((v) => !v)}>
                {showForm ? '收起' : '重新排盤'}
              </button>
            </>
          )}
          <button
            className="secondary lib-btn"
            title="不用排盤，直接瀏覽 168 則主星×宮位解讀、雙星同宮與格局說明"
            onClick={() => setShowLibrary((v) => !v)}
          >
            {showLibrary ? '離開文庫' : '文庫'}
          </button>
        </div>
      </header>

      {toast && <p className="copy-toast">{toast}</p>}

      {showLibrary && (
        <Library
          onUseChart={() => {
            setShowLibrary(false)
            setShowForm(true)
            window.scrollTo({ top: 0 })
          }}
        />
      )}

      {!showLibrary && (<>
      <SavedCharts />

      {!chart && (
        <div className="hero">
          <p className="hero-title">輸入出生年月日時，排出完整的紫微斗數命盤</p>
          <p className="hero-sub">
            十二宮星曜與四化・14 主星 × 12 宮白話解讀・格局判斷・大限流年流月流日・可保存多人命盤與分享連結
          </p>
        </div>
      )}

      {(!chart || showForm) && <BirthForm onDone={() => setShowForm(false)} />}

      {input && !chart && <p className="error">這個日期無法排盤，請確認日期是否存在（例如農曆閏月、大小月）。</p>}

      {chart && isDemoInput(input) && (
        <p className="demo-banner">
          這是<strong>範例命盤</strong>（1992-7-7 申時・女），先隨意點宮位、切流年感受一下。
          看完點右上角「重新排盤」輸入自己的生日。
        </p>
      )}

      {chart && (
        <main className="chart-area">
          <div className="chart-col">
            {decadals && yearly && <DecadalBar decadals={decadals} yearly={yearly} />}
            {yearly && <YearBar yearly={yearly} birthYear={birthYear} decadal={decadal} />}
            {yearly && <MonthBar monthly={monthly} />}
            {yearly && <DayBar yearly={yearly} daily={daily} />}
            <ChartGrid chart={chart} name={input!.name} yearly={yearly} monthly={monthly} decadal={decadal} daily={daily} />
            <div className="chart-legend">
              <span><b className="mutagen mut-lu">祿</b> 生年四化</span>
              <span><b className="mutagen dec mut-quan">權</b> 大限四化</span>
              <span><b className="mutagen flow mut-ji">忌</b> 流年／流月四化</span>
              <span><b className="mutagen day mut-ke">科</b> 流日四化</span>
              <span><em className="yearly-tag decadal-tag decadal-soul">大命</em> 大限命宮</span>
              <span><em className="yearly-tag yearly-soul">年命</em> 流年命宮</span>
              <span><em className="yearly-tag monthly-soul">月命</em> 流月命宮</span>
              <span><em className="yearly-tag daily-soul">日命</em> 流日命宮</span>
              <span><em className="body-badge">身</em> 身宮</span>
              <span>虛線框＝所選宮位的三方四正</span>
            </div>
            <Glossary />
          </div>
          <div className="side-col">
            <PatternCard patterns={patterns} />
            {decadal && <DecadalPanel chart={chart} decadal={decadal} />}
            {yearly && <YearlyPanel chart={chart} yearly={yearly} monthly={monthly} daily={daily} />}
            <ReadingPanel chart={chart} />
          </div>
        </main>
      )}
      </>)}

      <footer className="app-footer">
        © 2026 wadasiwak · 解讀內容未經授權禁止轉載 · 排盤：
        <a href="https://github.com/SylarLong/iztro" target="_blank" rel="noreferrer">iztro</a>
      </footer>
    </div>
  )
}
