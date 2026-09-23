import { useEffect, useState } from "react"

interface StorageData {
  isActive: boolean
  apiKey?: string
}

function IndexPopup() {
  const [isActive, setIsActive] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [tempApiKey, setTempApiKey] = useState("")

  useEffect(() => {
    // Load settings from chrome storage
    chrome.storage.sync.get(["isActive", "apiKey"], (result: StorageData) => {
      setIsActive(result.isActive || false)
      setApiKey(result.apiKey || "")
      setTempApiKey(result.apiKey || "")
    })
  }, [])

  const toggleActive = () => {
    const newValue = !isActive
    setIsActive(newValue)
    chrome.storage.sync.set({ isActive: newValue })
    
    // Notify background script about state change
    chrome.runtime.sendMessage({ type: "TOGGLE_ACTIVE", isActive: newValue })
  }

  const saveApiKey = () => {
    setApiKey(tempApiKey)
    chrome.storage.sync.set({ apiKey: tempApiKey })
  }

  return (
    <div
      style={{
        padding: 20,
        width: 300,
        fontFamily: "system-ui, sans-serif"
      }}>
      <h2 style={{ margin: "0 0 16px 0", fontSize: 18 }}>Voice Word Predictor</h2>
      
      {/* Toggle Switch */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={toggleActive}
            style={{ width: 18, height: 18 }}
          />
          <span style={{ fontSize: 14 }}>Enable Voice Prediction</span>
        </label>
      </div>

      {/* API Key Input */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, marginBottom: 6, color: "#555" }}>
          OpenAI API Key (optional for AI predictions)
        </label>
        <input
          type="password"
          value={tempApiKey}
          onChange={(e) => setTempApiKey(e.target.value)}
          onBlur={saveApiKey}
          placeholder="sk-..."
          style={{
            width: "100%",
            padding: 8,
            fontSize: 13,
            border: "1px solid #ddd",
            borderRadius: 4,
            boxSizing: "border-box"
          }}
        />
      </div>

      {/* Status Indicator */}
      <div
        style={{
          padding: 12,
          backgroundColor: isActive ? "#e6f4ea" : "#fce8e6",
          borderRadius: 6,
          fontSize: 13,
          color: isActive ? "#137333" : "#c5221f"
        }}>
        Status: {isActive ? "Active" : "Inactive"}
      </div>

      {/* Instructions */}
      <div style={{ marginTop: 16, fontSize: 12, color: "#666" }}>
        <p style={{ margin: "0 0 8px 0" }}>How to use:</p>
        <ol style={{ margin: 0, paddingLeft: 16 }}>
          <li>Enable the extension</li>
          <li>Navigate to any webpage</li>
          <li>Start speaking - predictions will appear on screen</li>
        </ol>
      </div>
    </div>
  )
}

export default IndexPopup
