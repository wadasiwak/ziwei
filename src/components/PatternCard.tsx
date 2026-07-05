import type { Pattern } from '../lib/patterns'

export default function PatternCard({ patterns }: { patterns: Pattern[] }) {
  if (patterns.length === 0) return null
  return (
    <section className="pattern-card">
      <h3>本盤格局</h3>
      {patterns.map((p) => (
        <details key={p.name} className="pattern-item">
          <summary><span className="pattern-badge">{p.name}</span></summary>
          <p>{p.description}</p>
        </details>
      ))}
    </section>
  )
}
