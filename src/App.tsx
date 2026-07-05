import { useMemo, useState } from 'react'
import BirthForm from './components/BirthForm'
import ChartGrid from './components/ChartGrid'
import ReadingPanel from './components/ReadingPanel'
import SavedCharts from './components/SavedCharts'
import { computeChart } from './lib/chart'
import { useStore } from './state'

export default function App() {
  const input = useStore((s) => s.input)
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
          <ChartGrid chart={chart} name={input!.name} />
          <ReadingPanel chart={chart} />
        </main>
      )}
    </div>
  )
}
