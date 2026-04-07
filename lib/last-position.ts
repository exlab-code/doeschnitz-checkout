interface LastPosition {
  areaId: string
  detailIndex?: number
}

export function savePosition(pos: LastPosition): void {
  localStorage.setItem('last-position', JSON.stringify(pos))
}

export function getPosition(): LastPosition | null {
  const stored = localStorage.getItem('last-position')
  if (!stored) return null
  try { return JSON.parse(stored) as LastPosition } catch { return null }
}

export function clearPosition(): void {
  localStorage.removeItem('last-position')
}
