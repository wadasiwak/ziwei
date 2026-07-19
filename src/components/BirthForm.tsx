import { useState } from 'react'
import { TIME_OPTIONS, type BirthInput } from '../lib/chart'
import { DEMO_INPUT } from '../lib/demo'
import { useStore } from '../state'

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 120 }, (_, i) => currentYear - i)
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

export default function BirthForm({ onDone }: { onDone?: () => void }) {
  const setInput = useStore((s) => s.setInput)
  const prev = useStore((s) => s.input)

  const [name, setName] = useState(prev?.name ?? '')
  const [gender, setGender] = useState<'男' | '女'>(prev?.gender ?? '女')
  const [calendar, setCalendar] = useState<'solar' | 'lunar'>(prev?.calendar ?? 'solar')
  const [year, setYear] = useState(prev ? Number(prev.date.split('-')[0]) : 1990)
  const [month, setMonth] = useState(prev ? Number(prev.date.split('-')[1]) : 1)
  const [day, setDay] = useState(prev ? Number(prev.date.split('-')[2]) : 1)
  const [timeIndex, setTimeIndex] = useState(prev?.timeIndex ?? 6)
  const [isLeapMonth, setIsLeapMonth] = useState(prev?.isLeapMonth ?? false)
  const [showTimeHint, setShowTimeHint] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const input: BirthInput = {
      name: name.trim() || '未命名',
      gender,
      calendar,
      date: `${year}-${month}-${day}`,
      timeIndex,
      isLeapMonth: calendar === 'lunar' && isLeapMonth,
    }
    setInput(input)
    onDone?.()
  }

  const loadDemo = () => {
    setInput(DEMO_INPUT)
    onDone?.()
  }

  return (
    <form className="birth-form" onSubmit={submit}>
      <div className="form-row">
        <label>
          姓名
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="（選填）" maxLength={12} />
        </label>
        <label>
          性別
          <select value={gender} onChange={(e) => setGender(e.target.value as '男' | '女')}>
            <option value="女">女</option>
            <option value="男">男</option>
          </select>
        </label>
        <label>
          曆法
          <select value={calendar} onChange={(e) => setCalendar(e.target.value as 'solar' | 'lunar')}>
            <option value="solar">國曆（陽曆）</option>
            <option value="lunar">農曆</option>
          </select>
        </label>
      </div>
      <div className="form-row date-row">
        <label>
          年
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
        <label>
          月
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
        <label>
          日
          <select value={day} onChange={(e) => setDay(Number(e.target.value))}>
            {DAYS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>
        {calendar === 'lunar' && (
          <label className="leap-label">
            <input type="checkbox" checked={isLeapMonth} onChange={(e) => setIsLeapMonth(e.target.checked)} />
            閏月
          </label>
        )}
      </div>
      <div className="form-row">
        <label className="time-label">
          時辰
          <select value={timeIndex} onChange={(e) => setTimeIndex(Number(e.target.value))}>
            {TIME_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="link-btn time-hint-toggle"
          onClick={() => setShowTimeHint((v) => !v)}
        >
          不知道出生時間？
        </button>
      </div>
      {showTimeHint && (
        <p className="time-hint">
          常見做法是先用大概的時段挑一個近似時辰（例如只記得「早上」就先選辰時或巳時）排盤參考。
          時辰決定命宮、身宮的位置，差一個時辰整張盤的宮位排布就不同，所以主星解讀僅供初步參考，
          建議之後向長輩或出生證明確認正確時間再排一次。
        </p>
      )}
      <div className="form-row submit-row">
        <button type="submit" className="primary">排盤</button>
        <button type="button" className="secondary demo-btn" onClick={loadDemo} title="不輸入生日，先載入一張示範命盤看看功能">
          先看範例命盤
        </button>
      </div>
      <p className="privacy-note">所有計算都在你的瀏覽器完成，生日資料不會上傳到任何伺服器。</p>
    </form>
  )
}
