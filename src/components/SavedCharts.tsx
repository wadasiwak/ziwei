import { TIME_OPTIONS } from '../lib/chart'
import { useStore } from '../state'

export default function SavedCharts() {
  const saved = useStore((s) => s.saved)
  const input = useStore((s) => s.input)
  const loadSaved = useStore((s) => s.loadSaved)
  const deleteSaved = useStore((s) => s.deleteSaved)
  const saveCurrent = useStore((s) => s.saveCurrent)

  const isCurrentSaved =
    !!input &&
    saved.some(
      (c) =>
        c.name === input.name &&
        c.date === input.date &&
        c.timeIndex === input.timeIndex &&
        c.calendar === input.calendar &&
        c.gender === input.gender,
    )

  return (
    <div className="saved-charts">
      {saved.map((c) => (
        <span key={c.id} className="saved-chip">
          <button
            className="chip-load"
            onClick={() => loadSaved(c.id)}
            title={`${c.calendar === 'lunar' ? '農曆' : '國曆'} ${c.date} ${TIME_OPTIONS[c.timeIndex]?.label ?? ''}`}
          >
            {c.name}
          </button>
          <button className="chip-del" onClick={() => deleteSaved(c.id)} aria-label={`刪除 ${c.name}`}>✕</button>
        </span>
      ))}
      {input && !isCurrentSaved && (
        <button className="chip-save" onClick={saveCurrent}>＋ 保存這張命盤</button>
      )}
    </div>
  )
}
