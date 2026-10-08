/**
 * Builds a static visual regression report from the component test snapshots.
 *
 * The snapshots may come from an untrusted fork, so only regular PNG files in
 * the expected `__vis__` layout are read, and they are copied under a content
 * hash rather than their original path.
 *
 * Usage:
 *   node build-report.ts --report-dir <dir> --out-dir <dir> \
 *     --pr-url <url> --commit-url <url> --run-url <url> --head-sha <sha>
 */
import { createHash } from "node:crypto";
import {
  copyFile,
  lstat,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import path from "node:path";
import { parseArgs } from "node:util";

import type { Manifest, ReportImage, Snapshot } from "./manifest.ts";

const STATIC_DIR = path.join(import.meta.dirname, "static");

const CLIENT_SCRIPT = path.join(import.meta.dirname, "client", "report.ts");

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

const SEGMENT_PATTERN = /^[\w.-]+$/u;

const ARG_NAMES = [
  "report-dir",
  "out-dir",
  "pr-url",
  "commit-url",
  "run-url",
  "head-sha",
] as const;

type ArgName = (typeof ARG_NAMES)[number];

const { values: args } = parseArgs({
  options: Object.fromEntries(
    ARG_NAMES.map((name) => [name, { type: "string" }] as const),
  ),
  strict: true,
});

const requireArg = (name: ArgName) => {
  const value = args[name];

  if (typeof value !== "string" || !value) {
    throw new Error(`Missing required argument --${name}`);
  }

  return value;
};

const requireUrlArg = (name: ArgName) => {
  const url = new URL(requireArg(name));

  if (url.protocol !== "https:") {
    throw new Error(`--${name} must be an https URL`);
  }

  return url.href;
};

const reportDir = requireArg("report-dir");
const outDir = requireArg("out-dir");
const headSha = requireArg("head-sha");

if (!/^[\da-f]{40}$/u.test(headSha)) {
  throw new Error("--head-sha must be a full commit SHA");
}

const isMissingError = (error: unknown) =>
  error instanceof Error && "code" in error && error.code === "ENOENT";

const readDirectory = async (directory: string) => {
  try {
    return await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (isMissingError(error)) {
      return [];
    }

    throw error;
  }
};

/** Lists the regular files below a directory, relative to it, skipping symlinks */
const listFiles = async (root: string) => {
  try {
    const entries = await readdir(root, {
      recursive: true,
      withFileTypes: true,
    });

    return entries
      .filter((entry) => entry.isFile())
      .map((entry) =>
        path.relative(root, path.join(entry.parentPath, entry.name)),
      )
      .toSorted();
  } catch (error) {
    if (isMissingError(error)) {
      return [];
    }

    throw error;
  }
};

const isRegularFile = async (filePath: string) => {
  try {
    const stats = await lstat(filePath);

    return stats.isFile();
  } catch {
    return false;
  }
};

const copiedImages = new Map<string, ReportImage>();

/** Validates a PNG and copies it into the report, returning its content-addressed path and dimensions */
const addImage = async (imagePath: string) => {
  const stats = await lstat(imagePath);

  if (!stats.isFile()) {
    throw new Error(`${imagePath} is not a regular file`);
  }

  if (stats.size > MAX_IMAGE_BYTES) {
    throw new Error(
      `${imagePath} is larger than ${String(MAX_IMAGE_BYTES)} bytes`,
    );
  }

  const contents = await readFile(imagePath);

  // The IHDR chunk always comes first, with the width and height at bytes 16-24
  if (
    contents.length < 24 ||
    !contents.subarray(0, 8).equals(PNG_SIGNATURE) ||
    contents.toString("latin1", 12, 16) !== "IHDR"
  ) {
    throw new Error(`${imagePath} is not a PNG`);
  }

  const hash = createHash("sha256").update(contents).digest("hex").slice(0, 32);
  const existing = copiedImages.get(hash);

  if (existing) {
    return existing;
  }

  const image: ReportImage = {
    src: `images/${hash}.png`,
    width: contents.readUInt32BE(16),
    height: contents.readUInt32BE(20),
  };

  await writeFile(path.join(outDir, image.src), contents);

  copiedImages.set(hash, image);

  return image;
};

/** Collects the snapshots in a platform directory that differ from, or have no, baseline */
const collectPlatformSnapshots = async (
  workspace: string,
  platform: string,
) => {
  const platformDir = path.join(reportDir, workspace, "__vis__", platform);
  const resultsDir = path.join(platformDir, "__results__");
  const snapshots: Snapshot[] = [];

  for (const relativePath of await listFiles(resultsDir)) {
    if (
      !relativePath.endsWith(".png") ||
      relativePath.split("/").includes("..")
    ) {
      continue;
    }

    const baselinePath = path.join(platformDir, "__baselines__", relativePath);
    const diffPath = path.join(platformDir, "__diffs__", relativePath);
    const hasBaseline = await isRegularFile(baselinePath);
    const hasDiff = await isRegularFile(diffPath);

    // Results that match their baseline are not part of the review
    if (hasBaseline && !hasDiff) {
      continue;
    }

    snapshots.push({
      // Matches the baseline paths listed in the step summary and PR comment
      id: `${workspace}/__vis__/${platform}/__baselines__/${relativePath}`,
      status: hasBaseline ? "changed" : "new",
      workspace,
      platform,
      file: path.posix.dirname(relativePath),
      name: path.posix.basename(relativePath, ".png"),
      baseline: hasBaseline ? await addImage(baselinePath) : null,
      result: await addImage(path.join(resultsDir, relativePath)),
      diff: hasDiff ? await addImage(diffPath) : null,
    });
  }

  return snapshots;
};

const collectSnapshots = async () => {
  const snapshots: Snapshot[] = [];

  for (const workspaceType of ["apps", "packages"]) {
    for (const workspaceEntry of await readDirectory(
      path.join(reportDir, workspaceType),
    )) {
      if (
        !workspaceEntry.isDirectory() ||
        !SEGMENT_PATTERN.test(workspaceEntry.name)
      ) {
        continue;
      }

      const workspace = `${workspaceType}/${workspaceEntry.name}`;

      for (const platformEntry of await readDirectory(
        path.join(reportDir, workspace, "__vis__"),
      )) {
        if (
          platformEntry.isDirectory() &&
          SEGMENT_PATTERN.test(platformEntry.name)
        ) {
          snapshots.push(
            ...(await collectPlatformSnapshots(workspace, platformEntry.name)),
          );
        }
      }
    }
  }

  return snapshots;
};

await rm(outDir, { recursive: true, force: true });
await mkdir(path.join(outDir, "images"), { recursive: true });

const snapshots = await collectSnapshots();

for (const file of await readdir(STATIC_DIR)) {
  await copyFile(path.join(STATIC_DIR, file), path.join(outDir, file));
}

await writeFile(
  path.join(outDir, "report.js"),
  stripTypeScriptTypes(await readFile(CLIENT_SCRIPT, "utf8")),
);

const manifest: Manifest = {
  pullRequestUrl: requireUrlArg("pr-url"),
  commitUrl: requireUrlArg("commit-url"),
  runUrl: requireUrlArg("run-url"),
  headSha,
  snapshots,
};

await writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest));

const changedCount = snapshots.filter(
  ({ status }) => status === "changed",
).length;

console.debug(
  `Built a report of ${String(changedCount)} visual regressions and ${String(snapshots.length - changedCount)} new baselines in ${outDir}`,
);
