# Haus Döschnitz Checkout App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first PWA that guides Haus Döschnitz members and guests through a structured checkout with area-based checklists, instructional media, inline editing, and sign-off logging.

**Architecture:** Next.js 15 App Router, content stored as JSON files on disk (no database), deployed on Coolify. PWA with service worker for offline. All editing writes directly to JSON files via API routes.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Serwist (PWA/service worker), Zod (validation)

---

## File Structure

```
doeschnitz-checkout/
├── app/
│   ├── layout.tsx                  # Root layout — mono font, metadata, PWA manifest link
│   ├── page.tsx                    # Home screen — area cards
│   ├── area/
│   │   └── [id]/
│   │       └── page.tsx            # Area view — focus checklist
│   ├── signoff/
│   │   └── page.tsx                # Sign-off screen
│   ├── log/
│   │   └── page.tsx                # Checkout log
│   └── api/
│       ├── areas/
│       │   ├── route.ts            # GET all areas, POST new area
│       │   └── [id]/
│       │       ├── route.ts        # GET/PUT/DELETE area
│       │       └── tasks/
│       │           ├── route.ts    # POST new task
│       │           └── [taskId]/
│       │               └── route.ts # PUT/DELETE task
│       ├── media/
│       │   ├── route.ts            # POST upload
│       │   └── [filename]/
│       │       └── route.ts        # DELETE media
│       ├── checkouts/
│       │   └── route.ts            # GET list, POST sign-off
│       └── changelog/
│           └── route.ts            # GET changelog
├── lib/
│   ├── types.ts                    # Shared TypeScript types + Zod schemas
│   ├── content.ts                  # Read/write JSON files on disk
│   └── changelog.ts                # Append to changelog
├── components/
│   ├── area-card.tsx               # Area card for home screen
│   ├── task-item.tsx               # Single task in checklist (collapsed/expanded)
│   ├── progress-bar.tsx            # Stepped progress bar
│   ├── edit-mode-provider.tsx      # Edit mode context + name prompt
│   ├── editable-text.tsx           # Inline editable text field
│   ├── media-player.tsx            # Video/image display
│   └── media-upload.tsx            # Upload button for edit mode
├── content/
│   ├── areas.json                  # Area index (seeded with example data)
│   └── areas/
│       ├── kueche.json             # Example: Küche tasks
│       └── bad.json                # Example: Bad tasks
├── public/
│   ├── manifest.json               # PWA manifest
│   └── media/                      # Uploaded media files served statically
├── checkouts.json                  # Sign-off log (created at runtime)
├── changelog.json                  # Edit log (created at runtime)
├── tailwind.config.ts
├── next.config.ts                  # PWA config via Serwist
├── package.json
├── tsconfig.json
└── __tests__/
    ├── lib/
    │   ├── content.test.ts         # Content read/write tests
    │   └── changelog.test.ts       # Changelog tests
    ├── api/
    │   ├── areas.test.ts           # Areas API tests
    │   ├── checkouts.test.ts       # Checkouts API tests
    │   └── media.test.ts           # Media API tests
    └── components/
        ├── area-card.test.tsx      # Area card render tests
        ├── task-item.test.tsx      # Task item tests
        └── progress-bar.test.tsx   # Progress bar tests
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `app/layout.tsx`, `app/page.tsx`, `public/manifest.json`, `.gitignore`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd /Users/juliusfalk/Documents/GitHub/doeschnitz-checkout
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

When prompted, accept defaults. This creates the scaffolding with App Router, TypeScript, and Tailwind.

- [ ] **Step 2: Install dependencies**

```bash
npm install zod
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: [],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

Add to `package.json` scripts:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 4: Add PWA manifest**

Create `public/manifest.json`:

```json
{
  "name": "Haus Döschnitz — Abreise",
  "short_name": "Abreise",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ffffff",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 5: Set up Tailwind for monospace / sharp style**

Update `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '2px',
        sm: '1px',
        md: '2px',
        lg: '2px',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 6: Create root layout**

Replace `app/layout.tsx`:

```tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Abreise — Haus Döschnitz',
  description: 'Checkout-Checkliste für Haus Döschnitz',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-mono bg-white text-black antialiased">
        <main className="max-w-md mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  )
}
```

- [ ] **Step 7: Create placeholder home page**

Replace `app/page.tsx`:

```tsx
export default function Home() {
  return (
    <div>
      <h1 className="text-xs font-bold tracking-[3px] uppercase">Abreise</h1>
      <p className="text-xs text-gray-400 tracking-wider uppercase mt-1">
        Haus Döschnitz
      </p>
    </div>
  )
}
```

- [ ] **Step 8: Update globals.css**

Replace `app/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    border-radius: 2px;
  }

  body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}
```

- [ ] **Step 9: Verify it runs**

```bash
npm run dev
```

Open http://localhost:3000 — should see "ABREISE" header with monospace font on white background.

- [ ] **Step 10: Commit**

```bash
git init
echo "node_modules/\n.next/\n.superpowers/" > .gitignore
git add .
git commit -m "feat: scaffold Next.js project with Tailwind, monospace theme, PWA manifest"
```

---

## Task 2: Types and Zod Schemas

**Files:**
- Create: `lib/types.ts`
- Test: `__tests__/lib/types.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  AreaIndexSchema,
  AreaFileSchema,
  CheckoutEntrySchema,
  ChangelogEntrySchema,
  type AreaIndex,
  type AreaFile,
  type Task,
} from '@/lib/types'

describe('AreaIndexSchema', () => {
  it('validates a valid area index', () => {
    const input = [
      { id: 'kueche', name: 'Küche', emoji: '🍳', sortOrder: 0 },
      { id: 'bad', name: 'Bad', emoji: '🚿', sortOrder: 1 },
    ]
    const result = AreaIndexSchema.parse(input)
    expect(result).toEqual(input)
  })

  it('rejects missing fields', () => {
    expect(() => AreaIndexSchema.parse([{ id: 'x' }])).toThrow()
  })
})

describe('AreaFileSchema', () => {
  it('validates area with tasks', () => {
    const input = {
      id: 'kueche',
      name: 'Küche',
      emoji: '🍳',
      tasks: [
        {
          id: 'herd',
          title: 'Herd reinigen',
          description: 'Platten abwischen.',
          media: [{ type: 'video', url: '/media/herd.mp4', label: 'Video' }],
        },
      ],
    }
    const result = AreaFileSchema.parse(input)
    expect(result.tasks).toHaveLength(1)
    expect(result.tasks[0].media).toHaveLength(1)
  })

  it('allows empty tasks and media', () => {
    const input = { id: 'test', name: 'Test', emoji: '🔧', tasks: [] }
    const result = AreaFileSchema.parse(input)
    expect(result.tasks).toEqual([])
  })

  it('defaults media to empty array', () => {
    const input = {
      id: 'test',
      name: 'Test',
      emoji: '🔧',
      tasks: [{ id: 't1', title: 'Task', description: '' }],
    }
    const result = AreaFileSchema.parse(input)
    expect(result.tasks[0].media).toEqual([])
  })
})

describe('CheckoutEntrySchema', () => {
  it('validates a checkout entry', () => {
    const input = {
      name: 'Julius',
      date: '2026-04-07T14:00:00Z',
      tasksCompleted: 18,
      tasksTotal: 18,
    }
    expect(CheckoutEntrySchema.parse(input)).toEqual(input)
  })
})

describe('ChangelogEntrySchema', () => {
  it('validates a changelog entry', () => {
    const input = {
      timestamp: '2026-04-07T14:23:00Z',
      author: 'Julius',
      area: 'kueche',
      action: 'edit_task',
      taskId: 'herd',
      changes: { description: { old: 'A', new: 'B' } },
    }
    expect(ChangelogEntrySchema.parse(input)).toEqual(input)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/lib/types.test.ts
```

Expected: FAIL — cannot resolve `@/lib/types`

- [ ] **Step 3: Implement types**

Create `lib/types.ts`:

