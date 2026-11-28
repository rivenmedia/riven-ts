/**
 * Claude Code hook: lints and formats the files an agent changes, and reports
 * any errors that remain back to the agent (exit code 2), so that broken files
 * can't be reported as done.
 *
 * Files are caught however they were written:
 *   pre-bash   (PreToolUse Bash)        record a timestamp marker for the call
 *   post-bash  (PostToolUse Bash)       check files changed since the marker
 *   post-edit  (PostToolUse Edit|Write) check the edited file
 *   stop       (Stop / SubagentStop)    re-check every file touched this
 *                                       session, and block stopping on errors
 *
 * oxlint runs from the directory of each file's nearest oxlint config, the
 * same as each workspace's `lint` script. Nested configs use root-only
 * options, so running oxlint against them from the repo root fails.
 *
 * Usage:
 *   node check-changed-files.ts <pre-bash|post-bash|post-edit|stop> < hook-input.json
 */
import { spawn } from "node:child_process";
import {
  access,
  appendFile,
  mkdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { text } from "node:stream/consumers";

interface HookInput {
  session_id: string;
  cwd?: string;
  tool_use_id?: string;
  agent_id?: string;
  tool_input?: { file_path?: unknown };
}

interface OxlintReport {
  diagnostics: {
    severity: string;
    code: string;
    message: string;
    help?: string;
    filename: string;
    labels: { span: { line: number; column: number } }[];
  }[];
}

interface RunResult {
  ok: boolean;
  stdout: string;
  output: string;
}

const LINT_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".cjs",
  ".mjs",
  ".ts",
  ".tsx",
  ".cts",
  ".mts",
]);

// Matches lint-staged.config.mjs
const FORMAT_EXTENSIONS = new Set([
  ...LINT_EXTENSIONS,
  ".json",
  ".md",
  ".mdx",
  ".html",
  ".yml",
  ".yaml",
]);

const OXLINT_CONFIGS = ["oxlint.config.ts", ".oxlintrc.json"];
const MAX_STOP_BLOCKS = 3;
const MAX_OUTPUT_LINES = 150;

const { CLAUDE_PROJECT_DIR: projectDir } = process.env;
const mode = process.argv.at(2) ?? "";
const input = JSON.parse(await text(process.stdin)) as HookInput;
const cwd = input.cwd ?? projectDir ?? process.cwd();
const agentKey = input.agent_id ?? "main";

const sessionDir = path.join(
  tmpdir(),
  "claude-check-changed-files",
  input.session_id,
);
const touchedFile = (key: string) => path.join(sessionDir, `${key}.touched`);
const blocksFile = path.join(sessionDir, `${agentKey}.blocks`);
const markerFile = path.join(
  sessionDir,
  "markers",
  (input.tool_use_id ?? "unknown").replaceAll(/[^\w-]/gu, "_"),
);

async function exists(file: string) {
  try {
    await access(file);

    return true;
  } catch {
    return false;
  }
}

