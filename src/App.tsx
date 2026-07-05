import { useMemo, useState } from 'react'
import BirthForm from './components/BirthForm'
import ChartGrid from './components/ChartGrid'
import ReadingPanel from './components/ReadingPanel'
import SavedCharts from './components/SavedCharts'
import YearlyPanel, { YearBar } from './components/YearlyPanel'
import { computeChart, computeYearly } from './lib/chart'
import { useStore } from './state'

export default function App() {
  const input = useStore((s) => s.input)
  const selectedYear = useStore((s) => s.selectedYear)
  const [showForm, setShowForm] = useState(false)

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

  return (
    <div className="app">
      <header className="app-header">
        <h1>紫微斗數排盤</h1>
        {chart && (
          <button className="secondary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? '收起' : '重新排盤'}
          </button>
        )}
      </header>

      <SavedCharts />

      {(!chart || showForm) && <BirthForm onDone={() => setShowForm(false)} />}

      {input && !chart && <p className="error">這個日期無法排盤，請確認日期是否存在（例如農曆閏月、大小月）。</p>}

      {chart && (
        <main className="chart-area">
          <div className="chart-col">
            {yearly && <YearBar yearly={yearly} birthYear={birthYear} />}
            <ChartGrid chart={chart} name={input!.name} yearly={yearly} />
          </div>
          <div className="side-col">
            {yearly && <YearlyPanel chart={chart} yearly={yearly} />}
            <ReadingPanel chart={chart} />
          </div>
        </main>
      )}
    </div>
  )
}
