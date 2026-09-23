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
let isInitialized = false

// Safe storage access: never throw synchronously if chrome APIs are unavailable
function safeGetStorage(): Promise<StorageData> {
  return new Promise((resolve) => {
    try {
      if (typeof chrome === "undefined" || !chrome.storage?.sync?.get) {
        console.warn("[background] chrome.storage not available")
        resolve({ isActive: false } as StorageData)
        return
      }
      chrome.storage.sync.get(["isActive", "apiKey"], (result: StorageData) => {
        if (chrome.runtime.lastError) {
          console.warn("[background] storage get error:", chrome.runtime.lastError.message)
          resolve({ isActive: false } as StorageData)
          return
        }
        resolve(result || ({ isActive: false } as StorageData))
      })
    } catch (e) {
      console.error("[background] safeGetStorage threw:", e)
      resolve({ isActive: false } as StorageData)
    }
  })
}

// Initialize state and start listening for messages
async function initialize() {
  const result = await safeGetStorage()
  isActive = result.isActive || false
  apiKey = result.apiKey
  isInitialized = true
  console.log("[background] initialized. isActive=", isActive, "hasApiKey=", !!apiKey)
}

// Set up message listener IMMEDIATELY (synchronously at top level).
// MV3 requires listeners to be registered before the first await,
// otherwise events fired during async init are lost.
setupMessageListener()

// Then hydrate state from storage in the background.
initialize().catch((e) => console.error("[background] init failed:", e))

// Listen for storage changes (guarded so a missing API can never crash SW registration)
try {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "sync") {
    if (changes.isActive) {
      isActive = changes.isActive.newValue
      // Notify content scripts about the change
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              type: "TOGGLE_ACTIVE",
              isActive: changes.isActive.newValue
            }).catch(() => {}) // Ignore errors for tabs that don't have content script
          }
        })
      })
    }
    if (changes.apiKey) {
      apiKey = changes.apiKey.newValue
      // Notify content scripts about API key change
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              type: "UPDATE_API_KEY",
              apiKey: changes.apiKey.newValue
            }).catch(() => {})
          }
        })
      })
    }
    }
  })
} catch (e) {
  console.error("[background] failed to register storage.onChanged listener:", e)
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

// Handle messages from popup and content scripts
function setupMessageListener() {
  chrome.runtime.onMessage.addListener((message: PlasmoBackgroundMessage, sender, sendResponse) => {
    if (message.type === "TOGGLE_ACTIVE") {
      isActive = message.isActive
      chrome.storage.sync.set({ isActive })
      sendResponse({ success: true })
    } else if (message.type === "GET_STATE") {
      sendResponse({ isActive, apiKey })
    } else if (message.type === "GET_PREDICTIONS") {
      // Content script requests predictions from background
      getPredictions(message.transcript!).then((predictions) => {
        sendResponse({ predictions })
      })
      return true // Keep message channel open for async response
    }
  })
}

export {}

// Re-run init when the extension is installed/updated so state is fresh
try {
  chrome.runtime.onInstalled.addListener(() => {
    console.log("[background] onInstalled fired, re-initializing")
    initialize()
  })
} catch (e) {
  console.error("[background] failed to register onInstalled listener:", e)
}
