interface PlasmoBackgroundMessage {
  type: string
  isActive?: boolean
  transcript?: string
  predictions?: string[]
  [key: string]: any
}

interface StorageData {
  isActive: boolean
  apiKey?: string
}

let isActive = false
let apiKey: string | undefined
let recognition: any = null
let isListening = false

// Load initial state
chrome.storage.sync.get(["isActive", "apiKey"], (result: StorageData) => {
  isActive = result.isActive || false
  apiKey = result.apiKey
})

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync") {
    if (changes.isActive) {
      isActive = changes.isActive.newValue
      if (isActive) {
        startListening()
      } else {
        stopListening()
      }
    }
    if (changes.apiKey) {
      apiKey = changes.apiKey.newValue
    }
  }
})

// Start speech recognition
function startListening() {
  if (isListening || !isActive) return

  // Check if Web Speech API is available
  if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
    console.warn("Web Speech API not supported")
    return
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  recognition = new SpeechRecognition()
  
  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = "en-US"

  recognition.onresult = async (event: any) => {
    const transcript = Array.from(event.results)
      .map((result: any) => result[0].transcript)
      .join("")

    // Send transcript to content script for display
    if (transcript.trim()) {
      const predictions = await getPredictions(transcript)
      
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: "UPDATE_PREDICTIONS",
            transcript,
            predictions
          })
        }
      })
    }
  }

  recognition.onerror = (event: any) => {
    console.error("Speech recognition error:", event.error)
  }

  recognition.start()
  isListening = true
  console.log("Voice prediction started")
}

// Stop speech recognition
function stopListening() {
  if (recognition && isListening) {
    recognition.stop()
    isListening = false
    console.log("Voice prediction stopped")
  }
}

// Get word predictions using AI or simple algorithm
async function getPredictions(transcript: string): Promise<string[]> {
  // If API key is provided, use OpenAI API
  if (apiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that predicts the next 3-5 words someone might say. Return ONLY the predicted words, separated by spaces, no punctuation or explanation."
            },
            {
              role: "user",
              content: `Given this partial sentence, predict the next 3-5 words: "${transcript}"`
            }
          ],
          max_tokens: 20,
          temperature: 0.7
        })
      })

      const data = await response.json()
      if (data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content.trim().split(/\s+/)
      }
    } catch (error) {
      console.error("AI prediction error:", error)
    }
  }

  // Fallback: simple word prediction based on common patterns
  return getSimplePredictions(transcript)
}

// Simple fallback prediction algorithm
function getSimplePredictions(transcript: string): string[] {
  const words = transcript.toLowerCase().split(/\s+/)
  const lastWord = words[words.length - 1] || ""

  // Common word associations (simplified example)
  const associations: Record<string, string[]> = {
    "hello": ["there", "how", "are", "you"],
    "good": ["morning", "afternoon", "evening", "day"],
    "thank": ["you", "very", "much"],
    "i": ["am", "think", "believe", "would"],
    "the": ["quick", "best", "most", "first"],
    "is": ["this", "it", "that", "a"],
    "are": ["you", "we", "they", "these"],
    "can": ["you", "I", "we", "help"],
    "will": ["be", "you", "I", "do"],
    "have": ["a", "to", "been", "got"]
  }

  if (associations[lastWord]) {
    return associations[lastWord].slice(0, 4)
  }

  // Default predictions
  return ["the", "a", "is", "to", "of"]
}

// Start listening if already active on service worker startup
if (isActive) {
  startListening()
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((message: PlasmoBackgroundMessage, sender, sendResponse) => {
  if (message.type === "TOGGLE_ACTIVE") {
    isActive = message.isActive
    if (isActive) {
      startListening()
    } else {
      stopListening()
    }
  }
  sendResponse({ success: true })
})

export {}
