interface SkeletonProps {
  height?: number | string
  width?: string
  borderRadius?: string
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ height = 20, width = '100%', borderRadius = '6px', className = '', style }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ height, width, borderRadius, ...style }}
      aria-hidden="true"
    />
  )
}

export function KPICardSkeleton() {
  return (
    <div className="kpi-card">
      <div className="kpi-card-top">
        <Skeleton height={42} width="42px" borderRadius="10px" />
        <Skeleton height={24} width="60px" borderRadius="12px" />
      </div>
      <Skeleton height={14} width="80px" borderRadius="4px" />
      <Skeleton height={32} width="120px" borderRadius="6px" style={{ marginTop: 8 }} />
    </div>
  )
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i}><Skeleton height={16} width={i === 0 ? '140px' : '80px'} /></td>
      ))}
    </tr>
  )
}