```typescript
import { z } from 'zod'

export const MediaItemSchema = z.object({
  type: z.enum(['video', 'image']),
  url: z.string(),
  label: z.string(),
})

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  media: z.array(MediaItemSchema).default([]),
})

export const AreaFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  emoji: z.string(),
  tasks: z.array(TaskSchema),
})

export const AreaIndexItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  emoji: z.string(),
  sortOrder: z.number(),
})

export const AreaIndexSchema = z.array(AreaIndexItemSchema)

export const CheckoutEntrySchema = z.object({
  name: z.string().min(1),
  date: z.string(),
  tasksCompleted: z.number(),
  tasksTotal: z.number(),
})

export const ChangelogEntrySchema = z.object({
  timestamp: z.string(),
  author: z.string(),
  area: z.string(),
  action: z.string(),
  taskId: z.string().optional(),
  changes: z.record(z.any()),
})

export type MediaItem = z.infer<typeof MediaItemSchema>
export type Task = z.infer<typeof TaskSchema>
export type AreaFile = z.infer<typeof AreaFileSchema>
export type AreaIndexItem = z.infer<typeof AreaIndexItemSchema>
export type AreaIndex = z.infer<typeof AreaIndexSchema>
export type CheckoutEntry = z.infer<typeof CheckoutEntrySchema>
export type ChangelogEntry = z.infer<typeof ChangelogEntrySchema>
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/lib/types.test.ts
```

Expected: all 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts __tests__/lib/types.test.ts
git commit -m "feat: add Zod schemas and types for areas, tasks, checkouts, changelog"
```

---

## Task 3: Content Read/Write Library

**Files:**
- Create: `lib/content.ts`
- Test: `__tests__/lib/content.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/content.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import {
  getAreas,
  getArea,
  saveArea,
  saveAreas,
  deleteAreaFile,
  getCheckouts,
  addCheckout,
} from '@/lib/content'

let testDir: string

beforeEach(async () => {
  testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'checkout-test-'))
  process.env.CONTENT_DIR = testDir
  process.env.DATA_DIR = testDir

  await fs.mkdir(path.join(testDir, 'areas'), { recursive: true })

  await fs.writeFile(
    path.join(testDir, 'areas.json'),
    JSON.stringify([
      { id: 'kueche', name: 'Küche', emoji: '🍳', sortOrder: 0 },
    ])
  )

  await fs.writeFile(
    path.join(testDir, 'areas', 'kueche.json'),
    JSON.stringify({
      id: 'kueche',
      name: 'Küche',
      emoji: '🍳',
      tasks: [{ id: 't1', title: 'Test task', description: 'Do it', media: [] }],
    })
  )
})

afterEach(async () => {
  await fs.rm(testDir, { recursive: true })
  delete process.env.CONTENT_DIR
  delete process.env.DATA_DIR
})

describe('getAreas', () => {
  it('reads and parses areas.json', async () => {
    const areas = await getAreas()
    expect(areas).toHaveLength(1)
    expect(areas[0].id).toBe('kueche')
  })
})

describe('getArea', () => {
  it('reads a single area file', async () => {
    const area = await getArea('kueche')
    expect(area.name).toBe('Küche')
    expect(area.tasks).toHaveLength(1)
  })

  it('throws for nonexistent area', async () => {
    await expect(getArea('nope')).rejects.toThrow()
  })
})

describe('saveArea', () => {
  it('writes area file to disk', async () => {
    const area = {
      id: 'bad',
      name: 'Bad',
      emoji: '🚿',
      tasks: [],
    }
    await saveArea(area)
    const raw = await fs.readFile(
      path.join(testDir, 'areas', 'bad.json'),
      'utf-8'
    )
    expect(JSON.parse(raw).name).toBe('Bad')
  })
})

describe('saveAreas', () => {
  it('writes areas index to disk', async () => {
    const areas = [
      { id: 'kueche', name: 'Küche', emoji: '🍳', sortOrder: 0 },
      { id: 'bad', name: 'Bad', emoji: '🚿', sortOrder: 1 },
    ]
    await saveAreas(areas)
    const raw = await fs.readFile(path.join(testDir, 'areas.json'), 'utf-8')
    expect(JSON.parse(raw)).toHaveLength(2)
  })
})

describe('deleteAreaFile', () => {
  it('removes an area file from disk', async () => {
    await deleteAreaFile('kueche')
    await expect(
      fs.access(path.join(testDir, 'areas', 'kueche.json'))
    ).rejects.toThrow()
  })
})

