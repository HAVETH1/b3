interface ProgressBarProps {
  value: number  // 0–100
  status?: 'safe' | 'warning' | 'exceeded'
  height?: number
  animated?: boolean
}

export function ProgressBar({ value, status = 'safe', height = 8, animated = true }: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 100)
  return (
    <div className="progress-bar-track" style={{ height }}>
      <div
        className={`progress-bar-fill ${status} ${animated ? '' : 'no-anim'}`}
        style={{ width: `${clamped}%` }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  )
}

interface ProgressRingProps {
  value: number  // 0–100
  size?: number
  strokeWidth?: number
  color?: string
  children?: React.ReactNode
}

export function ProgressRing({ value, size = 80, strokeWidth = 7, color = 'var(--color-primary)', children }: ProgressRingProps) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const clamped = Math.min(Math.max(value, 0), 100)
  const dashOffset = circ - (circ * clamped) / 100

  return (
    <div className="goal-progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-border)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      {children && (
        <div className="goal-progress-ring-label">{children}</div>
      )}
    </div>
  )
}
