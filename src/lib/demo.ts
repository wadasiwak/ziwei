import type { BirthInput } from './chart'

// 固定示範生辰：武曲破軍坐命（殺破狼、雙星組合都看得到），用來讓新手先看懂盤面長什麼樣。
export const DEMO_NAME = '範例命盤'

export const DEMO_INPUT: BirthInput = {
  name: DEMO_NAME,
  gender: '女',
  calendar: 'solar',
  date: '1992-7-7',
  timeIndex: 8,
  isLeapMonth: false,
}

export function isDemoInput(input: BirthInput | null): boolean {
  return (
    !!input &&
    input.name === DEMO_NAME &&
    input.date === DEMO_INPUT.date &&
    input.timeIndex === DEMO_INPUT.timeIndex
  )
}
