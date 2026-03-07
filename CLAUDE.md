# Prototype Playground

## Project Overview

A Next.js 16 prototype playground built with Tailwind CSS v4 and TypeScript.
Multiple designers share this repo, each with their own namespace folder for prototypes.

## Tech Stack

- Next.js 16.1.6 (App Router, Turbopack)
- TypeScript 5
- Tailwind CSS v4 (CSS-first `@theme` config)
- React 19
- DaisyUI 5 (component classes via `@plugin "daisyui"`)
- Utilities: clsx + tailwind-merge (via `cn()` helper)

## Project Structure

```
src/
  app/
    layout.tsx                  # Root layout with Geist fonts
    page.tsx                    # Homepage - auto-discovers prototypes
    globals.css                 # Tailwind v4 theme tokens
    prototypes/[designer]/[prototype]/page.tsx  # Dynamic prototype routes
  components/
    ui/                         # Shared UI: Button, Card, Input, Badge
      index.ts                  # Barrel export
    icons/                      # SVG icon components (Icon component with name prop)
    layout/                     # PrototypeFrame (wraps prototypes with nav bar)
    home/                       # Homepage components (PrototypeCard, DesignerSection, ExternalLinkCard)
  lib/
    types.ts                    # PrototypeMeta, Prototype, ExternalPrototype, DesignerGroup
    utils.ts                    # cn(), formatDate(), displayName()
    discovery.ts                # Filesystem scanner for auto-discovering prototypes
  prototypes/                   # All prototype content lives here
    _template/                  # Template for new prototypes
    _external.json              # External prototype links (Figma, V0, etc.)
    <designer-name>/            # Designer namespace (freeform name, kebab-case)
      <prototype-slug>/         # Prototype folder (kebab-case)
        meta.json               # Required metadata
        page.tsx                # Main component (default export)
        components/             # Optional local components
```

## Creating a Prototype

Each prototype needs two files minimum:

### meta.json

```json
{
  "title": "Human Readable Title",
  "description": "Brief description of what this prototype demonstrates.",
  "author": "designer-name",
  "date": "YYYY-MM-DD",
  "tags": ["tag1", "tag2"],
  "status": "in-progress"
}
```

Status values: `"in-progress"`, `"complete"`, `"archived"`

### page.tsx

```tsx
"use client";

import { Button, Card, Input, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function MyPrototype() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-secondary p-8">
      {/* Prototype content */}
    </div>
  );
}
```

### Naming Convention

- Designer folder: freeform kebab-case (e.g., `aj-siegel`, `jane-doe`)
- Prototype folder: kebab-case from title (e.g., "Onboarding Flow" → `onboarding-flow`)
- If a feature request doesn't specify a designer, use `claude-bot` as the designer name

## DaisyUI Components

DaisyUI 5 is available globally via `@plugin "daisyui"` in globals.css. Use DaisyUI component classes directly in JSX — no imports needed. Choose components contextually based on what you're building. See https://daisyui.com/components/ for the full reference.

Examples: `btn`, `card`, `input`, `modal`, `drawer`, `tabs`, `navbar`, `alert`, `badge`, `table`, `toggle`, `select`, `textarea`, `collapse`, `stat`, `hero`, `tooltip`, `dropdown`, `swap`.

Use DaisyUI modifier classes for variants (e.g., `btn-primary`, `btn-ghost`, `card-compact`, `input-bordered`).

## Legacy Shared UI Components

Import from `@/components/ui` (these predate DaisyUI — prefer DaisyUI classes for new prototypes):

- **Button** — variants: `primary` (default), `secondary`, `ghost`, `destructive`; sizes: `sm`, `md`, `lg`
- **Card** — container with border, rounded corners, and shadow
- **Input** — styled text input with focus ring
- **Badge** — variants: `default`, `subtle`, `status`

All accept standard HTML attributes plus `className` for overrides.

## Tailwind CSS v4 Theme Tokens

Always use theme tokens instead of raw colors:

- Backgrounds: `bg-bg`, `bg-bg-secondary`, `bg-bg-tertiary`
- Text: `text-text-primary`, `text-text-secondary`, `text-text-tertiary`
- Borders: `border-border`, `border-border-hover`
- Accent: `text-accent`, `bg-accent`, `bg-accent-hover`, `bg-accent-light`
- Tags: `bg-tag-blue`, `bg-tag-green`, `bg-tag-purple`, `bg-tag-orange`, `bg-tag-pink`
- Shadows: `shadow-card`, `shadow-card-hover`
- Fonts: `font-sans`, `font-mono`

## Rules

1. Always use `"use client"` for prototypes with interactivity (useState, useEffect, onClick, etc.)
2. Always default export the main prototype component from page.tsx
3. Never modify the discovery system, routing, or layout components
4. Never install new packages without explicit approval
5. Always run `npm run build` after implementation to verify no errors
6. Follow existing patterns — reference `src/prototypes/example-designer/counter-demo/`
7. Use `cn()` from `@/lib/utils` for className merging
8. Keep prototypes self-contained — each should work independently
9. Use semantic HTML and ensure basic accessibility
10. Prototypes should work on both desktop and mobile viewports
