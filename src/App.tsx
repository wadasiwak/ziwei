import { useEffect, useMemo, useState } from 'react'
import BirthForm from './components/BirthForm'
import ChartGrid from './components/ChartGrid'
import PatternCard from './components/PatternCard'
import ReadingPanel from './components/ReadingPanel'
import SavedCharts from './components/SavedCharts'
import YearlyPanel, { MonthBar, YearBar } from './components/YearlyPanel'
import { computeChart, computeMonthly, computeYearly } from './lib/chart'
import { detectPatterns } from './lib/patterns'
import { buildLlmPrompt } from './lib/prompt'
import { inputToParams, paramsToInput, shareUrl } from './lib/share'
import { useStore } from './state'

function useCopy(): [string | null, string | null, (text: string, label: string, toast: string) => void] {
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
  return [copied, toast, copy]
}

export default function App() {
  const input = useStore((s) => s.input)
  const setInput = useStore((s) => s.setInput)
  const selectedYear = useStore((s) => s.selectedYear)
  const selectedMonth = useStore((s) => s.selectedMonth)
  const [showForm, setShowForm] = useState(false)
  const [copied, toast, copy] = useCopy()

  // 開站時從網址讀取分享的命盤參數
  useEffect(() => {
    const fromUrl = paramsToInput(location.search)
    if (fromUrl) setInput(fromUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 命盤變動時把參數同步到網址，直接複製網址列也能分享
  useEffect(() => {
    if (input) {
      history.replaceState(null, '', `${location.pathname}?${inputToParams(input)}`)
    }
  }, [input])

  const chart = useMemo(() => {
    if (!input) return null
    try {
      return computeChart(input)
    } catch (e) {
      console.error(e)
      return null
    }
  }, [input])

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

  const patterns = useMemo(() => (chart ? detectPatterns(chart) : []), [chart])

  return (
    <div className="app">
      <header className="app-header">
        <h1>紫微斗數排盤</h1>
        {chart && input && (
          <div className="header-actions">
            <button
              className="secondary"
              title="複製這張命盤的專屬連結，傳給對方打開就是同一張盤"
              onClick={() => copy(shareUrl(input), 'share', '已複製命盤連結 ✓ 用 LINE 或訊息傳給對方，打開就是這張盤（生日資料只在連結裡，不經任何伺服器）。')}
            >
              {copied === 'share' ? '已複製 ✓' : '分享'}
            </button>
            <button
              className="secondary"
              title="複製整張命盤的結構化資料，貼到 ChatGPT／Claude 等 AI 取得整盤綜合解讀"
              onClick={() => copy(buildLlmPrompt(chart, input, yearly, monthly), 'ai', '已複製整張命盤資料 ✓ 接著開啟 ChatGPT、Claude 或任何 AI，直接「貼上→送出」，就會得到這張盤的綜合解讀。')}
            >
              {copied === 'ai' ? '已複製 ✓' : 'AI 解讀'}
            </button>
            <button className="secondary" onClick={() => setShowForm((v) => !v)}>
              {showForm ? '收起' : '重新排盤'}
            </button>
          </div>
        )}
      </header>

      {toast && <p className="copy-toast">{toast}</p>}

      <SavedCharts />

      {!chart && (
        <div className="hero">
          <p className="hero-title">輸入出生年月日時，排出完整的紫微斗數命盤</p>
          <p className="hero-sub">
            十二宮星曜與四化・14 主星 × 12 宮白話解讀・格局判斷・流年流月・可保存多人命盤與分享連結
          </p>
        </div>
      )}

      {(!chart || showForm) && <BirthForm onDone={() => setShowForm(false)} />}

      {input && !chart && <p className="error">這個日期無法排盤，請確認日期是否存在（例如農曆閏月、大小月）。</p>}

      {chart && (
        <main className="chart-area">
          <div className="chart-col">
            {yearly && <YearBar yearly={yearly} birthYear={birthYear} />}
            {yearly && <MonthBar monthly={monthly} />}
            <ChartGrid chart={chart} name={input!.name} yearly={yearly} monthly={monthly} />
            <div className="chart-legend">
              <span><b className="mutagen mut-lu">祿</b> 生年四化</span>
              <span><b className="mutagen flow mut-ji">忌</b> 流年／流月四化</span>
              <span><em className="yearly-tag yearly-soul">年命</em> 流年命宮</span>
              <span><em className="yearly-tag monthly-soul">月命</em> 流月命宮</span>
              <span><em className="body-badge">身</em> 身宮</span>
              <span>虛線框＝所選宮位的三方四正</span>
            </div>
          </div>
          <div className="side-col">
            <PatternCard patterns={patterns} />
            {yearly && <YearlyPanel chart={chart} yearly={yearly} monthly={monthly} />}
            <ReadingPanel chart={chart} />
          </div>
        </main>
      )}
    </div>
  )
}