describe('checkouts', () => {
  it('returns empty array when no file exists', async () => {
    const checkouts = await getCheckouts()
    expect(checkouts).toEqual([])
  })

  it('appends a checkout entry', async () => {
    await addCheckout({
      name: 'Julius',
      date: '2026-04-07T14:00:00Z',
      tasksCompleted: 18,
      tasksTotal: 18,
    })
    const checkouts = await getCheckouts()
    expect(checkouts).toHaveLength(1)
    expect(checkouts[0].name).toBe('Julius')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/lib/content.test.ts
```

Expected: FAIL — cannot resolve `@/lib/content`

- [ ] **Step 3: Implement content library**

Create `lib/content.ts`:

```typescript
import fs from 'fs/promises'
import path from 'path'
import {
  AreaIndexSchema,
  AreaFileSchema,
  CheckoutEntrySchema,
  type AreaIndexItem,
  type AreaFile,
  type CheckoutEntry,
} from './types'

function contentDir(): string {
  return process.env.CONTENT_DIR || path.join(process.cwd(), 'content')
}

function dataDir(): string {
  return process.env.DATA_DIR || process.cwd()
}

export async function getAreas(): Promise<AreaIndexItem[]> {
  const raw = await fs.readFile(
    path.join(contentDir(), 'areas.json'),
    'utf-8'
  )
  return AreaIndexSchema.parse(JSON.parse(raw))
}

export async function saveAreas(areas: AreaIndexItem[]): Promise<void> {
  const validated = AreaIndexSchema.parse(areas)
  await fs.writeFile(
    path.join(contentDir(), 'areas.json'),
    JSON.stringify(validated, null, 2)
  )
}

export async function getArea(id: string): Promise<AreaFile> {
  const filePath = path.join(contentDir(), 'areas', `${id}.json`)
  const raw = await fs.readFile(filePath, 'utf-8')
  return AreaFileSchema.parse(JSON.parse(raw))
}

export async function saveArea(area: AreaFile): Promise<void> {
  const validated = AreaFileSchema.parse(area)
  await fs.mkdir(path.join(contentDir(), 'areas'), { recursive: true })
  await fs.writeFile(
    path.join(contentDir(), 'areas', `${validated.id}.json`),
    JSON.stringify(validated, null, 2)
  )
}

export async function deleteAreaFile(id: string): Promise<void> {
  await fs.unlink(path.join(contentDir(), 'areas', `${id}.json`))
}

export async function getCheckouts(): Promise<CheckoutEntry[]> {
  const filePath = path.join(dataDir(), 'checkouts.json')
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    return CheckoutEntrySchema.array().parse(JSON.parse(raw))
  } catch {
    return []
  }
}

export async function addCheckout(entry: CheckoutEntry): Promise<void> {
  const validated = CheckoutEntrySchema.parse(entry)
  const existing = await getCheckouts()
  const updated = [...existing, validated]
  await fs.writeFile(
    path.join(dataDir(), 'checkouts.json'),
    JSON.stringify(updated, null, 2)
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/lib/content.test.ts
```

Expected: all 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/content.ts __tests__/lib/content.test.ts
git commit -m "feat: add content read/write library for areas, checkouts"
```

---

## Task 4: Changelog Library

**Files:**
- Create: `lib/changelog.ts`
- Test: `__tests__/lib/changelog.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/changelog.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { appendChange, getChangelog } from '@/lib/changelog'

let testDir: string

beforeEach(async () => {
  testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'changelog-test-'))
  process.env.DATA_DIR = testDir
})

afterEach(async () => {
  await fs.rm(testDir, { recursive: true })
  delete process.env.DATA_DIR
})

describe('changelog', () => {
  it('returns empty array when no file exists', async () => {
    const log = await getChangelog()
    expect(log).toEqual([])
  })

  it('appends a change entry', async () => {
    await appendChange({
      author: 'Julius',
      area: 'kueche',
      action: 'edit_task',
      taskId: 'herd',
      changes: { title: { old: 'A', new: 'B' } },
    })
    const log = await getChangelog()
    expect(log).toHaveLength(1)
    expect(log[0].author).toBe('Julius')
    expect(log[0].timestamp).toBeDefined()
  })

  it('appends multiple entries', async () => {
    await appendChange({
      author: 'Julius',
      area: 'kueche',
      action: 'edit_task',
      taskId: 'herd',
      changes: { title: { old: 'A', new: 'B' } },
    })
    await appendChange({
      author: 'Anna',
      area: 'bad',
      action: 'add_task',
      changes: { title: { new: 'Spiegel putzen' } },
    })
    const log = await getChangelog()
    expect(log).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/lib/changelog.test.ts
```

Expected: FAIL — cannot resolve `@/lib/changelog`

- [ ] **Step 3: Implement changelog library**

Create `lib/changelog.ts`:

```typescript
import fs from 'fs/promises'
import path from 'path'
import { ChangelogEntrySchema, type ChangelogEntry } from './types'

function dataDir(): string {
  return process.env.DATA_DIR || process.cwd()
}

interface ChangeInput {
  author: string
  area: string
  action: string
  taskId?: string
  changes: Record<string, unknown>
}

export async function appendChange(input: ChangeInput): Promise<void> {
  const entry: ChangelogEntry = {
    timestamp: new Date().toISOString(),
    author: input.author,
    area: input.area,
    action: input.action,
    taskId: input.taskId,
    changes: input.changes,
  }
  const validated = ChangelogEntrySchema.parse(entry)
  const existing = await getChangelog()
  const updated = [...existing, validated]
  await fs.writeFile(
    path.join(dataDir(), 'changelog.json'),
    JSON.stringify(updated, null, 2)
  )
}

export async function getChangelog(): Promise<ChangelogEntry[]> {
  const filePath = path.join(dataDir(), 'changelog.json')
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    return ChangelogEntrySchema.array().parse(JSON.parse(raw))
  } catch {
    return []
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/lib/changelog.test.ts
```

Expected: all 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/changelog.ts __tests__/lib/changelog.test.ts
git commit -m "feat: add changelog append-only logging library"
```

---

## Task 5: API Routes — Areas

**Files:**
- Create: `app/api/areas/route.ts`, `app/api/areas/[id]/route.ts`, `app/api/areas/[id]/tasks/route.ts`, `app/api/areas/[id]/tasks/[taskId]/route.ts`
- Test: `__tests__/api/areas.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/api/areas.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

let testDir: string

beforeEach(async () => {
  testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'api-test-'))
  process.env.CONTENT_DIR = testDir
  process.env.DATA_DIR = testDir

  await fs.mkdir(path.join(testDir, 'areas'), { recursive: true })
  await fs.writeFile(
    path.join(testDir, 'areas.json'),
    JSON.stringify([
      { id: 'kueche', name: 'Küche', emoji: '🍳', sortOrder: 0 },
    ])
  )
  await fs.writeFile(
    path.join(testDir, 'areas', 'kueche.json'),
    JSON.stringify({
      id: 'kueche',
      name: 'Küche',
      emoji: '🍳',
      tasks: [
        { id: 'herd', title: 'Herd reinigen', description: 'Abwischen.', media: [] },
      ],
    })
  )
})

afterEach(async () => {
  await fs.rm(testDir, { recursive: true })
  delete process.env.CONTENT_DIR
  delete process.env.DATA_DIR
})

describe('GET /api/areas', () => {
  it('returns areas list', async () => {
    const { GET } = await import('@/app/api/areas/route')
    const response = await GET()
    const data = await response.json()
    expect(data).toHaveLength(1)
    expect(data[0].id).toBe('kueche')
  })
})

describe('GET /api/areas/[id]', () => {
  it('returns area with tasks', async () => {
    const { GET } = await import('@/app/api/areas/[id]/route')
    const response = await GET(new Request('http://localhost/api/areas/kueche'), {
      params: Promise.resolve({ id: 'kueche' }),
    })
    const data = await response.json()
    expect(data.name).toBe('Küche')
    expect(data.tasks).toHaveLength(1)
  })

  it('returns 404 for unknown area', async () => {
    const { GET } = await import('@/app/api/areas/[id]/route')
    const response = await GET(new Request('http://localhost/api/areas/nope'), {
      params: Promise.resolve({ id: 'nope' }),
    })
    expect(response.status).toBe(404)
  })
})

describe('PUT /api/areas/[id]/tasks/[taskId]', () => {
  it('updates a task and logs the change', async () => {
    const { PUT } = await import(
      '@/app/api/areas/[id]/tasks/[taskId]/route'
    )
    const body = JSON.stringify({
      title: 'Herd & Ofen reinigen',
      description: 'Alle Platten abwischen.',
      author: 'Julius',
    })
    const response = await PUT(
      new Request('http://localhost/api/areas/kueche/tasks/herd', {
        method: 'PUT',
        body,
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'kueche', taskId: 'herd' }) }
    )
    expect(response.status).toBe(200)

    const area = JSON.parse(
      await fs.readFile(path.join(testDir, 'areas', 'kueche.json'), 'utf-8')
    )
    expect(area.tasks[0].title).toBe('Herd & Ofen reinigen')

    const changelog = JSON.parse(
      await fs.readFile(path.join(testDir, 'changelog.json'), 'utf-8')
    )
    expect(changelog).toHaveLength(1)
    expect(changelog[0].author).toBe('Julius')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/api/areas.test.ts
```

Expected: FAIL — cannot resolve route files

- [ ] **Step 3: Implement GET /api/areas**

Create `app/api/areas/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getAreas, saveAreas } from '@/lib/content'
import { AreaIndexItemSchema } from '@/lib/types'
import { z } from 'zod'

export async function GET() {
  const areas = await getAreas()
  return NextResponse.json(areas)
}

const CreateAreaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  emoji: z.string().min(1),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = CreateAreaSchema.parse(body)

  const areas = await getAreas()
  const newItem = { ...parsed, sortOrder: areas.length }
  const updated = [...areas, newItem]
  await saveAreas(updated)

  const { saveArea } = await import('@/lib/content')
  await saveArea({ ...parsed, tasks: [] })

  return NextResponse.json(newItem, { status: 201 })
}
```

- [ ] **Step 4: Implement GET/PUT/DELETE /api/areas/[id]**

Create `app/api/areas/[id]/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getArea, saveArea, saveAreas, getAreas, deleteAreaFile } from '@/lib/content'
import { appendChange } from '@/lib/changelog'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  try {
    const area = await getArea(id)
    return NextResponse.json(area)
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params
  const body = await request.json()

  try {
    const area = await getArea(id)
    const updated = { ...area, name: body.name ?? area.name, emoji: body.emoji ?? area.emoji }

    if (body.tasks) {
      updated.tasks = body.tasks
    }

    await saveArea(updated)

    if (body.author) {
      await appendChange({
        author: body.author,
        area: id,
        action: 'edit_area',
        changes: { name: { old: area.name, new: updated.name }, emoji: { old: area.emoji, new: updated.emoji } },
      })
    }

    const areas = await getAreas()
    const updatedAreas = areas.map((a) =>
      a.id === id ? { ...a, name: updated.name, emoji: updated.emoji } : a
    )
    await saveAreas(updatedAreas)

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params
  try {
    await deleteAreaFile(id)
    const areas = await getAreas()
    const updated = areas.filter((a) => a.id !== id)
    await saveAreas(updated)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
```

- [ ] **Step 5: Implement POST /api/areas/[id]/tasks**

Create `app/api/areas/[id]/tasks/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getArea, saveArea } from '@/lib/content'
import { appendChange } from '@/lib/changelog'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const body = await request.json()

  const area = await getArea(id)
  const newTask = {
    id: body.id || crypto.randomUUID().slice(0, 8),
    title: body.title || '',
    description: body.description || '',
    media: body.media || [],
  }

  const updated = { ...area, tasks: [...area.tasks, newTask] }
  await saveArea(updated)

  if (body.author) {
    await appendChange({
      author: body.author,
      area: id,
      action: 'add_task',
      taskId: newTask.id,
      changes: { title: { new: newTask.title } },
    })
  }

  return NextResponse.json(newTask, { status: 201 })
}
```

- [ ] **Step 6: Implement PUT/DELETE /api/areas/[id]/tasks/[taskId]**

Create `app/api/areas/[id]/tasks/[taskId]/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getArea, saveArea } from '@/lib/content'
import { appendChange } from '@/lib/changelog'

type Params = { params: Promise<{ id: string; taskId: string }> }

export async function PUT(request: Request, { params }: Params) {
  const { id, taskId } = await params
  const body = await request.json()

  const area = await getArea(id)
  const taskIndex = area.tasks.findIndex((t) => t.id === taskId)
  if (taskIndex === -1) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  const oldTask = area.tasks[taskIndex]
  const updatedTask = {
    ...oldTask,
    title: body.title ?? oldTask.title,
    description: body.description ?? oldTask.description,
    media: body.media ?? oldTask.media,
  }

  const updatedTasks = area.tasks.map((t, i) =>
    i === taskIndex ? updatedTask : t
  )
  await saveArea({ ...area, tasks: updatedTasks })

  if (body.author) {
    const changes: Record<string, { old: string; new: string }> = {}
    if (body.title !== undefined && body.title !== oldTask.title) {
      changes.title = { old: oldTask.title, new: body.title }
    }
    if (body.description !== undefined && body.description !== oldTask.description) {
      changes.description = { old: oldTask.description, new: body.description }
    }
    await appendChange({
      author: body.author,
      area: id,
      action: 'edit_task',
      taskId,
      changes,
    })
  }

  return NextResponse.json(updatedTask)
}

export async function DELETE(request: Request, { params }: Params) {
  const { id, taskId } = await params
  const body = await request.json().catch(() => ({}))
  const area = await getArea(id)

  const task = area.tasks.find((t) => t.id === taskId)
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  const updatedTasks = area.tasks.filter((t) => t.id !== taskId)
  await saveArea({ ...area, tasks: updatedTasks })

  if (body.author) {
    await appendChange({
      author: body.author,
      area: id,
      action: 'delete_task',
      taskId,
      changes: { title: { old: task.title } },
    })
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
npx vitest run __tests__/api/areas.test.ts
```

Expected: all 4 tests PASS

- [ ] **Step 8: Commit**

```bash
git add app/api/ __tests__/api/areas.test.ts
git commit -m "feat: add API routes for areas and tasks CRUD with changelog"
```

---

## Task 6: API Routes — Checkouts, Changelog, Media

**Files:**
- Create: `app/api/checkouts/route.ts`, `app/api/changelog/route.ts`, `app/api/media/route.ts`, `app/api/media/[filename]/route.ts`
- Test: `__tests__/api/checkouts.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/api/checkouts.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

let testDir: string

beforeEach(async () => {
  testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'checkout-api-test-'))
  process.env.DATA_DIR = testDir
})

afterEach(async () => {
  await fs.rm(testDir, { recursive: true })
  delete process.env.DATA_DIR
})

describe('POST /api/checkouts', () => {
  it('records a sign-off', async () => {
    const { POST } = await import('@/app/api/checkouts/route')
    const response = await POST(
      new Request('http://localhost/api/checkouts', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Julius',
          tasksCompleted: 18,
          tasksTotal: 18,
        }),
        headers: { 'Content-Type': 'application/json' },
      })
    )
    expect(response.status).toBe(201)

    const { GET } = await import('@/app/api/checkouts/route')
    const listResponse = await GET()
    const data = await listResponse.json()
    expect(data).toHaveLength(1)
    expect(data[0].name).toBe('Julius')
  })
})

