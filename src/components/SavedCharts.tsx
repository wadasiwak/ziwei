import { useEffect, useRef, useState } from 'react'
import { TIME_OPTIONS, type BirthInput } from '../lib/chart'
import type { SavedChart } from '../lib/storage'
import { useStore } from '../state'

export default function SavedCharts() {
  const saved = useStore((s) => s.saved)
  const input = useStore((s) => s.input)
  const loadSaved = useStore((s) => s.loadSaved)
  const deleteSaved = useStore((s) => s.deleteSaved)
  const saveCurrent = useStore((s) => s.saveCurrent)
  const updateSaved = useStore((s) => s.updateSaved)
  const setSynastry = useStore((s) => s.setSynastry)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editNote, setEditNote] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [showSynPicker, setShowSynPicker] = useState(false)
  const [synA, setSynA] = useState('')
  const [synB, setSynB] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 4000)
  }

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

  const startEdit = (id: string) => {
    const c = saved.find((x) => x.id === id)
    if (!c) return
    setEditingId(id)
    setEditName(c.name)
    setEditNote(c.note ?? '')
    setConfirmDeleteId(null)
  }

  const commitEdit = () => {
    if (editingId) updateSaved(editingId, { name: editName, note: editNote })
    setEditingId(null)
  }

  const onDelete = (id: string) => {
    if (confirmDeleteId === id) {
      deleteSaved(id)
      setConfirmDeleteId(null)
    } else {
      setConfirmDeleteId(id)
      setTimeout(() => setConfirmDeleteId((v) => (v === id ? null : v)), 4000)
    }
  }

  const onSave = () => {
    const result = saveCurrent()
    if (result === 'duplicate') showToast('這張命盤已保存過，不用再存一次。')
    else if (result === 'saved') showToast('已保存 ✓ 下次開站直接點名字載入。')
  }

  const openSynPicker = () => {
    setShowSynPicker(true)
    setEditingId(null)
    setSynA(saved[0]?.id ?? '')
    setSynB(saved[1]?.id ?? '')
  }

  const startSynastry = () => {
    const a = saved.find((c) => c.id === synA)
    const b = saved.find((c) => c.id === synB)
    if (!a || !b || a.id === b.id) return
    const strip = ({ id: _id, note: _note, ...rest }: SavedChart): BirthInput => rest
    setSynastry({ a: strip(a), b: strip(b) })
    setShowSynPicker(false)
  }

  const chipLabel = (c: SavedChart) => `${c.name}${c.note ? `（${c.note}）` : ''}・${c.date}`

  return (
    <div className="saved-charts-wrap">
      <div className="saved-charts">
        {saved.map((c) => (
          <span key={c.id} className="saved-chip">
            <button
              className="chip-load"
              onClick={() => loadSaved(c.id)}
              title={`${c.calendar === 'lunar' ? '農曆' : '國曆'} ${c.date} ${TIME_OPTIONS[c.timeIndex]?.label ?? ''}${c.note ? `｜${c.note}` : ''}`}
            >
              {c.name}
              {c.note && <em className="chip-note">{c.note}</em>}
            </button>
            <button className="chip-edit" onClick={() => startEdit(c.id)} aria-label={`編輯 ${c.name}`} title="改名／加備註">✎</button>
            <button
              className={`chip-del ${confirmDeleteId === c.id ? 'confirming' : ''}`}
              onClick={() => onDelete(c.id)}
              aria-label={`刪除 ${c.name}`}
              title={confirmDeleteId === c.id ? '再點一次確認刪除' : '刪除'}
            >
              {confirmDeleteId === c.id ? '確定刪除？' : '✕'}
            </button>
          </span>
        ))}
        {input && !isCurrentSaved && (
          <button className="chip-save" onClick={onSave}>＋ 保存這張命盤</button>
        )}
        {saved.length >= 2 && (
          <button className="chip-syn" title="從已保存的命盤挑兩張，看看彼此的互動" onClick={openSynPicker}>
            🔗 合盤比較
          </button>
        )}
      </div>
      {showSynPicker && (
        <div className="syn-picker">
          <label>
            甲方
            <select value={synA} onChange={(e) => setSynA(e.target.value)}>
              {saved.map((c) => (
                <option key={c.id} value={c.id}>{chipLabel(c)}</option>
              ))}
            </select>
          </label>
          <span className="syn-x">×</span>
          <label>
            乙方
            <select value={synB} onChange={(e) => setSynB(e.target.value)}>
              {saved.map((c) => (
                <option key={c.id} value={c.id}>{chipLabel(c)}</option>
              ))}
            </select>
          </label>
          <div className="chip-editor-actions">
            <button className="primary" type="button" disabled={synA === synB} onClick={startSynastry}>開始比較</button>
            <button type="button" onClick={() => setShowSynPicker(false)}>取消</button>
          </div>
          {synA === synB && <p className="syn-hint">請選兩張不同的命盤。</p>}
        </div>
      )}
      {editingId && (
        <div className="chip-editor">
          <label>
            名稱
            <input value={editName} maxLength={12} onChange={(e) => setEditName(e.target.value)} />
          </label>
          <label>
            備註
            <input value={editNote} maxLength={20} placeholder="（選填，例如：媽媽、同事）" onChange={(e) => setEditNote(e.target.value)} />
          </label>
          <div className="chip-editor-actions">
            <button className="primary" type="button" onClick={commitEdit}>儲存</button>
            <button type="button" onClick={() => setEditingId(null)}>取消</button>
          </div>
        </div>
      )}
      {toast && <p className="copy-toast">{toast}</p>}
    </div>
  )
}
