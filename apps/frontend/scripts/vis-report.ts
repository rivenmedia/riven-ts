/**
 * Builds a report of visual snapshot changes from a `storybook-addon-vis` snapshot directory.
 *
 * Usage:
 *   node scripts/vis-report.ts generate [--root <snapshot root>] [--out <dir>] [--head-sha <sha>] [--pr-number <number>]
 *     Writes `manifest.json`, the flagged images and a self-contained `visual-report.html` to the output directory.
 *
 * The commands below run in trusted workflows against the output of `generate` from an untrusted PR run,
 * so the manifest and images are validated before use:
 *
 *   node scripts/vis-report.ts comment --manifest <path> --image-base <url> [--report-url <url>] [--run-url <url>]
 *     Prints the PR comment for a manifest.
 *
 *   node scripts/vis-report.ts stage-images --manifest <path> --images <dir> --to <dir>
 *     Copies the manifest's images to a directory for publishing.
 *
 *   node scripts/vis-report.ts baseline-changes --manifest <path> --images <dir> --baselines <repo path> [--prune]
 *     Prints the file changes that accept the manifest's results as the new baselines, as JSON.
 */
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import { snapshotRootDir as defaultSnapshotRootDir } from "../.storybook/vis-paths.ts";

type EntryStatus = "changed" | "new" | "orphaned";

interface ImageInfo {
  /** Path relative to the report's `images` directory */
  path: string;
  width: number;
  height: number;
}

interface ManifestEntry {
  /** Snapshot path relative to the baselines directory, e.g. `components/_ui/button.stories.tsx/default-auto.png` */
  id: string;
  status: EntryStatus;
  baseline?: ImageInfo;
  result?: ImageInfo;
  diff?: ImageInfo;
}

export interface Manifest {
  version: 1;
  snapshotRootDir: string;
  headSha: string | null;
  prNumber: number | null;
  /** Number of snapshots captured in this run */
  compared: number;
  entries: ManifestEntry[];
}

const imageKinds = ["baseline", "result", "diff"] as const;

/** Named so the artifact is recognisable, as GitHub uses the file name for unzipped artifacts */
const reportFileName = "visual-report.html";

type ImageKind = (typeof imageKinds)[number];

const snapshotDirs: Record<ImageKind, string> = {
  baseline: "__baselines__",
  result: "__results__",
  diff: "__diffs__",
};

/** Snapshot IDs come from story file paths and names, which are restricted to this set */
const safeIdPattern = /^(?!.*\.\.)[\w\-./()[\]@ ]+\.png$/u;

const listPngs = async (dir: string): Promise<Set<string>> => {
  try {
    const files = await readdir(dir, { recursive: true });

    return new Set(
      files
        .filter((file) => file.endsWith(".png"))
        .map((file) => file.split(path.sep).join("/")),
    );
  } catch {
    return new Set();
  }
};

/** Reads the dimensions from a PNG's IHDR chunk */
const readPngSize = async (file: string) => {
  const header = await readFile(file).then((buffer) => buffer.subarray(0, 24));

  if (header.toString("latin1", 1, 4) !== "PNG") {
    throw new Error(`${file} is not a PNG`);
  }

  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
};

/** Writes to stdout, as the output of some commands is consumed by workflows */
const print = (text: string) => {
  process.stdout.write(`${text}\n`);
};

