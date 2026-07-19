import { GLOSSARY } from '../content/glossary'

/** 新手小辭典：可展開的術語白話解釋 */
export default function Glossary() {
  return (
    <details className="glossary">
      <summary>看不懂術語？打開小辭典</summary>
      <div className="glossary-list">
        {GLOSSARY.map((g) => (
          <details key={g.term} className="glossary-item">
            <summary>{g.term}</summary>
            <p>{g.text}</p>
          </details>
        ))}
      </div>
    </details>
  )
}
