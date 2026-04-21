# Blockchain CCTV UI/UX Redesign

**Date:** 2026-04-21  
**Audience:** Law enforcement / Security Operations Center (SOC) teams  
**Approach:** Tailwind-only reskin — no new dependencies

---

## Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| bg-base | `#0f172a` | Page background |
| bg-panel | `#1e293b` | Cards, sidebar, panels |
| bg-panel-alt | `#263348` | Table row alternates, hover states |
| accent-blue | `#3b82f6` | Interactive elements, links, active states |
| accent-green | `#22c55e` | Success, connected, detecting |
| accent-amber | `#f59e0b` | Warnings, idle states |
| accent-red | `#ef4444` | Errors, violence alerts, stopped |
| text-primary | `#f1f5f9` | Headings, primary content |
| text-muted | `#94a3b8` | Secondary text, labels |
| border | `#334155` | Panel borders, dividers |

No neon. No gradients. Flat, professional.

---

## Layout & Navigation

- **Shell:** Full-height flex layout. Fixed left sidebar (240px) + scrollable main content.
- **Sidebar contents (top → bottom):**
  - Shield icon + "CCTV Blockchain" wordmark
  - Nav links: Dashboard, Record, Verify, AI Alerts — each with an SVG icon
  - Active state: left accent bar (4px, blue) + `bg-panel-alt` background
  - Bottom: WebSocket connection dot (green=connected, red=disconnected) + label
- **Main content:** `bg-base` background, `px-8 py-6` padding, max-width container.
- **Typography:** Inter or system-ui. Headings white, body `text-muted`, code monospace.

---

## Dashboard Page

- **Stat cards row (3 cards):** Total Records · Latest Block · Cameras Active  
  Each card: `bg-panel`, icon (muted), large white number, muted label below.
- **Evidence table:**
  - Header: `bg-base`, uppercase muted labels
  - Rows: alternate `bg-panel` / `bg-panel-alt`, hover highlight
  - Hash/address cells: monospace code chip, copy icon on hover
  - Block number: muted blue pill badge
  - Timestamp: muted text
- **Refresh button:** Steel-blue outlined, spinning icon while loading, top-right of table header.
- **Empty state:** Centered chain/lock SVG icon + muted "No evidence records" text.

---

## Alerts Page

- **Status panel (4 stat cards):** Status · Camera ID · Buffer · FPS  
  Status value: green ("Detecting") / amber ("Idle") / red ("Stopped")
- **Control buttons:**
  - Start Detection: solid green
  - Stop Detection: red outlined
  - Test Recording: blue outlined
  - Disabled state: 40% opacity + `cursor-not-allowed`
- **Alert feed (each alert card):**
  - `bg-panel` card with colored left border (4px): red=violence, amber=anomaly, blue=recording
  - SVG icon (warning triangle / camera / info circle — no emojis)
  - Alert type: bold, capitalized
  - Message: `text-muted` body text
  - Confidence: small horizontal progress bar (color matches border)
  - Timestamp: muted, small, right-aligned
  - Hash/TX footer (if present): monospace code block, `bg-base`, subtle
- **Empty state:** Centered camera SVG + "Monitoring inactive. Start detection to begin." text.
- **Connection dot:** Moved to sidebar bottom — always visible across all pages.

---

## Record Page

- **Layout:** Single column, max-width centered (640px).
- **File drop zone:** Dashed border (`border-slate-600`), dark panel bg, upload SVG icon, "Click to upload or drag and drop" text. On file selected: solid border + file name + size.
- **Hash preview:** Appears below drop zone in a `bg-panel` code block with "SHA-256 (client-side)" label in muted text.
- **Camera ID input:** Dark styled input (`bg-base`, `border-slate-600`, white text, blue focus ring).
- **Submit button:** Full-width, solid blue, "Recording to Blockchain…" spinner state.
- **Success card:** Green-bordered `bg-panel` card, "Evidence Recorded" heading, key-value list for videoHash, txHash, blockNumber, cameraId, timestamp.
- **Error:** Red inline banner — no browser `alert()` calls.

---

## Verify Page

- **Drop zone:** Same style as Record. Transitions: gray → blue (dragging) → green (file loaded) → green/red (result).
- **Hash preview:** `bg-panel` code block below drop zone.
- **Action buttons:** "Verify on Blockchain" (blue solid, full-flex) + "Reset" (slate outlined).
- **Result card:**
  - Verified: green-bordered card, bold "VERIFIED" badge + "Evidence found on blockchain"
  - Not found: red-bordered card, bold "NOT FOUND" badge
  - Evidence details: clean key-value list (videoHash, cameraId, recorded at, block #, uploader)

---

## Components Shared Across Pages

- **Stat card:** `bg-panel` + border + icon + number + label
- **Code chip:** `bg-base` + monospace font + `px-2 py-0.5 rounded`
- **Status badge/pill:** Colored bg + matching text, small rounded-full
- **Inline error banner:** `bg-red-900/40 border border-red-500 text-red-300`
- **Page heading:** `text-2xl font-bold text-slate-100`

---

## Out of Scope

- Animations / transitions (Framer Motion)
- New npm dependencies
- Mobile-first responsive breakpoints (desktop-first is fine for SOC use)
- Dark/light mode toggle
