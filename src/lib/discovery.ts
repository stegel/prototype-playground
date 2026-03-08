import fs from "node:fs";
import path from "node:path";
import type {
  PrototypeMeta,
  Prototype,
  ExternalPrototype,
  PrototypeEntry,
  DesignerGroup,
} from "./types";

const PROTOTYPES_DIR = path.join(process.cwd(), "src", "prototypes");
const EXTERNAL_FILE = path.join(PROTOTYPES_DIR, "_external.json");

function readMeta(dirPath: string): PrototypeMeta | null {
  const metaPath = path.join(dirPath, "meta.json");
  if (!fs.existsSync(metaPath)) return null;

  try {
    const raw = fs.readFileSync(metaPath, "utf-8");
    return JSON.parse(raw) as PrototypeMeta;
  } catch {
    console.warn(`Failed to parse meta.json at ${metaPath}`);
    return null;
  }
}

export function discoverLocalPrototypes(): Prototype[] {
  const prototypes: Prototype[] = [];
  if (!fs.existsSync(PROTOTYPES_DIR)) return prototypes;

  const designerDirs = fs.readdirSync(PROTOTYPES_DIR, { withFileTypes: true });

  for (const designerEntry of designerDirs) {
    if (!designerEntry.isDirectory()) continue;
    if (designerEntry.name.startsWith("_")) continue;

    const designerPath = path.join(PROTOTYPES_DIR, designerEntry.name);
    const prototypeDirs = fs.readdirSync(designerPath, {
      withFileTypes: true,
    });

    for (const protoEntry of prototypeDirs) {
      if (!protoEntry.isDirectory()) continue;
      if (protoEntry.name.startsWith("_")) continue;

      const protoPath = path.join(designerPath, protoEntry.name);
      const meta = readMeta(protoPath);

      if (meta) {
        prototypes.push({
          meta,
          designer: designerEntry.name,
          slug: protoEntry.name,
          path: `/prototypes/${designerEntry.name}/${protoEntry.name}`,
          type: "local",
        });
      }
    }
  }

  return prototypes;
}

export function discoverExternalPrototypes(): ExternalPrototype[] {
  if (!fs.existsSync(EXTERNAL_FILE)) return [];

  try {
    const raw = fs.readFileSync(EXTERNAL_FILE, "utf-8");
    const entries = JSON.parse(raw) as Omit<ExternalPrototype, "type">[];
    return entries.map((entry) => ({ ...entry, type: "external" as const }));
  } catch {
    console.warn("Failed to parse _external.json");
    return [];
  }
}

export interface RecentPrototype {
  title: string;
  path: string;
  updatedAt: Date;
}

export function getRecentPrototypes(limit = 5): RecentPrototype[] {
  if (!fs.existsSync(PROTOTYPES_DIR)) return [];

  const results: RecentPrototype[] = [];
  const designerDirs = fs.readdirSync(PROTOTYPES_DIR, { withFileTypes: true });

  for (const designerEntry of designerDirs) {
    if (!designerEntry.isDirectory()) continue;
    if (designerEntry.name.startsWith("_")) continue;

    const designerPath = path.join(PROTOTYPES_DIR, designerEntry.name);
    const prototypeDirs = fs.readdirSync(designerPath, { withFileTypes: true });

    for (const protoEntry of prototypeDirs) {
      if (!protoEntry.isDirectory()) continue;
      if (protoEntry.name.startsWith("_")) continue;

      const protoPath = path.join(designerPath, protoEntry.name);
      const metaPath = path.join(protoPath, "meta.json");
      if (!fs.existsSync(metaPath)) continue;

      const meta = readMeta(protoPath);
      if (!meta) continue;

      const stat = fs.statSync(metaPath);
      results.push({
        title: meta.title,
        path: `/prototypes/${designerEntry.name}/${protoEntry.name}`,
        updatedAt: stat.mtime,
      });
    }
  }

  return results
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit);
}

export function discoverAllPrototypes(): DesignerGroup[] {
  const local = discoverLocalPrototypes();
  const external = discoverExternalPrototypes();
  const all: PrototypeEntry[] = [...local, ...external];

  const grouped = new Map<string, PrototypeEntry[]>();

  for (const entry of all) {
    const author = entry.type === "local" ? entry.designer : entry.author;
    if (!grouped.has(author)) {
      grouped.set(author, []);
    }
    grouped.get(author)!.push(entry);
  }

  // Sort each group by date descending
  const result: DesignerGroup[] = [];
  for (const [designer, prototypes] of grouped) {
    prototypes.sort((a, b) => {
      const dateA = a.type === "local" ? a.meta.date : a.date;
      const dateB = b.type === "local" ? b.meta.date : b.date;
      return dateB.localeCompare(dateA);
    });
    result.push({ designer, prototypes });
  }

  result.sort((a, b) => a.designer.localeCompare(b.designer));
  return result;
}
