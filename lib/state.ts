/**
 * 会話補完拡張機能の状態定義
 * popup / content script / background で共有する。
 */

export type ExtensionState = {
  /** 拡張機能全体のオン/オフ */
  enabled: boolean
  /** 音声認識のオン/オフ (API・音声処理は後回しなのでUIのみ) */
  voiceEnabled: boolean
  /** 補完候補の最大表示数 */
  maxCandidates: number
}

export const DEFAULT_STATE: ExtensionState = {
  enabled: true,
  voiceEnabled: false,
  maxCandidates: 3
}

export type CompletionCandidate = {
  text: string
  /** 確信度 0〜1 (ダミー値。API実装時に置き換える) */
  confidence: number
}

/** chrome.storage.local に保存するキー */
export const STORAGE_KEY = "meet-cmp:state"

export async function loadState(): Promise<ExtensionState> {
  const stored = await chrome.storage.local.get(STORAGE_KEY)
  return { ...DEFAULT_STATE, ...(stored[STORAGE_KEY] ?? {}) }
}

export async function saveState(state: ExtensionState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: state })
}
