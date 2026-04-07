# Haus Döschnitz Checkout App — Design Spec

## Overview

A mobile-first PWA at `checkout.haus-doeschnitz.de` that guides members and guests through a structured checkout process when leaving Haus Döschnitz. The app provides area-based checklists with instructional media, inline content editing, and a sign-off log.

## Users

- **Verein members** (~30 people) — primary users, can also edit content
- **External guests** — follow the checkout process, no editing expected but not blocked
- **Last person leaving** — runs through the full checkout

No authentication. The app is publicly accessible via URL.

## Language

German UI and content throughout.

## Architecture

### Stack

- **Next.js 15 App Router** — React framework
- **PWA** — service worker for offline support (Serwist or next-pwa)
- **Coolify** — self-hosted deployment
- **JSON files on disk** — all content stored as flat files, read/written at runtime
- **No database** — filesystem only

### Content Storage

```
content/
  areas.json              # ordered list of areas
  areas/
    kueche.json           # tasks for Küche
    bad.json              # tasks for Bad
    heizung.json          # tasks for Heizung
    garten.json           # tasks for Garten
    ...
  media/                  # uploaded instructional photos/videos
    herd-reinigen.mp4
    ...
checkouts.json            # sign-off log (append-only)
changelog.json            # edit history log (append-only)
```

### Data Shapes

**areas.json**
```json
[
  { "id": "kueche", "name": "Küche", "emoji": "🍳", "sortOrder": 0 },
  { "id": "bad", "name": "Bad", "emoji": "🚿", "sortOrder": 1 }
]
```

**Area file (e.g., kueche.json)**
```json
{
  "id": "kueche",
  "name": "Küche",
  "emoji": "🍳",
  "tasks": [
    {
      "id": "herd",
      "title": "Herd & Ofen reinigen",
      "description": "Alle Platten abwischen. Backofen kontrollieren und ggf. reinigen.",
      "media": [
        { "type": "video", "url": "/media/herd-reinigen.mp4", "label": "Video: Herd reinigen" }
      ]
    }
  ]
}
```

**checkouts.json** (append-only)
```json
[
  { "name": "Julius", "date": "2026-04-07T14:00:00Z", "tasksCompleted": 18, "tasksTotal": 18 }
]
```

**changelog.json** (append-only)
```json
[
  {
    "timestamp": "2026-04-07T14:23:00Z",
    "author": "Julius",
    "area": "kueche",
    "action": "edit_task",
    "taskId": "herd",
    "changes": {
      "description": { "old": "Platten abwischen.", "new": "Alle Platten abwischen. Backofen kontrollieren." }
    }
  }
]
```

## UI Design

### Visual Style

- **White background**, clean and minimal
- **Monospace font** (JetBrains Mono or similar system monospace)
- **Square corners** (border-radius: 2px or 0)
- **Black and grey palette** — no bright color accents except green for completed state
- **Utilitarian/sharp** aesthetic — not playful, not corporate
- **Emojis** for area icons — adds warmth without being childish

### Screens

#### 1. Home — Area Cards

- Header: "ABREISE" (uppercase, small, tracked) + "HAUS DÖSCHNITZ" subtitle
- List of area cards, each showing:
  - Emoji + area name
  - Task count and estimated time
  - Progress indicator (e.g., "3/6")
- Tap a card to enter area view
- Small link to view past checkouts / sign-off log
- Edit button (pencil icon) to enter edit mode

#### 2. Area View — Focus Checklist

- Back button ("← zurück") + area name with emoji
- **Stepped progress bar** at the top — small horizontal segments, one per task, filled as completed
- **Current task expanded**: title, description, media (photo/video)
- **Completed tasks**: collapsed, strikethrough, lighter text
- **Upcoming tasks**: visible at full opacity, tappable to jump ahead
- Tap checkbox to complete a task, focus advances to next
- Media embedded inline — video player, images displayed within the task

#### 3. Sign-off Screen

- Appears after all areas completed (or accessible via button)
- Summary: total tasks completed
- Text input: "Dein Name"
- "Abreise bestätigen" button
- Confirmation message after signing

#### 4. Checkout Log

- Simple list of past sign-offs: name, date, tasks completed
- Accessible from home screen

### Inline Editing

- **Edit mode toggle**: pencil icon on home screen and area views
- In edit mode:
  - Area names, emojis become editable fields
  - Task titles and descriptions become text inputs
  - Media gets add/remove buttons (upload from phone camera or gallery)
  - Drag handles for reordering tasks and areas
  - Add/delete buttons for tasks and areas
- Save writes JSON to disk via API route — instant, no redeploy
- **Wiki-style**: any user can edit, no approval flow
- "Zuletzt bearbeitet von [Name], [Datum]" shown under edited content
- All changes logged to changelog.json with before/after values

### Edit Author

Editing is independent from checkout — members can edit content anytime without going through the checkout flow. When entering edit mode, the app prompts for a name (remembered in localStorage). This name is used for changelog attribution ("Zuletzt bearbeitet von ..."). The name prompt appears once per session (or when localStorage is cleared), not on every save.

## Offline / PWA

- **Service worker** caches app shell and all content JSON files on first load
- **Checklist progress** stored in localStorage per session
- **Offline editing**: changes queue in localStorage, sync to server when connectivity returns
- **Media caching**: progressive — videos cached on first view, images eagerly cached
- **Manifest**: installable as home screen app on mobile

## API Routes

All routes are Next.js API routes (App Router route handlers):

- `GET /api/areas` — list all areas
- `GET /api/areas/[id]` — get single area with tasks
- `PUT /api/areas/[id]` — update area (name, emoji, task order)
- `POST /api/areas` — create new area
- `DELETE /api/areas/[id]` — delete area
- `PUT /api/areas/[id]/tasks/[taskId]` — update task
- `POST /api/areas/[id]/tasks` — add task
- `DELETE /api/areas/[id]/tasks/[taskId]` — delete task
- `POST /api/media` — upload media file
- `DELETE /api/media/[filename]` — delete media file
- `POST /api/checkouts` — record sign-off
- `GET /api/checkouts` — list past checkouts
- `GET /api/changelog` — view edit history

## Non-Goals

- No user accounts or authentication
- No role-based permissions
- No approval workflow for edits
- No revert/undo UI for content changes
- No multi-language support (German only for now)
- No proof/photo upload during checkout (instructional media only)
- No notifications or reminders
