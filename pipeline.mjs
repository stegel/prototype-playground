#!/usr/bin/env node

/**
 * Notion → Claude Code → Gitea PR Pipeline
 *
 * Polls Notion for feature requests with State="Ready", runs Claude Code
 * to implement each one, then creates a PR on Gitea for review.
 *
 * Usage:
 *   npm run pipeline          # single poll
 *   npm run pipeline:watch    # poll every 5 minutes
 *
 * Required env vars (put in .env):
 *   NOTION_TOKEN        - Notion internal integration token
 *   NOTION_DATABASE_ID  - Feature Requests database ID
 *   GITEA_URL           - Gitea base URL (e.g. https://git.ajsiegel.com)
 *   GITEA_TOKEN         - Gitea API token
 *   GITEA_OWNER         - Gitea repo owner (e.g. stegel)
 *   GITEA_REPO          - Gitea repo name (e.g. prototype-playground)
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// ── Load .env manually (avoid extra dependency) ─────────────────────────────
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

// ── Config ──────────────────────────────────────────────────────────────────
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const GITEA_URL = process.env.GITEA_URL;
const GITEA_TOKEN = process.env.GITEA_TOKEN;
const GITEA_OWNER = process.env.GITEA_OWNER;
const GITEA_REPO = process.env.GITEA_REPO;
const CLAUDE_BIN = process.env.CLAUDE_BIN || "claude";
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || "300", 10); // seconds
const PROJECT_DIR = process.cwd();

const required = {
  NOTION_TOKEN,
  NOTION_DATABASE_ID,
  GITEA_URL,
  GITEA_TOKEN,
  GITEA_OWNER,
  GITEA_REPO,
};
const missing = Object.entries(required)
  .filter(([, v]) => !v)
  .map(([k]) => k);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(", ")}`);
  console.error("Copy .env.example to .env and fill in the values.");
  process.exit(1);
}

// ── Notion API helper ───────────────────────────────────────────────────────

async function notionApi(method, endpoint, body) {
  const res = await fetch(`https://api.notion.com/v1${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Notion API ${method} ${endpoint} failed (${res.status}): ${text}`);
  }
  return res.json();
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 60);
}

function getTitle(page) {
  const titleProp = Object.values(page.properties || {}).find(
    (p) => p.type === "title"
  );
  return titleProp?.title?.[0]?.plain_text || "Untitled";
}

function getDescription(page) {
  const descProp = page.properties?.Description;
  if (!descProp?.rich_text) return "";
  return descProp.rich_text.map((t) => t.plain_text).join("");
}

function getPriority(page) {
  return page.properties?.Priority?.select?.name || "Medium";
}

function git(...args) {
  return execSync(`git ${args.join(" ")}`, {
    cwd: PROJECT_DIR,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}

async function giteaApi(method, endpoint, body) {
  const url = `${GITEA_URL}/api/v1${endpoint}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `token ${GITEA_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gitea API ${method} ${endpoint} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function setNotionState(pageId, state) {
  await notionApi("PATCH", `/pages/${pageId}`, {
    properties: {
      State: { status: { name: state } },
    },
  });
}

// ── Main pipeline ───────────────────────────────────────────────────────────

async function queryReadyFeatures() {
  const response = await notionApi("POST", `/databases/${NOTION_DATABASE_ID}/query`, {
    filter: {
      and: [
        { property: "State", status: { equals: "Ready" } },
        { property: "Project", multi_select: { contains: "Prototype Playground" } },
      ],
    },
  });
  return response.results;
}

async function implementFeature(page) {
  const pageId = page.id;
  const title = getTitle(page);
  const description = getDescription(page);
  const priority = getPriority(page);
  const slug = slugify(title);
  const branchName = `feature/${slug}`;

  console.log(`\n--- Implementing: "${title}" (${priority}) ---`);

  // 1. Set Notion state to "In progress"
  await setNotionState(pageId, "In progress");
  console.log("  Notion state -> In progress");

  // 2. Make sure we're on main and up to date
  git("checkout", "main");
  git("pull", "origin", "main", "--ff-only");

  // 3. Create a new branch
  try {
    git("branch", "-D", branchName);
  } catch {
    // branch didn't exist, that's fine
  }
  git("checkout", "-b", branchName);
  console.log(`  Created branch: ${branchName}`);

  // 4. Build the prompt for Claude Code
  const prompt = [
    `Implement the following feature for the Prototype Playground.`,
    `Read CLAUDE.md first for project conventions.`,
    ``,
    `## Feature: ${title}`,
    `## Priority: ${priority}`,
    ``,
    `## Description`,
    description || "No description provided.",
    ``,
    `## Instructions`,
    `1. If this is a new prototype, create it under src/prototypes/claude-bot/${slug}/`,
    `   with a meta.json and page.tsx following the conventions in CLAUDE.md.`,
    `2. If this is a change to shared components or the app itself, modify the appropriate files.`,
    `3. Use shared UI components from @/components/ui.`,
    `4. Use Tailwind CSS v4 theme tokens (never raw colors).`,
    `5. Make the prototype interactive and functional.`,
    `6. Run npm run build to verify no errors.`,
  ].join("\n");

  // 5. Run Claude Code
  console.log("  Running Claude Code...");
  try {
    execSync(`echo ${JSON.stringify(prompt)} | ${CLAUDE_BIN} -p --max-turns 30`, {
      cwd: PROJECT_DIR,
      encoding: "utf-8",
      stdio: ["pipe", "inherit", "inherit"],
      timeout: 10 * 60 * 1000, // 10 minute timeout
    });
  } catch (err) {
    console.error(`  Claude Code failed: ${err.message}`);
    // Reset branch and go back to main
    git("checkout", "main");
    git("branch", "-D", branchName);
    await setNotionState(pageId, "Ready"); // revert state
    throw err;
  }

  // 6. Check if there are changes to commit
  const status = git("status", "--porcelain");
  if (!status) {
    console.log("  No changes produced by Claude Code, skipping");
    git("checkout", "main");
    git("branch", "-D", branchName);
    await setNotionState(pageId, "Ready");
    return null;
  }

  // 7. Commit and push
  git("add", "-A");
  const commitMsg = `feat: ${title}\n\nImplemented via Notion pipeline.\nNotion page: ${pageId}\n\nCo-Authored-By: Claude <noreply@anthropic.com>`;
  execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, {
    cwd: PROJECT_DIR,
    encoding: "utf-8",
  });
  git("push", "origin", branchName, "--force");
  console.log(`  Pushed branch: ${branchName}`);

  // 8. Create PR on Gitea (or find existing one)
  let pr;
  try {
    pr = await giteaApi(
      "POST",
      `/repos/${GITEA_OWNER}/${GITEA_REPO}/pulls`,
      {
        title: `[Feature] ${title}`,
        body: [
          `## Feature Request from Notion`,
          ``,
          `**Priority:** ${priority}`,
          `**Notion Page:** \`${pageId}\``,
          ``,
          `### Description`,
          ``,
          description || "No description provided.",
          ``,
          `---`,
          `*Implemented automatically by Claude Code via the Notion pipeline.*`,
        ].join("\n"),
        head: branchName,
        base: "main",
      }
    );
    console.log(`  Created PR #${pr.number}: ${pr.html_url}`);
  } catch (err) {
    if (err.message.includes("409")) {
      // PR already exists, find it
      const pulls = await giteaApi(
        "GET",
        `/repos/${GITEA_OWNER}/${GITEA_REPO}/pulls?state=open&head=${branchName}`
      );
      pr = pulls[0];
      console.log(`  PR already exists #${pr.number}: ${pr.html_url}`);
    } else {
      throw err;
    }
  }

  // 9. Update Notion state to "Review"
  await setNotionState(pageId, "Review");
  console.log("  Notion state -> Review");

  // 10. Switch back to main
  git("checkout", "main");

  return pr;
}

async function poll() {
  console.log(`\n[${new Date().toISOString()}] Polling Notion for ready features...`);

  const features = await queryReadyFeatures();
  console.log(`Found ${features.length} ready feature(s)`);

  for (const page of features) {
    try {
      await implementFeature(page);
    } catch (err) {
      console.error(`Failed to implement "${getTitle(page)}":`, err.message);
    }
  }
}

// ── Entry point ─────────────────────────────────────────────────────────────

const watchMode = process.argv.includes("--watch");

await poll();

if (watchMode) {
  console.log(`\nWatching for new features every ${POLL_INTERVAL}s...`);
  setInterval(poll, POLL_INTERVAL * 1000);
}
