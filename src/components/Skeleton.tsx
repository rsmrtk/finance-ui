export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg ${className}`} style={{ background: 'var(--border)' }} />
}
