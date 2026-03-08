#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const [, , designer, name] = process.argv;

if (!designer || !name) {
  console.error(
    "Usage: npm run new <designer-name> <prototype-name>\n" +
      'Example: npm run new aj.siegel "Onboarding Flow"'
  );
  process.exit(1);
}

const slug = name.toLowerCase().replace(/\s+/g, "-");
const targetDir = path.join(process.cwd(), "prototypes-repo", "src", "prototypes", designer, slug);
const templateDir = path.join(process.cwd(), "prototypes-repo", "src", "prototypes", "_template");

if (fs.existsSync(targetDir)) {
  console.error(`Prototype already exists at ${targetDir}`);
  process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });

// Copy and customize meta.json
const meta = JSON.parse(
  fs.readFileSync(path.join(templateDir, "meta.json"), "utf-8")
);
meta.title = name;
meta.author = designer;
meta.date = new Date().toISOString().split("T")[0];
fs.writeFileSync(
  path.join(targetDir, "meta.json"),
  JSON.stringify(meta, null, 2) + "\n"
);

// Copy page.tsx
fs.copyFileSync(
  path.join(templateDir, "page.tsx"),
  path.join(targetDir, "page.tsx")
);

console.log(`\nCreated prototype at: src/prototypes/${designer}/${slug}/`);
console.log(
  `View at: http://localhost:3000/prototypes/${designer}/${slug}\n`
);
