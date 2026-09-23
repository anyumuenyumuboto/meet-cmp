import { useEffect, useState, useRef } from "react"

interface PredictionMessage {
  type: string
  transcript?: string
  predictions?: string[]
  isActive?: boolean
  apiKey?: string
}

export default function Content() {
  const [transcript, setTranscript] = useState("")
  const [predictions, setPredictions] = useState<string[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<any>(null)
  const isListeningRef = useRef(false)

  // Initialize speech recognition in content script
  useEffect(() => {
    if (!isActive) {
      if (recognitionRef.current && isListeningRef.current) {
        recognitionRef.current.stop()
        isListeningRef.current = false
      }
      return
    }

    // Check if Web Speech API is available
    if (!(window as any).webkitSpeechRecognition && !(window as any).SpeechRecognition) {
      console.warn("Web Speech API not supported")
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.continuous = true
    recognitionRef.current.interimResults = true
    recognitionRef.current.lang = "en-US"

    recognitionRef.current.onresult = async (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join("")

      if (transcript.trim()) {
        setTranscript(transcript)
        
        // Request predictions from background script
        chrome.runtime.sendMessage(
          { type: "GET_PREDICTIONS", transcript },
          (response) => {
            if (response?.predictions) {
              setPredictions(response.predictions)
              setIsVisible(true)
              
              // Clear previous timeout
              if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current)
              }
              
              // Hide after 3 seconds of inactivity
              hideTimeoutRef.current = setTimeout(() => {
                setIsVisible(false)
              }, 3000)
            }
          }
        )
      }
    }

    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error)
    }

    recognitionRef.current.start()
    isListeningRef.current = true
    console.log("Voice prediction started in content script")

    return () => {
      if (recognitionRef.current && isListeningRef.current) {
        recognitionRef.current.stop()
        isListeningRef.current = false
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [isActive])

  useEffect(() => {
    // Listen for messages from background script or popup
    const handleMessage = (message: PredictionMessage, sender: any, sendResponse: any) => {
      if (message.type === "TOGGLE_ACTIVE") {
        setIsActive(message.isActive || false)
      } else if (message.type === "UPDATE_API_KEY") {
        // API key updated, will be used in next prediction request
      } else if (message.type === "UPDATE_PREDICTIONS") {
        // Legacy message format from older background script
        setTranscript(message.transcript || "")
        setPredictions(message.predictions || [])
        setIsVisible(true)
        
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current)
        }
        
        setTimeout(() => {
          setIsVisible(false)
        }, 3000)
      }
      sendResponse({ success: true })
    }

    chrome.runtime.onMessage.addListener(handleMessage)
    
    // Request initial state
    chrome.runtime.sendMessage({ type: "GET_STATE" }, (response) => {
      if (response) {
        setIsActive(response.isActive || false)
      }
    })
    
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage)
    }
  }, [])

  if (!isVisible || predictions.length === 0 || !isActive) {
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