const escapeHtml = (value: string) =>
  value.replaceAll(
    /[&<>"']/gu,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ] ?? char,
  );

const splitId = (id: string) => {
  const separatorIndex = id.lastIndexOf("/");

  return {
    file: id.slice(0, separatorIndex),
    snapshot: id.slice(separatorIndex + 1).replace(/\.png$/u, ""),
  };
};

const statusLabels: Record<EntryStatus, string> = {
  changed: "Changed",
  new: "New",
  orphaned: "No longer captured",
};

const renderHtml = async (manifest: Manifest, imagesDir: string) => {
  // Images are inlined so the report is a single file that GitHub can serve directly from an unzipped artifact
  const toDataUri = async (image: ImageInfo | undefined) => {
    if (!image) {
      return null;
    }

    const contents = await readFile(path.join(imagesDir, image.path));

    return `data:image/png;base64,${contents.toString("base64")}`;
  };

  const entries = await Promise.all(
    manifest.entries.map(async (entry) => ({
      id: splitId(entry.id),
      status: entry.status,
      label: statusLabels[entry.status],
      baseline: await toDataUri(entry.baseline),
      result: await toDataUri(entry.result),
      diff: await toDataUri(entry.diff),
    })),
  );

  const title =
    manifest.prNumber === null
      ? "Visual changes"
      : `Visual changes · PR #${manifest.prNumber.toString()}`;

  // `<` is escaped so the JSON can't close the script tag
  const data = JSON.stringify(entries).replaceAll("<", String.raw`\u003c`);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  :root {
    color-scheme: light dark;
    --bg: #ffffff; --panel: #f6f7f9; --border: #e3e5e8; --text: #1f2328; --muted: #656d76;
    --accent: #2f7d6d; --changed: #bf8700; --new: #1f6feb; --orphaned: #8250df;
    --checker-a: #ececec; --checker-b: #ffffff;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #16181d; --panel: #1e2128; --border: #30343c; --text: #e6e8eb; --muted: #9198a1;
      --accent: #4fb39b; --changed: #d29922; --new: #4493f8; --orphaned: #a371f7;
      --checker-a: #23262d; --checker-b: #1b1d22;
    }
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font: 14px/1.5 system-ui, sans-serif; }
  header { padding: 12px 16px; border-bottom: 1px solid var(--border); display: flex; gap: 12px; align-items: baseline; flex-wrap: wrap; }
  header h1 { font-size: 16px; margin: 0; }
  header p { margin: 0; color: var(--muted); }
  main { display: grid; grid-template-columns: minmax(220px, 320px) 1fr; min-height: calc(100vh - 50px); }
  nav { border-right: 1px solid var(--border); background: var(--panel); overflow-y: auto; position: sticky; top: 0; align-self: start; height: 100vh; }
  nav button { all: unset; display: block; width: 100%; padding: 8px 16px; cursor: pointer; border-bottom: 1px solid var(--border); }
  nav button:hover, nav button[aria-current="true"] { background: var(--bg); }
  nav button:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
  nav .file { display: block; color: var(--muted); font-size: 12px; overflow-wrap: anywhere; }
  .badge { display: inline-block; font-size: 11px; padding: 0 6px; border-radius: 999px; color: #fff; margin-right: 6px; }
  .badge.changed { background: var(--changed); } .badge.new { background: var(--new); } .badge.orphaned { background: var(--orphaned); }
  section { padding: 16px; min-width: 0; }
  section h2 { font-size: 15px; margin: 0 0 4px; overflow-wrap: anywhere; }
  section .file { color: var(--muted); margin: 0 0 12px; overflow-wrap: anywhere; }
  [role="tablist"] { display: flex; gap: 4px; border-bottom: 1px solid var(--border); margin-bottom: 12px; flex-wrap: wrap; }
  [role="tab"] { all: unset; padding: 6px 12px; cursor: pointer; border-bottom: 2px solid transparent; color: var(--muted); }
  [role="tab"][aria-selected="true"] { color: var(--text); border-bottom-color: var(--accent); }
  [role="tab"]:disabled { opacity: .4; cursor: not-allowed; }
  [role="tab"]:focus-visible { outline: 2px solid var(--accent); }
  .stage { background: repeating-conic-gradient(var(--checker-a) 0 25%, var(--checker-b) 0 50%) 0 0 / 16px 16px; border: 1px solid var(--border); display: inline-block; max-width: 100%; overflow: auto; }
  .stage img { display: block; max-width: 100%; height: auto; }
  .slider { position: relative; display: inline-block; max-width: 100%; vertical-align: top; }
  .slider .overlay { position: absolute; inset: 0; overflow: hidden; clip-path: inset(0 calc(100% - var(--pos, 50%)) 0 0); }
  .slider .overlay img { width: 100%; }
  .slider .handle { position: absolute; top: 0; bottom: 0; left: var(--pos, 50%); width: 2px; background: var(--accent); pointer-events: none; }
  .slider-controls { display: flex; gap: 8px; align-items: center; margin-top: 8px; color: var(--muted); font-size: 12px; }
  .slider-controls input { flex: 1; max-width: 400px; accent-color: var(--accent); }
  .empty { color: var(--muted); padding: 32px 16px; }
  @media (max-width: 720px) {
    main { grid-template-columns: 1fr; align-content: start; }
    nav { position: static; height: auto; max-height: 40vh; border-right: 0; border-bottom: 1px solid var(--border); }
  }
</style>
</head>
<body>
<header>
  <h1>${escapeHtml(title)}</h1>
  <p>${manifest.compared.toString()} snapshots compared · ${manifest.entries.length.toString()} flagged${manifest.headSha ? ` · ${escapeHtml(manifest.headSha.slice(0, 7))}` : ""}</p>
</header>
<main>
  <nav id="list" aria-label="Flagged snapshots"></nav>
  <section id="detail" aria-live="polite"></section>
</main>
<script>
const entries = ${data};
const tabs = [
  { id: "diff", label: "Diff", available: (e) => e.diff },
  { id: "baseline", label: "Reference", available: (e) => e.baseline },
  { id: "result", label: "Actual", available: (e) => e.result },
  { id: "slider", label: "Slider", available: (e) => e.baseline && e.result },
];
const list = document.getElementById("list");
const detail = document.getElementById("detail");
let selected = 0;
let selectedTab = null;

const el = (tag, props = {}, children = []) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};

const image = (src, alt) => el("img", { src, alt });

const renderStage = (entry, tab) => {
  if (tab === "slider") {
    const slider = el("div", { className: "slider" }, [
      image(entry.result, "Actual"),
      el("div", { className: "overlay" }, [image(entry.baseline, "Reference")]),
      el("div", { className: "handle" }),
    ]);
    const input = el("input", { type: "range", min: 0, max: 100, value: 50, ariaLabel: "Reference / actual split" });
    input.addEventListener("input", () => slider.style.setProperty("--pos", input.value + "%"));
    return el("div", {}, [
      el("div", { className: "stage" }, [slider]),
      el("div", { className: "slider-controls" }, ["Reference", input, "Actual"]),
    ]);
  }
  return el("div", { className: "stage" }, [image(entry[tab], tab)]);
};

const renderDetail = () => {
  const entry = entries[selected];
  detail.replaceChildren();
  if (!entry) {
    detail.append(el("p", { className: "empty", textContent: "No visual changes detected." }));
    return;
  }
  const available = tabs.filter((tab) => tab.available(entry));
  const tab = available.some((t) => t.id === selectedTab) ? selectedTab : available[0]?.id;
  const tablist = el("div", { role: "tablist" }, tabs.map((t) => {
    const button = el("button", { role: "tab", textContent: t.label, disabled: !t.available(entry) });
    button.setAttribute("aria-selected", String(t.id === tab));
    button.addEventListener("click", () => { selectedTab = t.id; renderDetail(); });
    return button;
  }));
  detail.append(
    el("h2", {}, [el("span", { className: "badge " + entry.status, textContent: entry.label }), entry.id.snapshot]),
    el("p", { className: "file", textContent: entry.id.file }),
    tablist,
    tab ? renderStage(entry, tab) : el("p", { className: "empty", textContent: "No images available." }),
  );
};

const renderList = () => {
  list.replaceChildren(...entries.map((entry, index) => {
    const button = el("button", {}, [
      el("span", { className: "badge " + entry.status, textContent: entry.label }),
      entry.id.snapshot,
      el("span", { className: "file", textContent: entry.id.file }),
    ]);
    button.setAttribute("aria-current", String(index === selected));
    button.addEventListener("click", () => { selected = index; renderList(); renderDetail(); });
    return button;
  }));
};

renderList();
renderDetail();
</script>
</body>
</html>
`;
};

const generate = async ({
  snapshotRootDir,
  outDir,
  headSha,
  prNumber,
}: {
  snapshotRootDir: string;
  outDir: string;
  headSha: string | undefined;
  prNumber: string | undefined;
}) => {
  const [baselines, results, diffs] = await Promise.all([
    listPngs(path.join(snapshotRootDir, snapshotDirs.baseline)),
    listPngs(path.join(snapshotRootDir, snapshotDirs.result)),
    listPngs(path.join(snapshotRootDir, snapshotDirs.diff)),
  ]);

  const entries: ManifestEntry[] = [];

  for (const id of diffs) {
    entries.push({ id, status: "changed" });
  }

  for (const id of results) {
    if (!baselines.has(id)) {
      entries.push({ id, status: "new" });
    }
  }

  // Only meaningful for a full run - a filtered run or a story that errored before capturing also has no result
  for (const id of baselines) {
    if (results.size > 0 && !results.has(id)) {
      entries.push({ id, status: "orphaned" });
    }
  }

  entries.sort((a, b) => a.id.localeCompare(b.id));

  await rm(outDir, { recursive: true, force: true });

  for (const entry of entries) {
    for (const kind of imageKinds) {
      const exists = { baseline: baselines, result: results, diff: diffs }[
        kind
      ].has(entry.id);

      if (!exists) {
        continue;
      }

      const source = path.join(snapshotRootDir, snapshotDirs[kind], entry.id);
      const imagePath = `${kind}/${entry.id}`;
      const target = path.join(outDir, "images", imagePath);

      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(source, target);

      entry[kind] = { path: imagePath, ...(await readPngSize(source)) };
    }
  }

  const manifest: Manifest = {
    version: 1,
    snapshotRootDir,
    headSha: headSha ?? null,
    prNumber: prNumber ? Math.trunc(Number(prNumber)) : null,
    compared: results.size,
    entries,
  };

  await mkdir(outDir, { recursive: true });
  await writeFile(
    path.join(outDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  await writeFile(
    path.join(outDir, reportFileName),
    await renderHtml(manifest, path.join(outDir, "images")),
  );

  const counts = Object.groupBy(entries, (entry) => entry.status);

  print(
    `Compared ${results.size.toString()} snapshots: ${(counts.changed?.length ?? 0).toString()} changed, ${(counts.new?.length ?? 0).toString()} new, ${(counts.orphaned?.length ?? 0).toString()} orphaned`,
  );
  print(`Report: ${path.resolve(outDir, reportFileName)}`);
};

const pngSignature = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

const readManifest = async (manifestPath: string) => {
  const manifest = JSON.parse(
    await readFile(manifestPath, "utf8"),
  ) as Partial<Manifest>;

  if (
    manifest.version !== 1 ||
    typeof manifest.compared !== "number" ||
    !Array.isArray(manifest.entries)
  ) {
    throw new Error("Unsupported manifest");
  }

  for (const entry of manifest.entries) {
    if (!safeIdPattern.test(entry.id)) {
      throw new Error(
        `Refusing to use unexpected snapshot path: ${JSON.stringify(entry.id)}`,
      );
    }

    for (const kind of imageKinds) {
      const image = entry[kind];

      if (image && image.path !== `${kind}/${entry.id}`) {
        throw new Error(
          `Refusing to use unexpected image path: ${JSON.stringify(image.path)}`,
        );
      }
    }
  }

  // Validated above
  return manifest as Manifest;
};

/** Reads an image from an untrusted images directory, ensuring it is a PNG */
const readPng = async (imagesDir: string, image: ImageInfo) => {
  const contents = await readFile(path.join(imagesDir, image.path));

  if (!contents.subarray(0, pngSignature.length).equals(pngSignature)) {
    throw new Error(`${image.path} is not a PNG`);
  }

  return contents;
};

const comment = async ({
  manifestPath,
  imageBase,
  reportUrl,
  runUrl,
}: {
  manifestPath: string;
  imageBase: string;
  reportUrl: string | undefined;
  runUrl: string | undefined;
}) => {
  const manifest = await readManifest(manifestPath);
  const marker = "<!-- vis-report -->";

  const links = [
    reportUrl && `[Open the full report](${reportUrl})`,
    runUrl && `[Workflow run](${runUrl})`,
  ]
    .filter(Boolean)
    .join(" · ");

  const sha = manifest.headSha?.slice(0, 7) ?? "this commit";

  if (manifest.compared === 0) {
    return [
      marker,
      "## Visual changes",
      "",
      `⚠️ No snapshots were captured in \`${sha}\`, so the visual tests may not have run to completion.`,
      ...(links ? ["", links] : []),
    ].join("\n");
  }

  if (manifest.entries.length === 0) {
    return [
      marker,
      "## Visual changes",
      "",
      `✅ No visual changes detected in \`${sha}\` (${manifest.compared.toString()} snapshots compared).`,
      ...(links ? ["", links] : []),
    ].join("\n");
  }
  const imageUrl = (image: ImageInfo | undefined) =>
    image
      ? `<img src="${imageBase}/${image.path.split("/").map(encodeURIComponent).join("/")}" width="260" alt="">`
      : "–";

  const groups = Object.groupBy(manifest.entries, (entry) => entry.status);

  const sections: string[] = [];

  for (const status of ["changed", "new", "orphaned"] as const) {
    const group = groups[status];

    if (!group?.length) {
      continue;
    }

    sections.push(
      `### ${statusLabels[status]} (${group.length.toString()})`,
      "",
    );

    for (const entry of group) {
      const { file, snapshot } = splitId(entry.id);

      sections.push(
        "<details>",
        `<summary><code>${escapeHtml(file)}</code> › <strong>${escapeHtml(snapshot)}</strong></summary>`,
        "",
        "| Expected | Actual | Diff |",
        "| --- | --- | --- |",
        `| ${imageUrl(entry.baseline)} | ${imageUrl(entry.result)} | ${imageUrl(entry.diff)} |`,
        "",
        "</details>",
      );
    }

    sections.push("");
  }

  const approvable = (groups.changed?.length ?? 0) + (groups.new?.length ?? 0);

  return [
    marker,
    "## Visual changes",
    "",
    `⚠️ ${manifest.entries.length.toString()} snapshot(s) differ from the baselines in \`${sha}\` (${manifest.compared.toString()} compared).`,
    ...(links ? ["", links] : []),
    "",
    ...sections,
    "---",
    "",
    `If these changes are intended, a maintainer can comment \`/approve-visuals\` to commit the ${approvable.toString()} new baseline(s) to this branch.`,
    ...(groups.orphaned?.length
      ? [
          `Use \`/approve-visuals prune\` to also delete the ${groups.orphaned.length.toString()} baseline(s) that are no longer captured.`,
        ]
      : []),
  ].join("\n");
};

