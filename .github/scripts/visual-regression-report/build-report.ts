/**
 * Builds a static visual regression report from the component test snapshots.
 *
 * The snapshots may come from an untrusted fork, so only regular PNG files in
 * the expected `__vis__` layout are read, and they are copied under a content
 * hash rather than their original path.
 *
 * Unused baselines can only be found when every component test shard uploaded
 * its results, so they are only reported with `--complete-report true`. Like
 * git, an unused baseline that looks like a new snapshot is reported as renamed.
 *
 * Usage:
 *   node build-report.ts --report-dir <dir> --out-dir <dir> \
 *     --pr-url <url> --commit-url <url> --run-url <url> --head-sha <sha> \
 *     --complete-report <true|false>
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

import { diffImages, similarity } from "./compare.ts";
import { PNG_SIGNATURE, decodePng, encodePng } from "./png.ts";

import type { Manifest, ReportImage, Snapshot } from "./manifest.ts";
import type { DecodedImage } from "./png.ts";

const STATIC_DIR = path.join(import.meta.dirname, "static");

const CLIENT_SCRIPT = path.join(import.meta.dirname, "client", "report.ts");

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

/** The share of pixels a new snapshot must have in common with an unused baseline to be reported as renamed, as in git */
const RENAME_THRESHOLD = 0.5;

const SEGMENT_PATTERN = /^[\w.-]+$/u;

