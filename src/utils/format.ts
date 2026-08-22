export function formatPoints(value: number): string {
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(value)
}

export function formatCurrencyGBP(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatLastSyncedAt(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.max(0, Math.round(diffMs / 60000))
  if (mins < 1) return 'Synced just now'
  if (mins === 1) return 'Synced 1 min ago'
  if (mins < 60) return `Synced ${mins} mins ago`
  const hours = Math.round(mins / 60)
  return hours === 1 ? 'Synced 1 hr ago' : `Synced ${hours} hrs ago`
}

export function formatTransactionDate(iso: string): string {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  if (sameDay(date, today)) return 'Today'
  if (sameDay(date, yesterday)) return 'Yesterday'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function normalizeTransactionDescription(description: string): string {
  const trimmed = description.trim().replace(/\s+/g, ' ')
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0]!.charAt(0)
  const last = parts.length > 1 ? parts[parts.length - 1]!.charAt(0) : ''
  return (first + last).toUpperCase()
}
