import { describe, it, expect } from 'vitest'
import {
  MediaItemSchema,
  TaskSchema,
  AreaFileSchema,
  AreaIndexItemSchema,
  AreaIndexSchema,
  CheckoutEntrySchema,
  ChangelogEntrySchema,
} from '@/lib/types'

describe('MediaItemSchema', () => {
  it('validates a valid media item', () => {
    const result = MediaItemSchema.safeParse({
      type: 'video',
      url: 'https://example.com/video.mp4',
      label: 'Demo video',
    })
    expect(result.success).toBe(true)
  })

  it('validates image type', () => {
    const result = MediaItemSchema.safeParse({
      type: 'image',
      url: 'https://example.com/photo.jpg',
      label: 'Photo',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid type', () => {
    const result = MediaItemSchema.safeParse({
      type: 'audio',
      url: 'https://example.com/audio.mp3',
      label: 'Audio',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing fields', () => {
    const result = MediaItemSchema.safeParse({ type: 'video' })
    expect(result.success).toBe(false)
  })
})

describe('TaskSchema', () => {
  it('validates a valid task with media', () => {
    const result = TaskSchema.safeParse({
      id: 'task-1',
      title: 'Check something',
      description: 'Make sure this is done',
      media: [
        { type: 'image', url: 'https://example.com/img.jpg', label: 'Reference' },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('defaults media to empty array when omitted', () => {
    const result = TaskSchema.safeParse({
      id: 'task-2',
      title: 'Another task',
      description: 'No media needed',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.media).toEqual([])
    }
  })

  it('allows empty media array', () => {
    const result = TaskSchema.safeParse({
      id: 'task-3',
      title: 'Empty media',
      description: 'Has explicit empty media',
      media: [],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.media).toEqual([])
    }
  })

  it('rejects missing required fields', () => {
    const result = TaskSchema.safeParse({ id: 'task-4' })
    expect(result.success).toBe(false)
  })
})

describe('AreaFileSchema', () => {
  it('validates a valid area file with tasks', () => {
    const result = AreaFileSchema.safeParse({
      id: 'area-1',
      name: 'Kitchen',
      emoji: '🍳',
      tasks: [
        {
          id: 'task-1',
          title: 'Clean stove',
          description: 'Wipe down the stove top',
          media: [],
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('allows empty tasks array', () => {
    const result = AreaFileSchema.safeParse({
      id: 'area-2',
      name: 'Garage',
      emoji: '🏠',
      tasks: [],
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing fields', () => {
    const result = AreaFileSchema.safeParse({ id: 'area-3', name: 'Bathroom' })
    expect(result.success).toBe(false)
  })
})

describe('AreaIndexItemSchema', () => {
  it('validates a valid area index item', () => {
    const result = AreaIndexItemSchema.safeParse({
      id: 'area-1',
      name: 'Kitchen',
      emoji: '🍳',
      sortOrder: 1,
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing sortOrder', () => {
    const result = AreaIndexItemSchema.safeParse({
      id: 'area-1',
      name: 'Kitchen',
      emoji: '🍳',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing fields', () => {
    const result = AreaIndexItemSchema.safeParse({ id: 'area-1' })
    expect(result.success).toBe(false)
  })
})

describe('AreaIndexSchema', () => {
  it('validates an array of area index items', () => {
    const result = AreaIndexSchema.safeParse([
      { id: 'area-1', name: 'Kitchen', emoji: '🍳', sortOrder: 1 },
      { id: 'area-2', name: 'Bathroom', emoji: '🚿', sortOrder: 2 },
    ])
    expect(result.success).toBe(true)
  })

  it('validates an empty array', () => {
    const result = AreaIndexSchema.safeParse([])
    expect(result.success).toBe(true)
  })

  it('rejects non-array input', () => {
    const result = AreaIndexSchema.safeParse({ id: 'area-1' })
    expect(result.success).toBe(false)
  })

  it('rejects array with invalid items', () => {
    const result = AreaIndexSchema.safeParse([
      { id: 'area-1', name: 'Kitchen' }, // missing emoji and sortOrder
    ])
    expect(result.success).toBe(false)
  })
})

describe('CheckoutEntrySchema', () => {
  it('validates a valid checkout entry', () => {
    const result = CheckoutEntrySchema.safeParse({
      name: 'John Doe',
      date: '2024-01-15',
      tasksCompleted: 8,
      tasksTotal: 10,
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = CheckoutEntrySchema.safeParse({
      name: '',
      date: '2024-01-15',
      tasksCompleted: 8,
      tasksTotal: 10,
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing fields', () => {
    const result = CheckoutEntrySchema.safeParse({ name: 'John' })
    expect(result.success).toBe(false)
  })
})

describe('ChangelogEntrySchema', () => {
  it('validates a valid changelog entry with optional taskId', () => {
    const result = ChangelogEntrySchema.safeParse({
      timestamp: '2024-01-15T10:00:00Z',
      author: 'Jane',
      area: 'kitchen',
      action: 'update',
      taskId: 'task-1',
      changes: { title: 'New title' },
    })
    expect(result.success).toBe(true)
  })

  it('validates a changelog entry without taskId', () => {
    const result = ChangelogEntrySchema.safeParse({
      timestamp: '2024-01-15T10:00:00Z',
      author: 'Jane',
      area: 'kitchen',
      action: 'create',
      changes: { name: 'New area' },
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing required fields', () => {
    const result = ChangelogEntrySchema.safeParse({
      timestamp: '2024-01-15T10:00:00Z',
      author: 'Jane',
    })
    expect(result.success).toBe(false)
  })
})