const ARG_NAMES = [
  "report-dir",
  "out-dir",
  "pr-url",
  "commit-url",
  "run-url",
  "head-sha",
  "complete-report",
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

const completeReport = requireArg("complete-report");

if (completeReport !== "true" && completeReport !== "false") {
  throw new Error("--complete-report must be true or false");
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

const isDirectory = async (directoryPath: string) => {
  try {
    const stats = await lstat(directoryPath);

    return stats.isDirectory();
  } catch {
    return false;
  }
};

/** Reads and validates a PNG from the report */
const readImage = async (imagePath: string) => {
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

  return contents;
};

const copiedImages = new Map<string, ReportImage>();

/** Writes a validated PNG into the report, returning its content-addressed path and dimensions */
const storeImage = async (contents: Buffer) => {
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

const addImage = async (imagePath: string) => {
  const contents = await readImage(imagePath);

  return storeImage(contents);
};

/** Lists the PNGs below a snapshot directory, relative to it */
const listSnapshots = async (directory: string) => {
  const files = await listFiles(directory);

  return files.filter(
    (relativePath) =>
      relativePath.endsWith(".png") && !relativePath.split("/").includes(".."),
  );
};

interface RenameCandidate {
  relativePath: string;
  contents: Buffer;
}

interface RenamePair {
  result: RenameCandidate;
  baseline: RenameCandidate;
  similarity: number;
}

/** Decodes each candidate once, as each is compared against several others */
const createDecoder = () => {
  const decoded = new Map<RenameCandidate, Promise<DecodedImage | null>>();

  return async (candidate: RenameCandidate) => {
    const image = decoded.get(candidate) ?? decodePng(candidate.contents);

    decoded.set(candidate, image);

    return image;
  };
};

/** Scores each pair of new snapshot and unused baseline that are at least as similar as the threshold */
const scoreRenamePairs = async (
  added: RenameCandidate[],
  removed: RenameCandidate[],
  decode: ReturnType<typeof createDecoder>,
) => {
  const pairs: RenamePair[] = [];

  const score = async (result: RenameCandidate, baseline: RenameCandidate) => {
    if (result.contents.equals(baseline.contents)) {
      return 1;
    }

    const resultImage = await decode(result);
    const baselineImage = await decode(baseline);

    return resultImage && baselineImage
      ? similarity(baselineImage, resultImage, RENAME_THRESHOLD)
      : null;
  };

  for (const result of added) {
    for (const baseline of removed) {
      const pairSimilarity = await score(result, baseline);

      if (pairSimilarity !== null) {
        pairs.push({ result, baseline, similarity: pairSimilarity });
      }
    }
  }

  return pairs;
};

/** Counts the path segments two snapshots share, from the file name up and then from the root down */
const pathAffinity = ({ result, baseline }: RenamePair) => {
  const resultSegments = result.relativePath.split("/");
  const baselineSegments = baseline.relativePath.split("/");

  const sharedSegments = (fromEnd: boolean) => {
    const length = Math.min(resultSegments.length, baselineSegments.length);
    const at = (segments: string[], i: number) =>
      segments.at(fromEnd ? -1 - i : i);
    let shared = 0;

    while (
      shared < length &&
      at(resultSegments, shared) === at(baselineSegments, shared)
    ) {
      shared += 1;
    }

    return shared;
  };

  return [sharedSegments(true), sharedSegments(false)] as const;
};

/**
 * Orders the most similar pairs first. Snapshots often look identical, such as a story and its play function
 * tests, so equally similar pairs are ordered by their paths, as git prefers renames that keep the file name.
 */
const compareRenamePairs = (a: RenamePair, b: RenamePair) => {
  const [aFromEnd, aFromRoot] = pathAffinity(a);
  const [bFromEnd, bFromRoot] = pathAffinity(b);

  return (
    Math.floor(b.similarity * 100) - Math.floor(a.similarity * 100) ||
    bFromEnd - aFromEnd ||
    bFromRoot - aFromRoot ||
    a.result.relativePath.localeCompare(b.result.relativePath) ||
    a.baseline.relativePath.localeCompare(b.baseline.relativePath)
  );
};

/** Matches new snapshots to unused baselines they look like, in the way git detects renamed files */
const detectRenames = async (
  added: RenameCandidate[],
  removed: RenameCandidate[],
) => {
  const decode = createDecoder();
  const pairs = await scoreRenamePairs(added, removed, decode);
  const renames = new Map<RenameCandidate, RenamePair>();
  const matchedBaselines = new Set<RenameCandidate>();

  // The most similar pairs are matched first, and each snapshot is only matched once, as in git
  for (const pair of pairs.toSorted(compareRenamePairs)) {
    if (!renames.has(pair.result) && !matchedBaselines.has(pair.baseline)) {
      renames.set(pair.result, pair);
      matchedBaselines.add(pair.baseline);
    }
  }

  const diffs = new Map<RenameCandidate, Buffer>();

  for (const { result, baseline, similarity: score } of renames.values()) {
    const resultImage = await decode(result);
    const baselineImage = await decode(baseline);

    if (score < 1 && resultImage && baselineImage) {
      diffs.set(
        result,
        await encodePng(diffImages(baselineImage, resultImage)),
      );
    }
  }

  return { renames, matchedBaselines, diffs };
};

interface SnapshotDirectories {
  workspace: string;
  platform: string;
  platformDir: string;
  resultsDir: string;
  baselinesDir: string;
}

/** Describes a snapshot by the repository path of its baseline */
const describeSnapshot = (
  { workspace, platform }: SnapshotDirectories,
  relativePath: string,
) => ({
  // Matches the baseline paths listed in the step summary and PR comment
  id: `${workspace}/__vis__/${platform}/__baselines__/${relativePath}`,
  workspace,
  platform,
  file: path.posix.dirname(relativePath),
  name: path.posix.basename(relativePath, ".png"),
});

/** Collects the results that differ from their baseline, and the results that have none */
const collectResults = async (directories: SnapshotDirectories) => {
  const { platformDir, resultsDir, baselinesDir } = directories;
  const changed: Snapshot[] = [];
  const added: RenameCandidate[] = [];

  for (const relativePath of await listSnapshots(resultsDir)) {
    const baselinePath = path.join(baselinesDir, relativePath);
    const diffPath = path.join(platformDir, "__diffs__", relativePath);
    const resultPath = path.join(resultsDir, relativePath);

    if (!(await isRegularFile(baselinePath))) {
      added.push({ relativePath, contents: await readImage(resultPath) });
    } else if (await isRegularFile(diffPath)) {
      // Results that match their baseline are not part of the review
      changed.push({
        ...describeSnapshot(directories, relativePath),
        status: "changed",
        renamedFrom: null,
        similarity: null,
        baseline: await addImage(baselinePath),
        result: await addImage(resultPath),
        diff: await addImage(diffPath),
      });
    }
  }

  return { changed, added };
};

/**
 * Collects the baselines without a result, which belong to removed snapshots as every snapshot taken writes one.
 * Only the snapshot directories with results are checked, as in the workflow.
 */
const collectUnusedBaselines = async ({
  resultsDir,
  baselinesDir,
}: SnapshotDirectories) => {
  const removed: RenameCandidate[] = [];

  if (completeReport !== "true" || !(await isDirectory(resultsDir))) {
    return removed;
  }

  for (const relativePath of await listSnapshots(baselinesDir)) {
    if (!(await isRegularFile(path.join(resultsDir, relativePath)))) {
      removed.push({
        relativePath,
        contents: await readImage(path.join(baselinesDir, relativePath)),
      });
    }
  }

  return removed;
};

/** Collects the snapshots in a platform directory that differ from, have no, or no longer use a baseline */
const collectPlatformSnapshots = async (
  workspace: string,
  platform: string,
) => {
  const platformDir = path.join(reportDir, workspace, "__vis__", platform);
  const directories: SnapshotDirectories = {
    workspace,
    platform,
    platformDir,
    resultsDir: path.join(platformDir, "__results__"),
    baselinesDir: path.join(platformDir, "__baselines__"),
  };

  const { changed, added } = await collectResults(directories);
  const removed = await collectUnusedBaselines(directories);
  const { renames, matchedBaselines, diffs } = await detectRenames(
    added,
    removed,
  );
  const snapshots = [...changed];

  for (const result of added) {
    const rename = renames.get(result);
    const diff = diffs.get(result);

    snapshots.push({
      ...describeSnapshot(directories, result.relativePath),
      status: rename ? "renamed" : "new",
      renamedFrom: rename
        ? describeSnapshot(directories, rename.baseline.relativePath).id
        : null,
      similarity: rename ? Math.floor(rename.similarity * 100) : null,
      baseline: rename ? await storeImage(rename.baseline.contents) : null,
      result: await storeImage(result.contents),
      diff: diff ? await storeImage(diff) : null,
    });
  }

  for (const baseline of removed.filter(
    (candidate) => !matchedBaselines.has(candidate),
  )) {
    snapshots.push({
      ...describeSnapshot(directories, baseline.relativePath),
      status: "removed",
      renamedFrom: null,
      similarity: null,
      baseline: await storeImage(baseline.contents),
      result: null,
      diff: null,
    });
  }

  return snapshots.toSorted((a, b) => a.id.localeCompare(b.id));
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

const counts = Object.groupBy(snapshots, ({ status }) => status);

console.debug(
  `Built a report of ${String(counts.changed?.length ?? 0)} visual regressions, ${String(counts.new?.length ?? 0)} new baselines, ${String(counts.renamed?.length ?? 0)} renamed baselines and ${String(counts.removed?.length ?? 0)} removed baselines in ${outDir}`,
);
