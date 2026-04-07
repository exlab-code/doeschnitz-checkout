import { describe, it, expect, beforeEach } from 'vitest'
import { savePosition, getPosition, clearPosition } from '@/lib/last-position'

describe('savePosition', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves position with areaId only', () => {
    savePosition({ areaId: 'kitchen' })
    const raw = localStorage.getItem('last-position')
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw!)).toEqual({ areaId: 'kitchen' })
  })

  it('saves position with areaId and detailIndex', () => {
    savePosition({ areaId: 'bathroom', detailIndex: 2 })
    const raw = localStorage.getItem('last-position')
    expect(JSON.parse(raw!)).toEqual({ areaId: 'bathroom', detailIndex: 2 })
  })

  it('overwrites a previous position', () => {
    savePosition({ areaId: 'kitchen' })
    savePosition({ areaId: 'bathroom', detailIndex: 1 })
    const raw = localStorage.getItem('last-position')
    expect(JSON.parse(raw!)).toEqual({ areaId: 'bathroom', detailIndex: 1 })
  })
})

describe('getPosition', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when nothing is stored', () => {
    expect(getPosition()).toBeNull()
  })

  it('returns the saved position', () => {
    savePosition({ areaId: 'kitchen', detailIndex: 3 })
    expect(getPosition()).toEqual({ areaId: 'kitchen', detailIndex: 3 })
  })

  it('returns null for malformed JSON', () => {
    localStorage.setItem('last-position', 'not-json')
    expect(getPosition()).toBeNull()
  })
})

describe('clearPosition', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('removes the stored position', () => {
    savePosition({ areaId: 'kitchen' })
    clearPosition()
    expect(localStorage.getItem('last-position')).toBeNull()
  })

  it('does not throw when nothing is stored', () => {
    expect(() => clearPosition()).not.toThrow()
  })
})