describe('GET /api/changelog', () => {
  it('returns empty array when no changelog exists', async () => {
    const { GET } = await import('@/app/api/changelog/route')
    const response = await GET()
    const data = await response.json()
    expect(data).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/api/checkouts.test.ts
```

Expected: FAIL — cannot resolve route files

- [ ] **Step 3: Implement checkouts route**

Create `app/api/checkouts/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getCheckouts, addCheckout } from '@/lib/content'

export async function GET() {
  const checkouts = await getCheckouts()
  return NextResponse.json(checkouts)
}

export async function POST(request: Request) {
  const body = await request.json()
  const entry = {
    name: body.name,
    date: new Date().toISOString(),
    tasksCompleted: body.tasksCompleted,
    tasksTotal: body.tasksTotal,
  }
  await addCheckout(entry)
  return NextResponse.json(entry, { status: 201 })
}
```

- [ ] **Step 4: Implement changelog route**

Create `app/api/changelog/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getChangelog } from '@/lib/changelog'

export async function GET() {
  const changelog = await getChangelog()
  return NextResponse.json(changelog)
}
```

- [ ] **Step 5: Implement media upload route**

Create `app/api/media/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

function mediaDir(): string {
  return process.env.MEDIA_DIR || path.join(process.cwd(), 'public', 'media')
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filename = `${Date.now()}-${sanitizedName}`
  const buffer = Buffer.from(await file.arrayBuffer())

  await fs.mkdir(mediaDir(), { recursive: true })
  await fs.writeFile(path.join(mediaDir(), filename), buffer)

  return NextResponse.json(
    { url: `/media/${filename}`, filename },
    { status: 201 }
  )
}
```

- [ ] **Step 6: Implement media delete route**

Create `app/api/media/[filename]/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

function mediaDir(): string {
  return process.env.MEDIA_DIR || path.join(process.cwd(), 'public', 'media')
}

type Params = { params: Promise<{ filename: string }> }

export async function DELETE(_request: Request, { params }: Params) {
  const { filename } = await params
  const sanitized = path.basename(filename)

  try {
    await fs.unlink(path.join(mediaDir(), sanitized))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
npx vitest run __tests__/api/checkouts.test.ts
```

Expected: all 2 tests PASS

- [ ] **Step 8: Commit**

```bash
git add app/api/checkouts/ app/api/changelog/ app/api/media/ __tests__/api/checkouts.test.ts
git commit -m "feat: add API routes for checkouts, changelog, and media upload"
```

---

## Task 7: Seed Content

**Files:**
- Create: `content/areas.json`, `content/areas/kueche.json`, `content/areas/bad.json`, `content/areas/heizung.json`, `content/areas/garten.json`

- [ ] **Step 1: Create areas index**

Create `content/areas.json`:

```json
[
  { "id": "kueche", "name": "Küche", "emoji": "🍳", "sortOrder": 0 },
  { "id": "bad", "name": "Bad", "emoji": "🚿", "sortOrder": 1 },
  { "id": "heizung", "name": "Heizung", "emoji": "🔥", "sortOrder": 2 },
  { "id": "garten", "name": "Garten", "emoji": "🌿", "sortOrder": 3 }
]
```

- [ ] **Step 2: Create Küche tasks**

Create `content/areas/kueche.json`:

```json
{
  "id": "kueche",
  "name": "Küche",
  "emoji": "🍳",
  "tasks": [
    { "id": "kuehlschrank", "title": "Kühlschrank ausräumen", "description": "Alle Lebensmittel mitnehmen oder entsorgen. Kühlschrank auswischen.", "media": [] },
    { "id": "herd", "title": "Herd & Ofen reinigen", "description": "Alle Platten abwischen. Backofen kontrollieren und ggf. reinigen.", "media": [] },
    { "id": "spuele", "title": "Spüle sauber machen", "description": "Spüle und Abtropffläche reinigen. Abfluss kontrollieren.", "media": [] },
    { "id": "muell", "title": "Müll rausbringen", "description": "Alle Mülleimer leeren. Neue Beutel einlegen.", "media": [] },
    { "id": "arbeitsflaechen", "title": "Arbeitsflächen wischen", "description": "Alle Oberflächen mit feuchtem Tuch abwischen.", "media": [] },
    { "id": "boden-kueche", "title": "Boden fegen", "description": "Küchenboden fegen und ggf. wischen.", "media": [] }
  ]
}
```

- [ ] **Step 3: Create Bad tasks**

Create `content/areas/bad.json`:

```json
{
  "id": "bad",
  "name": "Bad",
  "emoji": "🚿",
  "tasks": [
    { "id": "handtuecher", "title": "Handtücher waschen", "description": "Benutzte Handtücher in die Waschmaschine. Frische Handtücher auslegen.", "media": [] },
    { "id": "dusche", "title": "Dusche reinigen", "description": "Duschwanne und Armaturen abwischen. Haare aus dem Abfluss entfernen.", "media": [] },
    { "id": "spiegel", "title": "Spiegel putzen", "description": "Spiegel mit Glasreiniger abwischen.", "media": [] },
    { "id": "toilette", "title": "Toilette reinigen", "description": "Toilette mit Bürste reinigen. Sitz abwischen.", "media": [] }
  ]
}
```

- [ ] **Step 4: Create Heizung tasks**

Create `content/areas/heizung.json`:

```json
{
  "id": "heizung",
  "name": "Heizung",
  "emoji": "🔥",
  "tasks": [
    { "id": "thermostat", "title": "Thermostat zurückstellen", "description": "Alle Thermostate auf Frostschutz (Schneeflocke) stellen.", "media": [] },
    { "id": "fenster", "title": "Fenster schließen", "description": "Alle Fenster im Haus schließen und verriegeln.", "media": [] },
    { "id": "heizraum", "title": "Heizraum kontrollieren", "description": "Heizungsanlage kontrollieren. Keine Fehlermeldungen am Display.", "media": [] }
  ]
}
```

- [ ] **Step 5: Create Garten tasks**

Create `content/areas/garten.json`:

```json
{
  "id": "garten",
  "name": "Garten",
  "emoji": "🌿",
  "tasks": [
    { "id": "gartenmoebel", "title": "Gartenmöbel verräumen", "description": "Stühle und Tische unter das Vordach stellen oder in den Schuppen.", "media": [] },
    { "id": "grill", "title": "Grill reinigen", "description": "Grillrost reinigen. Asche entsorgen. Abdeckung drauf.", "media": [] },
    { "id": "wasseranschluss", "title": "Wasseranschluss prüfen", "description": "Außenwasserhahn zudrehen (besonders im Winter).", "media": [] },
    { "id": "tor", "title": "Tor & Zaun kontrollieren", "description": "Gartentor schließen. Zaun auf Schäden prüfen.", "media": [] },
    { "id": "licht-aussen", "title": "Außenbeleuchtung aus", "description": "Alle Außenlichter ausschalten.", "media": [] }
  ]
}
```

- [ ] **Step 6: Commit**

```bash
git add content/
git commit -m "feat: seed initial checkout content for Küche, Bad, Heizung, Garten"
```

---

## Task 8: Home Screen — Area Cards

**Files:**
- Create: `components/area-card.tsx`, `components/progress-bar.tsx`
- Modify: `app/page.tsx`
- Test: `__tests__/components/area-card.test.tsx`, `__tests__/components/progress-bar.test.tsx`

- [ ] **Step 1: Write progress bar test**

Create `__tests__/components/progress-bar.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressBar } from '@/components/progress-bar'

describe('ProgressBar', () => {
  it('renders correct number of segments', () => {
    const { container } = render(<ProgressBar total={6} completed={3} />)
    const segments = container.querySelectorAll('[data-segment]')
    expect(segments).toHaveLength(6)
  })

  it('marks completed segments', () => {
    const { container } = render(<ProgressBar total={4} completed={2} />)
    const filled = container.querySelectorAll('[data-filled="true"]')
    expect(filled).toHaveLength(2)
  })

  it('renders nothing when total is 0', () => {
    const { container } = render(<ProgressBar total={0} completed={0} />)
    const segments = container.querySelectorAll('[data-segment]')
    expect(segments).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/progress-bar.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Implement ProgressBar**

Create `components/progress-bar.tsx`:

```tsx
interface ProgressBarProps {
  total: number
  completed: number
}

export function ProgressBar({ total, completed }: ProgressBarProps) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          data-segment
          data-filled={i < completed}
          className={`h-1 flex-1 ${
            i < completed ? 'bg-black' : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/components/progress-bar.test.tsx
```

Expected: all 3 tests PASS

- [ ] **Step 5: Write area card test**

Create `__tests__/components/area-card.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AreaCard } from '@/components/area-card'

describe('AreaCard', () => {
  it('renders area name and emoji', () => {
    render(
      <AreaCard
        id="kueche"
        name="Küche"
        emoji="🍳"
        taskCount={6}
        completedCount={3}
      />
    )
    expect(screen.getByText('🍳 Küche')).toBeDefined()
  })

  it('shows task count', () => {
    render(
      <AreaCard
        id="kueche"
        name="Küche"
        emoji="🍳"
        taskCount={6}
        completedCount={0}
      />
    )
    expect(screen.getByText('6 Aufgaben')).toBeDefined()
  })

  it('shows progress fraction', () => {
    render(
      <AreaCard
        id="kueche"
        name="Küche"
        emoji="🍳"
        taskCount={6}
        completedCount={3}
      />
    )
    expect(screen.getByText('3/6')).toBeDefined()
  })
})
```

- [ ] **Step 6: Implement AreaCard**

Create `components/area-card.tsx`:

```tsx
import Link from 'next/link'
import { ProgressBar } from './progress-bar'

interface AreaCardProps {
  id: string
  name: string
  emoji: string
  taskCount: number
  completedCount: number
}

export function AreaCard({
  id,
  name,
  emoji,
  taskCount,
  completedCount,
}: AreaCardProps) {
  return (
    <Link href={`/area/${id}`} className="block">
      <div className="border border-gray-200 p-3 hover:border-gray-400 transition-colors">
        <div className="flex justify-between items-center">
          <div>
            <div className="font-semibold text-sm text-black">
              {emoji} {name}
            </div>
            <div className="text-[10px] text-gray-400 mt-1">
              {taskCount} Aufgaben
            </div>
          </div>
          <div className="text-[10px] font-semibold text-black">
            {completedCount > 0 ? `${completedCount}/${taskCount}` : '—'}
          </div>
        </div>
        {taskCount > 0 && (
          <div className="mt-2">
            <ProgressBar total={taskCount} completed={completedCount} />
          </div>
        )}
      </div>
    </Link>
  )
}
```

- [ ] **Step 7: Run area card tests**

```bash
npx vitest run __tests__/components/area-card.test.tsx
```

Expected: all 3 tests PASS

- [ ] **Step 8: Wire up home page**

Replace `app/page.tsx`:

```tsx
import { getAreas, getArea } from '@/lib/content'
import { AreaCard } from '@/components/area-card'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const areas = await getAreas()
  const areasWithTasks = await Promise.all(
    areas
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(async (area) => {
        const full = await getArea(area.id)
        return { ...area, taskCount: full.tasks.length }
      })
  )

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xs font-bold tracking-[3px] uppercase">
          Abreise
        </h1>
        <p className="text-[10px] text-gray-400 tracking-wider uppercase mt-1">
          Haus Döschnitz
        </p>
      </header>

      <div className="flex flex-col gap-2">
        {areasWithTasks.map((area) => (
          <AreaCard
            key={area.id}
            id={area.id}
            name={area.name}
            emoji={area.emoji}
            taskCount={area.taskCount}
            completedCount={0}
          />
        ))}
      </div>

      <footer className="mt-8 text-center">
        <Link
          href="/log"
          className="text-[10px] text-gray-400 hover:text-gray-600 uppercase tracking-wider"
        >
          Letzte Abreisen
        </Link>
      </footer>
    </div>
  )
}
```

- [ ] **Step 9: Verify visually**

```bash
npm run dev
```

Open http://localhost:3000 — should see the sharp mono area cards with Küche, Bad, Heizung, Garten.

- [ ] **Step 10: Commit**

```bash
git add components/area-card.tsx components/progress-bar.tsx app/page.tsx __tests__/components/
git commit -m "feat: add home screen with area cards and progress bar"
```

---

## Task 9: Area View — Focus Checklist

**Files:**
- Create: `components/task-item.tsx`, `components/media-player.tsx`, `app/area/[id]/page.tsx`
- Test: `__tests__/components/task-item.test.tsx`

- [ ] **Step 1: Write task item test**

Create `__tests__/components/task-item.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TaskItem } from '@/components/task-item'

describe('TaskItem', () => {
  const baseTask = {
    id: 'herd',
    title: 'Herd reinigen',
    description: 'Alle Platten abwischen.',
    media: [],
  }

  it('renders task title', () => {
    render(
      <TaskItem task={baseTask} status="current" onToggle={() => {}} />
    )
    expect(screen.getByText('Herd reinigen')).toBeDefined()
  })

  it('shows description when current', () => {
    render(
      <TaskItem task={baseTask} status="current" onToggle={() => {}} />
    )
    expect(screen.getByText('Alle Platten abwischen.')).toBeDefined()
  })

  it('shows strikethrough when completed', () => {
    const { container } = render(
      <TaskItem task={baseTask} status="completed" onToggle={() => {}} />
    )
    const title = container.querySelector('.line-through')
    expect(title).toBeDefined()
  })

  it('calls onToggle when checkbox clicked', () => {
    const onToggle = vi.fn()
    render(
      <TaskItem task={baseTask} status="current" onToggle={onToggle} />
    )
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith('herd')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/task-item.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Implement MediaPlayer**

Create `components/media-player.tsx`:

```tsx
import type { MediaItem } from '@/lib/types'

interface MediaPlayerProps {
  items: MediaItem[]
}

export function MediaPlayer({ items }: MediaPlayerProps) {
  if (items.length === 0) return null

  return (
    <div className="flex flex-col gap-2 mt-2">
      {items.map((item) => (
        <div
          key={item.url}
          className="border border-gray-200 bg-gray-50 p-2"
        >
          {item.type === 'video' ? (
            <video
              src={item.url}
              controls
              className="w-full"
              preload="metadata"
            >
              <track kind="captions" />
            </video>
          ) : (
            <img src={item.url} alt={item.label} className="w-full" />
          )}
          <p className="text-[10px] text-gray-500 mt-1">{item.label}</p>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Implement TaskItem**

Create `components/task-item.tsx`:

```tsx
'use client'

import type { Task } from '@/lib/types'
import { MediaPlayer } from './media-player'

interface TaskItemProps {
  task: Task
  status: 'completed' | 'current' | 'upcoming'
  onToggle: (taskId: string) => void
}

export function TaskItem({ task, status, onToggle }: TaskItemProps) {
  const isExpanded = status === 'current'

  return (
    <div
      className={`border p-3 ${
        status === 'current'
          ? 'border-2 border-black'
          : status === 'completed'
            ? 'border-gray-200 bg-gray-50'
            : 'border-gray-200'
      }`}
    >
      <div className="flex items-center gap-2">
        <button
          role="checkbox"
          aria-checked={status === 'completed'}
          onClick={() => onToggle(task.id)}
          className={`w-4 h-4 flex-shrink-0 border-2 flex items-center justify-center ${
            status === 'completed'
              ? 'bg-black border-black text-white'
              : 'border-black'
          }`}
        >
          {status === 'completed' && (
            <span className="text-[10px]">✓</span>
          )}
        </button>
        <span
          className={`text-xs font-semibold ${
            status === 'completed'
              ? 'line-through text-gray-400'
              : 'text-black'
          }`}
        >
          {task.title}
        </span>
      </div>

      {isExpanded && (
        <div className="ml-6 mt-2">
          {task.description && (
            <p className="text-[10px] text-gray-600 leading-relaxed">
              {task.description}
            </p>
          )}
          <MediaPlayer items={task.media} />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run __tests__/components/task-item.test.tsx
```

Expected: all 4 tests PASS

- [ ] **Step 6: Create area page**

Create `app/area/[id]/page.tsx`:

```tsx
'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import type { AreaFile } from '@/lib/types'
import { TaskItem } from '@/components/task-item'
import { ProgressBar } from '@/components/progress-bar'

export default function AreaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [area, setArea] = useState<AreaFile | null>(null)
  const [completed, setCompleted] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch(`/api/areas/${id}`)
      .then((res) => res.json())
      .then(setArea)
  }, [id])

  useEffect(() => {
    const stored = localStorage.getItem(`progress-${id}`)
    if (stored) {
      setCompleted(new Set(JSON.parse(stored)))
    }
  }, [id])

  useEffect(() => {
    if (completed.size > 0) {
      localStorage.setItem(
        `progress-${id}`,
        JSON.stringify([...completed])
      )
    }
  }, [completed, id])

  if (!area) {
    return (
      <div className="text-xs text-gray-400">Laden...</div>
    )
  }

  const toggleTask = (taskId: string) => {
    setCompleted((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }

  const currentIndex = area.tasks.findIndex((t) => !completed.has(t.id))

  return (
    <div>
      <Link
        href="/"
        className="text-[10px] text-gray-400 hover:text-gray-600"
      >
        ← zurück
      </Link>

      <h1 className="font-bold text-sm text-black mt-2">
        {area.emoji} {area.name}
      </h1>

      <div className="mt-3 mb-4">
        <ProgressBar
          total={area.tasks.length}
          completed={completed.size}
        />
      </div>

      <div className="flex flex-col gap-2">
        {area.tasks.map((task, i) => {
          let status: 'completed' | 'current' | 'upcoming'
          if (completed.has(task.id)) {
            status = 'completed'
          } else if (i === currentIndex) {
            status = 'current'
          } else {
            status = 'upcoming'
          }

          return (
            <TaskItem
              key={task.id}
              task={task}
              status={status}
              onToggle={toggleTask}
            />
          )
        })}
      </div>

      {completed.size === area.tasks.length && (
        <div className="mt-4 text-center">
          <Link
            href="/signoff"
            className="inline-block border-2 border-black px-4 py-2 text-xs font-semibold hover:bg-black hover:text-white transition-colors"
          >
            Alle erledigt — Abreise bestätigen
          </Link>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Verify visually**

```bash
npm run dev
```

Open http://localhost:3000, tap "Küche" — should see focus checklist with progress bar, expanded current task, checkbox toggling.

- [ ] **Step 8: Commit**

```bash
git add components/task-item.tsx components/media-player.tsx app/area/ __tests__/components/task-item.test.tsx
git commit -m "feat: add area view with focus checklist, progress bar, task toggling"
```

---

## Task 10: Sign-off Screen

**Files:**
- Create: `app/signoff/page.tsx`

- [ ] **Step 1: Create sign-off page**

Create `app/signoff/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function SignoffPage() {
  const [name, setName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('checkout-name') || ''
    }
    return ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSubmitting(true)

    localStorage.setItem('checkout-name', name)

    let totalCompleted = 0
    let totalTasks = 0

    const areasRes = await fetch('/api/areas')
    const areas = await areasRes.json()

    for (const area of areas) {
      const areaRes = await fetch(`/api/areas/${area.id}`)
      const areaData = await areaRes.json()
      const stored = localStorage.getItem(`progress-${area.id}`)
      const completed = stored ? JSON.parse(stored) : []
      totalCompleted += completed.length
      totalTasks += areaData.tasks.length
    }

    await fetch('/api/checkouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        tasksCompleted: totalCompleted,
        tasksTotal: totalTasks,
      }),
    })

    for (const area of areas) {
      localStorage.removeItem(`progress-${area.id}`)
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="text-center mt-12">
        <p className="text-sm font-semibold">Danke, {name}!</p>
        <p className="text-[10px] text-gray-400 mt-2">
          Abreise wurde erfasst.
        </p>
        <Link
          href="/"
          className="inline-block mt-6 border border-gray-300 px-4 py-2 text-[10px] text-gray-500 hover:border-gray-400"
        >
          Zurück zum Start
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        href="/"
        className="text-[10px] text-gray-400 hover:text-gray-600"
      >
        ← zurück
      </Link>

      <h1 className="text-xs font-bold tracking-[3px] uppercase mt-4">
        Abreise bestätigen
      </h1>
      <p className="text-[10px] text-gray-400 mt-1">
        Bitte mit deinem Namen unterschreiben.
      </p>

      <div className="mt-6">
        <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">
          Dein Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name eingeben"
          className="w-full border-2 border-black px-3 py-2 text-sm font-mono focus:outline-none"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!name.trim() || submitting}
        className="w-full mt-4 border-2 border-black px-4 py-3 text-xs font-semibold uppercase tracking-wider hover:bg-black hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {submitting ? 'Wird gespeichert...' : 'Abreise bestätigen'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verify visually**

```bash
npm run dev
```

Open http://localhost:3000/signoff — should see name input and confirm button.

- [ ] **Step 3: Commit**

```bash
git add app/signoff/
git commit -m "feat: add sign-off screen with name input and checkout logging"
```

---

## Task 11: Checkout Log Screen

**Files:**
- Create: `app/log/page.tsx`

- [ ] **Step 1: Create log page**

Create `app/log/page.tsx`:

```tsx
import Link from 'next/link'
import { getCheckouts } from '@/lib/content'

export const dynamic = 'force-dynamic'

export default async function LogPage() {
  const checkouts = await getCheckouts()
  const sorted = [...checkouts].reverse()

  return (
    <div>
      <Link
        href="/"
        className="text-[10px] text-gray-400 hover:text-gray-600"
      >
        ← zurück
      </Link>

      <h1 className="text-xs font-bold tracking-[3px] uppercase mt-4">
        Letzte Abreisen
      </h1>

      {sorted.length === 0 ? (
        <p className="text-[10px] text-gray-400 mt-4">
          Noch keine Abreisen erfasst.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {sorted.map((entry, i) => (
            <div
              key={i}
              className="border border-gray-200 p-3 flex justify-between items-center"
            >
              <div>
                <div className="text-xs font-semibold">{entry.name}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {new Date(entry.date).toLocaleDateString('de-DE', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </div>
              <div className="text-[10px] text-gray-500">
                {entry.tasksCompleted}/{entry.tasksTotal}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify visually**

```bash
npm run dev
```

Open http://localhost:3000/log — should show "Noch keine Abreisen erfasst."

- [ ] **Step 3: Commit**

```bash
git add app/log/
git commit -m "feat: add checkout log screen showing past sign-offs"
```

---

## Task 12: Edit Mode — Provider and Editable Fields

**Files:**
- Create: `components/edit-mode-provider.tsx`, `components/editable-text.tsx`

- [ ] **Step 1: Create edit mode context provider**

Create `components/edit-mode-provider.tsx`:

```tsx
'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface EditModeContextValue {
  isEditing: boolean
  authorName: string
  toggleEditing: () => void
}

const EditModeContext = createContext<EditModeContextValue>({
  isEditing: false,
  authorName: '',
  toggleEditing: () => {},
})

export function useEditMode() {
  return useContext(EditModeContext)
}

export function EditModeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [authorName, setAuthorName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('edit-author') || ''
    }
    return ''
  })

  const toggleEditing = useCallback(() => {
    if (!isEditing) {
      const stored =
        typeof window !== 'undefined'
          ? localStorage.getItem('edit-author') || ''
          : ''
      if (!stored) {
        const name = prompt('Dein Name (für das Änderungsprotokoll):')
        if (!name) return
        localStorage.setItem('edit-author', name)
        setAuthorName(name)
      } else {
        setAuthorName(stored)
      }
    }
    setIsEditing((prev) => !prev)
  }, [isEditing])

  return (
    <EditModeContext.Provider value={{ isEditing, authorName, toggleEditing }}>
      {children}
    </EditModeContext.Provider>
  )
}
```

- [ ] **Step 2: Create editable text component**

Create `components/editable-text.tsx`:

```tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useEditMode } from './edit-mode-provider'

interface EditableTextProps {
  value: string
  onSave: (newValue: string) => void
  as?: 'span' | 'p' | 'div'
  className?: string
  multiline?: boolean
}

export function EditableText({
  value,
  onSave,
  as: Tag = 'span',
  className = '',
  multiline = false,
}: EditableTextProps) {
  const { isEditing } = useEditMode()
  const [localValue, setLocalValue] = useState(value)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  if (!isEditing) {
    return <Tag className={className}>{value}</Tag>
  }

  const handleBlur = () => {
    if (localValue !== value) {
      onSave(localValue)
    }
  }

  if (multiline) {
    return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        className={`${className} w-full border border-gray-300 px-1 py-0.5 focus:outline-none focus:border-black bg-white`}
        rows={3}
      />
    )
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      className={`${className} border border-gray-300 px-1 py-0.5 focus:outline-none focus:border-black bg-white`}
    />
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/edit-mode-provider.tsx components/editable-text.tsx
git commit -m "feat: add edit mode context provider and inline editable text component"
```

---

## Task 13: Wire Edit Mode Into Pages

**Files:**
- Modify: `app/layout.tsx`, `app/page.tsx`, `app/area/[id]/page.tsx`
- Create: `components/edit-toggle.tsx`, `components/media-upload.tsx`

- [ ] **Step 1: Create edit toggle button**

Create `components/edit-toggle.tsx`:

```tsx
'use client'

import { useEditMode } from './edit-mode-provider'

export function EditToggle() {
  const { isEditing, toggleEditing } = useEditMode()

  return (
    <button
      onClick={toggleEditing}
      className={`fixed bottom-4 right-4 w-10 h-10 flex items-center justify-center border-2 z-50 ${
        isEditing
          ? 'border-black bg-black text-white'
          : 'border-gray-300 bg-white text-gray-400 hover:border-gray-400'
      }`}
      aria-label={isEditing ? 'Bearbeitung beenden' : 'Bearbeiten'}
    >
      <span className="text-sm">{isEditing ? '✕' : '✎'}</span>
    </button>
  )
}
```

- [ ] **Step 2: Create media upload component**

Create `components/media-upload.tsx`:

```tsx
'use client'

import { useEditMode } from './edit-mode-provider'

interface MediaUploadProps {
  onUploaded: (url: string, type: 'image' | 'video', filename: string) => void
}

export function MediaUpload({ onUploaded }: MediaUploadProps) {
  const { isEditing } = useEditMode()

  if (!isEditing) return null

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/media', { method: 'POST', body: formData })
    const data = await res.json()

    const type = file.type.startsWith('video/') ? 'video' : 'image'
    onUploaded(data.url, type, data.filename)
  }

  return (
    <label className="block mt-2 border border-dashed border-gray-300 p-2 text-center text-[10px] text-gray-400 cursor-pointer hover:border-gray-500">
      + Foto / Video hinzufügen
      <input
        type="file"
        accept="image/*,video/*"
        onChange={handleUpload}
        className="hidden"
      />
    </label>
  )
}
```

- [ ] **Step 3: Wrap layout with EditModeProvider**

Update `app/layout.tsx` — wrap `{children}` with providers:

```tsx
import type { Metadata, Viewport } from 'next'
import { EditModeProvider } from '@/components/edit-mode-provider'
import { EditToggle } from '@/components/edit-toggle'
import './globals.css'

export const metadata: Metadata = {
  title: 'Abreise — Haus Döschnitz',
  description: 'Checkout-Checkliste für Haus Döschnitz',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-mono bg-white text-black antialiased">
        <EditModeProvider>
          <main className="max-w-md mx-auto px-4 py-6">
            {children}
          </main>
          <EditToggle />
        </EditModeProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Update area page with edit capabilities**

Update `app/area/[id]/page.tsx` — add inline editing for task title and description. Add the `useEditMode` hook and `EditableText` + `MediaUpload` components. In `toggleTask`, keep existing logic. Add save handlers that call `PUT /api/areas/[id]/tasks/[taskId]`:

```tsx
'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import type { AreaFile, Task } from '@/lib/types'
import { TaskItem } from '@/components/task-item'
import { ProgressBar } from '@/components/progress-bar'
import { useEditMode } from '@/components/edit-mode-provider'
import { EditableText } from '@/components/editable-text'
import { MediaUpload } from '@/components/media-upload'

export default function AreaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { isEditing, authorName } = useEditMode()
  const [area, setArea] = useState<AreaFile | null>(null)
  const [completed, setCompleted] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch(`/api/areas/${id}`)
      .then((res) => res.json())
      .then(setArea)
  }, [id])

  useEffect(() => {
    const stored = localStorage.getItem(`progress-${id}`)
    if (stored) {
      setCompleted(new Set(JSON.parse(stored)))
    }
  }, [id])

  useEffect(() => {
    if (completed.size > 0) {
      localStorage.setItem(
        `progress-${id}`,
        JSON.stringify([...completed])
      )
    }
  }, [completed, id])

  if (!area) {
    return <div className="text-xs text-gray-400">Laden...</div>
  }

  const toggleTask = (taskId: string) => {
    setCompleted((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }

  const saveTask = async (taskId: string, updates: Partial<Task>) => {
    await fetch(`/api/areas/${id}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updates, author: authorName }),
    })
    const res = await fetch(`/api/areas/${id}`)
    setArea(await res.json())
  }

  const addTask = async () => {
    const res = await fetch(`/api/areas/${id}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Neue Aufgabe',
        description: '',
        author: authorName,
      }),
    })
    if (res.ok) {
      const areaRes = await fetch(`/api/areas/${id}`)
      setArea(await areaRes.json())
    }
  }

  const deleteTask = async (taskId: string) => {
    await fetch(`/api/areas/${id}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: authorName }),
    })
    const res = await fetch(`/api/areas/${id}`)
    setArea(await res.json())
  }

  const addMedia = async (
    taskId: string,
    url: string,
    type: 'image' | 'video',
    filename: string
  ) => {
    const task = area.tasks.find((t) => t.id === taskId)
    if (!task) return
    const updatedMedia = [...task.media, { type, url, label: filename }]
    await saveTask(taskId, { media: updatedMedia })
  }

  const currentIndex = area.tasks.findIndex((t) => !completed.has(t.id))

  return (
    <div>
      <Link
        href="/"
        className="text-[10px] text-gray-400 hover:text-gray-600"
      >
        ← zurück
      </Link>

      <h1 className="font-bold text-sm text-black mt-2">
        {area.emoji} {area.name}
      </h1>

      <div className="mt-3 mb-4">
        <ProgressBar
          total={area.tasks.length}
          completed={completed.size}
        />
      </div>

      <div className="flex flex-col gap-2">
        {area.tasks.map((task, i) => {
          let status: 'completed' | 'current' | 'upcoming'
          if (completed.has(task.id)) {
            status = 'completed'
          } else if (i === currentIndex) {
            status = 'current'
          } else {
            status = 'upcoming'
          }

          return (
            <div key={task.id}>
              {isEditing ? (
                <div className="border-2 border-dashed border-gray-300 p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <EditableText
                        value={task.title}
                        onSave={(v) => saveTask(task.id, { title: v })}
                        className="text-xs font-semibold text-black"
                      />
                      <EditableText
                        value={task.description}
                        onSave={(v) =>
                          saveTask(task.id, { description: v })
                        }
                        as="p"
                        className="text-[10px] text-gray-600 mt-1"
                        multiline
                      />
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-[10px] text-red-400 hover:text-red-600 ml-2"
                    >
                      ✕
                    </button>
                  </div>
                  <MediaUpload
                    onUploaded={(url, type, filename) =>
                      addMedia(task.id, url, type, filename)
                    }
                  />
                </div>
              ) : (
                <TaskItem
                  task={task}
                  status={status}
                  onToggle={toggleTask}
                />
              )}
            </div>
          )
        })}
      </div>

      {isEditing && (
        <button
          onClick={addTask}
          className="w-full mt-2 border border-dashed border-gray-300 p-3 text-[10px] text-gray-400 hover:border-gray-500 hover:text-gray-600"
        >
          + Aufgabe hinzufügen
        </button>
      )}

      {!isEditing && completed.size === area.tasks.length && area.tasks.length > 0 && (
        <div className="mt-4 text-center">
          <Link
            href="/signoff"
            className="inline-block border-2 border-black px-4 py-2 text-xs font-semibold hover:bg-black hover:text-white transition-colors"
          >
            Alle erledigt — Abreise bestätigen
          </Link>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Verify visually**

```bash
npm run dev
```

Open http://localhost:3000, tap pencil icon in bottom right — edit mode should activate. Tap into an area, fields should become editable.

- [ ] **Step 6: Commit**

```bash
git add components/edit-toggle.tsx components/media-upload.tsx app/layout.tsx app/page.tsx app/area/
git commit -m "feat: wire edit mode into layout, area pages with inline editing"
```

---

## Task 14: PWA / Service Worker Setup

**Files:**
- Modify: `next.config.ts`, `package.json`
- Create: `app/sw.ts`

- [ ] **Step 1: Install Serwist**

```bash
npm install @serwist/next
npm install -D serwist
```

- [ ] **Step 2: Create service worker**

Create `app/sw.ts`:

```typescript
import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
})

serwist.addEventListeners()
```

- [ ] **Step 3: Update next.config.ts**

Replace `next.config.ts`:

```typescript
import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
})

const nextConfig = {}

export default withSerwist(nextConfig)
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: builds successfully, `public/sw.js` is generated.

- [ ] **Step 5: Commit**

```bash
git add app/sw.ts next.config.ts package.json package-lock.json
git commit -m "feat: add PWA service worker with Serwist for offline support"
```

---

## Task 15: Coolify Deployment Setup

**Files:**
- Create: `Dockerfile`, `.dockerignore`

- [ ] **Step 1: Create Dockerfile**

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

COPY --from=builder /app/content ./content

RUN mkdir -p /app/data && chown nextjs:nodejs /app/data
RUN mkdir -p /app/public/media && chown nextjs:nodejs /app/public/media

ENV CONTENT_DIR=/app/content
ENV DATA_DIR=/app/data
ENV MEDIA_DIR=/app/public/media

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

- [ ] **Step 2: Create .dockerignore**

Create `.dockerignore`:

```
node_modules
.next
.git
.superpowers
docs
__tests__
```

- [ ] **Step 3: Enable standalone output**

Update `next.config.ts` to add `output: 'standalone'`:

```typescript
import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
})

const nextConfig = {
  output: 'standalone',
}

export default withSerwist(nextConfig)
```

- [ ] **Step 4: Verify Docker build**

```bash
docker build -t doeschnitz-checkout .
```

Expected: builds successfully.

- [ ] **Step 5: Commit**

```bash
git add Dockerfile .dockerignore next.config.ts
git commit -m "feat: add Dockerfile and standalone output for Coolify deployment"
```

---

## Task 16: Home Page — Client-Side Progress Tracking

**Files:**
- Modify: `app/page.tsx`

The home screen currently shows `completedCount={0}` for all areas. It needs to read localStorage progress and pass it to area cards. Since localStorage requires client-side code, convert the home page to a client component that fetches areas from the API.

- [ ] **Step 1: Convert home page to client component**

Replace `app/page.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { AreaCard } from '@/components/area-card'
import Link from 'next/link'
import type { AreaIndexItem, AreaFile } from '@/lib/types'

interface AreaWithProgress {
  id: string
  name: string
  emoji: string
  taskCount: number
  completedCount: number
}

export default function Home() {
  const [areas, setAreas] = useState<AreaWithProgress[]>([])

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/areas')
      const index: AreaIndexItem[] = await res.json()

      const withProgress = await Promise.all(
        index
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(async (area) => {
            const areaRes = await fetch(`/api/areas/${area.id}`)
            const full: AreaFile = await areaRes.json()
            const stored = localStorage.getItem(`progress-${area.id}`)
            const completed = stored ? JSON.parse(stored) : []
            return {
              id: area.id,
              name: area.name,
              emoji: area.emoji,
              taskCount: full.tasks.length,
              completedCount: completed.length,
            }
          })
      )
      setAreas(withProgress)
    }
    load()
  }, [])

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xs font-bold tracking-[3px] uppercase">
          Abreise
        </h1>
        <p className="text-[10px] text-gray-400 tracking-wider uppercase mt-1">
          Haus Döschnitz
        </p>
      </header>

      <div className="flex flex-col gap-2">
        {areas.map((area) => (
          <AreaCard
            key={area.id}
            id={area.id}
            name={area.name}
            emoji={area.emoji}
            taskCount={area.taskCount}
            completedCount={area.completedCount}
          />
        ))}
      </div>

      <footer className="mt-8 text-center">
        <Link
          href="/log"
          className="text-[10px] text-gray-400 hover:text-gray-600 uppercase tracking-wider"
        >
          Letzte Abreisen
        </Link>
      </footer>
    </div>
  )
}
```

- [ ] **Step 2: Verify visually**

```bash
npm run dev
```

Open http://localhost:3000, complete some tasks in an area, go back — progress should be reflected on the home cards.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add client-side progress tracking to home screen area cards"
```

---

## Task 17: Final Integration Test

**Files:** None new — run existing tests and verify end-to-end.

- [ ] **Step 1: Run all tests**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: builds successfully with no errors.

- [ ] **Step 3: Manual walkthrough**

```bash
npm run dev
```

Walk through the full flow:
1. Open http://localhost:3000 — see area cards
2. Tap "Küche" — see focus checklist with progress bar
3. Complete all tasks — "Abreise bestätigen" button appears
4. Go to sign-off, enter name, confirm
5. Check /log — sign-off appears
6. Tap pencil icon — edit mode activates, fields become editable
7. Edit a task title, check it saves

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final integration verification"
```