async function run(
  command: string,
  args: string[],
  runCwd: string,
): Promise<RunResult> {
  const child = spawn(command, args, {
    cwd: runCwd,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const [stdout, stderr, status] = await Promise.all([
    text(child.stdout),
    text(child.stderr),
    new Promise<number | null>((resolve, reject) => {
      child.once("error", reject);
      child.once("close", resolve);
    }),
  ]);

  return { ok: status === 0, stdout, output: `${stdout}${stderr}`.trim() };
}

async function findUp(
  start: string,
  predicate: (dir: string) => Promise<boolean>,
) {
  let dir = start;

  for (;;) {
    if (await predicate(dir)) {
      return dir;
    }

    const parent = path.dirname(dir);

    if (parent === dir) {
      return null;
    }

    dir = parent;
  }
}

const findRepoRoot = (start: string) =>
  findUp(start, async (dir) => exists(path.join(dir, ".git")));

const findOxlintConfigDir = (start: string) =>
  findUp(start, async (dir) => {
    const found = await Promise.all(
      OXLINT_CONFIGS.map(async (name) => exists(path.join(dir, name))),
    );

    return found.includes(true);
  });

/** Groups items by key, dropping items whose key is null. */
async function groupBy(
  items: string[],
  keyOf: (item: string) => Promise<string | null>,
) {
  const keys = await Promise.all(items.map(keyOf));
  const groups = new Map<string, string[]>();

  for (const [index, key] of keys.entries()) {
    if (key !== null) {
      groups.set(key, [...(groups.get(key) ?? []), items[index] ?? ""]);
    }
  }

  return groups;
}

const relativeOrDot = (from: string, to: string) => {
  const relative = path.relative(from, to);

  return relative === "" ? "." : relative;
};

/**
 * Renders oxlint's JSON report as one line per diagnostic, with paths
 * relative to the repo root. The JSON keeps the `help` text, which the other
 * compact formats drop. Falls back to the raw output, e.g. for config errors.
 */
function formatLintResult(result: RunResult, configDir: string, root: string) {
  try {
    const { diagnostics } = JSON.parse(result.stdout) as OxlintReport;

    return diagnostics
      .map(({ severity, code, message, help, filename, labels }) => {
        const [label] = labels;
        const where =
          filename === ""
            ? relativeOrDot(root, configDir)
            : `${path.relative(root, path.join(configDir, filename))}:${String(label?.span.line ?? 0)}:${String(label?.span.column ?? 0)}`;
        const hint = help === undefined ? "" : ` (${help})`;

        return `${where}: ${severity} ${code}: ${message}${hint}`;
      })
      .join("\n");
  } catch {
    return result.output;
  }
}

/** Fixes, formats, then lints the files, returning any remaining problems. */
async function check(files: string[]) {
  const problems: string[] = [];
  const present = await Promise.all(files.map(exists));
  const existing = files.filter(
    (file, index) =>
      present[index] && FORMAT_EXTENSIONS.has(path.extname(file)),
  );

  for (const [root, rootFiles] of await groupBy(existing, async (file) =>
    findRepoRoot(path.dirname(file)),
  )) {
    const bin = (name: string) => path.join(root, "node_modules", ".bin", name);

    if (!(await exists(bin("oxlint"))) || !(await exists(bin("oxfmt")))) {
      continue;
    }

    const lintGroups = [
      ...(await groupBy(
        rootFiles.filter((file) => LINT_EXTENSIONS.has(path.extname(file))),
        async (file) => findOxlintConfigDir(path.dirname(file)),
      )),
    ];
    const lint = async (extraArgs: string[]) =>
      Promise.all(
        lintGroups.map(async ([configDir, lintFiles]) =>
          run(
            bin("oxlint"),
            [
              ...extraArgs,
              "--no-error-on-unmatched-pattern",
              "--format",
              "json",
              ...lintFiles.map((file) => path.relative(configDir, file)),
            ],
            configDir,
          ),
        ),
      );

    await lint(["--fix"]);

    const format = await run(
      bin("oxfmt"),
      [
        "--write",
        "--no-error-on-unmatched-pattern",
        ...rootFiles.map((file) => path.relative(root, file)),
      ],
      root,
    );

    if (!format.ok) {
      problems.push(`oxfmt failed:\n${format.output}`);
    }

    const lintResults = await lint([]);

    for (const [index, result] of lintResults.entries()) {
      const [configDir] = lintGroups[index] ?? [root];

      if (!result.ok) {
        problems.push(formatLintResult(result, configDir, root));
      }
    }
  }

  return problems;
}

/** Feeds the problems back to the agent, returning the exit code to use. */
function report(problems: string[], heading: string) {
  const lines = `${heading}\n\n${problems.join("\n\n")}`.split("\n");
  const shown =
    lines.length > MAX_OUTPUT_LINES
      ? [
          ...lines.slice(0, MAX_OUTPUT_LINES),
          `… ${String(lines.length - MAX_OUTPUT_LINES)} more lines`,
        ]
      : lines;

  process.stderr.write(`${shown.join("\n")}\n`);

  return 2;
}

async function record(files: string[]) {
  if (files.length === 0) {
    return;
  }

  const lines = `${files.join("\n")}\n`;

  await appendFile(touchedFile(agentKey), lines);

  // Subagent files are also re-checked when the main agent stops.
  if (agentKey !== "main") {
    await appendFile(touchedFile("main"), lines);
  }
}

async function readTouched() {
  try {
    const contents = await readFile(touchedFile(agentKey), "utf8");

    return [...new Set(contents.split("\n").filter(Boolean))];
  } catch {
    return [];
  }
}

async function changedSinceMarker() {
  const root = await findRepoRoot(cwd);

  if (root === null) {
    return [];
  }

  const { mtimeNs: markerTime } = await stat(markerFile, { bigint: true });
  const listed = await run(
    "git",
    ["ls-files", "-z", "--modified", "--others", "--exclude-standard"],
    root,
  );
  const files = listed.stdout
    .split("\0")
    .filter(Boolean)
    .map((file) => path.join(root, file));
  const changed = await Promise.all(
    files.map(async (file) => {
      try {
        const { mtimeNs } = await stat(file, { bigint: true });

        return mtimeNs > markerTime;
      } catch {
        return false;
      }
    }),
  );

  return files.filter((_file, index) => changed[index]);
}

async function main() {
  await mkdir(path.dirname(markerFile), { recursive: true });

  switch (mode) {
    case "pre-bash": {
      await writeFile(markerFile, "");

      return 0;
    }
    case "post-bash": {
      if (!(await exists(markerFile))) {
        return 0;
      }

      const files = await changedSinceMarker();

      await rm(markerFile, { force: true });
      await record(files);

      const problems = await check(files);

      return problems.length === 0
        ? 0
        : report(
            problems,
            "This command changed files that still have lint/format errors. Fix them before continuing:",
          );
    }
    case "post-edit": {
      const filePath = input.tool_input?.file_path;

      if (typeof filePath !== "string") {
        return 0;
      }

      const file = path.resolve(cwd, filePath);

      await record([file]);

      const problems = await check([file]);

      return problems.length === 0
        ? 0
        : report(
            problems,
            `${path.relative(cwd, file)} still has lint/format errors. Fix them before continuing:`,
          );
    }
    case "stop": {
      const problems = await check(await readTouched());

      if (problems.length === 0) {
        await rm(touchedFile(agentKey), { force: true });
        await rm(blocksFile, { force: true });

        return 0;
      }

      const previousBlocks = (await exists(blocksFile))
        ? Number(await readFile(blocksFile, "utf8"))
        : 0;
      const blocks = previousBlocks + 1;

      // Give up rather than trap the agent in a loop it can't fix.
      if (blocks > MAX_STOP_BLOCKS) {
        await rm(blocksFile, { force: true });

        process.stdout.write(
          JSON.stringify({
            systemMessage: `Lint/format errors remain in changed files after ${String(MAX_STOP_BLOCKS)} attempts to fix them. Run \`turbo lint\` to see them.`,
          }),
        );

        return 0;
      }

      await writeFile(blocksFile, String(blocks));

      return report(
        problems,
        "Files changed in this session still have lint/format errors. Fix them before finishing — do not report the work as done until they pass:",
      );
    }
    default: {
      process.stderr.write(`Unknown mode: "${mode}"\n`);

      return 1;
    }
  }
}

process.exitCode = await main();
