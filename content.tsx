import ReactDOM from "react-dom/client"
import { useEffect, useState } from "react"

import type { PlasmoCSConfig } from "plasmo"

import { CandidateList } from "~components/candidate-list"
import { Toggle } from "~components/toggle"
import { loadState, saveState, type ExtensionState } from "~lib/state"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_idle",
  all_frames: false
}

/** ダミー候補。API実装後に本物の補完結果へ置き換える */
const DUMMY_CANDIDATES = [
  { text: "…, ということでございます。", confidence: 0.82 },
  { text: "…, 検討よろしくお願いいたします。", confidence: 0.64 },
  { text: "…, まとめさせていただきます。", confidence: 0.41 }
]

function Overlay() {
  const [state, setState] = useState<ExtensionState | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    loadState().then(setState)
    const listener = (changes: {
      [k: string]: chrome.storage.StorageChange
    }) => {
      if (changes["meet-cmp:state"]) {
        setState(changes["meet-cmp:state"].newValue as ExtensionState)
      }
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  if (!state) return null

  const update = (patch: Partial<ExtensionState>) => {
    const next = { ...state, ...patch }
    setState(next)
    void saveState(next)
  }

  if (!state.enabled) return null

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        width: 300,
        zIndex: 2147483647,
        background: "rgba(255,255,255,0.97)",
        border: "1px solid #ddd",
        borderRadius: 10,
        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        padding: 12,
        fontFamily:
          'system-ui, -apple-system, "Hiragino Kaku Gothic ProN", sans-serif',
        color: "#222"
      }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: collapsed ? 0 : 8
        }}>
        <strong style={{ fontSize: 13 }}>会話補完</strong>
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "展開" : "折りたたむ"}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 12,
            color: "#666"
          }}>
          {collapsed ? "▲" : "▼"}
        </button>
      </div>

      {!collapsed && (
        <>
          <div style={{ marginBottom: 10 }}>
            <Toggle
              label="音声認識"
              checked={state.voiceEnabled}
              onChange={(v) => update({ voiceEnabled: v })}
              hint="※ 未実装 (UIのみ)"
            />
          </div>
          <CandidateList
            candidates={DUMMY_CANDIDATES.slice(0, state.maxCandidates)}
          />
        </>
      )}
    </div>
  )
}

function getContainer() {
  let el = document.getElementById("meet-cmp-root")
  if (!el) {
    el = document.createElement("div")
    el.id = "meet-cmp-root"
    document.body.appendChild(el)
  }
  return el
}

export default function ContentScript() {
  useEffect(() => {
    const root = ReactDOM.createRoot(getContainer())
    root.render(<Overlay />)
    return () => root.unmount()
  }, [])

  // content script のエントリポイントは描画不要
  return null
}
