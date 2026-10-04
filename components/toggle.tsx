import type { ReactNode } from "react"

type ToggleProps = {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  hint?: ReactNode
}

/**
 * シンプルなトグルスイッチ。popup と overlay で共有。
 */
export function Toggle({
  label,
  checked,
  onChange,
  disabled = false,
  hint
}: ToggleProps) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1
      }}>
      <span>
        <span style={{ fontSize: 14 }}>{label}</span>
        {hint && (
          <span style={{ display: "block", fontSize: 11, color: "#888" }}>
            {hint}
          </span>
        )}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 18, height: 18, accentColor: "#4f7cff" }}
      />
    </label>
  )
}
