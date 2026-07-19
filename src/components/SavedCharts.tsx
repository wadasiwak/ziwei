import { useEffect, useRef, useState } from 'react'
import { TIME_OPTIONS } from '../lib/chart'
import { useStore } from '../state'

export default function SavedCharts() {
  const saved = useStore((s) => s.saved)
  const input = useStore((s) => s.input)
  const loadSaved = useStore((s) => s.loadSaved)
  const deleteSaved = useStore((s) => s.deleteSaved)
  const saveCurrent = useStore((s) => s.saveCurrent)
  const updateSaved = useStore((s) => s.updateSaved)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editNote, setEditNote] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
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
      </div>
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
