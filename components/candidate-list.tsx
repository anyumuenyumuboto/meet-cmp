import type { CompletionCandidate } from "~lib/state"

type CandidateListProps = {
  candidates: CompletionCandidate[]
  onSelect?: (candidate: CompletionCandidate) => void
}

/**
 * 補完候補リスト。API実装前はダミー候補を表示するプレビュー用。
 */
export function CandidateList({ candidates, onSelect }: CandidateListProps) {
  if (candidates.length === 0) {
    return (
      <p style={{ color: "#888", fontSize: 13, margin: "8px 0" }}>
        補完候補はここに表示されます
      </p>
    )
  }

  return (
    <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {candidates.map((c, i) => (
        <li key={i} style={{ marginBottom: 6 }}>
          <button
            onClick={() => onSelect?.(c)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #ddd",
              background: "#fafafa",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8
            }}>
            <span>{c.text}</span>
            <span
              style={{
                fontSize: 11,
                color: "#666",
                whiteSpace: "nowrap"
              }}>
              {(c.confidence * 100).toFixed(0)}%
            </span>
          </button>
        </li>
      ))}
    </ol>
  )
}
