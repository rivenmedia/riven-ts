// Syncs plugin documentation from packages/plugin-*/docs/settings.md
// into the wiki content directory as MDX files.
// Run: node scripts/sync-plugin-docs.mjs
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../../..");
const PLUGINS_DIR = join(ROOT, "packages");
const OUTPUT_DIR = join(import.meta.dirname, "../content/docs/plugins");

// Map plugin directory names to display names
function getPluginDisplayName(dirName) {
  return dirName
    .replace("plugin-", "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getPluginEnvPrefix(dirName) {
  const name = dirName.replace("plugin-", "").replace(/-/g, "_").toUpperCase();
  return `RIVEN_PLUGIN_SETTING__REPO_PLUGIN_${name}`;
}

const pluginDirs = readdirSync(PLUGINS_DIR).filter(
  (d) => d.startsWith("plugin-") && d !== "plugin-test",
);

// Ensure output directory exists
mkdirSync(OUTPUT_DIR, { recursive: true });

let metaPages = [];

for (const pluginDir of pluginDirs) {
  const settingsPath = join(PLUGINS_DIR, pluginDir, "docs", "settings.md");
  if (!existsSync(settingsPath)) continue;

  const content = readFileSync(settingsPath, "utf-8");
  const displayName = getPluginDisplayName(pluginDir);
  const envPrefix = getPluginEnvPrefix(pluginDir);
  const slug = pluginDir.replace("plugin-", "");

  // Read plugin package.json for version/description
  let description = "";
  const pkgPath = join(PLUGINS_DIR, pluginDir, "package.json");
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    description = pkg.description || "";
  }

  // Transform the markdown settings table into MDX
  const mdxContent = `---
title: ${displayName}
description: Configuration reference for the ${displayName} plugin.
---

${description ? `${description}\n` : ""}
## Environment Variable Prefix

All settings for this plugin use the prefix:

\`\`\`
${envPrefix}__<settingName>
\`\`\`

For example: \`${envPrefix}__apiKey="your-key"\`

${content}
`;

  writeFileSync(join(OUTPUT_DIR, `${slug}.mdx`), mdxContent);
  metaPages.push(slug);
}

// Write meta.json for plugin ordering (preserve index page)
const meta = {
  title: "Plugins",
  pages: ["index", ...metaPages.sort()],
};
writeFileSync(join(OUTPUT_DIR, "meta.json"), JSON.stringify(meta, null, 2));

console.log(
  `Synced docs for ${metaPages.length} plugins: ${metaPages.join(", ")}`,
);
