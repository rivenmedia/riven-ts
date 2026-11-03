import { decodeEnvValue } from "./decode-env-value.ts";
import {
  getLeafPaths,
  getLeafSchema,
  unflattenSettings,
} from "./leaf-paths.ts";

import type { LeafPathMap } from "./leaf-paths.ts";
import type { z } from "zod";

export interface SettingsIssue {
  path: string;
  message: string;
}

export interface ResolvedSettings<T extends z.ZodObject> {
  value: z.infer<T>;
  lockedLeaves: ReadonlySet<string>;
  ignoredStored: SettingsIssue[];
}

interface LeafIssue {
  leaf: string | undefined;
  issue: SettingsIssue;
}

function toLeafIssues(schema: z.ZodObject, error: z.ZodError): LeafIssue[] {
  const leaves = getLeafPaths(schema);

  return error.issues.map((issue) => {
    const leaf = issue.path.find(
      (segment): segment is string =>
        typeof segment === "string" && leaves.has(segment),
    );

    return {
      leaf,
      issue: {
        path: issue.path.map(String).join("."),
        message: issue.message,
      },
    };
  });
}

interface IgnoredLeaf {
  leaf: string;
  issue: SettingsIssue;
}

/** The first issue of each stored leaf that the issues are attributed to. */
function findInvalidStored(
  issues: LeafIssue[],
  isStoredInPlay: (leaf: string) => boolean,
): IgnoredLeaf[] {
  const found = new Map<string, SettingsIssue>();

  for (const { leaf, issue } of issues) {
    if (leaf !== undefined && isStoredInPlay(leaf) && !found.has(leaf)) {
      found.set(leaf, issue);
    }
  }

  return found
    .entries()
    .map(([leaf, issue]) => ({ leaf, issue }))
    .toArray();
}

/**
 * Last resort when the issues can't be traced to a stored leaf (e.g. a refinement
 * on a display group): ignores every stored leaf so env + defaults are used alone.
 */
function ignoreAllStored(
  leaves: LeafPathMap,
  issues: LeafIssue[],
  isStoredInPlay: (leaf: string) => boolean,
): IgnoredLeaf[] {
  const unattributed = issues.filter(({ leaf }) => leaf === undefined);
  const reason = (unattributed.length > 0 ? unattributed : issues)
    .map(({ issue }) => issue.message)
    .join("; ");

  return leaves
    .entries()
    .filter(([leaf]) => isStoredInPlay(leaf))
    .map(([leaf, path]) => ({
      leaf,
      issue: {
        path: path.join("."),
        message: `Ignored because the settings are invalid in a way that could not be traced to a single setting: ${reason}`,
      },
    }))
    .toArray();
}

/**
 * Validates a flat settings record against the schema, returning any issues
 * with dotted nested paths.
 */
export function validateSettings(
  schema: z.ZodObject,
  flat: Record<string, unknown>,
): SettingsIssue[] {
  const result = schema.safeParse(unflattenSettings(schema, flat));

  return result.success
    ? []
    : toLeafIssues(schema, result.error).map(({ issue }) => issue);
}

/**
 * Merges env > stored > schema default. Invalid stored leaves are dropped
 * (and reported); if the issues can't be traced to a stored leaf, every stored leaf
 * is dropped. Invalid env values or missing required leaves throw.
 */
export function resolveSettings<T extends z.ZodObject>(input: {
  schema: T;
  stored: Record<string, unknown>;
  env: Record<string, string>;
}): ResolvedSettings<T> {
  const { schema, stored, env } = input;
  const leaves = getLeafPaths(schema);

  const decodedEnv: Record<string, unknown> = {};

  for (const [leaf, raw] of Object.entries(env)) {
    if (leaves.has(leaf)) {
      decodedEnv[leaf] = decodeEnvValue(raw, getLeafSchema(schema, leaf));
    }
  }

  const merged: Record<string, unknown> = { ...stored, ...decodedEnv };
  const ignoredStored: SettingsIssue[] = [];

  /** Whether the leaf's merged value currently comes from the stored values. */
  const isStoredInPlay = (leaf: string) =>
    leaf in stored && !(leaf in decodedEnv) && leaf in merged;

  for (;;) {
    const result = schema.safeParse(unflattenSettings(schema, merged));

    if (result.success) {
      return {
        value: result.data,
        lockedLeaves: new Set(Object.keys(decodedEnv)),
        ignoredStored,
      };
    }

    const issues = toLeafIssues(schema, result.error);
    const toIgnore = findInvalidStored(issues, isStoredInPlay);
    const ignored =
      toIgnore.length > 0
        ? toIgnore
        : ignoreAllStored(leaves, issues, isStoredInPlay);

    if (ignored.length === 0) {
      throw result.error;
    }

    for (const { leaf, issue } of ignored) {
      // oxlint-disable-next-line typescript/no-dynamic-delete
      delete merged[leaf];
      ignoredStored.push(issue);
    }
  }
}
