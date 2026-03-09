# Prototype Playground — Shell App

## Project Overview

The shell application for Prototype Playground. This repo provides the homepage, routing, authentication, theming, and layout chrome that wraps prototypes. Prototype content lives in a separate `prototypes-repo/` directory (git submodule or symlink) — this app discovers and renders those prototypes but does not contain them.

## Tech Stack

- Next.js 16.1.6 (App Router, Turbopack)
- TypeScript 5
- Tailwind CSS v4 (CSS-first `@theme` config)
- React 19
- DaisyUI 5 (component classes via `@plugin "daisyui"`)
- NextAuth v5 (GitHub + Credentials providers, Upstash Redis)
- Utilities: clsx + tailwind-merge (via `cn()` helper)

## Project Structure

```
src/
  app/
    layout.tsx                  # Root layout (Geist fonts, AuthSessionProvider, ThemeProvider)
    page.tsx                    # Homepage — auto-discovers prototypes from prototypes-repo
    globals.css                 # Tailwind v4 + DaisyUI plugin config (all 32 themes)
    prototypes/[designer]/[prototype]/page.tsx  # Dynamic route — loads prototype via dynamic import
    api/
      auth/[...nextauth]/       # NextAuth route handlers
      auth/register/            # Credentials registration
      comments/                 # Prototype comments API
      create-prototype/         # Prototype creation API
      designers/                # Designer listing API
      prototypes/[designer]/    # Prototype data API
      user/claim-folder/        # Designer folder claiming
    auth/
      signin/                   # Sign-in page
      claim-folder/             # Claim a designer folder
  components/
    auth/                       # AuthSessionProvider
    home/                       # Homepage: SearchHome, RecentFeed, PrototypeCard, DesignerSection, ExternalLinkCard
    icons/                      # Icon component (SVG icons by name)
    layout/                     # Shell chrome: PrototypeFrame, ThemeProvider, ThemeSelector, DarkModeToggle, UserMenu, CommentLayer
    ui/                         # Legacy shared UI: Button, Card, Input, Badge (barrel export via index.ts)
  lib/
    auth.ts                     # NextAuth config (GitHub + Credentials, JWT, Redis user mapping)
    discovery.ts                # Filesystem scanner — reads from prototypes-repo/src/prototypes/
    redis.ts                    # Upstash Redis client
    types.ts                    # PrototypeMeta, Prototype, ExternalPrototype, DesignerGroup, etc.
    utils.ts                    # cn(), formatDate(), displayName()
  prototypes/                   # Local prototypes (legacy, may still exist)
```

## How the Shell Works

### Prototype Discovery

`discovery.ts` scans `prototypes-repo/src/prototypes/` at build/request time:
- Reads `meta.json` from each `<designer>/<prototype>/` folder
- Also reads `_external.json` for external links (Figma, V0, etc.)
- Groups prototypes by designer and sorts by date
- `getRecentPrototypes()` provides the recent activity feed

### Dynamic Routing

`/prototypes/[designer]/[prototype]` uses `next/dynamic` to import prototype components from the `@prototypes/` path alias (mapped to `prototypes-repo/src/prototypes/`). Each prototype is wrapped in `PrototypeFrame` which provides the nav bar, back button, and comment layer.

### Authentication

NextAuth v5 with JWT sessions, backed by Upstash Redis:
- GitHub OAuth and email/password credentials
- Users can claim a designer folder via `/auth/claim-folder`
- Session includes `designerFolder` for ownership checks

### Theming

DaisyUI 5 with 32 themes enabled in `globals.css`. Theme switching via `ThemeProvider` + `ThemeSelector` in the header. Themes are applied via `data-theme` attribute on `<html>`.

## Rules

1. Never modify the discovery system, routing, or layout components without understanding the impact on prototype rendering
2. Never install new packages without explicit approval
3. Always run `npm run build` after changes to verify no errors
4. Use `cn()` from `@/lib/utils` for className merging
5. Use DaisyUI semantic color classes (`bg-base-100`, `text-base-content`, `bg-primary`, etc.) — never raw hex colors
6. Shell components must work across all 32 DaisyUI themes
7. Keep the shell lightweight — it should load fast and stay out of the prototype's way
