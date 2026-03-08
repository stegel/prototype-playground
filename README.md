# Prototype Playground

A shared Next.js prototyping environment where multiple designers can create, share, and get feedback on interactive prototypes. Built with Next.js 16, Tailwind CSS v4, DaisyUI 5, and TypeScript.

## Table of Contents

- [Getting Started](#getting-started)
- [Integration Setup](#integration-setup)
  - [Vercel](#vercel)
  - [Upstash Redis](#upstash-redis)
  - [GitHub](#github)
  - [Notion](#notion)
  - [Pushover](#pushover-optional)
- [Creating a Prototype](#creating-a-prototype)
- [Other Scripts](#other-scripts)
- [Learn More](#learn-more)

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/stegel/prototype-playground.git
cd prototype-playground
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example env file:

```bash
cp .env.example .env
```

Then fill in each value as described below.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## Integration Setup

### Vercel

The project is deployed on [Vercel](https://vercel.com), which also manages environment variables and integrations.

1. Install the [Vercel CLI](https://vercel.com/docs/cli) if you don't have it:

```bash
npm i -g vercel
```

1. Link your local project to the Vercel project:

```bash
vercel link
```

1. Pull environment variables from Vercel into your local `.env`:

```bash
vercel env pull .env
```

This will populate most of the required variables. You can also manage env vars in the [Vercel Dashboard](https://vercel.com) under **Settings > Environment Variables**.

### Upstash Redis

Used for persistent storage: prototype comments, user credentials, and designer folder claims. Provisioned through Vercel's integration marketplace. Read more about [Upstash on Vercel](https://upstash.com/docs/redis/howto/vercelintegration)

1. In your [Vercel Dashboard](https://vercel.com), go to your project's **Storage** tab
2. Click **Create Database** and select **Upstash Redis** (KV)
3. Follow the prompts to create a free Redis database — Vercel will automatically add `KV_REST_API_URL` and `KV_REST_API_TOKEN` to your project's environment variables
4. Pull the new variables into your local `.env`:

```bash
vercel env pull .env
```

If you prefer to set it up manually, create a database at [console.upstash.com](https://console.upstash.com/) and add the REST credentials to your `.env`:

```ini
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=your-upstash-token
```

### GitHub

GitHub is used for two things: **OAuth login** and **automated PR creation** from the feature pipeline.

#### OAuth App (for user login)

1. Go to [github.com/settings/developers](https://github.com/settings/developers) and create a new **OAuth App**
2. Set the callback URL to `http://localhost:3000/api/auth/callback/github` (update for production)
3. Copy the Client ID and Client Secret into your `.env`:

```ini
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
```

1. Generate an auth secret for NextAuth session signing:

```bash
openssl rand -hex 32
```

```ini
AUTH_SECRET=your-generated-secret
```

#### Personal Access Token (for the pipeline)

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens) and create a fine-grained personal access token
2. Grant **Read and Write** access to **Pull requests** for the `prototype-playground` repo
3. Add to your `.env`:

```ini
GITHUB_TOKEN=github_pat_xxxxxxxxxxxx
GITHUB_OWNER=your-github-username
GITHUB_REPO=prototype-playground
```

### Notion

The feature pipeline polls a Notion database for feature requests and automates the build-and-PR workflow.

1. Create a [Notion integration](https://www.notion.so/my-integrations) and copy the Internal Integration Secret
2. Create a database (or use an existing one) with these properties:
   - **Title** (title) — Feature name
   - **Description** (rich text) — Feature details
   - **Priority** (select) — e.g. High, Medium, Low
   - **State** (status) — Must include: `Ready for dev`, `In progress`, `Review`, `Done`
   - **Project** (multi-select) — Must include `Prototype Playground`
3. Share the database with your integration
4. Copy the database ID from the URL (the 32-character hex string after the workspace name)
5. Add to your `.env`:

```ini
NOTION_TOKEN=ntn_xxxxxxxxxxxx
NOTION_DATABASE_ID=your-database-id
```

#### Pipeline workflow

The pipeline picks up Notion items with State = "Ready for dev" and Project = "Prototype Playground", implements them with Claude, creates a PR, and advances the state through `In progress` → `Review` → `Done`.

```bash
# Run once
npm run pipeline

# Watch mode (polls every POLL_INTERVAL seconds, default 300)
npm run pipeline:watch
```

### Pushover (optional)

Sends push notifications when the pipeline creates a PR or fails.

1. Sign up at [pushover.net](https://pushover.net/) and create an application
2. Add to your `.env`:

```ini
PUSHOVER_USER=your-user-key
PUSHOVER_TOKEN=your-app-token
```

---

## Creating a Prototype

This section walks you through creating a new prototype from scratch using Claude Code.

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed globally
- The repo cloned and dependencies installed (see **Getting Started** above)

### 1. Scaffold your prototype

Run the scaffolding script with your designer name and prototype title:

```bash
npm run new <designer-name> "<Prototype Name>"
```

For example:

```bash
npm run new aj.siegel "Onboarding Flow"
```

This generates files under `src/prototypes/<designer>/<prototype>/` based on the `_template/` folder — including a `meta.json`, `page.tsx`, and a local `CLAUDE.md`.

### 2. Launch Claude Code from the repo root

Always start Claude Code from the **repository root** (`prototype-playground/`), not from inside your prototype folder. The project-level `CLAUDE.md` gives Claude all the context it needs about the tech stack, conventions, and available components.

```bash
cd prototype-playground
claude
```

Then tell Claude what you want to build. Reference your prototype by path or name:

```text
Build out the prototype in src/prototypes/jane-doe/onboarding-flow based on this description: ...
```

### 3. Customize your prototype's local CLAUDE.md

Each scaffolded prototype gets its own `CLAUDE.md` at `src/prototypes/<designer>/<prototype>/CLAUDE.md`. This file is **prototype-scoped** — Claude reads it when working inside that folder, and it layers on top of the project-level instructions.

Use it to:

- Describe what the prototype does and what problem it explores
- Document which DaisyUI components you've chosen and why (e.g., "Use `drawer` for mobile nav, `tabs` for section switching")
- Note any prototype-specific constraints, Figma references, or design tokens
- Add conventions that differ from the project defaults

The template includes sections for overview, UI approach, component decisions, and notes. Fill this in as you iterate — it helps Claude make better decisions when you ask for changes later.

### 4. Verify your build

After Claude implements your prototype, always verify it compiles:

```bash
npm run build
```

Then preview it locally with `npm run dev` and navigate to `http://localhost:3000/prototypes/<designer>/<prototype>`.

---

## Other Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start dev server with auto-open |
| `npm run build` | Production build |
| `npm run new` | Scaffold a new prototype |
| `npm run pipeline` | Run the feature pipeline once |
| `npm run pipeline:watch` | Run the pipeline in watch mode |

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [DaisyUI Components](https://daisyui.com/components/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Upstash Redis](https://upstash.com/docs/redis/overall/getstarted)