const stageImages = async (
  manifestPath: string,
  imagesDir: string,
  outDir: string,
) => {
  const manifest = await readManifest(manifestPath);

  for (const entry of manifest.entries) {
    for (const kind of imageKinds) {
      const image = entry[kind];

      if (!image) {
        continue;
      }

      const target = path.join(outDir, image.path);

      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, await readPng(imagesDir, image));
    }
  }
};

/** Builds the file changes for GitHub's `createCommitOnBranch` mutation */
const baselineChanges = async ({
  manifestPath,
  imagesDir,
  baselinesPath,
  prune,
}: {
  manifestPath: string;
  imagesDir: string;
  baselinesPath: string;
  prune: boolean;
}) => {
  const manifest = await readManifest(manifestPath);
  const additions: { path: string; contents: string }[] = [];
  const deletions: { path: string }[] = [];

  for (const entry of manifest.entries) {
    const baselinePath = path.posix.join(baselinesPath, entry.id);

    if (entry.status === "orphaned") {
      if (prune) {
        deletions.push({ path: baselinePath });
      }

      continue;
    }

    if (!entry.result) {
      throw new Error(`${entry.id} has no result image`);
    }

    const contents = await readPng(imagesDir, entry.result);

    additions.push({
      path: baselinePath,
      contents: contents.toString("base64"),
    });
  }

  return {
    headSha: manifest.headSha,
    additions,
    deletions,
  };
};

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    root: { type: "string", default: defaultSnapshotRootDir },
    out: { type: "string", default: ".vis-report" },
    manifest: { type: "string", default: ".vis-report/manifest.json" },
    images: { type: "string", default: ".vis-report/images" },
    to: { type: "string" },
    "head-sha": { type: "string" },
    "pr-number": { type: "string" },
    baselines: { type: "string" },
    prune: { type: "boolean", default: false },
    "image-base": { type: "string" },
    "report-url": { type: "string" },
    "run-url": { type: "string" },
  },
});

const requireOption = (name: "to" | "baselines" | "image-base") => {
  const value = values[name];

  if (!value) {
    throw new Error(`--${name} is required`);
  }

  return value;
};

switch (positionals[0] ?? "") {
  case "generate": {
    await generate({
      snapshotRootDir: values.root,
      outDir: values.out,
      headSha: values["head-sha"],
      prNumber: values["pr-number"],
    });
    break;
  }
  case "comment": {
    print(
      await comment({
        manifestPath: values.manifest,
        imageBase: requireOption("image-base"),
        reportUrl: values["report-url"],
        runUrl: values["run-url"],
      }),
    );
    break;
  }
  case "stage-images": {
    await stageImages(values.manifest, values.images, requireOption("to"));
    break;
  }
  case "baseline-changes": {
    print(
      JSON.stringify(
        await baselineChanges({
          manifestPath: values.manifest,
          imagesDir: values.images,
          baselinesPath: requireOption("baselines"),
          prune: values.prune,
        }),
      ),
    );
    break;
  }
  default: {
    throw new Error(
      'Expected a command: "generate", "comment", "stage-images" or "baseline-changes"',
    );
  }
}
