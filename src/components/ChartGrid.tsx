import type FunctionalAstrolabe from 'iztro/lib/astro/FunctionalAstrolabe'
import { YEARLY_SHORT, type YearlyInfo } from '../lib/chart'
import { useStore } from '../state'
import PalaceCell from './PalaceCell'

// 經典盤面：寅在左下、地支順時針排列。grid-area 名稱對應各地支。
const BRANCH_AREA: Record<string, string> = {
  巳: 'b-si', 午: 'b-wu', 未: 'b-wei', 申: 'b-shen',
  辰: 'b-chen', 酉: 'b-you',
  卯: 'b-mao', 戌: 'b-xu',
  寅: 'b-yin', 丑: 'b-chou', 子: 'b-zi', 亥: 'b-hai',
}

const MUTAGEN_ORDER = ['祿', '權', '科', '忌']

export default function ChartGrid({
  chart,
  name,
  yearly,
}: {
  chart: FunctionalAstrolabe
  name: string
  yearly: YearlyInfo | null
}) {
  const selectedPalace = useStore((s) => s.selectedPalace)
  const selectPalace = useStore((s) => s.selectPalace)

  const yearlyMutagenOf = (starName: string): string | undefined => {
    if (!yearly) return undefined
    const i = yearly.mutagenStars.indexOf(starName)
    return i >= 0 ? MUTAGEN_ORDER[i] : undefined
  }

  return (
    <div className="chart-grid">
      {chart.palaces.map((p) => (
        <div key={p.earthlyBranch} style={{ gridArea: BRANCH_AREA[p.earthlyBranch] }}>
          <PalaceCell
            palace={p}
            selected={selectedPalace === p.name}
            onClick={() => selectPalace(selectedPalace === p.name ? null : p.name)}
            yearlyName={yearly ? YEARLY_SHORT[yearly.palaceNames[p.index]] ?? null : null}
            isYearlySoul={yearly?.soulPalaceIndex === p.index}
            yearlyMutagenOf={yearlyMutagenOf}
          />
        </div>
      ))}
      <div className="chart-center">
        <h2>{name}</h2>
        <dl>
          <div><dt>性別</dt><dd>{chart.gender}</dd></div>
          <div><dt>國曆</dt><dd>{chart.solarDate}</dd></div>
          <div><dt>農曆</dt><dd>{chart.lunarDate}</dd></div>
          <div><dt>四柱</dt><dd>{chart.chineseDate}</dd></div>
          <div><dt>時辰</dt><dd>{chart.time}（{chart.timeRange}）</dd></div>
          <div><dt>五行局</dt><dd>{chart.fiveElementsClass}</dd></div>
          <div><dt>命主</dt><dd>{chart.soul}</dd></div>
          <div><dt>身主</dt><dd>{chart.body}</dd></div>
          <div><dt>生肖</dt><dd>{chart.zodiac}</dd></div>
          <div><dt>星座</dt><dd>{chart.sign}</dd></div>
        </dl>
        <p className="center-hint">點任一宮位看解讀</p>
      </div>
    </div>
  )
}
