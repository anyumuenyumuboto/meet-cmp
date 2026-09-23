import { useEffect, useState } from "react"

interface PredictionMessage {
  type: string
  transcript?: string
  predictions?: string[]
}

export default function Content() {
  const [transcript, setTranscript] = useState("")
  const [predictions, setPredictions] = useState<string[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Listen for messages from background script
    const handleMessage = (message: PredictionMessage) => {
      if (message.type === "UPDATE_PREDICTIONS") {
        setTranscript(message.transcript || "")
        setPredictions(message.predictions || [])
        setIsVisible(true)
        
        // Hide after 3 seconds of inactivity
        setTimeout(() => {
          setIsVisible(false)
        }, 3000)
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)
    
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage)
    }
  }, [])

  if (!isVisible || predictions.length === 0) {
    return null
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        border: "2px solid #4285f4",
        borderRadius: "12px",
        padding: "16px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        zIndex: 999999,
        maxWidth: "320px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        transition: "opacity 0.3s ease"
      }}>
      {/* Transcript */}
      {transcript && (
        <div
          style={{
            fontSize: "13px",
            color: "#666",
            marginBottom: "12px",
            paddingBottom: "12px",
            borderBottom: "1px solid #eee",
            fontStyle: "italic",
            lineHeight: 1.4
          }}>
          "{transcript}"
        </div>
      )}

      {/* Predictions */}
      <div>
        <div
          style={{
            fontSize: "11px",
            color: "#999",
            marginBottom: "8px",
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
          Predicted next words:
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px"
          }}>
          {predictions.map((word, index) => (
            <span
              key={index}
              style={{
                backgroundColor: "#4285f4",
                color: "white",
                padding: "6px 12px",
                borderRadius: "16px",
                fontSize: "14px",
                fontWeight: 500,
                animation: "fadeIn 0.3s ease"
              }}>
              {word}
            </span>
          ))}
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
