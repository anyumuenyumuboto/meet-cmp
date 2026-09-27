import { useEffect, useState } from "react"

import { CandidateList } from "~components/candidate-list"
import { Toggle } from "~components/toggle"
import {
  loadState,
  saveState,
  type CompletionCandidate,
  type ExtensionState
} from "~lib/state"

/** ダミー候補。API実装後に本物の補完結果へ置き換える */
const DUMMY_CANDIDATES: CompletionCandidate[] = [
  { text: "…, ということでございます。", confidence: 0.82 },
  { text: "…, 検討よろしくお願いいたします。", confidence: 0.64 },
  { text: "…, まとめさせていただきます。", confidence: 0.41 }
]

function IndexPopup() {
  const [state, setState] = useState<ExtensionState | null>(null)
  const [showPreview, setShowPreview] = useState(true)

  // 保存された状態を読み込み、他タブ/overlayからの更新も購読
  useEffect(() => {
    loadState().then(setState)
    const listener = (changes: { [k: string]: chrome.storage.StorageChange }) => {
      if (changes["meet-cmp:state"]) {
        setState(changes["meet-cmp:state"].newValue as ExtensionState)
      }
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  if (!state) {
    return <div style={{ padding: 16, width: 320 }}>読み込み中…</div>
  }

  const update = (patch: Partial<ExtensionState>) => {
    const next = { ...state, ...patch }
    setState(next)
    void saveState(next)
  }

  return (
    <div
      style={{
        width: 320,
        padding: 16,
        fontFamily:
          'system-ui, -apple-system, "Hiragino Kaku Gothic ProN", sans-serif',
        color: "#222"
      }}>
      <h2 style={{ margin: "0 0 12px", fontSize: 16 }}>会話補完 (Meet cmp)</h2>

      <section style={{ display: "grid", gap: 10, marginBottom: 16 }}>
        <Toggle
          label="拡張機能を有効化"
          checked={state.enabled}
          onChange={(v) => update({ enabled: v })}
        />
        <Toggle
          label="音声認識"
          checked={state.voiceEnabled}
          onChange={(v) => update({ voiceEnabled: v })}
          hint="※ 音声処理は未実装 (UIのみ)"
        />
        <label
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12
          }}>
          <span style={{ fontSize: 14 }}>候補の最大表示数</span>
          <input
            type="number"
            min={1}
            max={5}
            value={state.maxCandidates}
            onChange={(e) =>
              update({
                maxCandidates: Math.min(5, Math.max(1, Number(e.target.value)))
              })
            }
            style={{
              width: 56,
              padding: "4px 6px",
              borderRadius: 6,
              border: "1px solid #ccc"
            }}
          />
        </label>
      </section>

      <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "0 0 12px" }} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8
        }}>
        <h3 style={{ margin: 0, fontSize: 13, color: "#555" }}>
          補完候補プレビュー
        </h3>
        <button
          onClick={() => setShowPreview((s) => !s)}
          style={{
            fontSize: 12,
            padding: "2px 8px",
            border: "1px solid #ddd",
            borderRadius: 6,
            background: "#fff",
            cursor: "pointer"
          }}>
          {showPreview ? "非表示" : "表示"}
        </button>
      </div>

      {showPreview && state.enabled && (
        <CandidateList
          candidates={DUMMY_CANDIDATES.slice(0, state.maxCandidates)}
        />
      )}
      {showPreview && !state.enabled && (
        <p style={{ color: "#888", fontSize: 13 }}>
          拡張機能がオフです。上のトグルからオンにしてください。
        </p>
      )}
    </div>
  )
}

export default IndexPopup
