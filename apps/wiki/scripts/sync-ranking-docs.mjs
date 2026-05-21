// Generates content/docs/configuration/ranking.mdx by extracting type and
// default information directly from the TypeScript source, combined with a
// description map defined here.
//
// Run: node scripts/sync-ranking-docs.mjs
import { execFileSync } from "node:child_process";
import { unlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../../..");
const RIVEN_APP = join(ROOT, "apps/riven");
const OUTPUT_FILE = join(
  import.meta.dirname,
  "../content/docs/configuration/ranking.mdx",
);

// ── Description maps ─────────────────────────────────────────────────────────

const PATTERN_DESCRIPTIONS = {
  require:
    "Patterns that a torrent title **must** match to be considered. " +
    "Patterns are case-insensitive by default; wrap in `/` delimiters for " +
    "case-sensitive matching (e.g. `/ExactCase/`). Accepts regex syntax.",
  exclude:
    "Patterns that, when matched against a torrent title, cause it to be " +
    "rejected entirely. Accepts regex syntax.",
  preferred:
    "Patterns that boost a torrent's rank when matched. Accepts regex syntax.",
};

const RESOLUTION_DESCRIPTIONS = {
  r2160p: "Allow 4K / 2160p",
  r1080p: "Allow 1080p",
  r720p: "Allow 720p",
  r480p: "Allow 480p",
  r360p: "Allow 360p",
  unknown: "Allow torrents with no detected resolution",
};

const OPTIONS_DESCRIPTIONS = {
  removeAllTrash: "Reject torrents in the `trash` custom rank category",
  removeRanksUnder:
    "Reject torrents whose total rank falls below this threshold",
  removeUnknownLanguages: "Reject torrents whose language cannot be determined",
  allowEnglishInLanguages:
    "Always allow English-language torrents regardless of language filters",
  removeAdultContent: "Reject adult-content torrents",
  titleSimilarity:
    "Minimum title similarity ratio required for a torrent to match a media item",
};

// Override the inferred Zod type string for specific fields where a more
// descriptive label is appropriate.
const OPTIONS_TYPE_OVERRIDES = {
  titleSimilarity: "number (0-1)",
};

const LANGUAGES_DESCRIPTIONS = {
  required: "Only accept torrents that include all of these languages",
  allowed:
    "Accept torrents in any of these languages (in addition to `required`)",
  exclude: "Reject torrents that include any of these languages",
  preferred: "Boost torrents matching these languages",
};

// Shared across both customRanks and rankingModel tables.
const ITEM_DESCRIPTIONS = {
  // quality
  av1: "AV1-encoded video",
  avc: "AVC / H.264",
  bluray: "Blu-ray source",
  dvd: "DVD source",
  hdtv: "HDTV source",
  hevc: "HEVC / H.265",
  mpeg: "MPEG-2 encoded video",
  remux: "Remux (lossless Blu-ray rip)",
  vhs: "VHS source",
  web: "Web source (generic)",
  webdl: "WEB-DL",
  webmux: "WebMux",
  xvid: "Xvid-encoded video",
  // rips
  bdrip: "BD-Rip",
  brrip: "BR-Rip",
  dvdrip: "DVD-Rip",
  hdrip: "HD-Rip",
  ppvrip: "PPV-Rip",
  satrip: "SAT-Rip",
  tvrip: "TV-Rip",
  uhdrip: "UHD-Rip",
  vhsrip: "VHS-Rip",
  webdlrip: "WEB-DL Rip",
  webrip: "WEB-Rip",
  // hdr
  bit10: "10-bit colour depth",
  dolbyVision: "Dolby Vision HDR",
  hdr: "HDR (generic)",
  hdr10plus: "HDR10+",
  sdr: "Standard Dynamic Range",
  // audio
  aac: "AAC audio",
  atmos: "Dolby Atmos",
  dolbyDigital: "Dolby Digital (AC3)",
  dolbyDigitalPlus: "Dolby Digital Plus (E-AC3)",
  dtsLossy: "DTS (lossy)",
  dtsLossless: "DTS-HD MA / DTS-X (lossless)",
  flac: "FLAC audio",
  mono: "Mono audio",
  mp3: "MP3 audio",
  stereo: "Stereo audio",
  surround: "Surround sound",
  truehd: "Dolby TrueHD",
  // extras
  threeD: "3D video",
  converted: "Format-converted",
  documentary: "Documentary",
  commentary: "Commentary track",
  dubbed: "Dubbed audio track",
  edition: "Special edition",
  hardcoded: "Hardcoded subtitles",
  network: "Network tag present",
  proper: "PROPER release",
  repack: "REPACK release",
  retail: "Retail copy",
  site: "Release site tag present",
  subbed: "Subtitled",
  upscaled: "AI-upscaled",
  scene: "Scene release",
  uncensored: "Uncensored content",
  // trash
  cam: "CAM recording",
  cleanAudio: "Clean audio track only",
  pdtv: "PDTV",
  r5: "R5 (region 5 DVD copy)",
  screener: "Screener",
  size: "Size-tagged release",
  telecine: "Telecine",
  telesync: "Telesync",
};

// rankingModel group membership - order controls display order in the output.
// Groups are not encoded in the Zod schema so they are defined here.
const RANKING_MODEL_GROUPS = {
  Quality: [
    "av1",
    "avc",
    "bluray",
    "dvd",
    "hdtv",
    "hevc",
    "mpeg",
    "remux",
    "vhs",
    "web",
    "webdl",
    "webmux",
    "xvid",
  ],
  Rips: [
    "bdrip",
    "brrip",
    "dvdrip",
    "hdrip",
    "ppvrip",
    "tvrip",
    "uhdrip",
    "vhsrip",
    "webdlrip",
    "webrip",
  ],
  HDR: ["bit10", "dolbyVision", "hdr", "hdr10plus", "sdr"],
  Audio: [
    "aac",
    "atmos",
    "dolbyDigital",
    "dolbyDigitalPlus",
    "dtsLossy",
    "dtsLossless",
    "flac",
    "mono",
    "mp3",
    "stereo",
    "surround",
    "truehd",
  ],
  Extras: [
    "threeD",
    "converted",
    "documentary",
    "commentary",
    "uncensored",
    "dubbed",
    "edition",
    "hardcoded",
    "network",
    "proper",
    "repack",
    "retail",
    "subbed",
    "upscaled",
    "scene",
  ],
  Trash: [
    "cam",
    "cleanAudio",
    "r5",
    "pdtv",
    "satrip",
    "screener",
    "site",
    "size",
    "telecine",
    "telesync",
  ],
};

// ── Schema data extraction ────────────────────────────────────────────────────

function extractSchemaData() {
  const tmpScript = join(RIVEN_APP, "_sync-ranking-docs-tmp.mjs");

  // Runs inside RIVEN_APP so workspace package imports resolve correctly.
  const script = [
    `import { SettingsSchema, RankingModelSchema } from '@repo/util-rank-torrent-name';`,
    `import { DEFAULT_SETTINGS_INPUT, DEFAULT_RANKING_MODEL_INPUT } from './lib/ranking-config/load-ranking-config.ts';`,
    ``,
    `// Walk Zod schema wrappers to reach the inner ZodObject shape.`,
    `// Uses property-existence checks rather than typeName strings to stay`,
    `// robust across Zod 4 wrapper types (ZodPipe, ZodDefault, ZodPrefault).`,
    `function getShape(schema) {`,
    `  if (!schema || typeof schema !== 'object') return null;`,
    `  if (schema.shape && typeof schema.shape === 'object') return schema.shape;`,
    `  const def = schema._def;`,
    `  if (!def || typeof def !== 'object') return null;`,
    `  if (def.innerType) return getShape(def.innerType);`,
    `  if (def.in) return getShape(def.in);`,
    `  return null;`,
    `}`,
    ``,
    `// Derive a human-readable type string from a Zod schema node.`,
    `// Uses .safeParse() probing and documented public accessors (.element, .shape)`,
    `// rather than internal _def.typeName strings which vary across Zod versions.`,
    `function getType(schema) {`,
    `  if (!schema || typeof schema !== 'object') return 'unknown';`,
    `  const def = schema._def;`,
    `  if (!def || typeof def !== 'object') return 'unknown';`,
    `  // Unwrap transparent wrappers; ZodDefault, ZodPrefault, ZodOptional all expose _def.innerType.`,
    `  if (def.innerType && typeof def.innerType === 'object') return getType(def.innerType);`,
    `  // ZodObject: exposes .shape (public API).`,
    `  if (schema.shape && typeof schema.shape === 'object') return 'object';`,
    `  if (typeof schema.safeParse !== 'function') return 'unknown';`,
    `  // ZodArray: safeParse([]) succeeds; element type via .element (public ZodArray accessor).`,
    `  if (schema.safeParse([])?.success === true) {`,
    `    const elementType = schema.element ? getType(schema.element) : 'unknown';`,
    `    return elementType + '[]';`,
    `  }`,
    `  // Primitive types: probe with known values.`,
    `  const passesBool = schema.safeParse(true)?.success === true;`,
    `  const passesStr  = schema.safeParse('test')?.success === true;`,
    `  const passesNum  = schema.safeParse(0)?.success === true;`,
    `  if (passesBool && !passesStr && !passesNum) return 'boolean';`,
    `  if (passesNum  && !passesStr) return 'number';`,
    `  if (passesStr) return 'string';`,
    `  return 'unknown';`,
    `}`,
    ``,
    `const settingsShape = getShape(SettingsSchema);`,
    ``,
    `const resolutionShape = getShape(settingsShape.resolutions);`,
    `const optionsShape    = getShape(settingsShape.options);`,
    `const languagesShape  = getShape(settingsShape.languages);`,
    `const customRanksShape = getShape(settingsShape.customRanks);`,
    ``,
    `// For each customRanks category, extract the ordered key list.`,
    `const customRanksKeys = Object.fromEntries(`,
    `  Object.entries(customRanksShape).map(([cat, catSchema]) => [`,
    `    cat,`,
    `    Object.keys(getShape(catSchema)),`,
    `  ])`,
    `);`,
    ``,
    `process.stdout.write(JSON.stringify({`,
    `  settingsTopLevel: {`,
    `    require:   { type: getType(settingsShape.require),   default: DEFAULT_SETTINGS_INPUT.require },`,
    `    exclude:   { type: getType(settingsShape.exclude),   default: DEFAULT_SETTINGS_INPUT.exclude },`,
    `    preferred: { type: getType(settingsShape.preferred), default: DEFAULT_SETTINGS_INPUT.preferred },`,
    `  },`,
    `  resolutions: {`,
    `    types:    Object.fromEntries(Object.entries(resolutionShape).map(([k, v]) => [k, getType(v)])),`,
    `    defaults: DEFAULT_SETTINGS_INPUT.resolutions,`,
    `  },`,
    `  options: {`,
    `    types:    Object.fromEntries(Object.entries(optionsShape).map(([k, v]) => [k, getType(v)])),`,
    `    defaults: DEFAULT_SETTINGS_INPUT.options,`,
    `  },`,
    `  languages: {`,
    `    types:    Object.fromEntries(Object.entries(languagesShape).map(([k, v]) => [k, getType(v)])),`,
    `    defaults: DEFAULT_SETTINGS_INPUT.languages,`,
    `  },`,
    `  customRanksKeys,`,
    `  customRanksDefaults: DEFAULT_SETTINGS_INPUT.customRanks,`,
    `  rankingModelKeys: Object.keys(RankingModelSchema.shape),`,
    `  rankingModelDefaults: DEFAULT_RANKING_MODEL_INPUT,`,
    `}));`,
  ].join("\n");

  writeFileSync(tmpScript, script);
  try {
    const output = execFileSync(
      "node",
      ["--experimental-strip-types", tmpScript],
      { cwd: RIVEN_APP, encoding: "utf-8" },
    );
    return JSON.parse(output);
  } finally {
    try {
      unlinkSync(tmpScript);
    } catch {}
  }
}

// ── MDX generation ────────────────────────────────────────────────────────────

// Format a default value for display in a markdown table cell.
// Uses JSON.stringify so backslashes are properly re-escaped for the reader.
function fmtDefault(value) {
  if (value === undefined || value === null) return "";
  return `\`${JSON.stringify(value)}\``;
}

function tableRow(...cells) {
  return `| ${cells.join(" | ")} |`;
}

function tableHeader(...cols) {
  return [tableRow(...cols), tableRow(...cols.map(() => ":---"))].join("\n");
}

// Generates a simple ### section for require / exclude / preferred.
function patternSection(key, data) {
  const { type, default: def } = data;
  return [
    `### \`${key}\``,
    ``,
    `**Type:** \`${type}\` | **Default:** ${fmtDefault(def)}`,
    ``,
    PATTERN_DESCRIPTIONS[key] ?? "",
  ].join("\n");
}

// Generates a table section for resolutions / options / languages.
function tableSection(
  title,
  intro,
  keys,
  types,
  defaults,
  descriptions,
  typeOverrides = {},
) {
  const header = tableHeader("Key", "Type", "Default", "Description");
  const rows = keys.map((k) =>
    tableRow(
      `\`${k}\``,
      `\`${typeOverrides[k] ?? types[k]}\``,
      fmtDefault(defaults[k]),
      descriptions[k] ?? "",
    ),
  );
  return [`### \`${title}\``, ``, intro, ``, header, ...rows].join("\n");
}

// Generates an #### table for a single customRanks category.
function customRanksCategorySection(cat, keys, defaults, isTrash = false) {
  const parts = [`#### \`customRanks.${cat}\``];
  if (isTrash) {
    parts.push(
      ``,
      `When \`removeAllTrash\` is \`true\` in \`options\`, any torrent matching a trash category is rejected regardless of \`fetch\` settings.`,
    );
  }
  parts.push(
    ``,
    tableHeader("Key", "Default `fetch`", "Description"),
    ...keys.map((k) =>
      tableRow(
        `\`${k}\``,
        `\`${String(defaults?.[k]?.fetch ?? true)}\``,
        ITEM_DESCRIPTIONS[k] ?? "",
      ),
    ),
  );
  return parts.join("\n");
}

// Generates a ### table for a single rankingModel group.
function rankingModelGroupSection(groupName, keys, defaults) {
  return [
    `### ${groupName}`,
    ``,
    tableHeader("Key", "Default", "Description"),
    ...keys
      .filter((k) => k in defaults || true) // include all schema keys
      .map((k) =>
        tableRow(
          `\`${k}\``,
          `\`${defaults[k] ?? 0}\``,
          ITEM_DESCRIPTIONS[k] ?? "",
        ),
      ),
  ].join("\n");
}

function generateMdx(data) {
  const {
    settingsTopLevel,
    resolutions,
    options,
    languages,
    customRanksKeys,
    customRanksDefaults,
    rankingModelDefaults,
  } = data;

  const parts = [
    `---`,
    `title: Ranking Configuration`,
    `description: Configure how Riven ranks and filters torrents when selecting downloads.`,
    `---`,
    ``,
    `import { Callout } from "fumadocs-ui/components/callout";`,
    ``,
    `{/* This file is auto-generated by scripts/sync-ranking-docs.mjs - do not edit manually. */}`,
    ``,
    `Riven uses a JSON file to configure how torrents are ranked when selecting downloads. On first startup, this file is automatically created at the path specified by the [\`rankingConfigPath\`](/docs/configuration#ranking) setting (default: \`./riven-ranking-config.json\`).`,
    ``,
    `Edit the file while Riven is not running, then restart for changes to take effect.`,
    ``,
    `## Error Handling`,
    ``,
    `| Scenario | Behaviour |`,
    `| :------- | :-------- |`,
    `| **Invalid JSON** | Riven refuses to start and logs an error. Delete the file to regenerate it with defaults, or fix the syntax errors. |`,
    `| **Unknown keys** | Riven logs a warning and ignores the unrecognised key. The rest of the config is used normally. |`,
    `| **Wrong value types** | If a section (\`settings\` or \`rankingModel\`) contains a value of the wrong type for a known key, Riven logs a warning and falls back to the built-in defaults for that entire section. |`,
    ``,
    `## Top-Level Structure`,
    ``,
    `\`\`\`json`,
    `{`,
    `  "settings": { ... },`,
    `  "rankingModel": { ... }`,
    `}`,
    `\`\`\``,
    ``,
    `---`,
    ``,
    `## \`settings\``,
    ``,
    `Controls which torrents are considered and how they are filtered.`,
    ``,
    patternSection("require", settingsTopLevel.require),
    ``,
    patternSection("exclude", settingsTopLevel.exclude),
    ``,
    patternSection("preferred", settingsTopLevel.preferred),
    ``,
    `---`,
    ``,
    tableSection(
      "resolutions",
      "Controls which video resolutions are eligible for download.",
      Object.keys(resolutions.types),
      resolutions.types,
      resolutions.defaults,
      RESOLUTION_DESCRIPTIONS,
    ),
    ``,
    `---`,
    ``,
    tableSection(
      "options",
      "Fine-grained filtering options.",
      Object.keys(options.types),
      options.types,
      options.defaults,
      OPTIONS_DESCRIPTIONS,
      OPTIONS_TYPE_OVERRIDES,
    ),
    ``,
    `---`,
    ``,
    tableSection(
      "languages",
      'Language filtering options. Language codes follow the same format used by the indexers (e.g. `"en"`, `"fr"`, `"anime"`).',
      Object.keys(languages.types),
      languages.types,
      languages.defaults,
      LANGUAGES_DESCRIPTIONS,
    ),
    ``,
    `---`,
    ``,
    `### \`customRanks\``,
    ``,
    `Controls which quality/format categories are fetched and optionally assigns a custom rank value. Setting \`fetch: false\` for a category means torrents with that attribute are rejected entirely.`,
    ``,
    `Each entry takes the form:`,
    ``,
    `\`\`\`json`,
    `{ "fetch": true, "rank": 100 }`,
    `\`\`\``,
    ``,
    `The \`rank\` field is optional. When omitted, the value from \`rankingModel\` is used for that category.`,
    ``,
    ...Object.entries(customRanksKeys).flatMap(([cat, keys]) => [
      customRanksCategorySection(
        cat,
        keys,
        customRanksDefaults[cat],
        cat === "trash",
      ),
      ``,
    ]),
    `---`,
    ``,
    `## \`rankingModel\``,
    ``,
    `Assigns a numeric score to each torrent attribute. Scores are summed to produce a final rank. Higher values are preferred. Values must be integers.`,
    ``,
    ...Object.entries(RANKING_MODEL_GROUPS).flatMap(([group, keys]) => [
      rankingModelGroupSection(group, keys, rankingModelDefaults),
      ``,
    ]),
  ];

  return parts.join("\n");
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log("Extracting ranking schema data from TypeScript source...");
const data = extractSchemaData();

console.log("Generating ranking.mdx...");
const mdx = generateMdx(data);
writeFileSync(OUTPUT_FILE, mdx);

const totalKeys =
  Object.keys(data.resolutions.types).length +
  Object.keys(data.options.types).length +
  Object.keys(data.languages.types).length +
  Object.values(data.customRanksKeys).reduce((n, ks) => n + ks.length, 0) +
  data.rankingModelKeys.length;

console.log(`Done - documented ${totalKeys} fields across all sections.`);
